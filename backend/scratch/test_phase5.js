import mongoose from 'mongoose';
import connectDatabase from '../src/config/database.js';
import User from '../src/models/User.js';
import Driver from '../src/models/Driver.js';
import Ride from '../src/models/Ride.js';
import { createRide, acceptRide, updateRideStatus, getMyRides, getRideById } from '../src/controllers/ride.controller.js';
import { getDriverStatus, updateDriverStatus, getPendingRequests, getDriverEarnings } from '../src/controllers/driver.controller.js';

// Helper mock response creator
const createMockRes = () => {
  const res = {};
  res.statusCode = 200;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.data = data;
    return res;
  };
  return res;
};

async function runPhase5Tests() {
  console.log('🧪 Starting Phase 5 Driver App & Ride Acceptance Integration Tests...\n');

  // 1. Connect DB
  await connectDatabase();

  // Clear existing test collections
  await User.deleteMany({});
  await Driver.deleteMany({});
  await Ride.deleteMany({});

  // 2. Setup Test Accounts
  console.log('1️⃣ Creating Test Users: 1 Passenger & 2 Drivers...');
  
  const passenger = await User.create({
    name: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '9876543210',
    passwordHash: 'hashedpass123',
    role: 'passenger',
  });

  const driverUser1 = await User.create({
    name: 'Anjali Verma',
    email: 'anjali@example.com',
    phone: '9876543211',
    passwordHash: 'hashedpass123',
    role: 'driver',
  });

  const driverDoc1 = await Driver.create({
    user: driverUser1._id,
    licenseNumber: 'RJ-27-2024-001',
    licenseExpiry: new Date(Date.now() + 365*24*60*60*1000),
    isAvailable: false,
    verificationStatus: 'verified',
  });

  const driverUser2 = await User.create({
    name: 'Sunita Rajput',
    email: 'sunita@example.com',
    phone: '9876543212',
    passwordHash: 'hashedpass123',
    role: 'driver',
  });

  const driverDoc2 = await Driver.create({
    user: driverUser2._id,
    licenseNumber: 'RJ-27-2024-002',
    licenseExpiry: new Date(Date.now() + 365*24*60*60*1000),
    isAvailable: false,
    verificationStatus: 'verified',
  });

  console.log('   ✅ Passenger and Drivers created.');

  // 3. Test Offline Driver
  console.log('\n2️⃣ Testing Offline Driver Restrictions...');
  {
    const req = { user: driverUser1 };
    const res = createMockRes();
    await getPendingRequests(req, res);
    console.log('   Pending requests for offline driver:', res.data.data.length, '(Expected 0)');
    if (res.data.isOnline !== false) throw new Error('Offline driver test failed');
  }

  // 4. Set Driver 1 Online
  console.log('\n3️⃣ Driver 1 Toggles Online...');
  {
    const req = { user: driverUser1, body: { isOnline: true } };
    const res = createMockRes();
    await updateDriverStatus(req, res);
    if (!res.data.data.isOnline) throw new Error('Failed to set driver online');
    console.log('   ✅ Driver 1 is now ONLINE.');
  }

  // 5. Passenger Creates Ride
  console.log('\n4️⃣ Passenger Creates Ride Request...');
  let rideId = null;
  {
    const req = {
      user: passenger,
      body: {
        pickupLocation: { address: 'Sukhadia Circle, Udaipur' },
        dropoffLocation: { address: 'Celebration Mall, Bhuwana, Udaipur' },
        vehicleType: 'auto',
      },
    };
    const res = createMockRes();
    await createRide(req, res);
    if (res.statusCode !== 201) throw new Error(`Create ride failed with code ${res.statusCode}`);
    rideId = res.data.data._id.toString();
    console.log(`   ✅ Ride requested! ID: ${rideId}, Status: ${res.data.data.status}, Fare: ₹${res.data.data.fare}`);
  }

  // 6. Driver 1 Fetches Pending Requests
  console.log('\n5️⃣ Driver 1 Fetches Eligible Pending Requests...');
  {
    const req = { user: driverUser1 };
    const res = createMockRes();
    await getPendingRequests(req, res);
    if (res.data.data.length !== 1) throw new Error(`Expected 1 pending request, got ${res.data.data.length}`);
    console.log(`   ✅ Driver 1 sees 1 pending ride request from ${res.data.data[0].passenger.name}`);
  }

  // 7. Driver 1 Accepts Ride
  console.log('\n6️⃣ Driver 1 Accepts Ride...');
  {
    const req = { user: driverUser1, params: { id: rideId } };
    const res = createMockRes();
    await acceptRide(req, res);
    if (res.statusCode !== 200) throw new Error(`Accept ride failed: ${res.data.message}`);
    console.log(`   ✅ Ride Accepted! Status: ${res.data.data.status}, Driver: ${res.data.data.driver.name}`);
  }

  // 8. RACE CONDITION TEST: Driver 2 Tries to Accept the Same Ride
  console.log('\n7️⃣ RACE CONDITION TEST: Driver 2 Tries to Accept the Already Accepted Ride...');
  {
    // Driver 2 goes online
    await Driver.updateOne({ user: driverUser2._id }, { isAvailable: true });

    const req = { user: driverUser2, params: { id: rideId } };
    const res = createMockRes();
    await acceptRide(req, res);
    console.log(`   Response Status Code: ${res.statusCode} (Expected 409)`);
    console.log(`   Response Message: "${res.data.message}"`);
    if (res.statusCode !== 409) throw new Error(`Race condition test failed! Expected 409 conflict, got ${res.statusCode}`);
    console.log('   ✅ Race condition / double acceptance PREVENTED server-side!');
  }

  // 9. UNAUTHORIZED ACCESS TEST: Driver 2 Tries to Update Status of Driver 1\'s Ride
  console.log('\n8️⃣ UNAUTHORIZED ACCESS TEST: Driver 2 Tries to Update Driver 1\'s Ride Status...');
  {
    const req = { user: driverUser2, params: { id: rideId }, body: { status: 'arrived' } };
    const res = createMockRes();
    await updateRideStatus(req, res);
    console.log(`   Response Status Code: ${res.statusCode} (Expected 403)`);
    console.log(`   Response Message: "${res.data.message}"`);
    if (res.statusCode !== 403) throw new Error(`Unauthorized status update failed! Expected 403, got ${res.statusCode}`);
    console.log('   ✅ Unauthorized driver action BLOCKED!');
  }

  // 10. INVALID STATUS TRANSITION TEST: Driver 1 Tries Invalid Transition ('accepted' -> 'completed')
  console.log('\n9️⃣ INVALID STATUS TRANSITION TEST: Driver 1 Tries to Skip Steps (\'accepted\' -> \'completed\')...');
  {
    const req = { user: driverUser1, params: { id: rideId }, body: { status: 'completed' } };
    const res = createMockRes();
    await updateRideStatus(req, res);
    console.log(`   Response Status Code: ${res.statusCode} (Expected 400)`);
    console.log(`   Response Message: "${res.data.message}"`);
    if (res.statusCode !== 400) throw new Error(`Invalid status transition failed! Expected 400, got ${res.statusCode}`);
    console.log('   ✅ Invalid status transition REJECTED server-side!');
  }

  // 11. VALID DRIVER WORKFLOW PROGRESSION
  console.log('\n🔟 Valid Driver Ride Workflow Progression...');
  // Step A: Driver 1 Arrives
  {
    const req = { user: driverUser1, params: { id: rideId }, body: { status: 'arrived' } };
    const res = createMockRes();
    await updateRideStatus(req, res);
    if (res.statusCode !== 200) throw new Error(`Arrived transition failed: ${res.data.message}`);
    console.log(`   a) Status updated: ${res.data.data.status}`);
  }

  // Step B: Start Ride
  {
    const req = { user: driverUser1, params: { id: rideId }, body: { status: 'in_progress' } };
    const res = createMockRes();
    await updateRideStatus(req, res);
    if (res.statusCode !== 200) throw new Error(`Start ride transition failed: ${res.data.message}`);
    console.log(`   b) Status updated: ${res.data.data.status}`);
  }

  // Step C: Complete Ride
  {
    const req = { user: driverUser1, params: { id: rideId }, body: { status: 'completed' } };
    const res = createMockRes();
    await updateRideStatus(req, res);
    if (res.statusCode !== 200) throw new Error(`Complete ride transition failed: ${res.data.message}`);
    console.log(`   c) Status updated: ${res.data.data.status}`);
  }

  // 12. Check Earnings & Ride History
  console.log('\n1️⃣1️⃣ Checking Driver 1 Earnings & History in MongoDB...');
  {
    const req = { user: driverUser1 };
    const res = createMockRes();
    await getDriverEarnings(req, res);
    console.log(`   Total Completed Rides: ${res.data.data.completedRidesCount}, Today Earnings: ₹${res.data.data.todayEarnings}`);
    if (res.data.data.completedRidesCount !== 1) throw new Error('Earnings test failed');
    console.log('   ✅ Earnings and trip stats correctly updated!');
  }

  // 13. CANCELLED RIDE TEST
  console.log('\n1️⃣2️⃣ CANCELLED RIDE TEST: Passenger creates ride and cancels it; Driver tries to accept...');
  {
    // Passenger creates second ride
    const req1 = {
      user: passenger,
      body: {
        pickupLocation: { address: 'Delhi Gate, Udaipur' },
        dropoffLocation: { address: 'Railway Station, Udaipur' },
        vehicleType: 'auto',
      },
    };
    const res1 = createMockRes();
    await createRide(req1, res1);
    const rideId2 = res1.data.data._id.toString();

    // Cancel ride as passenger
    const { cancelRide } = await import('../src/controllers/ride.controller.js');
    const reqCancel = { user: passenger, params: { id: rideId2 }, body: { reason: 'Plan changed' } };
    const resCancel = createMockRes();
    await cancelRide(reqCancel, resCancel);

    // Driver 2 tries to accept cancelled ride
    const reqAccept = { user: driverUser2, params: { id: rideId2 } };
    const resAccept = createMockRes();
    await acceptRide(reqAccept, resAccept);
    console.log(`   Response Status Code: ${resAccept.statusCode} (Expected 400)`);
    console.log(`   Response Message: "${resAccept.data.message}"`);
    if (resAccept.statusCode !== 400) throw new Error('Cancelled ride acceptance test failed');
    console.log('   ✅ Cancelled ride acceptance BLOCKED!');
  }

  console.log('\n🎉 ALL PHASE 5 BACKEND & DATABASE INTEGRATION TESTS PASSED PERFECTLY!\n');
  await mongoose.disconnect();
  process.exit(0);
}

runPhase5Tests().catch((err) => {
  console.error('\n❌ Test Error:', err);
  process.exit(1);
});
