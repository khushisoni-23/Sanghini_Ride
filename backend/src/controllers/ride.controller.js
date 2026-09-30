import Ride from '../models/Ride.js';
import Driver from '../models/Driver.js';
import {
  resolveCoordinates,
  resolveCoordinatesAsync,
  calculateRideMetrics,
  generateRideOTP,
  VEHICLE_RATES,
} from '../utils/rideCalculator.js';
import { fetchDrivingRoute, calculateLiveETA } from '../services/map.service.js';
import { dispatchRide, handleDriverReject, clearDispatchTimer } from '../services/matching.service.js';
import { createNotification } from '../services/notification.service.js';
import { getIO } from '../socket.js';

/**
 * Helper: Format ride object with clean driver and passenger properties
 */
export const formatRideResponse = (rideDoc) => {
  if (!rideDoc) return null;
  const obj = typeof rideDoc.toObject === 'function' ? rideDoc.toObject() : { ...rideDoc };

  if (obj.driver) {
    if (obj.driver.user && typeof obj.driver.user === 'object') {
      const u = obj.driver.user;
      obj.driver = {
        _id: obj.driver._id,
        id: obj.driver._id,
        name: u.name || 'Sanghini Driver',
        phone: u.phone || '',
        email: u.email || '',
        rating: obj.driver.rating || 5.0,
        totalRides: obj.driver.totalRides || 0,
        licenseNumber: obj.driver.licenseNumber || '',
        currentLocation: obj.driver.currentLocation || { coordinates: [73.6826, 24.5854] },
        heading: obj.driver.heading || 0,
      };
    } else if (obj.driver.name) {
      // Already formatted or flat
    }
  }

  return obj;
};

/**
 * @desc    Estimate ride distance, duration, route geometry, and fare
 * @route   POST /api/rides/estimate
 * @access  Public / Authenticated
 */
export const estimateRide = async (req, res) => {
  try {
    const { pickupLocation, dropoffLocation, vehicleType = 'auto' } = req.body;

    if (!pickupLocation || !dropoffLocation) {
      return res.status(400).json({
        success: false,
        message: 'Pickup and dropoff locations are required.',
      });
    }

    const pickupAddress = typeof pickupLocation === 'string' ? pickupLocation : pickupLocation.address;
    const dropoffAddress = typeof dropoffLocation === 'string' ? dropoffLocation : dropoffLocation.address;

    if (!pickupAddress || !dropoffAddress) {
      return res.status(400).json({
        success: false,
        message: 'Both pickup and dropoff addresses must be provided.',
      });
    }

    // Resolve real coordinates — Nominatim geocoding for unknown addresses
    const [pickupCoords, dropoffCoords] = await Promise.all([
      resolveCoordinatesAsync(
        pickupAddress,
        pickupLocation?.coordinates?.coordinates || pickupLocation?.coordinates
      ),
      resolveCoordinatesAsync(
        dropoffAddress,
        dropoffLocation?.coordinates?.coordinates || dropoffLocation?.coordinates
      ),
    ]);

    // Fetch real driving route from map provider / OSRM
    const routeData = await fetchDrivingRoute(pickupCoords, dropoffCoords);
    const metrics = calculateRideMetrics(pickupCoords, dropoffCoords, vehicleType);

    const finalDistance = routeData.distanceKm || metrics.distanceKm;
    const finalDuration = routeData.durationMins || metrics.durationMins;

    const vehicleOptions = Object.keys(VEHICLE_RATES).map((vType) => {
      const vMetrics = calculateRideMetrics(pickupCoords, dropoffCoords, vType);
      return {
        id: vType,
        name: VEHICLE_RATES[vType].name,
        capacity: VEHICLE_RATES[vType].capacity,
        estimatedFare: vMetrics.fare,
        estimatedDuration: finalDuration,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        pickupLocation: {
          address: pickupAddress,
          coordinates: pickupCoords,
        },
        dropoffLocation: {
          address: dropoffAddress,
          coordinates: dropoffCoords,
        },
        routeGeometry: routeData.geometry,
        estimatedDistance: finalDistance,
        estimatedDuration: finalDuration,
        fare: metrics.fare,
        selectedVehicleType: metrics.vehicleType,
        vehicleOptions,
      },
    });
  } catch (error) {
    console.error('Error in estimateRide:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to estimate ride metrics.',
    });
  }
};

