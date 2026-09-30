import Ride from '../models/Ride.js';
import Driver from '../models/Driver.js';
import User from '../models/User.js';
import Rating from '../models/Rating.js';
import { calculateAuthoritativeFare } from '../utils/fareCalculator.js';
import { createNotification } from './notification.service.js';
import { getIO } from '../socket.js';

/**
 * Backend-Authoritative Driver Ride Completion
 */
export async function completeRideByDriver({ rideId, driverUserId, finalDistanceKm, finalDurationMins }) {
  const ride = await Ride.findById(rideId)
    .populate('passenger', 'name email phone')
    .populate({ path: 'driver', populate: { path: 'user', select: 'name phone' } });

  if (!ride) {
    throw new Error('Ride not found');
  }

  // Security Check: Only assigned driver can complete ride
  if (!ride.driver || !ride.driver.user || ride.driver.user._id.toString() !== driverUserId.toString()) {
    throw new Error('Unauthorized: Only the assigned driver partner can complete this ride.');
  }

  // State Transition Check: Must be in_progress
  if (ride.status !== 'in_progress') {
    throw new Error(`Cannot complete ride in state "${ride.status}". Ride must be "in_progress" to be completed.`);
  }

  // Update distance/duration if provided
  if (finalDistanceKm && finalDistanceKm > 0) {
    ride.estimatedDistance = parseFloat(finalDistanceKm);
  }
  if (finalDurationMins && finalDurationMins > 0) {
    ride.estimatedDuration = Math.round(finalDurationMins);
  }

  // Finalize Authoritative Fare
  const fareBreakdown = calculateAuthoritativeFare({
    distanceKm: ride.estimatedDistance || 3.0,
    durationMins: ride.estimatedDuration || 10,
    vehicleType: 'auto',
  });
  ride.fareBreakdown = fareBreakdown;
  ride.fare = fareBreakdown.totalFare;

  // Complete Ride
  ride.status = 'completed';
  ride.completedAt = new Date();
  ride.isShared = false; // Expire live sharing upon completion
  ride.hasActiveSos = false;
  await ride.save();

  // Create In-App Notification
  const passengerId = ride.passenger._id.toString();
  await createNotification({
    recipient: passengerId,
    title: 'Ride Completed 🎉',
    message: `Your ride to ${ride.dropoffLocation.address} has ended. Total Fare: ₹${ride.fare}. Please rate your driver.`,
    type: 'ride_completed',
    rideId: ride._id,
    data: { rideId: ride._id, fare: ride.fare },
  });

  // Socket.IO Emit
  const io = getIO();
  if (io) {
    const payload = {
      rideId: ride._id,
      status: 'completed',
      fare: ride.fare,
      fareBreakdown: ride.fareBreakdown,
      completedAt: ride.completedAt,
    };
    io.to(`ride:${ride._id}`).emit('ride_completed', payload);
    io.to(`user:${passengerId}`).emit('ride_completed', payload);
    io.to(`user:${driverUserId.toString()}`).emit('ride_completed', payload);
  }

  return ride;
}

/**
 * Submit Rating & Review after ride completion
 */
export async function submitRating({ rideId, reviewerId, rating, review }) {
  const ride = await Ride.findById(rideId)
    .populate('passenger', 'name')
    .populate({ path: 'driver', populate: { path: 'user', select: 'name' } });

  if (!ride) {
    throw new Error('Ride not found');
  }

  // Must be completed
  if (ride.status !== 'completed') {
    throw new Error('Ratings and reviews can only be submitted for completed rides.');
  }

  const isPassenger = ride.passenger && ride.passenger._id.toString() === reviewerId.toString();
  const isDriver = ride.driver?.user && ride.driver.user._id.toString() === reviewerId.toString();

  if (!isPassenger && !isDriver) {
    throw new Error('Unauthorized: You can only rate rides you participated in.');
  }

  const reviewerRole = isPassenger ? 'passenger' : 'driver';
  const reviewedUser = isPassenger ? ride.driver.user._id : ride.passenger._id;

  const numericRating = Number(rating);
  if (!numericRating || numericRating < 1 || numericRating > 5) {
    throw new Error('Rating value must be a number between 1 and 5.');
  }

  // Prevent duplicate rating submission
  const existingRating = await Rating.findOne({ ride: ride._id, reviewer: reviewerId });
  if (existingRating) {
    throw new Error('You have already submitted a rating for this ride.');
  }

  // Create Rating Record
  const ratingDoc = await Rating.create({
    ride: ride._id,
    reviewer: reviewerId,
    reviewerRole,
    reviewedUser,
    rating: numericRating,
    review: review ? review.trim() : undefined,
  });

  // Update Ride flag
  if (isPassenger) {
    ride.passengerRated = true;
  } else {
    ride.driverRated = true;
  }
  await ride.save();

  // Recalculate average rating for reviewed user/driver
  if (reviewerRole === 'passenger' && ride.driver) {
    // Recalculate Driver model average rating
    const driverRatings = await Rating.find({ reviewedUser, reviewerRole: 'passenger' });
    const totalCount = driverRatings.length;
    const sumRating = driverRatings.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = parseFloat((sumRating / totalCount).toFixed(1));

    await Driver.findByIdAndUpdate(ride.driver._id, {
      $set: { rating: avgRating, totalRides: totalCount },
    });
  }

  // Send Notification
  await createNotification({
    recipient: reviewedUser.toString(),
    title: 'New Rating Received ⭐',
    message: `You received a ${numericRating}-star rating for Ride #${ride._id.toString().slice(-6)}.`,
    type: 'system',
    rideId: ride._id,
  });

  return ratingDoc;
}

/**
 * Get ratings & reviews for a user or driver
 */
export async function getUserRatings(targetUserId) {
  const ratings = await Rating.find({ reviewedUser: targetUserId })
    .populate('reviewer', 'name profilePhoto')
    .sort({ createdAt: -1 });

  const total = ratings.length;
  const avg = total > 0 ? parseFloat((ratings.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1)) : 5.0;

  return {
    totalRatings: total,
    averageRating: avg,
    ratings,
  };
}
