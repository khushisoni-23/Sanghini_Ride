import User from '../models/User.js';
import Driver from '../models/Driver.js';
import Vehicle from '../models/Vehicle.js';
import Ride from '../models/Ride.js';
import Payment from '../models/Payment.js';
import SafetyIncident from '../models/SafetyIncident.js';
import Rating from '../models/Rating.js';
import { createNotification } from '../services/notification.service.js';
import { getIO } from '../socket.js';

/**
 * ─── Admin Analytics ────────────────────────────────────────────────
 * Aggregates live platform metrics directly from MongoDB.
 */
export async function getAnalytics(req, res) {
  try {
    const [
      totalUsers,
      totalPassengers,
      totalDrivers,
      verifiedDrivers,
      pendingDrivers,
      activeOnlineDrivers,
      totalRides,
      completedRides,
      cancelledRides,
      activeRides,
      activeIncidents,
      totalIncidents,
      paymentsSummary,
      ratingsSummary,
      statusDistribution,
      revenueAggregation,
      recentRides
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'passenger' }),
      Driver.countDocuments(),
      Driver.countDocuments({ verificationStatus: 'verified' }),
      Driver.countDocuments({ verificationStatus: { $in: ['pending', 'in_review'] } }),
      Driver.countDocuments({ isAvailable: true }),
      Ride.countDocuments(),
      Ride.countDocuments({ status: 'completed' }),
      Ride.countDocuments({ status: 'cancelled' }),
      Ride.countDocuments({
        status: { $in: ['requested', 'finding_driver', 'accepted', 'driver_arriving', 'arrived', 'in_progress'] }
      }),
      SafetyIncident.countDocuments({ status: { $in: ['triggered', 'acknowledged'] } }),
      SafetyIncident.countDocuments(),

      // Payments Aggregation
      Payment.aggregate([
        {
          $group: {
            _id: '$paymentStatus',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]),

      // Average Rating Aggregation
      Rating.aggregate([
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            count: { $sum: 1 }
          }
        }
      ]),

      // Ride Status Distribution
      Ride.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),

      // Revenue from Completed Rides
      Ride.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: null,
            totalGrossFare: { $sum: '$fare' },
            count: { $sum: 1 }
          }
        }
      ]),

      // Recent 5 Rides
      Ride.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('passenger', 'name phone')
        .populate({ path: 'driver', populate: { path: 'user', select: 'name phone' } })
        .lean()
    ]);

    // Format Payments breakdown
    let successfulPayments = 0;
    let failedPayments = 0;
    let totalOnlineRevenue = 0;
    paymentsSummary.forEach(p => {
      if (p._id === 'successful') {
        successfulPayments = p.count;
        totalOnlineRevenue = p.totalAmount;
      } else if (p._id === 'failed') {
        failedPayments = p.count;
      }
    });

    const avgRating = ratingsSummary.length > 0 ? parseFloat(ratingsSummary[0].avgRating.toFixed(1)) : 5.0;
    const totalRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].totalGrossFare : totalOnlineRevenue;

    return res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          passengers: totalPassengers,
          drivers: totalDrivers
        },
        drivers: {
          total: totalDrivers,
          verified: verifiedDrivers,
          pending: pendingDrivers,
          activeOnline: activeOnlineDrivers
        },
        rides: {
          total: totalRides,
          completed: completedRides,
          cancelled: cancelledRides,
          active: activeRides
        },
        financials: {
          totalRevenue,
          successfulPayments,
          failedPayments
        },
        safety: {
          activeIncidents,
          totalIncidents
        },
        ratings: {
          average: avgRating,
          totalRatings: ratingsSummary.length > 0 ? ratingsSummary[0].count : 0
        },
        statusDistribution: statusDistribution.map(s => ({
          status: s._id,
          count: s.count
        })),
        recentRides
      }
    });
  } catch (error) {
    console.error('Error in getAnalytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin analytics.'
    });
  }
}

/**
 * ─── Manage Users ───────────────────────────────────────────────────
 */
