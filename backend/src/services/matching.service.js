import Driver from '../models/Driver.js';
import Ride from '../models/Ride.js';
import { calculateHaversineDistance } from '../utils/rideCalculator.js';
import { getIO } from '../socket.js';
import { createNotification } from './notification.service.js';

// Map to track active timeout timers per ride: rideId -> Timer
const activeDispatchTimers = new Map();

/**
 * Find eligible online, verified, and unassigned drivers near a pickup location
 * @param {[number, number]} pickupCoords - [lng, lat]
 * @param {number} maxRadiusKm - Search radius in km (default 25km to cover Udaipur and outskirts)
 * @param {Array<string>} excludeDriverIds - Driver IDs to exclude (already rejected/declined)
 */
export async function findEligibleDrivers(pickupCoords, maxRadiusKm = 25, excludeDriverIds = []) {
  try {
    const query = {
      isAvailable: true,
      verificationStatus: 'verified',
    };

    if (excludeDriverIds && excludeDriverIds.length > 0) {
      query._id = { $nin: excludeDriverIds };
    }

    const onlineDrivers = await Driver.find(query).populate('user', 'name phone email profilePhoto');

    const rankedDrivers = onlineDrivers
      .map((driver) => {
        const driverCoords = driver.currentLocation?.coordinates || [73.6826, 24.5854];
        const distanceKm = calculateHaversineDistance(driverCoords, pickupCoords);
        return {
          driver,
          distanceKm,
        };
      })
      .filter((item) => item.distanceKm <= maxRadiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return rankedDrivers;
  } catch (error) {
    console.error('Error finding eligible drivers:', error);
    return [];
  }
}

/**
 * Dispatch a ride request to eligible drivers and manage timeout
 * @param {string} rideId
 */
export async function dispatchRide(rideId) {
  try {
    const ride = await Ride.findById(rideId).populate('passenger', 'name phone email profilePhoto');
    if (!ride || !['requested', 'finding_driver'].includes(ride.status)) {
      return;
    }

    const pickupCoords = ride.pickupLocation?.coordinates?.coordinates || [73.6826, 24.5854];
    const excludedIds = ride.rejectedDrivers || [];

    const eligibleList = await findEligibleDrivers(pickupCoords, 25, excludedIds);

    const io = getIO();

    if (eligibleList.length === 0) {
      // No eligible drivers online
      if (activeDispatchTimers.has(rideId.toString())) {
        clearTimeout(activeDispatchTimers.get(rideId.toString()));
      }

      const timer = setTimeout(async () => {
        try {
          const currentRide = await Ride.findById(rideId);
          if (currentRide && ['requested', 'finding_driver'].includes(currentRide.status)) {
            currentRide.status = 'no_driver_available';
            await currentRide.save();

            const passengerId = currentRide.passenger?.toString() || currentRide.passenger;

            // Send notification to passenger
            await createNotification({
              recipient: passengerId,
              title: 'No Drivers Available',
              message: 'No verified women drivers are currently available nearby in Udaipur. Please retry in a few moments.',
              type: 'no_driver_available',
              rideId: currentRide._id,
              data: { rideId: currentRide._id, status: 'no_driver_available' },
            });

            if (io) {
              const payload = {
                rideId: currentRide._id,
                status: 'no_driver_available',
                message: 'No verified women drivers are currently available nearby in Udaipur. Please retry in a few moments.',
              };
              io.to(`ride:${rideId}`).emit('ride:no_driver_available', payload);
              io.to(`ride:${rideId}`).emit('no_driver_available', payload);
              io.to(`user:${passengerId}`).emit('ride:no_driver_available', payload);
              io.to(`user:${passengerId}`).emit('no_driver_available', payload);
            }
          }
        } catch (e) {
          console.error('Error in no_driver timeout:', e);
        } finally {
          activeDispatchTimers.delete(rideId.toString());
        }
      }, 20000);

      activeDispatchTimers.set(rideId.toString(), timer);
      return;
    }

    // Drivers exist: Notify online drivers in the 'drivers' room via Socket.IO
    const ridePayload = {
      _id: ride._id,
      passenger: ride.passenger,
      pickupLocation: ride.pickupLocation,
      dropoffLocation: ride.dropoffLocation,
      estimatedDistance: ride.estimatedDistance,
      estimatedDuration: ride.estimatedDuration,
      fare: ride.fare,
      status: ride.status,
      createdAt: ride.createdAt,
    };

    if (io) {
      io.to('drivers').emit('ride:new_request', { ride: ridePayload });
      io.to('drivers').emit('ride_offered', { ride: ridePayload });
    }

    // Send in-app notification to the top eligible drivers
    for (const item of eligibleList.slice(0, 3)) {
      if (item.driver?.user?._id) {
        await createNotification({
          recipient: item.driver.user._id,
          title: 'New Ride Request nearby',
          message: `Pickup: ${ride.pickupLocation?.address || 'Pickup'} • ₹${ride.fare}`,
          type: 'ride_offered',
          rideId: ride._id,
          data: {
            rideId: ride._id,
            fare: ride.fare,
            pickupAddress: ride.pickupLocation?.address,
            dropoffAddress: ride.dropoffLocation?.address,
          },
        });
      }
    }

    // Set a matching timeout (e.g. 45s) to handle no responses
    if (activeDispatchTimers.has(rideId.toString())) {
      clearTimeout(activeDispatchTimers.get(rideId.toString()));
    }

    const matchTimer = setTimeout(async () => {
      try {
        const currentRide = await Ride.findById(rideId);
        if (currentRide && ['requested', 'finding_driver'].includes(currentRide.status)) {
          currentRide.status = 'no_driver_available';
          await currentRide.save();

          const passengerId = currentRide.passenger?.toString() || currentRide.passenger;

          await createNotification({
            recipient: passengerId,
            title: 'No Drivers Available',
            message: 'All nearby drivers in Udaipur are currently busy. You can retry matching shortly.',
            type: 'no_driver_available',
            rideId: currentRide._id,
            data: { rideId: currentRide._id, status: 'no_driver_available' },
          });

          if (io) {
            const payload = {
              rideId: currentRide._id,
              status: 'no_driver_available',
              message: 'All nearby drivers in Udaipur are currently busy. You can retry matching shortly.',
            };
            io.to(`ride:${rideId}`).emit('ride:no_driver_available', payload);
            io.to(`ride:${rideId}`).emit('no_driver_available', payload);
            io.to(`user:${passengerId}`).emit('ride:no_driver_available', payload);
            io.to(`user:${passengerId}`).emit('no_driver_available', payload);
          }
        }
      } catch (e) {
        console.error('Error in dispatch matching timeout:', e);
      } finally {
        activeDispatchTimers.delete(rideId.toString());
      }
    }, 45000);

    activeDispatchTimers.set(rideId.toString(), matchTimer);
  } catch (error) {
    console.error('Error dispatching ride:', error);
  }
}

/**
 * Handle when a driver rejects a ride request
 * @param {string} rideId
 * @param {string} driverId
 */
export async function handleDriverReject(rideId, driverId) {
  try {
    const ride = await Ride.findById(rideId);
    if (!ride) return;

    if (!ride.rejectedDrivers.includes(driverId)) {
      ride.rejectedDrivers.push(driverId);
      await ride.save();
    }

    // Redispatch to remaining drivers
    await dispatchRide(rideId);
  } catch (error) {
    console.error('Error handling driver reject:', error);
  }
}

/**
 * Cancel dispatch timer when ride is accepted or cancelled
 * @param {string} rideId
 */
export function clearDispatchTimer(rideId) {
  if (activeDispatchTimers.has(rideId.toString())) {
    clearTimeout(activeDispatchTimers.get(rideId.toString()));
    activeDispatchTimers.delete(rideId.toString());
  }
}
