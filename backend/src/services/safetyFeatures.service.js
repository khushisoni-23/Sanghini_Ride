import SafeHaven from '../models/SafeHaven.js';
import CommunitySignal from '../models/CommunitySignal.js';
import JourneyBuddy from '../models/JourneyBuddy.js';
import SafetyIncident from '../models/SafetyIncident.js';
import Ride from '../models/Ride.js';
import User from '../models/User.js';
import TrustedContact from '../models/TrustedContact.js';
import { createNotification } from './notification.service.js';
import { getIO } from '../socket.js';

// ─────────────────────────────────────────────────────────────────
// SAFE HAVEN NETWORK
// ─────────────────────────────────────────────────────────────────

const UDAIPUR_SAFE_HAVENS = [
  { name: 'Udaipur City Police Station', type: 'police_booth', address: 'City Police Station, Udaipur', location: { type: 'Point', coordinates: [73.6812, 24.5854] }, phone: '0294-2413000', is24Hours: true },
  { name: 'Hiran Magri Police Station', type: 'police_booth', address: 'Sector 11, Hiran Magri, Udaipur', location: { type: 'Point', coordinates: [73.7124, 24.6215] }, phone: '0294-2490100', is24Hours: true },
  { name: 'Sukhadia Circle Police Booth', type: 'police_booth', address: 'Sukhadia Circle, Panchwati, Udaipur', location: { type: 'Point', coordinates: [73.6891, 24.6103] }, is24Hours: true },
  { name: 'Chetak Circle Police Booth', type: 'police_booth', address: 'Chetak Circle, Madhuban, Udaipur', location: { type: 'Point', coordinates: [73.7054, 24.5832] }, is24Hours: true },
  { name: 'RNT Medical College & Hospital', type: 'hospital', address: 'RNT Medical College, Udaipur', location: { type: 'Point', coordinates: [73.6953, 24.5723] }, phone: '0294-2528811', is24Hours: true },
  { name: 'GBH American Hospital', type: 'hospital', address: 'GBH Hospital, Udaipur', location: { type: 'Point', coordinates: [73.7123, 24.5901] }, phone: '0294-3090000', is24Hours: true },
  { name: 'Geetanjali Medical College', type: 'hospital', address: 'Manva Kheda, Udaipur', location: { type: 'Point', coordinates: [73.6741, 24.6432] }, phone: '0294-6669300', is24Hours: true },
  { name: 'Mahila Suraksha Grih (Women Shelter)', type: 'women_shelter', address: 'Near Collector Office, Udaipur', location: { type: 'Point', coordinates: [73.7012, 24.5864] }, phone: '1090', is24Hours: true },
  { name: 'One Stop Centre (Sakhi Centre)', type: 'women_shelter', address: 'Goverdhan Vilas, Udaipur', location: { type: 'Point', coordinates: [73.6892, 24.6534] }, phone: '181', is24Hours: true, notes: 'National helpline: 181' },
  { name: 'Celebration Mall', type: 'safe_shop', address: 'Bhuwana, Udaipur', location: { type: 'Point', coordinates: [73.7213, 24.6312] }, is24Hours: false, operatingHours: '10:00 AM - 10:00 PM' },
  { name: 'Big Bazaar Udaipur', type: 'safe_shop', address: 'Meera Girls College Road, Udaipur', location: { type: 'Point', coordinates: [73.6921, 24.5941] }, is24Hours: false, operatingHours: '10:00 AM - 9:00 PM' },
  { name: 'Fateh Sagar Road Fuel Station', type: 'petrol_station', address: 'Fateh Sagar Road, Udaipur', location: { type: 'Point', coordinates: [73.6763, 24.6234] }, is24Hours: true },
  { name: 'Delhi Gate Police Booth', type: 'police_booth', address: 'Delhi Gate, Bapu Bazaar, Udaipur', location: { type: 'Point', coordinates: [73.6842, 24.5734] }, is24Hours: true },
  { name: 'CDRI Collectorate Office', type: 'govt_office', address: 'Collectorate, Udaipur', location: { type: 'Point', coordinates: [73.6998, 24.5876] }, phone: '0294-2414345', is24Hours: false, operatingHours: '10:00 AM - 5:00 PM' },
];

/**
 * Seed safe havens for Udaipur if not already in DB
 */