export async function getUsers(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search ? req.query.search.trim() : '';
    const role = req.query.role || '';
    const status = req.query.status || '';

    const filter = {};
    if (role) filter.role = role;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-passwordHash')
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      }
    });
  } catch (error) {
    console.error('Error in getUsers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve users.'
    });
  }
}

export async function toggleUserStatus(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Don't allow deactivating other admins
    if (user.role === 'admin' && user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Cannot modify other admin accounts' });
    }

    user.isActive = req.body.isActive !== undefined ? req.body.isActive : !user.isActive;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User account ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
      data: { id: user._id, isActive: user.isActive }
    });
  } catch (error) {
    console.error('Error in toggleUserStatus:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user status.' });
  }
}

export async function deleteUserByAdmin(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin' && user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Cannot delete other admin accounts' });
    }

    await Driver.deleteMany({ user: id });
    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'User account permanently deleted from MongoDB by Admin.',
      data: { id }
    });
  } catch (error) {
    console.error('Error in deleteUserByAdmin:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete user account.' });
  }
}

/**
 * ─── Manage Drivers ─────────────────────────────────────────────────
 */
export async function getDrivers(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search ? req.query.search.trim() : '';
    const verificationStatus = req.query.verificationStatus || '';

    const filter = {};
    if (verificationStatus) filter.verificationStatus = verificationStatus;

    let query = Driver.find(filter)
      .populate('user', 'name email phone profilePhoto isActive isVerified createdAt')
      .populate('activeVehicle')
      .sort({ createdAt: -1 });

    const allDrivers = await query.lean();

    // Client-side/populated search filter if search provided
    let filtered = allDrivers;
    if (search) {
      const s = search.toLowerCase();
      filtered = allDrivers.filter(d => 
        (d.user && (d.user.name?.toLowerCase().includes(s) || d.user.email?.toLowerCase().includes(s) || d.user.phone?.includes(s))) ||
        d.licenseNumber?.toLowerCase().includes(s) ||
        (d.activeVehicle && (d.activeVehicle.plateNumber?.toLowerCase().includes(s) || d.activeVehicle.model?.toLowerCase().includes(s)))
      );
    }

    const total = filtered.length;
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    return res.status(200).json({
      success: true,
      data: {
        drivers: paginated,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit) || 1,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Error in getDrivers:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve drivers.' });
  }
}

export async function verifyDriver(req, res) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body; // 'verified' | 'rejected'

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "verified" or "rejected".'
      });
    }

    const driver = await Driver.findById(id).populate('user', 'name email phone');
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver profile not found' });
    }

    driver.verificationStatus = status;
    if (status === 'verified') {
      driver.backgroundCheckStatus = 'passed';
      // Also mark underlying user verified
      await User.findByIdAndUpdate(driver.user._id, { isVerified: true });
    } else {
      driver.backgroundCheckStatus = 'failed';
    }
    await driver.save();

    // Send Notification to Driver
    await createNotification({
      recipient: driver.user._id,
      title: status === 'verified' ? 'Driver Partner Verified! 🎉' : 'Driver Verification Update',
      message: status === 'verified'
        ? 'Congratulations! Your Sanghini driver verification is approved. You can now go online.'
        : `Your driver verification was rejected. Reason: ${notes || 'Document details could not be validated.'}`,
      type: 'verification'
    });

    return res.status(200).json({
      success: true,
      message: `Driver status updated to ${status}.`,
      data: driver
    });
  } catch (error) {
    console.error('Error in verifyDriver:', error);
    return res.status(500).json({ success: false, message: 'Failed to update driver verification.' });
  }
}

export async function toggleDriverStatus(req, res) {
  try {
    const { id } = req.params;
    const driver = await Driver.findById(id).populate('user');
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    if (driver.user) {
      const user = await User.findById(driver.user._id);
      if (user) {
        user.isActive = !user.isActive;
        await user.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Driver active status updated successfully.'
    });
  } catch (error) {
    console.error('Error in toggleDriverStatus:', error);
    return res.status(500).json({ success: false, message: 'Failed to update driver status.' });
  }
}

/**
 * ─── Manage Rides ───────────────────────────────────────────────────
 */
