import crypto from 'crypto';
import Ride from '../models/Ride.js';
import TrustedContact from '../models/TrustedContact.js';
import { createNotification } from './notification.service.js';
import { getIO } from '../socket.js';

/**
 * Generate secure Share Token for active ride
 */
export async function generateRideShare({ rideId, userId }) {
  const ride = await Ride.findById(rideId).populate('passenger', 'name email phone');
  if (!ride) {
    throw new Error('Ride not found');
  }

  if (ride.passenger._id.toString() !== userId.toString()) {
    throw new Error('Unauthorized: You can only share your own active rides');
  }

  const activeStatuses = ['accepted', 'driver_arriving', 'arrived', 'in_progress'];
  if (!activeStatuses.includes(ride.status)) {
    throw new Error(`Cannot share ride in state "${ride.status}". Ride sharing is available only during active trips.`);
  }

  // Generate cryptographically secure share token if not existing
  let token = ride.shareToken;
  if (!token || !ride.isShared || (ride.shareExpiresAt && ride.shareExpiresAt < new Date())) {
    token = crypto.randomBytes(16).toString('hex');
    ride.shareToken = token;
    ride.isShared = true;
    ride.shareExpiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // Expires in 4 hours
    await ride.save();
  }

  // Socket.IO Emit
  const io = getIO();
  if (io) {
    io.to(`ride:${ride._id}`).emit('RIDE_SHARE_STARTED', {
      rideId: ride._id,
      shareToken: token,
      passengerName: ride.passenger.name.split(' ')[0],
      shareExpiresAt: ride.shareExpiresAt,
    });
  }

  // Notify trusted contacts configured for ride share
  const trustedContacts = await TrustedContact.find({
    user: ride.passenger._id,
    receiveRideShare: true,
  });

  for (const contact of trustedContacts) {
    console.log(`📱 [RIDE SHARE] Sent live tracking link to ${contact.name} (${contact.phone})`);
  }

  return {
    shareToken: token,
    shareUrl: `/shared-ride/${token}`,
    expiresAt: ride.shareExpiresAt,
    isShared: true,
    message: 'Live ride link generated successfully.',
  };
}

/**
 * Stop / Revoke Ride Share
 */
export async function stopRideShare({ rideId, userId }) {
  const ride = await Ride.findById(rideId);
  if (!ride) {
    throw new Error('Ride not found');
  }

  if (ride.passenger.toString() !== userId.toString()) {
    throw new Error('Unauthorized');
  }

  ride.isShared = false;
  ride.shareExpiresAt = new Date();
  await ride.save();

  const io = getIO();
  if (io) {
    io.to(`ride:${ride._id}`).emit('RIDE_SHARE_STOPPED', {
      rideId: ride._id,
    });
  }

  return { success: true, message: 'Live ride sharing stopped.' };
}

/**
 * Get Public Sanitized Ride Details via Share Token (For Trusted Contacts & Family)
 */
export async function getSharedRideDetails(shareToken) {
  if (!shareToken) {
    throw new Error('Share token is required');
  }

  const ride = await Ride.findOne({ shareToken })
    .populate('passenger', 'name')
    .populate({
      path: 'driver',
      populate: [
        { path: 'user', select: 'name' },
        { path: 'activeVehicle' },
      ],
    });

  if (!ride) {
    throw new Error('Invalid or expired ride share link.');
  }

  // Check if expired or revoked
  const isExpired = ride.shareExpiresAt && ride.shareExpiresAt < new Date();
  const isFinished = ['completed', 'cancelled'].includes(ride.status);

  if (!ride.isShared || isExpired || isFinished) {
    throw new Error('This ride share link has expired or the trip has ended.');
  }

  // Privacy-preserved sanitized data
  const passengerFirstName = ride.passenger ? ride.passenger.name.split(' ')[0] : 'Sanghini Rider';
  const driverFirstName = ride.driver?.user ? ride.driver.user.name.split(' ')[0] : 'Verified Woman Partner';

  return {
    rideId: ride._id.toString(),
    brand: 'Sanghini Ride • Udaipur Women Mobility',
    shareToken: ride.shareToken,
    rideStatus: ride.status,
    passengerName: passengerFirstName,
    driver: ride.driver
      ? {
          firstName: driverFirstName,
          rating: ride.driver.rating || 5.0,
          vehicle: ride.driver.activeVehicle
            ? {
                make: ride.driver.activeVehicle.make,
                model: ride.driver.activeVehicle.model,
                color: ride.driver.activeVehicle.color,
                plateNumber: ride.driver.activeVehicle.registrationNumber,
              }
            : null,
        }
      : null,
    tripDetails: {
      pickupAddress: ride.pickupLocation?.address,
      dropoffAddress: ride.dropoffLocation?.address,
      estimatedDistanceKm: ride.estimatedDistance,
      estimatedDurationMins: ride.estimatedDuration,
    },
    latestLocation: {
      coordinates: ride.driverLocation?.coordinates || ride.pickupLocation?.coordinates?.coordinates || [73.6914, 24.6008],
      heading: ride.driverLocation?.heading || 0,
      updatedAt: ride.driverLocation?.updatedAt || ride.updatedAt,
    },
    hasActiveSos: Boolean(ride.hasActiveSos),
    expiresAt: ride.shareExpiresAt,
  };
}
