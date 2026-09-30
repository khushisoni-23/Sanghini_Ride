import mongoose from 'mongoose';

const safetyIncidentSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      required: true,
      index: true,
    },
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      index: true,
    },
    triggeredBy: {
      type: String,
      enum: ['passenger', 'driver', 'system'],
      required: true,
    },
    incidentType: {
      type: String,
      enum: ['manual_sos', 'discreet_alert', 'route_deviation', 'prolonged_stop', 'journey_buddy_miss', 'other'],
      default: 'manual_sos',
      required: true,
    },
    status: {
      type: String,
      enum: ['triggered', 'acknowledged', 'investigating', 'resolved', 'false_alarm'],
      default: 'triggered',
      index: true,
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
        },
      },
    },
    timeline: [
      {
        status: {
          type: String,
          required: true,
        },
        actor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        actorRole: {
          type: String,
        },
        actorName: {
          type: String,
        },
        notes: {
          type: String,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    notifiedContactsCount: {
      type: Number,
      default: 0,
    },
    triggeredAt: {
      type: Date,
      default: Date.now,
    },
    acknowledgedAt: {
      type: Date,
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
    resolutionDetails: {
      type: String,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

safetyIncidentSchema.index({ 'location.coordinates': '2dsphere' });

const SafetyIncident = mongoose.model('SafetyIncident', safetyIncidentSchema);

export default SafetyIncident;
