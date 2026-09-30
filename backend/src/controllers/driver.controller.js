import Driver from '../models/Driver.js';
import Vehicle from '../models/Vehicle.js';
import Ride from '../models/Ride.js';
import { calculateLiveETA } from '../services/map.service.js';
import { calculateHaversineDistance } from '../utils/rideCalculator.js';
import { getIO } from '../socket.js';
import { formatRideResponse } from './ride.controller.js';

/**
 * @desc    Get current driver status, profile, & active ride
 * @route   GET /api/driver/status
 * @access  Private (Driver only)
 */
export const getDriverStatus = async (req, res) => {
  try {
    let driver = await Driver.findOne({ user: req.user._id });

    if (!driver) {
      // Return empty profile state so frontend can prompt verification submission
      return res.status(200).json({
        success: true,
        data: {
          id: null,
          isOnline: false,
          verificationStatus: 'not_submitted',
          licenseNumber: null,
          rating: 5.0,
          totalRides: 0,
          currentLocation: null,
          heading: 0,
          activeRide: null,
        },
      });
    }


    // Find if driver currently has an active ride
    const activeRideDoc = await Ride.findOne({
      driver: driver._id,
      status: { $in: ['accepted', 'driver_arriving', 'arrived', 'in_progress'] },
    })
      .populate('passenger', 'name phone email profilePhoto')
      .populate({ path: 'driver', populate: { path: 'user', select: 'name phone email' } });

    return res.status(200).json({
      success: true,
      data: {
        id: driver._id,
        isOnline: driver.isAvailable,
        verificationStatus: driver.verificationStatus,
        licenseNumber: driver.licenseNumber,
        rating: driver.rating || 5.0,
        totalRides: driver.totalRides || 0,
        currentLocation: driver.currentLocation,
        heading: driver.heading || 0,
        activeRide: activeRideDoc ? formatRideResponse(activeRideDoc) : null,
      },
    });
  } catch (error) {
    console.error('Error fetching driver status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch driver status.',
    });
  }
};

/**
 * @desc    Update driver online/offline duty status
 * @route   POST /api/driver/status, PATCH /api/driver/status
 * @access  Private (Driver only)
 */
export const updateDriverStatus = async (req, res) => {
  try {
    const { isOnline, isAvailable, coordinates } = req.body;
    const targetStatus = isOnline !== undefined ? Boolean(isOnline) : Boolean(isAvailable);

    let driver = await Driver.findOne({ user: req.user._id });

    if (!driver) {
      // No driver profile — must submit verification first
      return res.status(403).json({
        success: false,
        message: 'Driver profile not found. Please submit your verification documents first via POST /api/driver/verification.',
      });
    }

    // Block going online if not yet approved by admin
    if (targetStatus && driver.verificationStatus !== 'verified') {
      return res.status(403).json({
        success: false,
        message: `Cannot go online. Your verification status is "${driver.verificationStatus}". Please wait for admin approval.`,
      });
    }

    driver.isAvailable = targetStatus;

    // Optionally update location when going online
    if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
      driver.currentLocation = { type: 'Point', coordinates };
    }

    await driver.save();

    return res.status(200).json({
      success: true,
      message: driver.isAvailable
        ? 'You are now ONLINE. You will receive real-time ride requests across Udaipur.'
        : 'You are now OFFLINE. You will not receive ride requests.',
      data: {
        id: driver._id,
        isOnline: driver.isAvailable,
        verificationStatus: driver.verificationStatus,
      },
    });
  } catch (error) {
    console.error('Error updating driver status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update duty status.',
    });
  }
};


/**
 * @desc    Update driver's current GPS location & broadcast to active ride
 * @route   PATCH /api/driver/location, POST /api/driver/location
 * @access  Private (Driver only)
 */
export const updateDriverLocation = async (req, res) => {
  try {
    const { coordinates, heading = 0, speed = 0, rideId } = req.body;

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Valid coordinates [longitude, latitude] are required.',
      });
    }

    const [lng, lat] = coordinates;
    const validCoords = [parseFloat(lng), parseFloat(lat)];

    const driver = await Driver.findOneAndUpdate(
      { user: req.user._id },
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

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found.',
      });
    }

    let etaData = null;

    // If an active ride is specified or found, update ride's driverLocation and calculate live ETA
    const targetRideId = rideId || driver.activeRide;
    if (targetRideId) {
      const ride = await Ride.findById(targetRideId);
      if (ride && ride.driver && ride.driver.toString() === driver._id.toString()) {
        const targetCoords =
          ride.status === 'in_progress'
            ? ride.dropoffLocation?.coordinates?.coordinates
            : ride.pickupLocation?.coordinates?.coordinates;

        if (targetCoords && targetCoords.length === 2) {
          etaData = calculateLiveETA(validCoords, targetCoords);
          ride.currentDistanceKm = etaData.remainingDistanceKm;
          ride.currentEtaMinutes = etaData.etaMinutes;
        }

        ride.driverLocation = {
          type: 'Point',
          coordinates: validCoords,
          heading: parseFloat(heading) || 0,
          speed: parseFloat(speed) || 0,
          updatedAt: new Date(),
        };
        await ride.save();

        // Broadcast live movement over Socket.IO to passenger
        const io = getIO();
        if (io) {
          io.to(`ride:${ride._id}`).emit('driver:location_changed', {
            rideId: ride._id,
            coordinates: validCoords,
            heading: parseFloat(heading) || 0,
            speed: parseFloat(speed) || 0,
            remainingDistanceKm: etaData?.remainingDistanceKm ?? ride.estimatedDistance,
            etaMinutes: etaData?.etaMinutes ?? ride.estimatedDuration,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Driver location updated.',
      data: {
        currentLocation: driver.currentLocation,
        heading: driver.heading,
        eta: etaData,
      },
    });
  } catch (error) {
    console.error('Error updating driver location:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update driver location.',
    });
  }
};