/**
 * @desc    Create a new ride request and initiate driver matching
 * @route   POST /api/rides
 * @access  Private (Passenger only)
 */
export const createRide = async (req, res) => {
  try {
    const { pickupLocation, dropoffLocation, vehicleType } = req.body;

    if (!pickupLocation || !dropoffLocation) {
      return res.status(400).json({
        success: false,
        message: 'Pickup and dropoff locations are required.',
      });
    }

    const pickupAddress = typeof pickupLocation === 'string' ? pickupLocation : pickupLocation.address;
    const dropoffAddress = typeof dropoffLocation === 'string' ? dropoffLocation : dropoffLocation.address;

    if (!pickupAddress || !dropoffAddress) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid pickup and destination addresses.',
      });
    }

    // Resolve real coordinates — Nominatim geocoding for unknown addresses
    const [pickupCoords, dropoffCoords] = await Promise.all([
      resolveCoordinatesAsync(
        pickupAddress,
        pickupLocation?.coordinates?.coordinates || pickupLocation?.coordinates
      ),
      resolveCoordinatesAsync(
        dropoffAddress,
        dropoffLocation?.coordinates?.coordinates || dropoffLocation?.coordinates
      ),
    ]);

    // Fetch real driving route
    const routeData = await fetchDrivingRoute(pickupCoords, dropoffCoords);
    const metrics = calculateRideMetrics(pickupCoords, dropoffCoords, vehicleType);
    const otp = generateRideOTP();

    const distance = routeData.distanceKm || metrics.distanceKm;
    const duration = routeData.durationMins || metrics.durationMins;

    const ride = await Ride.create({
      passenger: req.user._id,
      pickupLocation: {
        address: pickupAddress,
        coordinates: {
          type: 'Point',
          coordinates: pickupCoords,
        },
      },
      dropoffLocation: {
        address: dropoffAddress,
        coordinates: {
          type: 'Point',
          coordinates: dropoffCoords,
        },
      },
      routeGeometry: routeData.geometry,
      estimatedDistance: distance,
      estimatedDuration: duration,
      currentDistanceKm: distance,
      currentEtaMinutes: duration,
      fare: metrics.fare,
      status: 'finding_driver',
      otp,
      requestedAt: new Date(),
    });

    await ride.populate('passenger', 'name email phone');
    const formatted = formatRideResponse(ride);

    // Emit ride_requested event over Socket.IO
    const io = getIO();
    if (io) {
      io.to(`user:${req.user._id}`).emit('ride_requested', { ride: formatted });
      io.to(`user:${req.user._id}`).emit('ride:status_changed', {
        rideId: ride._id,
        status: 'finding_driver',
        ride: formatted,
      });
    }

    // Create persistent notification for passenger
    await createNotification({
      recipient: req.user._id,
      title: 'Ride Requested',
      message: `Searching for verified drivers near ${pickupAddress}. OTP: ${otp}`,
      type: 'ride_requested',
      rideId: ride._id,
      data: { rideId: ride._id, pickupAddress, dropoffAddress, fare: metrics.fare },
    });

    // Initiate async proximity driver dispatch
    dispatchRide(ride._id);

    return res.status(201).json({
      success: true,
      message: 'Ride request created successfully. Matching nearby drivers...',
      data: formatted,
    });
  } catch (error) {
    console.error('Error creating ride:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create ride request.',
    });
  }
};

/**
 * @desc    Accept ride request (Driver only)
 * @route   PATCH /api/rides/:id/accept
 * @access  Private (Driver only)
 */
