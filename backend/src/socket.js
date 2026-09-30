import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import env from './config/env.js';
import User from './models/User.js';
import Driver from './models/Driver.js';
import Ride from './models/Ride.js';
import Notification from './models/Notification.js';
import { calculateLiveETA } from './services/map.service.js';
import { formatRideResponse } from './controllers/ride.controller.js';

let ioInstance = null;

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH'],
    },
    pingTimeout: 30000,
    pingInterval: 15000,
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      // Check cookie fallback if auth token not provided directly
      if (!token && socket.handshake.headers?.cookie) {
        const cookieMatches = socket.handshake.headers.cookie.match(/token=([^;]+)/);
        if (cookieMatches) {
          token = cookieMatches[1];
        }
      }

      // Check authorization header fallback
      if (!token && socket.handshake.headers?.authorization) {
        const authHeader = socket.handshake.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.split(' ')[1];
        }
      }

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');

      if (!user || !user.isActive) {
        return next(new Error('Authentication error: Invalid or inactive user'));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.warn('Socket authentication failed:', err.message);
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', async (socket) => {
    const user = socket.user;
    console.log(`🔌 Socket connected: User ${user.name} (${user.role}) [ID: ${user._id}]`);

    // Join personal user room
    socket.join(`user:${user._id}`);

    // Send initial unread notifications count on connect
    try {
      const unreadCount = await Notification.countDocuments({
        recipient: user._id,
        isRead: false,
      });
      socket.emit('notification:count', { unreadCount });
    } catch (e) {
      // ignore
    }

    // If user is a driver, check driver profile and join drivers room if online
    if (user.role === 'driver') {
      try {
        const driver = await Driver.findOne({ user: user._id });
        if (driver && driver.isAvailable) {
          socket.join('drivers');
        }
      } catch (e) {
        console.error('Error checking driver profile on socket connect:', e);
      }
    }

    // ─── Ride Room Authorization & Join ─────────────────────────────
    socket.on('ride:join', async ({ rideId }) => {
      try {
        if (!rideId) return;

        const ride = await Ride.findById(rideId)
          .populate('passenger', 'name phone email profilePhoto')
          .populate({ path: 'driver', populate: { path: 'user', select: 'name phone email' } });

        if (!ride) {
          socket.emit('error', { message: 'Ride not found' });
          return;
        }

        // Check permission: user must be passenger, assigned driver, or admin
        let isDriver = false;
        if (user.role === 'driver') {
          const driverDoc = await Driver.findOne({ user: user._id });
          if (driverDoc && ride.driver && ride.driver._id.toString() === driverDoc._id.toString()) {
            isDriver = true;
          }
        }

        const isPassenger = ride.passenger && ride.passenger._id.toString() === user._id.toString();
        const isAdmin = user.role === 'admin';

        if (!isPassenger && !isDriver && !isAdmin) {
          socket.emit('error', { message: 'Unauthorized to join ride channel' });
          return;
        }

        const roomName = `ride:${rideId}`;
        socket.join(roomName);
        console.log(`👤 User ${user.name} joined room ${roomName}`);
        socket.emit('ride:joined', { rideId, status: ride.status, ride: formatRideResponse(ride) });
      } catch (err) {
        console.error('Error in ride:join:', err);
      }
    });

    // ─── Ride State Resynchronization ───────────────────────────────
    socket.on('ride:sync', async ({ rideId }) => {
      try {
        if (!rideId) return;

        const ride = await Ride.findById(rideId)
          .populate('passenger', 'name phone email profilePhoto')
          .populate({ path: 'driver', populate: { path: 'user', select: 'name phone email' } });

        if (!ride) return;

        // Verify authorization
        let isDriver = false;
        if (user.role === 'driver') {
          const driverDoc = await Driver.findOne({ user: user._id });
          if (driverDoc && ride.driver && ride.driver._id.toString() === driverDoc._id.toString()) {
            isDriver = true;
          }
        }

        const isPassenger = ride.passenger && ride.passenger._id.toString() === user._id.toString();
        const isAdmin = user.role === 'admin';

        if (isPassenger || isDriver || isAdmin) {
          socket.emit('ride:synced', { ride: formatRideResponse(ride) });
        }
      } catch (err) {
        console.error('Error in ride:sync:', err);
      }
    });

    socket.on('ride:leave', ({ rideId }) => {
      if (rideId) {
        socket.leave(`ride:${rideId}`);
      }
    });

    // ─── Driver Location Update ─────────────────────────────────────
    socket.on('driver:location_update', async (data) => {
      try {
        if (user.role !== 'driver') return;

        const { coordinates, heading = 0, speed = 0, rideId } = data;

        if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
          return;
        }

        const [lng, lat] = coordinates;
        const validCoords = [parseFloat(lng), parseFloat(lat)];

        // Update driver's location in Driver model
        const driverDoc = await Driver.findOneAndUpdate(
          { user: user._id },
          {
            $set: {
              currentLocation: {
                type: 'Point',
                coordinates: validCoords,
              },
              heading: parseFloat(heading) || 0,
              lastLocationUpdate: new Date(),
            },
          },
          { returnDocument: 'after' }
        );

        if (!driverDoc) return;

        // If there's an active ride, update ride and broadcast to passenger
        if (rideId) {
          const ride = await Ride.findById(rideId);
          if (ride && ride.driver && ride.driver.toString() === driverDoc._id.toString()) {
            const targetCoords =
              ride.status === 'in_progress'
                ? ride.dropoffLocation?.coordinates?.coordinates
                : ride.pickupLocation?.coordinates?.coordinates;

            let etaData = { remainingDistanceKm: ride.estimatedDistance, etaMinutes: ride.estimatedDuration };
            if (targetCoords && targetCoords.length === 2) {
              etaData = calculateLiveETA(validCoords, targetCoords);
            }

            // Update ride document
            ride.driverLocation = {
              type: 'Point',
              coordinates: validCoords,
              heading: parseFloat(heading) || 0,
              speed: parseFloat(speed) || 0,
              updatedAt: new Date(),
            };
            ride.currentDistanceKm = etaData.remainingDistanceKm;
            ride.currentEtaMinutes = etaData.etaMinutes;
            await ride.save();

            // Broadcast to room
            io.to(`ride:${rideId}`).emit('driver:location_changed', {
              rideId,
              coordinates: validCoords,
              heading: parseFloat(heading) || 0,
              speed: parseFloat(speed) || 0,
              remainingDistanceKm: etaData.remainingDistanceKm,
              etaMinutes: etaData.etaMinutes,
              timestamp: new Date().toISOString(),
            });
          }
        }
      } catch (err) {
        console.error('Error handling driver:location_update:', err);
      }
    });

    // ─── Driver Duty Status Change ──────────────────────────────────
    socket.on('driver:duty_change', async ({ isOnline }) => {
      try {
        if (user.role !== 'driver') return;

        const driver = await Driver.findOneAndUpdate(
          { user: user._id },
          { $set: { isAvailable: Boolean(isOnline) } },
          { returnDocument: 'after' }
        );

        if (driver) {
          if (driver.isAvailable) {
            socket.join('drivers');
          } else {
            socket.leave('drivers');
          }
          socket.emit('driver:duty_updated', { isOnline: driver.isAvailable });
        }
      } catch (err) {
        console.error('Error in driver:duty_change:', err);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: User ${user.name} (${reason})`);
    });
  });

  ioInstance = io;
  return io;
};

export const getIO = () => {
  return ioInstance;
};