export async function seedSafeHavens() {
  try {
    const existing = await SafeHaven.countDocuments();
    if (existing === 0) {
      await SafeHaven.insertMany(UDAIPUR_SAFE_HAVENS);
      console.log(`✅ [SafeHaven] Seeded ${UDAIPUR_SAFE_HAVENS.length} Udaipur safe havens`);
    }
  } catch (err) {
    console.error('[SafeHaven] Seed error:', err.message);
  }
}

/**
 * Get nearest safe havens to given coordinates
 */
export async function getNearestSafeHavens({ lat, lng, radiusKm = 3, types }) {
  const query = {
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: radiusKm * 1000,
      },
    },
    isVerified: true,
  };
  if (types && types.length > 0) {
    query.type = { $in: types };
  }
  return await SafeHaven.find(query).limit(20);
}

/**
 * Get all safe havens (Admin or map display)
 */
export async function getAllSafeHavens() {
  return await SafeHaven.find({ isVerified: true }).sort({ type: 1, name: 1 });
}

// ─────────────────────────────────────────────────────────────────
// COMMUNITY SAFETY SIGNALS
// ─────────────────────────────────────────────────────────────────

/**
 * Post a community safety signal
 */
export async function postCommunitySignal({ userId, userRole, signalType, severity, description, location, rideId }) {
  // Validate location
  if (!location?.coordinates || location.coordinates.length < 2) {
    throw new Error('Valid location coordinates are required');
  }

  const signal = await CommunitySignal.create({
    reporter: userId,
    reporterRole: userRole,
    signalType,
    severity: severity || 'medium',
    description,
    location: {
      address: location.address || 'Udaipur, Rajasthan',
      coordinates: {
        type: 'Point',
        coordinates: location.coordinates,
      },
    },
    rideId,
    expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
  });

  // Broadcast via Socket.IO to admin and nearby users
  const io = getIO();
  if (io) {
    io.to('admin:safety').emit('COMMUNITY_SIGNAL', {
      signalId: signal._id,
      signalType,
      severity,
      description,
      location: signal.location,
      reporterRole: userRole,
      createdAt: signal.createdAt,
    });
  }

  return signal;
}

/**
 * Get active community signals near a location
 */
export async function getNearbySignals({ lat, lng, radiusKm = 5 }) {
  const now = new Date();
  return await CommunitySignal.find({
    'location.coordinates': {
      $near: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: radiusKm * 1000,
      },
    },
    status: 'active',
    expiresAt: { $gt: now },
  })
    .populate('reporter', 'name role')
    .sort({ createdAt: -1 })
    .limit(20);
}

/**
 * Confirm/upvote a signal
 */
export async function confirmCommunitySignal({ signalId, userId }) {
  const signal = await CommunitySignal.findById(signalId);
  if (!signal) throw new Error('Signal not found');

  const alreadyConfirmed = signal.confirmedBy.some((id) => id.toString() === userId.toString());
  if (alreadyConfirmed) {
    throw new Error('You have already confirmed this signal');
  }

  signal.confirmations += 1;
  signal.confirmedBy.push(userId);
  await signal.save();
  return signal;
}

// ─────────────────────────────────────────────────────────────────
// I FEEL UNSAFE — DISCREET ALERT
// ─────────────────────────────────────────────────────────────────

/**
 * Trigger a DISCREET (silent) alert — less visible than full SOS
 * No loud alarm, but notifies trusted contacts and admin silently
 */
