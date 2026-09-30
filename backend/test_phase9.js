import mongoose from 'mongoose';
import crypto from 'crypto';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from './src/models/User.js';
import Driver from './src/models/Driver.js';
import Ride from './src/models/Ride.js';
import Payment from './src/models/Payment.js';
import Notification from './src/models/Notification.js';
import env from './src/config/env.js';
import { calculateAuthoritativeFare, generateInvoiceNumber, VEHICLE_PRICING } from './src/utils/fareCalculator.js';
import {
  createPaymentOrder,
  verifyPayment,
  recordPaymentFailure,
  getRideInvoice,
  processRazorpayWebhook,
} from './src/services/payment.service.js';

let mongoServer;

async function runPhase9Tests() {
  console.log('\n======================================================');
  console.log('🧪 SANGHINI RIDE — PHASE 9 INTEGRATION TEST SUITE');
  console.log('   Real Payments + Authoritative Fare + Invoice System');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // Setup In-Memory MongoDB Server
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  console.log('Connected to test in-memory MongoDB.\n');

  try {
    // ─── Test Suite 1: Authoritative Fare Calculation ─────────────────────
    console.log('--- Suite 1: Backend Authoritative Fare Calculation ---');
    
    // Test Auto Pricing
    const autoFare = calculateAuthoritativeFare({
      distanceKm: 5.0,
      durationMins: 15,
      vehicleType: 'auto',
    });
    // Base: 40 (covers 1.5km), extra 3.5km * 12 = 42, time 15 * 1 = 15. Subtotal = 97. Tax 5% = 5. Total = 102.
    assert(autoFare.totalFare > 0, 'Auto fare calculates positive total amount');
    assert(autoFare.baseFare === VEHICLE_PRICING.auto.baseFare, 'Applies correct auto base fare');
    assert(autoFare.currency === 'INR', 'Currency is INR');
    assert(autoFare.distanceFare > 0, 'Applies distance charge for distance > base distance');
    assert(autoFare.tax > 0, 'Includes 5% tax/GST breakdown');

    // Test Scooter Pricing
    const scooterFare = calculateAuthoritativeFare({
      distanceKm: 3.0,
      durationMins: 10,
      vehicleType: 'scooter',
    });
    assert(scooterFare.vehicleType === 'scooter', 'Correct vehicle tier pricing (scooter)');
    assert(scooterFare.totalFare < autoFare.totalFare, 'Scooter is more economical than Auto');

    // Test Premier Pricing
    const premierFare = calculateAuthoritativeFare({
      distanceKm: 5.0,
      durationMins: 15,
      vehicleType: 'premier',
    });
    assert(premierFare.totalFare > autoFare.totalFare, 'Premier car is priced higher than Auto');

    // Test Discount handling
    const discountedFare = calculateAuthoritativeFare({
      distanceKm: 5.0,
      durationMins: 15,
      vehicleType: 'auto',
      discount: 20,
    });
    assert(discountedFare.totalFare === autoFare.totalFare - 20, 'Applies promotional discount correctly');

    // Minimum base fare protection
    const minFare = calculateAuthoritativeFare({
      distanceKm: 0.1,
      durationMins: 1,
      vehicleType: 'auto',
      discount: 100,
    });
    assert(minFare.totalFare >= VEHICLE_PRICING.auto.baseFare, 'Fare never drops below base fare floor');

    // ─── Test Suite 2: Setup Database Records ────────────────────────────
    console.log('\n--- Suite 2: Setup Passengers, Drivers & Completed Ride ---');
    const passenger = await User.create({
      name: 'Sunita Sharma',
      email: 'sunita.sharma@example.com',
      phone: '+91 98290 11111',
      passwordHash: 'secret123',
      role: 'passenger',
      gender: 'female',
      isActive: true,
    });

    const unauthorizedUser = await User.create({
      name: 'Intruder User',
      email: 'intruder@example.com',
      phone: '+91 98290 99999',
      passwordHash: 'secret123',
      role: 'passenger',
      gender: 'female',
      isActive: true,
    });

    const driverUser = await User.create({
      name: 'Pooja Solanki',
      email: 'pooja.driver@example.com',
      phone: '+91 98290 22222',
      passwordHash: 'secret123',
      role: 'driver',
      gender: 'female',
      isActive: true,
    });

    const driver = await Driver.create({
      user: driverUser._id,
      licenseNumber: 'RJ27-DL-7777',
      licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isAvailable: true,
      verificationStatus: 'verified',
    });

    const rideBreakdown = calculateAuthoritativeFare({ distanceKm: 4.2, durationMins: 14, vehicleType: 'auto' });
    const ride = await Ride.create({
      passenger: passenger._id,
      driver: driver._id,
      pickupLocation: {
        address: 'City Palace, Udaipur',
        coordinates: { type: 'Point', coordinates: [73.6836, 24.5764] },
      },
      dropoffLocation: {
        address: 'Saheliyon Ki Bari, Udaipur',
        coordinates: { type: 'Point', coordinates: [73.6980, 24.6044] },
      },
      estimatedDistance: 4.2,
      estimatedDuration: 14,
      fare: rideBreakdown.totalFare,
      fareBreakdown: rideBreakdown,
      status: 'completed',
      completedAt: new Date(),
    });

    assert(passenger && driver && ride, 'Created passenger, driver, and completed ride');

    // ─── Test Suite 3: Online Payment Order Creation ─────────────────────
    console.log('\n--- Suite 3: Payment Order Creation (Online & Cash) ---');
    
    // Security check: Unauthorized user attempting to pay
    let unauthorizedBlocked = false;
    try {
      await createPaymentOrder({
        rideId: ride._id.toString(),
        userId: unauthorizedUser._id.toString(),
        paymentMethod: 'online',
      });
    } catch (err) {
      if (err.message.includes('Unauthorized')) {
        unauthorizedBlocked = true;
      }
    }
    assert(unauthorizedBlocked, 'Prevents unauthorized user from initiating payment for someone else');

    // Passenger creates Online order
    const onlineOrder = await createPaymentOrder({
      rideId: ride._id.toString(),
      userId: passenger._id.toString(),
      paymentMethod: 'online',
    });

    assert(onlineOrder.orderId, 'Generates valid payment order ID');
    assert(onlineOrder.amount === ride.fare, 'Order amount matches authoritative ride fare');
    assert(onlineOrder.currency === 'INR', 'Order currency is INR');
    assert(!onlineOrder.isCash, 'Flagged as online order');

    const paymentDoc1 = await Payment.findById(onlineOrder.paymentId);
    assert(paymentDoc1 && paymentDoc1.paymentStatus === 'created', 'Payment record created with status "created"');

    // ─── Test Suite 4: Online Payment Verification & Idempotency ─────────
    console.log('\n--- Suite 4: HMAC Signature Verification & Payment Success ---');
    
    const secret = env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_sanghini2026';
    const fakePaymentId = 'pay_test_' + Date.now();
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(`${onlineOrder.orderId}|${fakePaymentId}`)
      .digest('hex');

    // Reject forged signature
    let invalidSigCaught = false;
    try {
      await verifyPayment({
        rideId: ride._id.toString(),
        userId: passenger._id.toString(),
        razorpayOrderId: onlineOrder.orderId,
        razorpayPaymentId: fakePaymentId,
        razorpaySignature: 'invalid_forged_signature_123',
        paymentMethod: 'online',
      });
    } catch (err) {
      if (err.message.includes('signature verification failed')) {
        invalidSigCaught = true;
      }
    }
    assert(invalidSigCaught, 'Rejects forged or invalid Razorpay signature');

    // Verify with valid HMAC SHA256 signature
    const verifyResult = await verifyPayment({
      rideId: ride._id.toString(),
      userId: passenger._id.toString(),
      razorpayOrderId: onlineOrder.orderId,
      razorpayPaymentId: fakePaymentId,
      razorpaySignature: validSignature,
      paymentMethod: 'online',
    });

    assert(verifyResult.success === true, 'Verification succeeds with authentic HMAC signature');
    assert(verifyResult.invoiceNumber.startsWith('INV-SR-'), 'Generates valid invoice number upon success');

    // Check MongoDB Ride and Payment status
    const updatedRide = await Ride.findById(ride._id);
    assert(updatedRide.paymentStatus === 'paid', 'Ride paymentStatus transitioned to "paid"');
    assert(updatedRide.paymentMethod === 'online', 'Ride paymentMethod set to "online"');

    const updatedPayment = await Payment.findById(onlineOrder.paymentId);
    assert(updatedPayment.paymentStatus === 'successful', 'Payment document updated to "successful"');
    assert(updatedPayment.paidAt != null, 'Payment paidAt timestamp recorded');

    // Check In-App Notification was generated for passenger
    const notifs = await Notification.find({ recipient: passenger._id, ride: ride._id });
    assert(notifs.length > 0, 'In-app notification sent to passenger for successful payment');

    // Idempotency: Second verification call should be idempotent
    const idempotentResult = await verifyPayment({
      rideId: ride._id.toString(),
      userId: passenger._id.toString(),
      razorpayOrderId: onlineOrder.orderId,
      razorpayPaymentId: fakePaymentId,
      razorpaySignature: validSignature,
      paymentMethod: 'online',
    });
    assert(idempotentResult.success === true, 'Subsequent verification call is idempotent and succeeds without error');

    // ─── Test Suite 5: Cash Payment Flow & Driver Confirmation ──────────
    console.log('\n--- Suite 5: Cash Collection & Confirmation Flow ---');
    
    const cashRide = await Ride.create({
      passenger: passenger._id,
      driver: driver._id,
      pickupLocation: {
        address: 'Fateh Sagar Lake, Udaipur',
        coordinates: { type: 'Point', coordinates: [73.6763, 24.5960] },
      },
      dropoffLocation: {
        address: 'Chetak Circle, Udaipur',
        coordinates: { type: 'Point', coordinates: [73.6890, 24.5930] },
      },
      estimatedDistance: 2.5,
      estimatedDuration: 8,
      fare: 52,
      fareBreakdown: calculateAuthoritativeFare({ distanceKm: 2.5, durationMins: 8, vehicleType: 'auto' }),
      status: 'completed',
      completedAt: new Date(),
    });

    // Passenger selects Cash
    const cashOrder = await createPaymentOrder({
      rideId: cashRide._id.toString(),
      userId: passenger._id.toString(),
      paymentMethod: 'cash',
    });

    assert(cashOrder.isCash === true, 'Flags cash order correctly');
    assert(cashOrder.amount === cashRide.fare, 'Authoritative cash amount matches ride fare');

    // Driver verifies cash collection
    const cashVerifyResult = await verifyPayment({
      rideId: cashRide._id.toString(),
      userId: driverUser._id.toString(), // Driver confirms collection
      paymentMethod: 'cash',
    });

    assert(cashVerifyResult.success === true, 'Driver can confirm cash payment collection');
    assert(cashVerifyResult.invoiceNumber.startsWith('INV-SR-'), 'Generates invoice number for cash transaction');

    const updatedCashRide = await Ride.findById(cashRide._id);
    assert(updatedCashRide.paymentStatus === 'paid', 'Cash ride marked as paid in database');
    assert(updatedCashRide.paymentMethod === 'cash', 'Payment method stored as cash');

    // ─── Test Suite 6: Payment Failure Recording & Retry Flow ────────────
    console.log('\n--- Suite 6: Payment Failure & Retry Flow ---');
    
    const failRide = await Ride.create({
      passenger: passenger._id,
      pickupLocation: {
        address: 'Railway Station, Udaipur',
        coordinates: { type: 'Point', coordinates: [73.7020, 24.5730] },
      },
      dropoffLocation: {
        address: 'Surajpole, Udaipur',
        coordinates: { type: 'Point', coordinates: [73.6950, 24.5780] },
      },
      estimatedDistance: 2.0,
      estimatedDuration: 7,
      fare: 45,
      fareBreakdown: calculateAuthoritativeFare({ distanceKm: 2.0, durationMins: 7, vehicleType: 'auto' }),
      status: 'completed',
    });

    const failedPayment = await recordPaymentFailure({
      rideId: failRide._id.toString(),
      userId: passenger._id.toString(),
      razorpayOrderId: 'order_failed_test_1',
      reason: 'User cancelled payment modal',
    });

    assert(failedPayment && failedPayment.paymentStatus === 'failed', 'Payment document recorded with status "failed"');
    assert(failedPayment.failureReason === 'User cancelled payment modal', 'Failure reason persisted');

    const failedRideDb = await Ride.findById(failRide._id);
    assert(failedRideDb.paymentStatus === 'failed', 'Ride status reflects payment failure');

    // Retry: Passenger creates cash order after failed online attempt
    const retryOrder = await createPaymentOrder({
      rideId: failRide._id.toString(),
      userId: passenger._id.toString(),
      paymentMethod: 'cash',
    });
    assert(retryOrder.isCash === true, 'Allows passenger to retry and switch to cash');

    // ─── Test Suite 7: Structured Invoice Generation & Access Control ───
    console.log('\n--- Suite 7: Structured Invoice Generation & Access Control ---');

    // Passenger viewing invoice
    const passengerInvoice = await getRideInvoice(ride._id.toString(), passenger._id.toString(), 'passenger');
    assert(passengerInvoice && passengerInvoice.invoiceNumber, 'Returns structured invoice object');
    assert(passengerInvoice.passenger.name === 'Sunita Sharma', 'Invoice contains passenger name');
    assert(passengerInvoice.driver.name === 'Pooja Solanki', 'Invoice contains driver partner name');
    assert(passengerInvoice.fareBreakdown.totalFare === ride.fare, 'Invoice fare breakdown matches total fare');
    assert(passengerInvoice.company.name.includes('Sanghini Ride'), 'Invoice includes official company branding');
    assert(passengerInvoice.paymentInfo.status === 'PAID', 'Invoice shows PAID status');

    // Driver viewing invoice
    const driverInvoice = await getRideInvoice(ride._id.toString(), driverUser._id.toString(), 'driver');
    assert(driverInvoice && driverInvoice.invoiceNumber === passengerInvoice.invoiceNumber, 'Driver can view identical ride invoice');

    // Admin viewing invoice
    const adminInvoice = await getRideInvoice(ride._id.toString(), new mongoose.Types.ObjectId().toString(), 'admin');
    assert(adminInvoice && adminInvoice.invoiceNumber === passengerInvoice.invoiceNumber, 'Admin has permission to view invoice');

    // Unauthorized user viewing invoice
    let invoiceAccessBlocked = false;
    try {
      await getRideInvoice(ride._id.toString(), unauthorizedUser._id.toString(), 'passenger');
    } catch (err) {
      if (err.message.includes('Unauthorized')) {
        invoiceAccessBlocked = true;
      }
    }
    assert(invoiceAccessBlocked, 'Unauthorized user is blocked from viewing other riders invoices');

    // ─── Test Suite 8: Razorpay Webhook Processing ──────────────────────
    console.log('\n--- Suite 8: Razorpay Webhooks Handling ---');

    const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_sanghini2026';
    const webhookRide = await Ride.create({
      passenger: passenger._id,
      pickupLocation: { address: 'Panchwati, Udaipur', coordinates: { type: 'Point', coordinates: [73.6914, 24.6008] } },
      dropoffLocation: { address: 'Fatehpura, Udaipur', coordinates: { type: 'Point', coordinates: [73.6980, 24.6100] } },
      estimatedDistance: 3.0,
      estimatedDuration: 10,
      fare: 60,
      status: 'completed',
    });

    const pendingPayment = await Payment.create({
      ride: webhookRide._id,
      passenger: passenger._id,
      amount: 60,
      paymentMethod: 'online',
      paymentStatus: 'created',
      razorpayOrderId: 'order_webhook_test_999',
    });

    const webhookPayload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_hook_captured_777',
            order_id: 'order_webhook_test_999',
            amount: 6000,
            status: 'captured',
          },
        },
      },
    };

    const webhookRawBody = JSON.stringify(webhookPayload);
    const validWebhookSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(webhookRawBody)
      .digest('hex');

    // Invalid Webhook signature
    let invalidWebhookBlocked = false;
    try {
      await processRazorpayWebhook(webhookPayload, 'invalid_hook_signature');
    } catch (err) {
      if (err.message.includes('Invalid webhook signature')) {
        invalidWebhookBlocked = true;
      }
    }
    assert(invalidWebhookBlocked, 'Rejects invalid webhook signature');

    // Valid Webhook processing
    const webhookResult = await processRazorpayWebhook(webhookRawBody, validWebhookSig);
    assert(webhookResult.received === true, 'Processes verified webhook payload');

    const updatedWebhookPayment = await Payment.findById(pendingPayment._id);
    assert(updatedWebhookPayment.paymentStatus === 'successful', 'Webhook updates payment to "successful"');
    assert(updatedWebhookPayment.razorpayPaymentId === 'pay_hook_captured_777', 'Webhook captures gateway payment ID');

    const updatedWebhookRide = await Ride.findById(webhookRide._id);
    assert(updatedWebhookRide.paymentStatus === 'paid', 'Webhook marks ride as paid');

    // ─── Summary ────────────────────────────────────────────────────────
    console.log('\n======================================================');
    console.log(`Phase 9 Integration Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('======================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Unexpected test suite error:', error);
    process.exit(1);
  } finally {
    if (mongoServer) {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  }
}

runPhase9Tests();
