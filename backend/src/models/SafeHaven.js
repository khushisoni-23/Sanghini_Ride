import mongoose from 'mongoose';

/**
 * SafeHaven — Udaipur Safe Haven Network (Police Booths, Women Shelters, Hospitals, Safe Shops)
 */
const safeHavenSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['police_booth', 'hospital', 'women_shelter', 'safe_shop', 'petrol_station', 'govt_office'],
      required: true,
      index: true,
    },
    address: {
      type: String,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    phone: String,
    isVerified: {
      type: Boolean,
      default: true,
    },
    is24Hours: {
      type: Boolean,
      default: false,
    },
    operatingHours: {
      type: String,
      default: '24 Hours',
    },
    notes: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

safeHavenSchema.index({ location: '2dsphere' });

const SafeHaven = mongoose.model('SafeHaven', safeHavenSchema);
export default SafeHaven;
