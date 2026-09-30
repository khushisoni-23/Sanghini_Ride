import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import env from './src/config/env.js';
import User from './src/models/User.js';
import Driver from './src/models/Driver.js';
import Ride from './src/models/Ride.js';
import { calculateRideMetrics, calculateHaversineDistance } from './src/utils/rideCalculator.js';
import { fetchDrivingRoute, calculateLiveETA } from './src/services/map.service.js';
import { findEligibleDrivers, handleDriverReject } from './src/services/matching.service.js';

let mongoServer;

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 SANGHINI RIDE — PHASE 6 & 7 INTEGRATION TEST SUITE');
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

  // 1. Setup in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  console.log('Connected to test database.\n');

  try {
    // ─── Test 1: User & Driver Setup ──────────────────────────────────
    console.log('--- Test Suite 1: Driver Availability & Proximity ---');
    const passenger = await User.create({
      name: 'Ananya Sharma',
      email: 'ananya@example.com',
      phone: '+91 98290 11111',
      passwordHash: 'password123',
      role: 'passenger',
      gender: 'female',
      isActive: true,
    });

    const driverUser1 = await User.create({
      name: 'Pooja Meena',
      email: 'pooja@example.com',
      phone: '+91 98290 22222',
      passwordHash: 'password123',
      role: 'driver',
      gender: 'female',
      isActive: true,
    });

    const driverUser2 = await User.create({
      name: 'Rekha Rajput',
      email: 'rekha@example.com',
      phone: '+91 98290 33333',
      passwordHash: 'password123',
      role: 'driver',
      gender: 'female',
      isActive: true,
    });

    // Driver 1: Near Sukhadia Circle (24.6008, 73.6914)
    const driver1 = await Driver.create({
      user: driverUser1._id,
      licenseNumber: 'RJ27-2023-001',
      licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isAvailable: true,
      verificationStatus: 'verified',
      currentLocation: {
        type: 'Point',
        coordinates: [73.6914, 24.6008], // Sukhadia Circle
      },
      rating: 4.9,
    });

    // Driver 2: Near City Palace (24.5764, 73.6835)
    const driver2 = await Driver.create({
      user: driverUser2._id,
      licenseNumber: 'RJ27-2023-002',
      licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isAvailable: true,
      verificationStatus: 'verified',
      currentLocation: {
        type: 'Point',
        coordinates: [73.6835, 24.5764], // City Palace
      },
      rating: 4.8,
    });

    assert(driver1 && driver2, 'Drivers created successfully with valid verified status');

    // Test Proximity Driver Ranking
    const pickupCoords = [73.6914, 24.6008]; // Sukhadia Circle
    const ranked = await findEligibleDrivers(pickupCoords, 25, []);
    assert(ranked.length === 2, 'Found 2 online eligible drivers in Udaipur');
    assert(
      ranked[0].driver._id.toString() === driver1._id.toString(),
      `Driver 1 ranked first due to proximity (distance: ${ranked[0].distanceKm.toFixed(2)} km vs ${ranked[1].distanceKm.toFixed(2)} km)`
    );

    // ─── Test 2: Map & Routing Service ────────────────────────────────
    console.log('\n--- Test Suite 2: Map Routing & Real ETA Calculations ---');
    const dropoffCoords = [73.6763, 24.5960]; // Fateh Sagar Lake
    const routeData = await fetchDrivingRoute(pickupCoords, dropoffCoords);
    assert(routeData.geometry && routeData.geometry.length > 0, `Route geometry generated with ${routeData.geometry.length} waypoints`);
    assert(routeData.distanceKm > 0 && routeData.durationMins > 0, `Route metrics valid: ${routeData.distanceKm} km, ~${routeData.durationMins} mins`);

    const etaTest = calculateLiveETA(pickupCoords, dropoffCoords);
    assert(etaTest.remainingDistanceKm > 0 && etaTest.etaMinutes > 0, `Live ETA calculation returned ${etaTest.etaMinutes} mins`);

    // ─── Test 3: Ride Creation & State Flow ────────────────────────────
    console.log('\n--- Test Suite 3: Ride Lifecycle (Request → Accept → Progress → Complete) ---');
    const ride = await Ride.create({
      passenger: passenger._id,
      pickupLocation: {
        address: 'Sukhadia Circle, Panchwati, Udaipur',
        coordinates: { type: 'Point', coordinates: pickupCoords },
      },
      dropoffLocation: {
        address: 'Fateh Sagar Lake Paal, Udaipur',
        coordinates: { type: 'Point', coordinates: dropoffCoords },
      },
      routeGeometry: routeData.geometry,
      estimatedDistance: routeData.distanceKm,
      estimatedDuration: routeData.durationMins,
      fare: 75,
      status: 'finding_driver',
      otp: '4821',
      requestedAt: new Date(),
    });

    assert(ride.status === 'finding_driver', 'Ride created with finding_driver status');

    // ─── Test 4: Atomic Driver Assignment & Double Acceptance Prevention ──
    console.log('\n--- Test Suite 4: Atomic Assignment & Concurrency Protection ---');
    // Driver 1 accepts atomically
    const acceptedRide = await Ride.findOneAndUpdate(
      {
        _id: ride._id,
        status: { $in: ['requested', 'finding_driver'] },
        $or: [{ driver: { $exists: false } }, { driver: null }],
      },
      {
        $set: {
          status: 'accepted',
          driver: driver1._id,
          acceptedAt: new Date(),
          driverLocation: {
            type: 'Point',
            coordinates: driver1.currentLocation.coordinates,
            updatedAt: new Date(),
          },
        },
      },
      { returnDocument: 'after' }
    );

    assert(acceptedRide && acceptedRide.status === 'accepted', 'Driver 1 successfully assigned to ride');
    assert(acceptedRide.driver.toString() === driver1._id.toString(), 'Ride document authoritative driver ID matches Driver 1');

    // Driver 2 attempts to accept same ride (Concurrency test)
    const duplicateAccept = await Ride.findOneAndUpdate(
      {
        _id: ride._id,
        status: { $in: ['requested', 'finding_driver'] },
        $or: [{ driver: { $exists: false } }, { driver: null }],
      },
      {
        $set: {
          status: 'accepted',
          driver: driver2._id,
          acceptedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    assert(duplicateAccept === null, 'Atomic constraint prevented Driver 2 from double-accepting already assigned ride');

    // ─── Test 5: Live Location Updates & ETA Tracking ──────────────────
    console.log('\n--- Test Suite 5: Driver Live Location & Heading Updates ---');
    const newDriverPos = [73.6880, 24.5980];
    driver1.currentLocation.coordinates = newDriverPos;
    driver1.heading = 45;
    await driver1.save();

    acceptedRide.driverLocation = {
      type: 'Point',
      coordinates: newDriverPos,
      heading: 45,
      updatedAt: new Date(),
    };
    const liveEtaUpdate = calculateLiveETA(newDriverPos, dropoffCoords);
    acceptedRide.currentDistanceKm = liveEtaUpdate.remainingDistanceKm;
    acceptedRide.currentEtaMinutes = liveEtaUpdate.etaMinutes;
    await acceptedRide.save();

    assert(acceptedRide.driverLocation.coordinates[0] === 73.6880, 'Driver location coordinates updated to [73.6880, 24.5980]');
    assert(acceptedRide.driverLocation.heading === 45, 'Driver heading updated to 45 deg');

    // ─── Test 6: Status Transitions & Validation ───────────────────────
    console.log('\n--- Test Suite 6: State Machine Transitions ---');
    // driver_arriving -> arrived
    acceptedRide.status = 'arrived';
    acceptedRide.arrivedAt = new Date();
    await acceptedRide.save();
    assert(acceptedRide.status === 'arrived', 'Status transitioned to arrived');

    // arrived -> in_progress (Trip Started)
    acceptedRide.status = 'in_progress';
    acceptedRide.startedAt = new Date();
    await acceptedRide.save();
    assert(acceptedRide.status === 'in_progress', 'Status transitioned to in_progress');

    // in_progress -> completed
    acceptedRide.status = 'completed';
    acceptedRide.completedAt = new Date();
    await acceptedRide.save();
    driver1.totalRides += 1;
    await driver1.save();

    assert(acceptedRide.status === 'completed', 'Status transitioned to completed');
    assert(driver1.totalRides === 1, 'Driver total rides incremented to 1');

    // ─── Test 7: Driver Rejection & Redispatch ─────────────────────────
    console.log('\n--- Test Suite 7: Driver Rejection & Redispatch ---');
    const ride2 = await Ride.create({
      passenger: passenger._id,
      pickupLocation: {
        address: 'City Palace, Old City, Udaipur',
        coordinates: { type: 'Point', coordinates: [73.6835, 24.5764] },
      },
      dropoffLocation: {
        address: 'Celebration Mall, Bhuwana, Udaipur',
        coordinates: { type: 'Point', coordinates: [73.7142, 24.6180] },
      },
      fare: 120,
      status: 'finding_driver',
    });

    await handleDriverReject(ride2._id, driver1._id);
    const updatedRide2 = await Ride.findById(ride2._id);
    assert(
      updatedRide2.rejectedDrivers.some((d) => d.toString() === driver1._id.toString()),
      'Driver 1 recorded in rejectedDrivers list'
    );

    const remainingEligible = await findEligibleDrivers([73.6835, 24.5764], 25, updatedRide2.rejectedDrivers);
    assert(
      remainingEligible.every((r) => r.driver._id.toString() !== driver1._id.toString()),
      'Driver 1 excluded from subsequent matching query'
    );
    assert(
      remainingEligible.length === 1 && remainingEligible[0].driver._id.toString() === driver2._id.toString(),
      'Driver 2 correctly matched as the next available candidate'
    );

    // ─── Test 8: Offline Driver Protection ─────────────────────────────
    console.log('\n--- Test Suite 8: Offline Driver Protection ---');
    driver2.isAvailable = false;
    await driver2.save();

    const offlineEligible = await findEligibleDrivers([73.6835, 24.5764], 25, []);
    assert(
      offlineEligible.every((r) => r.driver._id.toString() !== driver2._id.toString()),
      'Offline Driver 2 excluded from eligible driver search'
    );

    // ─── Test 9: Cancellation & Cleanup ────────────────────────────────
    console.log('\n--- Test Suite 9: Ride Cancellation Handling ---');
    ride2.status = 'cancelled';
    ride2.cancelledAt = new Date();
    ride2.cancelledBy = 'passenger';
    ride2.cancellationReason = 'Changed travel plans';
    await ride2.save();

    assert(ride2.status === 'cancelled', 'Ride 2 successfully cancelled');
    assert(ride2.cancelledBy === 'passenger', 'Cancellation reason and actor recorded');

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

runTests();
