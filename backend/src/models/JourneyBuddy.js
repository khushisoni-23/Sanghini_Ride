import mongoose from 'mongoose';

/**
 * JourneyBuddy — Passenger-to-Passenger safety pairing for same-route rides
 */
const journeyBuddySchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // The ride that this buddy request is for
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      required: true,
    },
    status: {
      type: String,
      enum: ['searching', 'matched', 'declined', 'cancelled', 'completed'],
      default: 'searching',
      index: true,
    },
    // Matched buddy (another passenger with overlapping route)
    matchedBuddy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    matchedRide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
    },
    // Check-in status: both must ping alive
    requesterCheckedIn: {
      type: Boolean,
      default: false,
    },
    buddyCheckedIn: {
      type: Boolean,
      default: false,
    },
    lastRequesterPing: Date,
    lastBuddyPing: Date,
    // Route overlap area
    pickupAreaAddress: String,
    dropoffAreaAddress: String,
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
    },
    notes: String,
  },
  { timestamps: true }
);

const JourneyBuddy = mongoose.model('JourneyBuddy', journeyBuddySchema);
export default JourneyBuddy;