export const acceptRide = async (req, res) => {
  try {
    let driverDoc = await Driver.findOne({ user: req.user._id }).populate('user', 'name phone email');

    if (!driverDoc) {
      driverDoc = await Driver.create({
        user: req.user._id,
        licenseNumber: 'LIC-' + Date.now(),
        licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isAvailable: true,
        verificationStatus: 'verified',
        currentLocation: { type: 'Point', coordinates: [73.6826, 24.5854] },
      });
      await driverDoc.populate('user', 'name phone email');
    }

    // SECURITY: Driver MUST be online to accept rides
    if (!driverDoc.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'You are currently offline. Please go online to accept rides.',
      });
    }

    // CONCURRENCY & ATOMICITY: findOneAndUpdate guarantees only ONE driver gets the ride
    const driverCurrentCoords = driverDoc.currentLocation?.coordinates || [73.6826, 24.5854];

    const updatedRide = await Ride.findOneAndUpdate(
      {
        _id: req.params.id,
        status: { $in: ['requested', 'finding_driver'] },
        $or: [{ driver: { $exists: false } }, { driver: null }],
      },
      {
        $set: {
          status: 'accepted',
          driver: driverDoc._id,
          acceptedAt: new Date(),
          driverLocation: {
            type: 'Point',
            coordinates: driverCurrentCoords,
            heading: driverDoc.heading || 0,
            updatedAt: new Date(),
          },
        },
      },
      { returnDocument: 'after' }
    )
      .populate('passenger', 'name phone email profilePhoto')
      .populate({ path: 'driver', populate: { path: 'user', select: 'name phone email' } });

    if (!updatedRide) {
      const existingRide = await Ride.findById(req.params.id);
      if (!existingRide) {
        return res.status(404).json({
          success: false,
          message: 'Ride not found.',
        });
      }

      if (existingRide.status === 'cancelled') {
        return res.status(400).json({
          success: false,
          message: 'This ride request was cancelled by the passenger.',
        });
      }

      if (
        existingRide.driver ||
        ['accepted', 'driver_arriving', 'arrived', 'in_progress', 'completed'].includes(existingRide.status)
      ) {
        return res.status(409).json({
          success: false,
          message: 'This ride has already been accepted by another driver.',
        });
      }

      return res.status(400).json({
        success: false,
        message: `Ride cannot be accepted when status is '${existingRide.status}'.`,
      });
    }

    // Mark driver's active ride
    driverDoc.activeRide = updatedRide._id;
    await driverDoc.save();

    // Clear matching timeout timer
    clearDispatchTimer(updatedRide._id);

    const formatted = formatRideResponse(updatedRide);
    const passengerId = updatedRide.passenger?._id?.toString() || updatedRide.passenger?.toString();
    const driverName = driverDoc.user?.name || 'Your assigned driver';

    // Broadcast live event to ride room and user room via Socket.IO
    const io = getIO();
    if (io) {
      const payload = { ride: formatted, status: 'accepted', rideId: updatedRide._id };
      io.to(`ride:${updatedRide._id}`).emit('driver_accepted', payload);
      io.to(`ride:${updatedRide._id}`).emit('ride:accepted', payload);
      io.to(`ride:${updatedRide._id}`).emit('ride:status_changed', payload);

      if (passengerId) {
        io.to(`user:${passengerId}`).emit('driver_accepted', payload);
        io.to(`user:${passengerId}`).emit('ride:accepted', payload);
        io.to(`user:${passengerId}`).emit('ride:status_changed', payload);
      }

      // Notify drivers room that this ride is taken
      io.to('drivers').emit('ride:taken', { rideId: updatedRide._id });
    }

    // Create in-app notification for passenger
    if (passengerId) {
      await createNotification({
        recipient: passengerId,
        sender: req.user._id,
        title: 'Driver Assigned!',
        message: `Verified driver ${driverName} accepted your ride. Start OTP: ${updatedRide.otp}`,
        type: 'driver_accepted',
        rideId: updatedRide._id,
        data: {
          rideId: updatedRide._id,
          driverName,
          driverPhone: driverDoc.user?.phone,
          otp: updatedRide.otp,
          fare: updatedRide.fare,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Ride accepted successfully. Drive safely to the passenger pickup point.',
      data: formatted,
    });
  } catch (error) {
    console.error('Error accepting ride:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to accept ride.',
    });
  }
};

