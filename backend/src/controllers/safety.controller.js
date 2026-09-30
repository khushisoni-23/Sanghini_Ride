import {
  triggerSos,
  getIncidents,
  getIncidentById,
  updateIncidentStatus,
} from '../services/safety.service.js';

export const triggerSosAction = async (req, res) => {
  try {
    const { rideId, location } = req.body;

    if (!rideId) {
      return res.status(400).json({ success: false, message: 'Ride ID is required to trigger SOS.' });
    }

    const result = await triggerSos({
      rideId,
      userId: req.user._id,
      userRole: req.user.role,
      location,
    });

    return res.status(201).json({
      success: true,
      message: result.message,
      data: result.incident,
      alreadyActive: result.alreadyActive,
    });
  } catch (error) {
    console.error('Error in triggerSosAction:', error);
    return res.status(error.message.includes('Unauthorized') ? 403 : 400).json({
      success: false,
      message: error.message || 'Failed to trigger SOS.',
    });
  }
};

export const getIncidentsAction = async (req, res) => {
  try {
    const { status } = req.query;
    const incidents = await getIncidents({
      status,
      userRole: req.user.role,
      userId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      count: incidents.length,
      data: incidents,
    });
  } catch (error) {
    console.error('Error in getIncidentsAction:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch safety incidents.' });
  }
};

export const getIncidentByIdAction = async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await getIncidentById(id, req.user._id, req.user.role);

    return res.status(200).json({
      success: true,
      data: incident,
    });
  } catch (error) {
    console.error('Error in getIncidentByIdAction:', error);
    return res.status(error.message.includes('Unauthorized') ? 403 : 404).json({
      success: false,
      message: error.message || 'Incident not found.',
    });
  }
};

export const updateIncidentStatusAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const incident = await updateIncidentStatus({
      incidentId: id,
      actorId: req.user._id,
      actorRole: req.user.role,
      status,
      notes,
    });

    return res.status(200).json({
      success: true,
      message: `Incident status updated to ${status}.`,
      data: incident,
    });
  } catch (error) {
    console.error('Error in updateIncidentStatusAction:', error);
    return res.status(error.message.includes('Unauthorized') ? 403 : 400).json({
      success: false,
      message: error.message || 'Failed to update incident status.',
    });
  }
};
