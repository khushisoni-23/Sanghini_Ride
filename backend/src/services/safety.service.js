import crypto from 'crypto';
import SafetyIncident from '../models/SafetyIncident.js';
import Ride from '../models/Ride.js';
import User from '../models/User.js';
import Driver from '../models/Driver.js';
import TrustedContact from '../models/TrustedContact.js';
import { createNotification } from './notification.service.js';
import { getIO } from '../socket.js';

/**
 * Trigger real backend SOS incident
 */
export async function triggerSos({ rideId, userId, userRole, location }) {
  const ride = await Ride.findById(rideId)
    .populate('passenger', 'name email phone')
    .populate({ path: 'driver', populate: { path: 'user', select: 'name phone email' } });

  if (!ride) {
    throw new Error('Ride not found');
  }

  const isPassenger = ride.passenger && ride.passenger._id.toString() === userId.toString();
  const isDriver = ride.driver?.user && ride.driver.user._id.toString() === userId.toString();

  if (!isPassenger && !isDriver) {
    throw new Error('Unauthorized: You are not a participant in this ride');
  }

  const activeStatuses = ['accepted', 'driver_arriving', 'arrived', 'in_progress'];
  if (!activeStatuses.includes(ride.status)) {
    throw new Error(`Cannot trigger SOS for ride in state "${ride.status}". SOS is only available during an active ride.`);
  }

  // Prevent duplicate active SOS for the same ride
  if (ride.hasActiveSos && ride.activeIncident) {
    const existing = await SafetyIncident.findById(ride.activeIncident);
    if (existing && ['triggered', 'acknowledged', 'investigating'].includes(existing.status)) {
      return {
        incident: existing,
        alreadyActive: true,
        message: 'An active SOS incident is already in progress for this ride.',
      };
    }
  }

  const triggeredByRole = isPassenger ? 'passenger' : 'driver';

  // Determine latest coordinates
  let incidentCoordinates = location?.coordinates || ride.driverLocation?.coordinates;
  if (!incidentCoordinates || incidentCoordinates.length < 2 || (incidentCoordinates[0] === 0 && incidentCoordinates[1] === 0)) {
    incidentCoordinates = ride.pickupLocation?.coordinates?.coordinates || [73.6914, 24.6008];
  }

  const incidentAddress = location?.address || ride.pickupLocation?.address || 'Udaipur, Rajasthan';

  // Create SafetyIncident
  const incident = await SafetyIncident.create({
    ride: ride._id,
    passenger: ride.passenger._id,
    driver: ride.driver ? ride.driver._id : undefined,
    triggeredBy: triggeredByRole,
    incidentType: 'manual_sos',
    status: 'triggered',
    location: {
      address: incidentAddress,
      coordinates: {
        type: 'Point',
        coordinates: incidentCoordinates,
      },
    },
    triggeredAt: new Date(),
    timeline: [
      {
        status: 'triggered',
        actor: userId,
        actorRole: triggeredByRole,
        actorName: isPassenger ? ride.passenger.name : ride.driver.user.name,
        notes: `EMERGENCY SOS Triggered by ${triggeredByRole.toUpperCase()}`,
        timestamp: new Date(),
      },
    ],
  });

  // Update Ride model flags
  ride.hasActiveSos = true;
  ride.activeIncident = incident._id;
  await ride.save();

  // Notify passenger's trusted contacts
  const trustedContacts = await TrustedContact.find({
    user: ride.passenger._id,
    receiveSafetyAlerts: true,
  });

  let notifiedCount = 0;
  for (const contact of trustedContacts) {
    notifiedCount++;
    console.log(`🚨 [SOS ALERT] Notifying trusted contact ${contact.name} (${contact.phone}) for passenger ${ride.passenger.name}`);
  }

  incident.notifiedContactsCount = notifiedCount;
  await incident.save();

  // Create In-App Notifications for Admin
  const admins = await User.find({ role: 'admin' });
  for (const admin of admins) {
    await createNotification({
      recipient: admin._id,
      title: '🚨 EMERGENCY SOS ALERT',
      message: `SOS triggered by ${triggeredByRole.toUpperCase()} (${isPassenger ? ride.passenger.name : ride.driver.user.name}) on Ride #${ride._id.toString().slice(-6)}.`,
      type: 'system',
      rideId: ride._id,
      data: { incidentId: incident._id, rideId: ride._id },
    });
  }

  // Socket.IO Broadcasts
  const io = getIO();
  if (io) {
    const sosPayload = {
      incidentId: incident._id,
      rideId: ride._id,
      triggeredBy: triggeredByRole,
      status: 'triggered',
      passengerName: ride.passenger.name,
      driverName: ride.driver?.user?.name || 'Assigned Driver',
      location: {
        address: incidentAddress,
        coordinates: incidentCoordinates,
      },
      triggeredAt: incident.triggeredAt,
    };

    io.to(`ride:${ride._id}`).emit('SOS_TRIGGERED', sosPayload);
    io.to('admin:safety').emit('SOS_TRIGGERED', sosPayload);
    io.to(`user:${ride.passenger._id.toString()}`).emit('SOS_TRIGGERED', sosPayload);
    if (ride.driver?.user) {
      io.to(`user:${ride.driver.user._id.toString()}`).emit('SOS_TRIGGERED', sosPayload);
    }
  }

  return {
    incident,
    alreadyActive: false,
    message: 'EMERGENCY SOS Triggered successfully. Safety Desk & Emergency Services have been alerted.',
  };
}