/**
 * @desc    Decline ride request (Driver only)
 * @route   PATCH /api/rides/:id/decline
 * @access  Private (Driver only)
 */
export const declineRide = async (req, res) => {
  try {
    const driverDoc = await Driver.findOne({ user: req.user._id });
    if (driverDoc) {
      await handleDriverReject(req.params.id, driverDoc._id);
    }

    return res.status(200).json({
      success: true,
      message: 'Ride request declined.',
    });
  } catch (error) {
    console.error('Error declining ride:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to decline ride.',
    });
  }
};

/**
 * @desc    Update ride status (driver_arriving, arrived, in_progress, completed)
 * @route   PATCH /api/rides/:id/status
 * @access  Private (Driver only)
 */
export const updateRideStatus = async (req, res) => {
  try {
    const { status: newStatus } = req.body;

    if (!newStatus) {
      return res.status(400).json({
        success: false,
        message: 'Status is required.',
      });
    }

    const driverDoc = await Driver.findOne({ user: req.user._id }).populate('user', 'name phone email');
    if (!driverDoc) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found.',
      });
    }

    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found.',
      });
    }

    // SECURITY: Verify driver ownership
    if (!ride.driver || ride.driver.toString() !== driverDoc._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not the assigned driver for this ride.',
      });
    }

    // State Machine validation
    const validTransitions = {
      accepted: ['driver_arriving', 'arrived', 'in_progress', 'cancelled'],
      driver_arriving: ['arrived', 'in_progress', 'cancelled'],
      arrived: ['in_progress', 'cancelled'],
      in_progress: ['completed'],
    };

    const allowedNextStatuses = validTransitions[ride.status] || [];
    if (!allowedNextStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from '${ride.status}' to '${newStatus}'.`,
      });
    }

    ride.status = newStatus;
    if (newStatus === 'arrived') {
      ride.arrivedAt = new Date();
    } else if (newStatus === 'in_progress') {
      ride.startedAt = new Date();
    } else if (newStatus === 'completed') {
      ride.completedAt = new Date();
      driverDoc.totalRides = (driverDoc.totalRides || 0) + 1;
      driverDoc.activeRide = null;
      await driverDoc.save();
    }

    await ride.save();
    await ride.populate('passenger', 'name phone email profilePhoto');
    await ride.populate({ path: 'driver', populate: { path: 'user', select: 'name phone email' } });

    const formatted = formatRideResponse(ride);
    const passengerId = ride.passenger?._id?.toString() || ride.passenger?.toString();
    const driverUserId = driverDoc.user?._id?.toString() || req.user._id.toString();

    // Map status to socket event name
    const statusEventMap = {
      driver_arriving: 'driver_arriving',
      arrived: 'driver_arrived',
      in_progress: 'ride_started',
      completed: 'ride_completed',
    };
    const eventName = statusEventMap[newStatus] || 'ride:status_changed';

    // Live Socket.IO Broadcast
    const io = getIO();
    if (io) {
      const payload = {
        rideId: ride._id,
        status: newStatus,
        ride: formatted,
      };

      io.to(`ride:${ride._id}`).emit(eventName, payload);
      io.to(`ride:${ride._id}`).emit('ride:status_changed', payload);

      if (passengerId) {
        io.to(`user:${passengerId}`).emit(eventName, payload);
        io.to(`user:${passengerId}`).emit('ride:status_changed', payload);
      }
      if (driverUserId) {
        io.to(`user:${driverUserId}`).emit(eventName, payload);
        io.to(`user:${driverUserId}`).emit('ride:status_changed', payload);
      }
    }

    // Create corresponding In-App Notifications
    if (newStatus === 'driver_arriving' && passengerId) {
      await createNotification({
        recipient: passengerId,
        sender: req.user._id,
        title: 'Driver On The Way',
        message: 'Your driver is heading towards your pickup location.',
        type: 'driver_arriving',
        rideId: ride._id,
        data: { rideId: ride._id, status: newStatus },
      });
    } else if (newStatus === 'arrived' && passengerId) {
      await createNotification({
        recipient: passengerId,
        sender: req.user._id,
        title: 'Driver Arrived at Pickup',
        message: `Your driver has arrived. Please share start OTP: ${ride.otp} when boarding.`,
        type: 'driver_arrived',
        rideId: ride._id,
        data: { rideId: ride._id, otp: ride.otp, status: newStatus },
      });
    } else if (newStatus === 'in_progress' && passengerId) {
      await createNotification({
        recipient: passengerId,
        sender: req.user._id,
        title: 'Trip Started',
        message: `Your ride to ${ride.dropoffLocation?.address || 'Destination'} has started. Have a safe trip!`,
        type: 'ride_started',
        rideId: ride._id,
        data: { rideId: ride._id, status: newStatus },
      });
    } else if (newStatus === 'completed') {
      if (passengerId) {
        await createNotification({
          recipient: passengerId,
          sender: req.user._id,
          title: 'Ride Completed',
          message: `You have arrived safely. Total fare: ₹${ride.fare}. Thank you for riding with Sanghini!`,
          type: 'ride_completed',
          rideId: ride._id,
          data: { rideId: ride._id, fare: ride.fare, status: newStatus },
        });
      }
      if (driverUserId) {
        await createNotification({
          recipient: driverUserId,
          title: 'Trip Completed',
          message: `Trip completed successfully! You earned ₹${ride.fare}.`,
          type: 'ride_completed',
          rideId: ride._id,
          data: { rideId: ride._id, fare: ride.fare, status: newStatus },
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Ride status updated to '${newStatus}'.`,
      data: formatted,
    });
  } catch (error) {
    console.error('Error updating ride status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update ride status.',
    });
  }
};

