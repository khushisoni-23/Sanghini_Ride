import mongoose from 'mongoose';

const rideSchema = new mongoose.Schema(
  {
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      index: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    pickupLocation: {
      address: {
        type: String,
        required: true,
      },
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
    dropoffLocation: {
      address: {
        type: String,
        required: true,
      },
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
    estimatedDistance: {
      type: Number, // in km
    },
    estimatedDuration: {
      type: Number, // in minutes
    },
    fare: {
      type: Number,
      required: true,
    },
    fareBreakdown: {
      baseFare: Number,
      distanceFare: Number,
      timeFare: Number,
      platformFee: Number,
      tax: Number,
      discount: Number,
      totalFare: Number,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'online', 'upi', 'card', 'wallet'],
      default: 'cash',
    },
    status: {
      type: String,
      enum: [
        'requested',
        'finding_driver',
        'accepted',
        'driver_arriving',
        'arrived',
        'in_progress',
        'completed',
        'cancelled',
        'no_driver_available',
      ],
      default: 'requested',
      index: true,
    },
    driverLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
      heading: {
        type: Number,
        default: 0,
      },
      speed: {
        type: Number,
        default: 0,
      },
      updatedAt: {
        type: Date,
      },
    },
    routeGeometry: {
      type: [[Number]], // Array of [lng, lat] coordinates
      default: [],
    },
    currentEtaMinutes: {
      type: Number,
    },
    currentDistanceKm: {
      type: Number,
    },
    rejectedDrivers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
      },
    ],
    otp: {
      type: String,
      // For ride start verification in future phases
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    acceptedAt: {
      type: Date,
    },
    arrivedAt: {
      type: Date,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
    },
    cancelledBy: {
      type: String,
      enum: ['passenger', 'driver', 'admin', 'system'],
    },
    // Safety & Live Sharing
    shareToken: {
      type: String,
      index: true,
      sparse: true,
    },
    isShared: {
      type: Boolean,
      default: false,
    },
    shareExpiresAt: {
      type: Date,
    },
    hasActiveSos: {
      type: Boolean,
      default: false,
    },
    activeIncident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SafetyIncident',
    },
    // Ratings
    passengerRated: {
      type: Boolean,
      default: false,
    },
    driverRated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for spatial queries on pickup/dropoff
rideSchema.index({ 'pickupLocation.coordinates': '2dsphere' });
rideSchema.index({ 'dropoffLocation.coordinates': '2dsphere' });
rideSchema.index({ 'driverLocation.coordinates': '2dsphere' });

const Ride = mongoose.model('Ride', rideSchema);

export default Ride;