/**
 * @desc    Get eligible pending ride requests for online driver (ranked by proximity)
 * @route   GET /api/driver/requests
 * @access  Private (Driver only)
 */
export const getPendingRequests = async (req, res) => {
  try {
    const driver = await Driver.findOne({ user: req.user._id });

    if (!driver || !driver.isAvailable) {
      return res.status(200).json({
        success: true,
        count: 0,
        isOnline: false,
        message: 'Driver is offline.',
        data: [],
      });
    }

    // Find pending ride requests that are not assigned and not rejected by this driver
    const pendingRides = await Ride.find({
      status: { $in: ['requested', 'finding_driver'] },
      $or: [{ driver: { $exists: false } }, { driver: null }],
      rejectedDrivers: { $ne: driver._id },
    })
      .populate('passenger', 'name phone email profilePhoto')
      .sort({ createdAt: -1 });

    const driverCoords = driver.currentLocation?.coordinates || [73.6826, 24.5854];

    // Compute proximity distance from driver to pickup point for each pending request
    const ridesWithDistance = pendingRides.map((rideDoc) => {
      const rideObj = formatRideResponse(rideDoc);
      const pickupCoords = rideDoc.pickupLocation?.coordinates?.coordinates || [73.6826, 24.5854];
      const distanceToPickup = calculateHaversineDistance(driverCoords, pickupCoords);
      return {
        ...rideObj,
        distanceToPickupKm: distanceToPickup,
      };
    });

    // Rank by closest pickup
    ridesWithDistance.sort((a, b) => a.distanceToPickupKm - b.distanceToPickupKm);

    return res.status(200).json({
      success: true,
      count: ridesWithDistance.length,
      isOnline: true,
      data: ridesWithDistance,
    });
  } catch (error) {
    console.error('Error fetching pending ride requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pending ride requests.',
    });
  }
};

/**
 * @desc    Get driver earnings summary
 * @route   GET /api/driver/earnings
 * @access  Private (Driver only)
 */
export const getDriverEarnings = async (req, res) => {
  try {
    const driver = await Driver.findOne({ user: req.user._id });

    if (!driver) {
      return res.status(200).json({
        success: true,
        data: {
          todayEarnings: 0,
          totalEarnings: 0,
          completedRidesCount: 0,
          todayRidesCount: 0,
        },
      });
    }

    const completedRides = await Ride.find({
      driver: driver._id,
      status: 'completed',
    }).sort({ completedAt: -1 });

    const totalEarnings = completedRides.reduce((sum, r) => sum + (r.fare || 0), 0);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayRides = completedRides.filter(
      (r) => r.completedAt && new Date(r.completedAt) >= startOfToday
    );
    const todayEarnings = todayRides.reduce((sum, r) => sum + (r.fare || 0), 0);

    return res.status(200).json({
      success: true,
      data: {
        todayEarnings,
        totalEarnings,
        completedRidesCount: completedRides.length,
        todayRidesCount: todayRides.length,
      },
    });
  } catch (error) {
    console.error('Error fetching driver earnings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch driver earnings.',
    });
  }
};

/**
 * @desc    Submit driver verification documents (license + vehicle)
 * @route   POST /api/driver/verification
 * @access  Private (Driver only)
 */
export const submitVerification = async (req, res) => {
  try {
    const { licenseNumber, licenseExpiry, vehicleType, plateNumber, model: vehicleModel } = req.body;

    if (!licenseNumber || !licenseExpiry) {
      return res.status(400).json({
        success: false,
        message: 'License number and expiry date are required.',
      });
    }

    // Find or create the driver profile
    let driver = await Driver.findOne({ user: req.user._id });

    if (!driver) {
      driver = new Driver({
        user: req.user._id,
        licenseNumber,
        licenseExpiry: new Date(licenseExpiry),
        verificationStatus: 'in_review',
        backgroundCheckStatus: 'pending',
        currentLocation: { type: 'Point', coordinates: [73.6826, 24.5854] },
      });
    } else {
      driver.licenseNumber = licenseNumber;
      driver.licenseExpiry = new Date(licenseExpiry);
      driver.verificationStatus = 'in_review';
    }

    await driver.save();

    // Create or update vehicle record if vehicle details provided
    if (vehicleType && plateNumber) {
      let vehicle = await Vehicle.findOne({ driver: driver._id });
      const registrationNumber = plateNumber.replace(/\s+/g, '').toUpperCase();
      if (!vehicle) {
        vehicle = await Vehicle.create({
          driver: driver._id,
          vehicleType: vehicleType,
          registrationNumber,
          make: vehicleModel ? vehicleModel.split(' ')[0] : 'Generic',
          model: vehicleModel || 'EV',
          year: new Date().getFullYear(),
          color: 'White',
          isActive: true,
        });
      } else {
        vehicle.vehicleType = vehicleType;
        vehicle.registrationNumber = registrationNumber;
        if (vehicleModel) {
          vehicle.make = vehicleModel.split(' ')[0];
          vehicle.model = vehicleModel;
        }
        await vehicle.save();
      }
      driver.activeVehicle = vehicle._id;
      await driver.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Verification documents submitted. Awaiting admin review.',
      data: {
        driver: {
          _id: driver._id,
          verificationStatus: driver.verificationStatus,
          licenseNumber: driver.licenseNumber,
        },
      },
    });
  } catch (error) {
    console.error('Error in submitVerification:', error);
    // Handle duplicate license number
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A driver profile with this license number already exists.',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to submit verification documents.',
    });
  }
};
