import {
  getNearestSafeHavens,
  getAllSafeHavens,
  postCommunitySignal,
  getNearbySignals,
  confirmCommunitySignal,
  triggerDiscreetAlert,
  requestJourneyBuddy,
  buddyCheckIn,
  getGuardianDashboard,
  guardianPing,
  getTimeAwareSafetyRules,
  checkSafetyBubble,
} from '../services/safetyFeatures.service.js';

// ─────────────────────────────────────────────────────────────────
// SAFE HAVEN NETWORK
// ─────────────────────────────────────────────────────────────────

export async function getNearestHavensAction(req, res) {
  try {
    const { lat, lng, radius, types } = req.query;
    if (!lat || !lng) return res.status(400).json({ success: false, message: 'lat and lng are required' });

    const typesArray = types ? types.split(',') : undefined;
    const havens = await getNearestSafeHavens({
      lat,
      lng,
      radiusKm: parseFloat(radius) || 3,
      types: typesArray,
    });

    res.json({ success: true, count: havens.length, data: havens });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getAllHavensAction(req, res) {
  try {
    const havens = await getAllSafeHavens();
    res.json({ success: true, count: havens.length, data: havens });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────
// COMMUNITY SAFETY SIGNALS
// ─────────────────────────────────────────────────────────────────

export async function postSignalAction(req, res) {
  try {
    const { signalType, severity, description, location, rideId } = req.body;
    if (!signalType || !location) {
      return res.status(400).json({ success: false, message: 'signalType and location are required' });
    }

    const signal = await postCommunitySignal({
      userId: req.user._id,
      userRole: req.user.role,
      signalType,
      severity,
      description,
      location,
      rideId,
    });

    res.status(201).json({ success: true, data: signal, message: 'Safety signal posted. Thank you for keeping the community safe.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function getNearbySignalsAction(req, res) {
  try {
    const { lat, lng, radius } = req.query;
    if (!lat || !lng) return res.status(400).json({ success: false, message: 'lat and lng are required' });

    const signals = await getNearbySignals({ lat, lng, radiusKm: parseFloat(radius) || 5 });
    res.json({ success: true, count: signals.length, data: signals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function confirmSignalAction(req, res) {
  try {
    const signal = await confirmCommunitySignal({ signalId: req.params.id, userId: req.user._id });
    res.json({ success: true, data: signal, message: 'Signal confirmed. Your confirmation helps keep others safe.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────
// I FEEL UNSAFE — DISCREET ALERT
// ─────────────────────────────────────────────────────────────────

export async function triggerDiscreetAlertAction(req, res) {
  try {
    const { rideId } = req.params;
    const { location, message } = req.body;

    const result = await triggerDiscreetAlert({
      rideId,
      userId: req.user._id,
      userRole: req.user.role,
      location,
      message,
    });

    res.status(201).json({ success: true, data: result, message: result.message });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────
// JOURNEY BUDDY
// ─────────────────────────────────────────────────────────────────

export async function requestBuddyAction(req, res) {
  try {
    const { rideId } = req.params;
    const result = await requestJourneyBuddy({ rideId, userId: req.user._id });
    res.status(201).json({ success: true, data: result, message: result.message });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function buddyCheckInAction(req, res) {
  try {
    const { buddyId } = req.params;
    const result = await buddyCheckIn({ buddyId, userId: req.user._id });
    res.json({ success: true, data: result, message: result.message });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────
// GUARDIAN DASHBOARD
// ─────────────────────────────────────────────────────────────────

export async function getGuardianDashboardAction(req, res) {
  try {
    const { shareToken } = req.params;
    const data = await getGuardianDashboard(shareToken);
    res.json({ success: true, data });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
}

export async function guardianPingAction(req, res) {
  try {
    const { shareToken } = req.params;
    const { guardianName, message } = req.body;
    const result = await guardianPing({ shareToken, guardianName, message });
    res.json({ success: true, message: result.message });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────
// TIME-AWARE SAFETY
// ─────────────────────────────────────────────────────────────────

export async function getTimeAwareSafetyAction(req, res) {
  try {
    const rules = getTimeAwareSafetyRules();
    res.json({ success: true, data: rules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────
// SAFETY BUBBLE CHECK
// ─────────────────────────────────────────────────────────────────

export async function checkSafetyBubbleAction(req, res) {
  try {
    const { driverCoords, routeCoords, thresholdKm } = req.body;
    const result = checkSafetyBubble({
      driverCoords,
      expectedRouteCoords: routeCoords,
      thresholdKm,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}