export async function getRides(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search ? req.query.search.trim() : '';
    const status = req.query.status || '';

    const filter = {};
    if (status) filter.status = status;

    const total = await Ride.countDocuments(filter);
    const rides = await Ride.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('passenger', 'name email phone')
      .populate({ path: 'driver', populate: { path: 'user', select: 'name phone' } })
      .populate('vehicle')
      .lean();

    let filtered = rides;
    if (search) {
      const s = search.toLowerCase();
      filtered = rides.filter(r =>
        r._id.toString().includes(s) ||
        r.passenger?.name?.toLowerCase().includes(s) ||
        r.driver?.user?.name?.toLowerCase().includes(s) ||
        r.pickupLocation?.address?.toLowerCase().includes(s) ||
        r.dropoffLocation?.address?.toLowerCase().includes(s)
      );
    }

    return res.status(200).json({
      success: true,
      data: {
        rides: filtered,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit) || 1,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Error in getRides:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve rides.' });
  }
}

export async function getRideDetails(req, res) {
  try {
    const { id } = req.params;
    const ride = await Ride.findById(id)
      .populate('passenger', 'name email phone profilePhoto')
      .populate({
        path: 'driver',
        populate: [
          { path: 'user', select: 'name phone profilePhoto' },
          { path: 'activeVehicle' }
        ]
      })
      .populate('vehicle')
      .lean();

    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
    }

    const [payments, incidents] = await Promise.all([
      Payment.find({ ride: ride._id }).select('-razorpaySignature').lean(),
      SafetyIncident.find({ ride: ride._id }).lean()
    ]);

    return res.status(200).json({
      success: true,
      data: {
        ...ride,
        payments,
        incidents
      }
    });
  } catch (error) {
    console.error('Error in getRideDetails:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve ride details.' });
  }
}

/**
 * ─── Manage Payments ────────────────────────────────────────────────
 */
export async function getPayments(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const paymentStatus = req.query.status || '';

    const filter = {};
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const total = await Payment.countDocuments(filter);
    // Explicitly exclude razorpaySignature to safeguard secrets
    const payments = await Payment.find(filter)
      .select('-razorpaySignature')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('passenger', 'name email phone')
      .populate({
        path: 'ride',
        select: 'pickupLocation dropoffLocation fare status completedAt'
      })
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit) || 1,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Error in getPayments:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve payments.' });
  }
}

/**
 * ─── Manage Safety Incidents ────────────────────────────────────────
 */
export async function getSafetyIncidents(req, res) {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const incidents = await SafetyIncident.find(filter)
      .sort({ createdAt: -1 })
      .populate('passenger', 'name email phone')
      .populate({ path: 'driver', populate: { path: 'user', select: 'name phone' } })
      .populate('ride', 'pickupLocation dropoffLocation status fare')
      .lean();

    return res.status(200).json({
      success: true,
      data: incidents
    });
  } catch (error) {
    console.error('Error in getSafetyIncidents:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve safety incidents.' });
  }
}

export async function updateIncidentStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['acknowledged', 'resolved', 'false_alarm'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "acknowledged", "resolved", or "false_alarm".'
      });
    }

    const incident = await SafetyIncident.findById(id);
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Safety incident not found' });
    }

    incident.status = status;
    incident.resolvedAt = status === 'resolved' || status === 'false_alarm' ? new Date() : incident.resolvedAt;
    if (notes) {
      incident.notes = notes;
    }
    await incident.save();

    // If resolved or false alarm, clear active SOS flag on Ride
    if (incident.ride && (status === 'resolved' || status === 'false_alarm')) {
      await Ride.findByIdAndUpdate(incident.ride, {
        hasActiveSos: false
      });
    }

    // Emit Socket.IO event to alert desk & connected users
    const io = getIO();
    if (io) {
      io.emit('safety:incident_updated', {
        incidentId: incident._id,
        status: incident.status,
        rideId: incident.ride
      });
    }

    return res.status(200).json({
      success: true,
      message: `Incident status updated to ${status}.`,
      data: incident
    });
  } catch (error) {
    console.error('Error in updateIncidentStatus:', error);
    return res.status(500).json({ success: false, message: 'Failed to update incident status.' });
  }
}
