import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from './src/models/User.js';
import Driver from './src/models/Driver.js';
import Ride from './src/models/Ride.js';
import Notification from './src/models/Notification.js';
import {
  createNotification,
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from './src/services/notification.service.js';
import { findEligibleDrivers, dispatchRide } from './src/services/matching.service.js';

let mongoServer;

async function runPhase7And8Tests() {
  console.log('\n======================================================');
  console.log('🧪 SANGHINI RIDE — PHASE 7 & 8 INTEGRATION TEST SUITE');
  console.log('   Real-Time Communication + Notifications');
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
  console.log('Connected to test database.\n');

  try {
    // ─── Setup Users & Drivers ─────────────────────────────────────────
    console.log('--- Suite 1: Entities & Notification Setup ---');
    const passenger = await User.create({
      name: 'Sunita Mehra',
      email: 'sunita@example.com',
      phone: '+91 98290 55555',
      passwordHash: 'secret123',
      role: 'passenger',
      gender: 'female',
      isActive: true,
    });

    const driverUser = await User.create({
      name: 'Geeta Kumari',
      email: 'geeta@example.com',
      phone: '+91 98290 66666',
      passwordHash: 'secret123',
      role: 'driver',
      gender: 'female',
      isActive: true,
    });

    const driver = await Driver.create({
      user: driverUser._id,
      licenseNumber: 'RJ27-DL-8888',
      licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isAvailable: true,
      verificationStatus: 'verified',
      currentLocation: {
        type: 'Point',
        coordinates: [73.6914, 24.6008], // Sukhadia Circle
      },
    });

    assert(passenger && driverUser && driver, 'Passenger and Driver created');

    // ─── Test Suite 2: Notification Persistence & CRUD ────────────────
    console.log('\n--- Suite 2: In-App Notification System & Persistence ---');
    const notif1 = await createNotification({
      recipient: passenger._id,
      title: 'Ride Requested',
      message: 'Searching for verified drivers near Sukhadia Circle.',
      type: 'ride_requested',
    });

    assert(notif1 && notif1.title === 'Ride Requested', 'Notification persisted to MongoDB');
    assert(notif1.isRead === false, 'Notification initially has unread state (isRead: false)');

    const userNotifs = await getUserNotifications(passenger._id);
    assert(userNotifs.notifications.length === 1, 'Fetched 1 notification for passenger');
    assert(userNotifs.unreadCount === 1, 'Unread notification count is 1');

    // Mark single notification as read
    const readResult = await markNotificationRead(notif1._id, passenger._id);
    assert(readResult.notification.isRead === true, 'Notification marked as read');
    assert(readResult.unreadCount === 0, 'Unread count updated to 0');

    // Test Deduplication
    const notif2 = await createNotification({
      recipient: passenger._id,
      title: 'Driver Assigned',
      message: 'Driver Geeta has accepted your ride.',
      type: 'driver_accepted',
      rideId: new mongoose.Types.ObjectId(),
    });

    // Attempting to create same unread notification within 30s
    const duplicateNotif = await createNotification({
      recipient: passenger._id,
      title: 'Driver Assigned',
      message: 'Driver Geeta has accepted your ride.',
      type: 'driver_accepted',
      rideId: notif2.ride,
    });

    assert(
      duplicateNotif._id.toString() === notif2._id.toString(),
      'Duplicate notification prevented within 30s time window'
    );

    // Mark All As Read
    await createNotification({
      recipient: passenger._id,
      title: 'Driver Arrived',
      message: 'Your driver has arrived.',
      type: 'driver_arrived',
    });

    const allReadResult = await markAllNotificationsRead(passenger._id);
    assert(allReadResult.unreadCount === 0, 'markAllAsRead reset unread count to 0');

    // ─── Test Suite 3: End-to-End Ride Event Notifications ─────────────
    console.log('\n--- Suite 3: Server-Authoritative Ride Lifecycle Events ---');

    // 1. Ride Created (ride_requested & ride_offered)
    const ride = await Ride.create({
      passenger: passenger._id,
      pickupLocation: {
        address: 'Sukhadia Circle, Panchwati, Udaipur',
        coordinates: { type: 'Point', coordinates: [73.6914, 24.6008] },
      },
      dropoffLocation: {
        address: 'Fateh Sagar Lake Paal, Udaipur',
        coordinates: { type: 'Point', coordinates: [73.6763, 24.5960] },
      },
      estimatedDistance: 3.5,
      estimatedDuration: 12,
      fare: 75,
      status: 'finding_driver',
      otp: '7741',
    });

    // Driver receives ride_offered notification
    const driverOfferNotif = await createNotification({
      recipient: driverUser._id,
      title: 'New Ride Request nearby',
      message: 'Pickup: Sukhadia Circle • ₹75',
      type: 'ride_offered',
      rideId: ride._id,
    });
    assert(driverOfferNotif.type === 'ride_offered', 'Driver received ride_offered notification');

    // 2. Driver Accepts (driver_accepted)
    ride.status = 'accepted';
    ride.driver = driver._id;
    ride.acceptedAt = new Date();
    await ride.save();

    const acceptNotif = await createNotification({
      recipient: passenger._id,
      sender: driverUser._id,
      title: 'Driver Assigned!',
      message: `Verified driver Geeta Kumari accepted your ride. Start OTP: ${ride.otp}`,
      type: 'driver_accepted',
      rideId: ride._id,
    });
    assert(acceptNotif.type === 'driver_accepted', 'Passenger received driver_accepted notification');

    // 3. Driver On Way (driver_arriving)
    ride.status = 'driver_arriving';
    await ride.save();

    const arrivingNotif = await createNotification({
      recipient: passenger._id,
      title: 'Driver On The Way',
      message: 'Your driver is heading towards your pickup location.',
      type: 'driver_arriving',
      rideId: ride._id,
    });
    assert(arrivingNotif.type === 'driver_arriving', 'Passenger received driver_arriving notification');

    // 4. Driver Arrived (driver_arrived)
    ride.status = 'arrived';
    ride.arrivedAt = new Date();
    await ride.save();

    const arrivedNotif = await createNotification({
      recipient: passenger._id,
      title: 'Driver Arrived at Pickup',
      message: `Your driver has arrived. Start OTP: ${ride.otp}`,
      type: 'driver_arrived',
      rideId: ride._id,
    });
    assert(arrivedNotif.type === 'driver_arrived', 'Passenger received driver_arrived notification');

    // 5. Trip Started (ride_started)
    ride.status = 'in_progress';
    ride.startedAt = new Date();
    await ride.save();

    const startedNotif = await createNotification({
      recipient: passenger._id,
      title: 'Trip Started',
      message: 'Your ride to Fateh Sagar has started.',
      type: 'ride_started',
      rideId: ride._id,
    });
    assert(startedNotif.type === 'ride_started', 'Passenger received ride_started notification');

    // 6. Trip Completed (ride_completed)
    ride.status = 'completed';
    ride.completedAt = new Date();
    await ride.save();

    const completedPassengerNotif = await createNotification({
      recipient: passenger._id,
      title: 'Ride Completed',
      message: 'You have arrived safely. Total fare: ₹75.',
      type: 'ride_completed',
      rideId: ride._id,
    });
    const completedDriverNotif = await createNotification({
      recipient: driverUser._id,
      title: 'Trip Completed',
      message: 'Trip completed! You earned ₹75.',
      type: 'ride_completed',
      rideId: ride._id,
    });

    assert(completedPassengerNotif.type === 'ride_completed', 'Passenger received ride_completed notification');
    assert(completedDriverNotif.type === 'ride_completed', 'Driver received ride_completed notification');

    // ─── Test Suite 4: Cancellation & No Driver Events ────────────────
    console.log('\n--- Suite 4: Cancellation & No Driver Notifications ---');
    const ride3 = await Ride.create({
      passenger: passenger._id,
      pickupLocation: {
        address: 'MLSU Campus Gate 1, Udaipur',
        coordinates: { type: 'Point', coordinates: [73.7175, 24.5932] },
      },
      dropoffLocation: {
        address: 'City Palace, Udaipur',
        coordinates: { type: 'Point', coordinates: [73.6835, 24.5764] },
      },
      fare: 110,
      status: 'no_driver_available',
    });

    const noDriverNotif = await createNotification({
      recipient: passenger._id,
      title: 'No Drivers Available',
      message: 'All nearby drivers in Udaipur are busy.',
      type: 'no_driver_available',
      rideId: ride3._id,
    });
    assert(noDriverNotif.type === 'no_driver_available', 'Passenger received no_driver_available notification');

    const cancelNotif = await createNotification({
      recipient: driverUser._id,
      title: 'Ride Cancelled',
      message: 'The passenger cancelled the trip request.',
      type: 'ride_cancelled',
      rideId: ride3._id,
    });
    assert(cancelNotif.type === 'ride_cancelled', 'Driver received ride_cancelled notification');

    // Verify Notification History Isolation
    const passengerHistory = await getUserNotifications(passenger._id);
    const driverHistory = await getUserNotifications(driverUser._id);

    assert(
      passengerHistory.notifications.every((n) => n.recipient.toString() === passenger._id.toString()),
      'Passenger history contains ONLY passenger notifications'
    );
    assert(
      driverHistory.notifications.every((n) => n.recipient.toString() === driverUser._id.toString()),
      'Driver history contains ONLY driver notifications'
    );
  } catch (err) {
    console.error('Unhandled Test Exception:', err);
    failed++;
  } finally {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  }

  console.log('\n======================================================');
  console.log(`📊 RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runPhase7And8Tests();