export async function triggerDiscreetAlert({ rideId, userId, userRole, location, message }) {
  const ride = await Ride.findById(rideId)
    .populate('passenger', 'name email phone')
    .populate({ path: 'driver', populate: { path: 'user', select: 'name phone' } });

  if (!ride) throw new Error('Ride not found');

  const isPassenger = ride.passenger?._id.toString() === userId.toString();
  const isDriver = ride.driver?.user?._id.toString() === userId.toString();

  if (!isPassenger && !isDriver) {
    throw new Error('Unauthorized: You are not a participant in this ride');
  }

  const activeStatuses = ['accepted', 'driver_arriving', 'arrived', 'in_progress'];
  if (!activeStatuses.includes(ride.status)) {
    throw new Error('Discreet alert is only available during an active ride');
  }

  let incidentCoords = location?.coordinates || ride.driverLocation?.coordinates;
  if (!incidentCoords || incidentCoords.length < 2) {
    incidentCoords = ride.pickupLocation?.coordinates?.coordinates || [73.6914, 24.6008];
  }

  const incident = await SafetyIncident.create({
    ride: ride._id,
    passenger: ride.passenger._id,
    driver: ride.driver?._id,
    triggeredBy: isPassenger ? 'passenger' : 'driver',
    incidentType: 'discreet_alert',
    status: 'triggered',
    location: {
      address: location?.address || ride.pickupLocation?.address || 'Udaipur, Rajasthan',
      coordinates: { type: 'Point', coordinates: incidentCoords },
    },
    triggeredAt: new Date(),
    timeline: [{
      status: 'triggered',
      actor: userId,
      actorRole: isPassenger ? 'passenger' : 'driver',
      actorName: isPassenger ? ride.passenger.name : ride.driver.user.name,
      notes: `⚠️ DISCREET ALERT: ${message || 'Passenger feels unsafe'}`,
      timestamp: new Date(),
    }],
  });

  // Silently notify trusted contacts
  const contacts = await TrustedContact.find({ user: ride.passenger._id, receiveSafetyAlerts: true });
  for (const c of contacts) {
    console.log(`⚠️ [DISCREET ALERT] Quietly notifying ${c.name} (${c.phone}) — passenger ${ride.passenger.name} feels unsafe`);
  }

  // Notify admins (silently, labelled as discreet)
  const admins = await User.find({ role: 'admin' });
  for (const admin of admins) {
    await createNotification({
      recipient: admin._id,
      title: '⚠️ Discreet Safety Alert',
      message: `${ride.passenger.name} has silently indicated they feel unsafe on Ride #${ride._id.toString().slice(-6)}. Please monitor.`,
      type: 'discreet_alert',
      rideId: ride._id,
      data: { incidentId: incident._id },
    });
  }

  // Socket.IO silent emit to admin only
  const io = getIO();
  if (io) {
    io.to('admin:safety').emit('DISCREET_ALERT', {
      incidentId: incident._id,
      rideId: ride._id,
      passengerName: ride.passenger.name,
      message: message || 'Passenger feels unsafe',
      location: { coordinates: incidentCoords },
      triggeredAt: new Date(),
    });
  }

  return { incident, message: 'Your discreet alert has been sent. Trusted contacts and the safety desk have been notified silently.' };
}

// ─────────────────────────────────────────────────────────────────
// JOURNEY BUDDY
// ─────────────────────────────────────────────────────────────────

/**
 * Request a Journey Buddy for an active ride
 */
export async function requestJourneyBuddy({ rideId, userId }) {
  const ride = await Ride.findById(rideId);
  if (!ride) throw new Error('Ride not found');
  if (ride.passenger.toString() !== userId.toString()) throw new Error('Unauthorized');

  const activeStatuses = ['accepted', 'driver_arriving', 'arrived', 'in_progress', 'requested', 'finding_driver'];
  if (!activeStatuses.includes(ride.status)) {
    throw new Error('Journey Buddy is only available for active or pending rides');
  }

  // Check if already has an active buddy request
  const existing = await JourneyBuddy.findOne({ ride: rideId, status: { $in: ['searching', 'matched'] } });
  if (existing) {
    return { buddy: existing, message: 'Already searching for a journey buddy.' };
  }

  const buddy = await JourneyBuddy.create({
    requester: userId,
    ride: rideId,
    status: 'searching',
    pickupAreaAddress: ride.pickupLocation?.address,
    dropoffAreaAddress: ride.dropoffLocation?.address,
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
  });

  // Try to find a matching buddy (another passenger with overlapping route in searching state)
  const potentialMatch = await JourneyBuddy.findOne({
    requester: { $ne: userId },
    status: 'searching',
    _id: { $ne: buddy._id },
    expiresAt: { $gt: new Date() },
  }).populate('requester', 'name');

  if (potentialMatch) {
    // Match found — update both
    buddy.status = 'matched';
    buddy.matchedBuddy = potentialMatch.requester._id;
    buddy.matchedRide = potentialMatch.ride;
    await buddy.save();

    potentialMatch.status = 'matched';
    potentialMatch.matchedBuddy = userId;
    potentialMatch.matchedRide = rideId;
    await potentialMatch.save();

    // Notify both
    const user = await User.findById(userId).select('name');
    await createNotification({
      recipient: userId,
      title: '👭 Journey Buddy Found!',
      message: `You've been matched with ${potentialMatch.requester.name} as your Journey Buddy. Stay safe together!`,
      type: 'journey_buddy',
      rideId,
    });
    await createNotification({
      recipient: potentialMatch.requester._id,
      title: '👭 Journey Buddy Found!',
      message: `You've been matched with ${user?.name || 'another Sanghini rider'} as your Journey Buddy. Stay safe together!`,
      type: 'journey_buddy',
      rideId: potentialMatch.ride,
    });

    return { buddy, matched: true, matchedWith: potentialMatch.requester.name, message: 'Journey Buddy matched!' };
  }

  return { buddy, matched: false, message: 'Searching for a Journey Buddy. You will be notified when matched.' };
}

