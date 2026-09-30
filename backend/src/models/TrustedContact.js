import mongoose from 'mongoose';

const trustedContactSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a contact name'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Please provide a phone number'],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    relationship: {
      type: String,
      default: 'Family/Friend',
      trim: true,
    },
    receiveSafetyAlerts: {
      type: Boolean,
      default: true,
    },
    receiveRideShare: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate phone contacts for the same user
trustedContactSchema.index({ user: 1, phone: 1 }, { unique: true });

const TrustedContact = mongoose.model('TrustedContact', trustedContactSchema);

export default TrustedContact;
