import TrustedContact from '../models/TrustedContact.js';

const PHONE_REGEX = /^(?:\+91|91)?[6-9]\d{9}$/;

/**
 * Get all trusted contacts for a passenger
 */
export async function getTrustedContacts(userId) {
  return TrustedContact.find({ user: userId }).sort({ createdAt: -1 });
}

/**
 * Add a new trusted contact
 */
export async function addTrustedContact({
  userId,
  name,
  phone,
  email,
  relationship = 'Family/Friend',
  receiveSafetyAlerts = true,
  receiveRideShare = true,
}) {
  if (!name || !phone) {
    throw new Error('Contact name and phone number are required');
  }

  const cleanPhone = phone.replace(/[\s-]/g, '').slice(-10);
  if (!PHONE_REGEX.test(cleanPhone)) {
    throw new Error('Please provide a valid 10-digit Indian phone number.');
  }

  // Check duplicate contact for same user
  const existing = await TrustedContact.findOne({ user: userId, phone: cleanPhone });
  if (existing) {
    throw new Error('A trusted contact with this phone number already exists in your list.');
  }

  const contact = await TrustedContact.create({
    user: userId,
    name: name.trim(),
    phone: cleanPhone,
    email: email ? email.toLowerCase().trim() : undefined,
    relationship: relationship.trim(),
    receiveSafetyAlerts: Boolean(receiveSafetyAlerts),
    receiveRideShare: Boolean(receiveRideShare),
  });

  return contact;
}

/**
 * Update existing trusted contact
 */
export async function updateTrustedContact({ contactId, userId, ...data }) {
  const contact = await TrustedContact.findOne({ _id: contactId, user: userId });
  if (!contact) {
    throw new Error('Trusted contact not found or unauthorized');
  }

  if (data.phone) {
    const cleanPhone = data.phone.replace(/[\s-]/g, '').slice(-10);
    if (!PHONE_REGEX.test(cleanPhone)) {
      throw new Error('Please provide a valid 10-digit Indian phone number.');
    }
    contact.phone = cleanPhone;
  }

  if (data.name) contact.name = data.name.trim();
  if (data.email !== undefined) contact.email = data.email ? data.email.toLowerCase().trim() : undefined;
  if (data.relationship !== undefined) contact.relationship = data.relationship.trim();
  if (data.receiveSafetyAlerts !== undefined) contact.receiveSafetyAlerts = Boolean(data.receiveSafetyAlerts);
  if (data.receiveRideShare !== undefined) contact.receiveRideShare = Boolean(data.receiveRideShare);

  await contact.save();
  return contact;
}

/**
 * Delete a trusted contact
 */
export async function deleteTrustedContact({ contactId, userId }) {
  const contact = await TrustedContact.findOneAndDelete({ _id: contactId, user: userId });
  if (!contact) {
    throw new Error('Trusted contact not found or unauthorized');
  }
  return { success: true, message: 'Trusted contact removed successfully' };
}
