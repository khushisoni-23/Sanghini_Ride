import {
  getTrustedContacts,
  addTrustedContact,
  updateTrustedContact,
  deleteTrustedContact,
} from '../services/trustedContact.service.js';

export const getContacts = async (req, res) => {
  try {
    const contacts = await getTrustedContacts(req.user._id);
    return res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch trusted contacts.' });
  }
};

export const addContact = async (req, res) => {
  try {
    const { name, phone, email, relationship, receiveSafetyAlerts, receiveRideShare } = req.body;

    const contact = await addTrustedContact({
      userId: req.user._id,
      name,
      phone,
      email,
      relationship,
      receiveSafetyAlerts,
      receiveRideShare,
    });

    return res.status(201).json({
      success: true,
      message: 'Trusted contact added successfully.',
      data: contact,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || 'Failed to add trusted contact.' });
  }
};

export const updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await updateTrustedContact({
      contactId: id,
      userId: req.user._id,
      ...req.body,
    });

    return res.status(200).json({
      success: true,
      message: 'Trusted contact updated successfully.',
      data: contact,
    });
  } catch (error) {
    return res.status(error.message.includes('Unauthorized') ? 403 : 400).json({
      success: false,
      message: error.message || 'Failed to update trusted contact.',
    });
  }
};

export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteTrustedContact({ contactId: id, userId: req.user._id });

    return res.status(200).json({
      success: true,
      message: 'Trusted contact removed successfully.',
    });
  } catch (error) {
    return res.status(error.message.includes('Unauthorized') ? 403 : 400).json({
      success: false,
      message: error.message || 'Failed to delete trusted contact.',
    });
  }
};
