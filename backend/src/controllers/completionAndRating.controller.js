import {
  completeRideByDriver,
  submitRating,
  getUserRatings,
} from '../services/completionAndRating.service.js';

export const completeRide = async (req, res) => {
  try {
    const { id } = req.params; // Ride ID
    const { distanceKm, durationMins } = req.body;

    const ride = await completeRideByDriver({
      rideId: id,
      driverUserId: req.user._id,
      finalDistanceKm: distanceKm,
      finalDurationMins: durationMins,
    });

    return res.status(200).json({
      success: true,
      message: 'Ride completed successfully.',
      data: ride,
    });
  } catch (error) {
    console.error('Error in completeRide controller:', error);
    return res.status(error.message.includes('Unauthorized') ? 403 : 400).json({
      success: false,
      message: error.message || 'Failed to complete ride.',
    });
  }
};

export const submitRideRating = async (req, res) => {
  try {
    const { id } = req.params; // Ride ID
    const { rating, review } = req.body;

    const ratingDoc = await submitRating({
      rideId: id,
      reviewerId: req.user._id,
      rating,
      review,
    });

    return res.status(201).json({
      success: true,
      message: 'Rating and review submitted successfully.',
      data: ratingDoc,
    });
  } catch (error) {
    console.error('Error in submitRideRating controller:', error);
    return res.status(error.message.includes('Unauthorized') ? 403 : 400).json({
      success: false,
      message: error.message || 'Failed to submit rating.',
    });
  }
};

export const getUserRatingsHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const targetUserId = userId || req.user._id;

    const result = await getUserRatings(targetUserId);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch ratings history.',
    });
  }
};
