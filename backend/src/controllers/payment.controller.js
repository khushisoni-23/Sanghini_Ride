import {
  createPaymentOrder,
  verifyPayment,
  recordPaymentFailure,
  getRideInvoice,
  processRazorpayWebhook,
} from '../services/payment.service.js';
import Payment from '../models/Payment.js';

/**
 * @desc    Create a payment order for a ride
 * @route   POST /api/payments/create-order
 * @access  Private (Passenger only)
 */
export const createOrder = async (req, res) => {
  try {
    const { rideId, paymentMethod = 'online' } = req.body;

    if (!rideId) {
      return res.status(400).json({
        success: false,
        message: 'Ride ID is required to create a payment order.',
      });
    }

    const orderData = await createPaymentOrder({
      rideId,
      userId: req.user._id,
      paymentMethod,
    });

    return res.status(200).json({
      success: true,
      message: 'Payment order created successfully.',
      data: orderData,
    });
  } catch (error) {
    console.error('Error in createOrder:', error);
    return res.status(error.message.includes('Unauthorized') ? 403 : 500).json({
      success: false,
      message: error.message || 'Failed to create payment order.',
    });
  }
};

/**
 * @desc    Verify payment signature and finalize payment
 * @route   POST /api/payments/verify
 * @access  Private (Passenger / Driver)
 */
export const verify = async (req, res) => {
  try {
    const {
      rideId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentMethod = 'online',
    } = req.body;

    if (!rideId) {
      return res.status(400).json({
        success: false,
        message: 'Ride ID is required for verification.',
      });
    }

    const result = await verifyPayment({
      rideId,
      userId: req.user._id,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentMethod,
    });

    return res.status(200).json({
      success: true,
      message: result.message || 'Payment verified successfully.',
      data: result.payment,
      invoiceNumber: result.invoiceNumber,
    });
  } catch (error) {
    console.error('Error in verifyPayment:', error);
    return res.status(error.message.includes('Unauthorized') ? 403 : 400).json({
      success: false,
      message: error.message || 'Payment verification failed.',
    });
  }
};

/**
 * @desc    Record a payment failure
 * @route   POST /api/payments/failure
 * @access  Private (Passenger)
 */
export const recordFailure = async (req, res) => {
  try {
    const { rideId, razorpayOrderId, reason } = req.body;

    if (!rideId) {
      return res.status(400).json({
        success: false,
        message: 'Ride ID is required.',
      });
    }

    const payment = await recordPaymentFailure({
      rideId,
      userId: req.user._id,
      razorpayOrderId,
      reason,
    });

    return res.status(200).json({
      success: true,
      message: 'Payment failure recorded.',
      data: payment,
    });
  } catch (error) {
    console.error('Error in recordFailure:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record payment failure.',
    });
  }
};

/**
 * @desc    Get structured printable invoice for a ride
 * @route   GET /api/payments/invoice/:rideId
 * @access  Private
 */
export const getInvoice = async (req, res) => {
  try {
    const { rideId } = req.params;

    const invoice = await getRideInvoice(rideId, req.user._id, req.user.role);

    return res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error('Error in getInvoice:', error);
    return res.status(error.message.includes('Unauthorized') ? 403 : 404).json({
      success: false,
      message: error.message || 'Failed to fetch invoice.',
    });
  }
};

/**
 * @desc    Get user's payment history
 * @route   GET /api/payments/history
 * @access  Private
 */
export const getPaymentHistory = async (req, res) => {
  try {
    const query = req.user.role === 'passenger' ? { passenger: req.user._id } : {};

    const payments = await Payment.find(query)
      .populate('ride', 'pickupLocation dropoffLocation fare status createdAt')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error('Error in getPaymentHistory:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history.',
    });
  }
};

/**
 * @desc    Handle Razorpay Webhooks
 * @route   POST /api/payments/webhook
 * @access  Public (Gateway Signature Protected)
 */
export const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const result = await processRazorpayWebhook(req.body, signature);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Webhook error:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};