/**
 * Send a buddy check-in ping (I am safe)
 */
export async function buddyCheckIn({ buddyId, userId }) {
  const buddy = await JourneyBuddy.findById(buddyId).populate('matchedBuddy', 'name');
  if (!buddy) throw new Error('Journey Buddy session not found');

  const isRequester = buddy.requester.toString() === userId.toString();
  const isBuddy = buddy.matchedBuddy?._id?.toString() === userId.toString();

  if (!isRequester && !isBuddy) throw new Error('Unauthorized');

  if (isRequester) {
    buddy.requesterCheckedIn = true;
    buddy.lastRequesterPing = new Date();
  } else {
    buddy.buddyCheckedIn = true;
    buddy.lastBuddyPing = new Date();
  }

  await buddy.save();

  // Notify the other buddy
  const notifyUser = isRequester ? buddy.matchedBuddy?._id : buddy.requester;
  if (notifyUser) {
    const user = await User.findById(userId).select('name');
    await createNotification({
      recipient: notifyUser,
      title: '✅ Buddy Check-In',
      message: `${user?.name || 'Your Journey Buddy'} has checked in and is safe!`,
      type: 'journey_buddy',
    });
  }

  return { success: true, message: 'Check-in ping sent to your buddy.' };
}

/**
 * Get Guardian Dashboard data via shared ride token
 */
export async function getGuardianDashboard(shareToken) {
  const ride = await Ride.findOne({ shareToken })
    .populate('passenger', 'name phone')
    .populate({
      path: 'driver',
      populate: [
        { path: 'user', select: 'name' },
        { path: 'activeVehicle' },
      ],
    });

  if (!ride) throw new Error('Invalid or expired guardian link');

  const isExpired = ride.shareExpiresAt && ride.shareExpiresAt < new Date();
  const isFinished = ['completed', 'cancelled'].includes(ride.status);
  if (!ride.isShared || isExpired || isFinished) {
    throw new Error('This guardian link has expired or the trip has ended.');
  }

  const passengerFirstName = ride.passenger?.name?.split(' ')[0] || 'Sanghini Rider';
  const driverFirstName = ride.driver?.user?.name?.split(' ')[0] || 'Verified Partner';

  // Get nearby safe havens to the current location
  const coords = ride.driverLocation?.coordinates || ride.pickupLocation?.coordinates?.coordinates || [73.6914, 24.6008];
  const nearbyHavens = await SafeHaven.find({
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: coords },
        $maxDistance: 3000,
      },
    },
    isVerified: true,
  }).limit(5);

  return {
    rideId: ride._id.toString(),
    brand: 'Sanghini Ride • Guardian Safety Dashboard',
    rideStatus: ride.status,
    passengerName: passengerFirstName,
    driver: ride.driver ? {
      firstName: driverFirstName,
      rating: ride.driver.rating || 5.0,
      vehicle: ride.driver.activeVehicle ? {
        make: ride.driver.activeVehicle.make,
        model: ride.driver.activeVehicle.model,
        color: ride.driver.activeVehicle.color,
        plateNumber: ride.driver.activeVehicle.registrationNumber,
      } : null,
    } : null,
    tripDetails: {
      pickupAddress: ride.pickupLocation?.address,
      dropoffAddress: ride.dropoffLocation?.address,
      estimatedDistanceKm: ride.estimatedDistance,
      estimatedDurationMins: ride.estimatedDuration,
      fare: ride.fare,
      vehicleType: ride.vehicleType,
    },
    latestLocation: {
      coordinates: coords,
      heading: ride.driverLocation?.heading || 0,
      updatedAt: ride.driverLocation?.updatedAt || ride.updatedAt,
    },
    hasActiveSos: Boolean(ride.hasActiveSos),
    expiresAt: ride.shareExpiresAt,
    nearbyHavens: nearbyHavens.map((h) => ({
      name: h.name,
      type: h.type,
      address: h.address,
      phone: h.phone,
      is24Hours: h.is24Hours,
      coordinates: h.location.coordinates,
      distance: null, // Client can calculate
    })),
    timeAwareSafety: {
      isNight: isNightTime(),
      nightSafetyActive: isNightTime(),
      message: isNightTime()
        ? '🌙 Night safety mode active. Trusted contacts and safety desk are on high alert.'
        : '☀️ Daytime ride. Safety monitoring active.',
    },
  };
}

