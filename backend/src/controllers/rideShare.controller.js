import {
  generateRideShare,
  stopRideShare,
  getSharedRideDetails,
} from '../services/rideShare.service.js';

export const startRideShare = async (req, res) => {
  try {
    const { id } = req.params; // Ride ID

    const result = await generateRideShare({ rideId: id, userId: req.user._id });

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    console.error('Error in startRideShare:', error);
    return res.status(error.message.includes('Unauthorized') ? 403 : 400).json({
      success: false,
      message: error.message || 'Failed to generate ride share link.',
    });
  }
};

export const stopShare = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await stopRideShare({ rideId: id, userId: req.user._id });

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(error.message.includes('Unauthorized') ? 403 : 400).json({
      success: false,
      message: error.message || 'Failed to stop ride sharing.',
    });
  }
};

export const getSharedRide = async (req, res) => {
  try {
    const { shareToken } = req.params;

    const sharedRide = await getSharedRideDetails(shareToken);

    return res.status(200).json({
      success: true,
      data: sharedRide,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message || 'Shared ride not found or link has expired.',
    });
  }
};