/**
 * @desc    Retry driver matching for an active ride
 * @route   POST /api/rides/:id/retry
 * @access  Private (Passenger only)
 */
export const retryMatching = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found.',
      });
    }

    if (ride.passenger.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized.',
      });
    }

    ride.status = 'finding_driver';
    ride.rejectedDrivers = []; // Clear previous rejections on explicit user retry
    await ride.save();

    dispatchRide(ride._id);

    const io = getIO();
    if (io) {
      const payload = {
        rideId: ride._id,
        status: 'finding_driver',
        ride: formatRideResponse(ride),
      };
      io.to(`ride:${ride._id}`).emit('ride:status_changed', payload);
      io.to(`user:${req.user._id}`).emit('ride:status_changed', payload);
    }

    return res.status(200).json({
      success: true,
      message: 'Retrying driver matching in Udaipur...',
      data: formatRideResponse(ride),
    });
  } catch (error) {
    console.error('Error in retryMatching:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retry driver matching.',
    });
  }
};

/**
 * @desc    Get all rides for current passenger or driver
 * @route   GET /api/rides/my-rides
 * @access  Private
 */
export const getMyRides = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};

    if (req.user.role === 'passenger') {
      query.passenger = req.user._id;
    } else if (req.user.role === 'driver') {
      const driverDoc = await Driver.findOne({ user: req.user._id });
      if (driverDoc) {
        query.driver = driverDoc._id;
      } else {
        query.driver = null;
      }
    } else if (req.user.role === 'admin') {
      // Admin sees all
    } else {
      query.passenger = req.user._id;
    }

    if (status && status !== 'all') {
      if (status === 'active') {
        query.status = {
          $in: [
            'requested',
            'finding_driver',
            'accepted',
            'driver_arriving',
            'arrived',
            'in_progress',
          ],
        };
      } else {
        query.status = status;
      }
    }

    const rides = await Ride.find(query)
      .populate('passenger', 'name phone email profilePhoto')
      .populate({ path: 'driver', populate: { path: 'user', select: 'name phone email' } })
      .sort({ createdAt: -1 });

    const formattedRides = rides.map(formatRideResponse);

    return res.status(200).json({
      success: true,
      count: formattedRides.length,
      data: formattedRides,
    });
  } catch (error) {
    console.error('Error fetching user rides:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch rides history.',
    });
  }
};

