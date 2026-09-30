import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
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
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    paymentMethod: {
      type: String,
      enum: ['online', 'cash', 'upi', 'card', 'wallet'],
      default: 'online',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'created', 'initiated', 'successful', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    razorpayOrderId: {
      type: String,
      index: true,
      sparse: true,
    },
    razorpayPaymentId: {
      type: String,
      index: true,
      sparse: true,
    },
    razorpaySignature: {
      type: String,
    },
    transactionId: {
      type: String,
      sparse: true,
    },
    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    failureReason: {
      type: String,
    },
    paidAt: {
      type: Date,
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
    idempotencyKey: {
      type: String,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookup by user and ride
paymentSchema.index({ passenger: 1, createdAt: -1 });
paymentSchema.index({ ride: 1, paymentStatus: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
