import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
      index: true,
    },
    vehicleType: {
      type: String,
      enum: ['auto', 'mini', 'prime'],
      required: true,
      index: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true, // e.g., RJ 27 TA 4321
    },
    make: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    rcDocument: {
      type: String, // Path or URL to the registration certificate
    },
    insuranceDocument: {
      type: String,
    },
    insuranceExpiry: {
      type: Date,
    },
    pucDocument: {
      type: String,
    },
    pucExpiry: {
      type: Date,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'in_review', 'verified', 'rejected'],
      default: 'pending',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

export default Vehicle;
