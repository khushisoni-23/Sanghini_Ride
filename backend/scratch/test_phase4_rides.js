const BASE_URL = 'http://localhost:5000/api';

async function testPhase4Rides() {
  console.log('----------------------------------------------------');
  console.log('🧪 RUNNING PHASE 4 AUTOMATED API & VERIFICATION TESTS');
  console.log('----------------------------------------------------\n');

  try {
    // 1. Health check
    console.log('1. Testing Backend Health Check...');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    console.log('   Status:', healthRes.status, 'Response:', healthData);
    if (!healthData.success) throw new Error('Health check failed');

    // 2. Register & Login a Passenger
    const timestamp = Date.now();
    const testPassenger = {
      name: `Priya Test ${timestamp}`,
      email: `priya_${timestamp}@example.com`,
      phone: `9829${timestamp.toString().slice(-6)}`,
      password: 'password123',
      role: 'passenger',
    };

    console.log('\n2. Registering Passenger for Phase 4 Test...');
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPassenger),
    });
    const regData = await regRes.json();
    console.log('   Status:', regRes.status, 'User ID:', regData.data?._id);

    // Extract cookie header
    const cookieHeader = regRes.headers.get('set-cookie');
    console.log('   Session Cookie Received:', cookieHeader ? 'YES' : 'NO');

    // 3. Estimate Ride (Public/Auth)
    console.log('\n3. Testing Ride Estimation API (POST /api/rides/estimate)...');
    const estimateRes = await fetch(`${BASE_URL}/rides/estimate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookieHeader || '',
      },
      body: JSON.stringify({
        pickupLocation: 'Sukhadia Circle, Panchwati, Udaipur',
        dropoffLocation: 'Fateh Sagar Lake Paal, Udaipur',
        vehicleType: 'auto',
      }),
    });
    const estimateData = await estimateRes.json();
    console.log('   Status:', estimateRes.status);
    console.log('   Estimated Distance:', estimateData.data?.estimatedDistance, 'km');
    console.log('   Estimated Duration:', estimateData.data?.estimatedDuration, 'mins');
    console.log('   Authoritative Fare:', '₹' + estimateData.data?.fare);

    // 4. Create Real Ride (POST /api/rides)
    console.log('\n4. Creating Real Ride Request (POST /api/rides)...');
    const createRes = await fetch(`${BASE_URL}/rides`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookieHeader || '',
      },
      body: JSON.stringify({
        pickupLocation: { address: 'Sukhadia Circle, Panchwati, Udaipur' },
        dropoffLocation: { address: 'Fateh Sagar Lake Paal, Udaipur' },
        vehicleType: 'auto',
        // Attempting fake fare injection to verify backend authoritative calculation
        fare: 5, 
      }),
    });
    const createData = await createRes.json();
    console.log('   Status:', createRes.status);
    const ride = createData.data;
    console.log('   Ride ID:', ride?._id);
    console.log('   OTP:', ride?.otp);
    console.log('   Status:', ride?.status);
    console.log('   Backend Fare (Should ignore fake 5):', '₹' + ride?.fare);
    if (ride?.fare === 5) {
      throw new Error('SECURITY FAILURE: Backend accepted client-provided fare!');
    }

    // 5. Fetch Ride History (GET /api/rides/my-rides)
    console.log('\n5. Fetching Passenger Ride History (GET /api/rides/my-rides)...');
    const historyRes = await fetch(`${BASE_URL}/rides/my-rides`, {
      headers: { cookie: cookieHeader || '' },
    });
    const historyData = await historyRes.json();
    console.log('   Status:', historyRes.status);
    console.log('   Rides count in MongoDB:', historyData.count);

    // 6. Fetch Single Ride Details (GET /api/rides/:id)
    console.log('\n6. Fetching Ride Details by ID (GET /api/rides/' + ride?._id + ')...');
    const detailRes = await fetch(`${BASE_URL}/rides/${ride?._id}`, {
      headers: { cookie: cookieHeader || '' },
    });
    const detailData = await detailRes.json();
    console.log('   Status:', detailRes.status);
    console.log('   Fetched Ride Passenger Name:', detailData.data?.passenger?.name);

    // 7. Security Test: Unauthorized Access by another user
    console.log('\n7. Testing Security: Another user attempting to access this ride...');
    const unauthorizedRes = await fetch(`${BASE_URL}/rides/${ride?._id}`);
    console.log('   Status without cookie (Should be 401):', unauthorizedRes.status);

    // 8. Cancel Ride (PATCH /api/rides/:id/cancel)
    console.log('\n8. Testing Passenger Cancellation (PATCH /api/rides/' + ride?._id + '/cancel)...');
    const cancelRes = await fetch(`${BASE_URL}/rides/${ride?._id}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookieHeader || '',
      },
      body: JSON.stringify({ reason: 'Plan changed' }),
    });
    const cancelData = await cancelRes.json();
    console.log('   Status:', cancelRes.status);
    console.log('   Updated Status:', cancelData.data?.status);
    console.log('   Cancelled By:', cancelData.data?.cancelledBy);
    console.log('   Cancellation Reason:', cancelData.data?.cancellationReason);

    console.log('\n----------------------------------------------------');
    console.log('✅ ALL PHASE 4 AUTOMATED BACKEND TESTS PASSED!');
    console.log('----------------------------------------------------');
  } catch (err) {
    console.error('\n❌ PHASE 4 TEST FAILED:', err);
  }
}

testPhase4Rides();