/**
 * @desc    Get single ride by ID
 * @route   GET /api/rides/:id
 * @access  Private
 */
export const getRideById = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('passenger', 'name phone email profilePhoto')
      .populate({ path: 'driver', populate: { path: 'user', select: 'name phone email' } });

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found.',
      });
    }

    // SECURITY: Ensure current user is passenger, assigned driver, or admin
    let isDriver = false;
    if (req.user.role === 'driver') {
      const driverDoc = await Driver.findOne({ user: req.user._id });
      if (driverDoc && ride.driver && ride.driver._id.toString() === driverDoc._id.toString()) {
        isDriver = true;
      }
    }

    const isPassenger = ride.passenger && ride.passenger._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isPassenger && !isDriver && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not authorized to view this ride.',
      });
    }

    return res.status(200).json({
      success: true,
      data: formatRideResponse(ride),
    });
  } catch (error) {
    console.error('Error fetching ride by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch ride details.',
    });
  }
};

/**
 * @desc    Cancel a ride (Passenger cancellation)
 * @route   PATCH /api/rides/:id/cancel
 * @access  Private (Passenger / Owner)
 */
export const cancelRide = async (req, res) => {
  try {
    const { reason } = req.body;
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found.',
      });
    }

    // SECURITY: Ensure ownership
    if (ride.passenger.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own rides.',
      });
    }

    // Check status eligibility
    const cancellableStatuses = ['requested', 'finding_driver', 'accepted', 'driver_arriving', 'arrived', 'no_driver_available'];
    if (!cancellableStatuses.includes(ride.status)) {
      return res.status(400).json({
        success: false,
        message: `Ride cannot be cancelled when status is '${ride.status}'.`,
      });
    }

    ride.status = 'cancelled';
    ride.cancelledAt = new Date();
    ride.cancelledBy = req.user.role === 'admin' ? 'admin' : 'passenger';
    ride.cancellationReason = reason || 'Cancelled by passenger';

    await ride.save();

    // Clear matching timer if any
    clearDispatchTimer(ride._id);

    // If a driver was assigned, clear their active ride & send them a notification
    if (ride.driver) {
      const driverDoc = await Driver.findByIdAndUpdate(ride.driver, { $set: { activeRide: null } }).populate('user', '_id');
      if (driverDoc?.user?._id) {
        await createNotification({
          recipient: driverDoc.user._id,
          title: 'Ride Cancelled',
          message: 'The passenger has cancelled this ride request.',
          type: 'ride_cancelled',
          rideId: ride._id,
          data: { rideId: ride._id, status: 'cancelled' },
        });
      }
    }

    await ride.populate('passenger', 'name phone email profilePhoto');
    await ride.populate({ path: 'driver', populate: { path: 'user', select: 'name phone email' } });

    const formatted = formatRideResponse(ride);
    const passengerId = ride.passenger?._id?.toString() || ride.passenger?.toString();

    // Socket.IO Broadcast
    const io = getIO();
    if (io) {
      const payload = {
        rideId: ride._id,
        status: 'cancelled',
        ride: formatted,
      };
      io.to(`ride:${ride._id}`).emit('ride_cancelled', payload);
      io.to(`ride:${ride._id}`).emit('ride:status_changed', payload);
      io.to('drivers').emit('ride:cancelled', { rideId: ride._id });
      if (passengerId) {
        io.to(`user:${passengerId}`).emit('ride_cancelled', payload);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Ride cancelled successfully.',
      data: formatted,
    });
  } catch (error) {
    console.error('Error cancelling ride:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel ride.',
    });
  }
};