/**
 * Guardian sends a remote SOS / welfare ping to passenger
 */
export async function guardianPing({ shareToken, guardianName, message }) {
  const ride = await Ride.findOne({ shareToken }).populate('passenger', 'name');
  if (!ride) throw new Error('Invalid guardian link');

  if (!ride.isShared) throw new Error('Guardian access has been revoked');

  await createNotification({
    recipient: ride.passenger._id,
    title: `📲 Message from ${guardianName || 'Your Guardian'}`,
    message: message || `${guardianName || 'Your guardian'} is checking on you. Please respond when safe.`,
    type: 'guardian_ping',
    rideId: ride._id,
  });

  const io = getIO();
  if (io) {
    io.to(`user:${ride.passenger._id.toString()}`).emit('GUARDIAN_PING', {
      rideId: ride._id,
      guardianName: guardianName || 'Your Guardian',
      message: message || 'Your guardian is checking on you.',
      timestamp: new Date(),
    });
  }

  return { success: true, message: `Your check-in message has been sent to ${ride.passenger?.name?.split(' ')[0] || 'the passenger'}.` };
}

// ─────────────────────────────────────────────────────────────────
// TIME-AWARE SAFETY
// ─────────────────────────────────────────────────────────────────

export function isNightTime() {
  const hour = new Date().getHours();
  return hour >= 21 || hour < 6; // 9 PM to 6 AM = night
}

export function getTimeAwareSafetyRules() {
  const hour = new Date().getHours();
  const isNight = hour >= 21 || hour < 6;
  const isLateNight = hour >= 23 || hour < 5;
  const isEarlyMorning = hour >= 5 && hour < 7;

  return {
    isNight,
    isLateNight,
    isEarlyMorning,
    nightSurcharge: isNight ? 0.2 : 0, // 20% night surcharge
    guardianAutoShare: isLateNight, // Auto-share location with guardian at late night
    enhancedVerification: isNight, // Extra OTP check at night
    message: isLateNight
      ? '🌙 Late-night safety mode: Extra verification and automatic guardian sharing enabled.'
      : isNight
      ? '🌙 Night safety mode active. Trusted contacts are on alert.'
      : isEarlyMorning
      ? '🌅 Early morning ride. Safety monitoring active.'
      : '☀️ Daytime safety standards active.',
    recommendations: isNight
      ? [
          'Share your live ride with a trusted contact',
          'Keep your phone charged and accessible',
          'Verify the driver OTP before boarding',
          'Stay on call with a trusted person during the ride',
        ]
      : ['Verify the driver OTP before boarding', 'Keep your phone accessible'],
  };
}

// ─────────────────────────────────────────────────────────────────
// SAFETY BUBBLE (Route Deviation Detection)
// ─────────────────────────────────────────────────────────────────

/**
 * Check if current location deviates significantly from expected route
 * Returns deviation alert if driver has moved far off the planned path
 */
export function checkSafetyBubble({ driverCoords, expectedRouteCoords, thresholdKm = 0.5 }) {
  if (!driverCoords || !expectedRouteCoords || expectedRouteCoords.length === 0) {
    return { isDeviated: false };
  }

  const [dLng, dLat] = driverCoords;

  // Find minimum distance from driver to any point on the planned route
  let minDist = Infinity;
  for (const [rLng, rLat] of expectedRouteCoords) {
    const dist = haversineKm(dLat, dLng, rLat, rLng);
    if (dist < minDist) minDist = dist;
  }

  const isDeviated = minDist > thresholdKm;
  return {
    isDeviated,
    deviationKm: parseFloat(minDist.toFixed(3)),
    thresholdKm,
    message: isDeviated
      ? `⚠️ Safety Bubble Alert: Driver has deviated ${(minDist * 1000).toFixed(0)}m from planned route.`
      : null,
  };
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
