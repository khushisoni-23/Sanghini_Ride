import mongoose from 'mongoose';

/**
 * CommunitySignal — Crowd-sourced safety signals from drivers/passengers in Udaipur
 */
const communitySignalSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reporterRole: {
      type: String,
      enum: ['passenger', 'driver'],
      required: true,
    },
    signalType: {
      type: String,
      enum: [
        'unsafe_area',
        'bad_lighting',
        'eve_teasing',
        'suspicious_activity',
        'road_block',
        'flooding',
        'accident',
        'safe_area',
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    description: {
      type: String,
      maxlength: 500,
    },
    location: {
      address: String,
      coordinates: {
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
    },
    // How many other users confirmed this signal
    confirmations: {
      type: Number,
      default: 0,
    },
    confirmedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['active', 'expired', 'resolved'],
      default: 'active',
      index: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours
    },
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
    },
  },
  { timestamps: true }
);

communitySignalSchema.index({ 'location.coordinates': '2dsphere' });
communitySignalSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

const CommunitySignal = mongoose.model('CommunitySignal', communitySignalSchema);
export default CommunitySignal;
