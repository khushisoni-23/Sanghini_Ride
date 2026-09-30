import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      required: true,
      index: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reviewerRole: {
      type: String,
      enum: ['passenger', 'driver'],
      required: true,
    },
    reviewedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating between 1 and 5'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    review: {
      type: String,
      trim: true,
      maxlength: [500, 'Review text cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one rating per reviewer per ride
ratingSchema.index({ ride: 1, reviewer: 1 }, { unique: true });

const Rating = mongoose.model('Rating', ratingSchema);

export default Rating;