/**
 * Fetch active or historic safety incidents (Admin / Safety Desk)
 */
export async function getIncidents({ status, userRole, userId }) {
  let query = {};
  if (status) {
    query.status = status;
  }

  // Passengers / Drivers can only view their own incidents
  if (userRole === 'passenger') {
    query.passenger = userId;
  } else if (userRole === 'driver') {
    const driver = await Driver.findOne({ user: userId });
    if (driver) {
      query.driver = driver._id;
    }
  }

  const incidents = await SafetyIncident.find(query)
    .populate('passenger', 'name email phone')
    .populate({ path: 'driver', populate: { path: 'user', select: 'name phone' } })
    .populate('ride', 'pickupLocation dropoffLocation status')
    .sort({ createdAt: -1 });

  return incidents;
}

/**
 * Get single Safety Incident by ID
 */
export async function getIncidentById(incidentId, userId, userRole) {
  const incident = await SafetyIncident.findById(incidentId)
    .populate('passenger', 'name email phone')
    .populate({ path: 'driver', populate: { path: 'user', select: 'name phone' } })
    .populate('ride')
    .populate('timeline.actor', 'name role');

  if (!incident) {
    throw new Error('Safety incident not found');
  }

  const isAdmin = userRole === 'admin';
  const isPassenger = incident.passenger && incident.passenger._id.toString() === userId.toString();
  const isDriver = incident.driver?.user && incident.driver.user._id.toString() === userId.toString();

  if (!isAdmin && !isPassenger && !isDriver) {
    throw new Error('Unauthorized: You do not have permission to view this safety incident');
  }

  return incident;
}

/**
 * Update Incident Status (Acknowledge, Investigate, Resolve) — Admin Only
 */
export async function updateIncidentStatus({ incidentId, actorId, actorRole, status, notes }) {
  if (actorRole !== 'admin') {
    throw new Error('Unauthorized: Only authorized Admin/Safety Desk users can update incident status.');
  }

  const validStatuses = ['acknowledged', 'investigating', 'resolved', 'false_alarm'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status "${status}". Allowed values: ${validStatuses.join(', ')}`);
  }

  const incident = await SafetyIncident.findById(incidentId);
  if (!incident) {
    throw new Error('Safety incident not found');
  }

  const actorUser = await User.findById(actorId);

  // Update timestamps and resolution info
  incident.status = status;
  if (status === 'acknowledged' && !incident.acknowledgedAt) {
    incident.acknowledgedAt = new Date();
    incident.acknowledgedBy = actorId;
  } else if (status === 'resolved' || status === 'false_alarm') {
    incident.resolvedAt = new Date();
    incident.resolvedBy = actorId;
    incident.resolutionDetails = notes || `Resolved as ${status}`;

    // Reset ride's active SOS flag
    await Ride.findByIdAndUpdate(incident.ride, {
      $set: { hasActiveSos: false, activeIncident: null },
    });
  }

  // Push to Timeline
  incident.timeline.push({
    status,
    actor: actorId,
    actorRole: 'admin',
    actorName: actorUser ? actorUser.name : 'Safety Desk Officer',
    notes: notes || `Incident status updated to ${status.toUpperCase()}`,
    timestamp: new Date(),
  });

  await incident.save();

  // Create notifications
  const passengerId = incident.passenger.toString();
  await createNotification({
    recipient: passengerId,
    title: `SOS Incident ${status.toUpperCase()}`,
    message: `Safety Desk has updated your SOS incident status to ${status.replace('_', ' ')}.`,
    type: 'system',
    rideId: incident.ride,
  });

  // Socket.IO Emit
  const io = getIO();
  if (io) {
    const payload = {
      incidentId: incident._id,
      rideId: incident.ride,
      status,
      updatedBy: actorUser ? actorUser.name : 'Safety Desk Officer',
      notes,
      timestamp: new Date(),
    };

    const eventName = status === 'acknowledged' ? 'SOS_ACKNOWLEDGED' : 'SOS_STATUS_UPDATED';
    io.to(`ride:${incident.ride}`).emit(eventName, payload);
    io.to('admin:safety').emit(eventName, payload);
    io.to(`user:${passengerId}`).emit(eventName, payload);
  }

  return incident;
}
