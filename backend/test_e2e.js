import http from 'http';

const BASE_URL = 'http://localhost:5000/api';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(url, reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🚀 STARTING COMPREHENSIVE SANGHINI RIDE INTEGRATION TEST\n');
  const results = [];

  const assert = (name, condition, extra = '') => {
    if (condition) {
      console.log(`✅ [PASS] ${name} ${extra}`);
      results.push({ name, pass: true });
    } else {
      console.error(`❌ [FAIL] ${name} ${extra}`);
      results.push({ name, pass: false, error: extra });
    }
  };

  try {
    // 1. Health Check
    const health = await request('/health');
    assert('Health Check Endpoint', health.status === 200 && health.data.success, JSON.stringify(health.data.models));

    // 2. Admin Login
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@sanghini.com', password: 'Admin@12345' }
    });
    assert('Admin Login', adminLogin.status === 200 && (adminLogin.data.token || adminLogin.data.data?.token), 'Admin authenticated');
    const adminToken = adminLogin.data.token || adminLogin.data.data?.token;

    // 3. Register Passenger via OTP
    const rand = Math.floor(1000 + Math.random() * 9000);
    const passEmail = `passenger_${rand}@test.com`;
    const passPhone = `+9198${rand}1234`;

    const passOtpReq = await request('/auth/send-otp', {
      method: 'POST',
      body: { email: passEmail, phone: passPhone, name: 'Priya Sharma' }
    });
    assert('Passenger OTP Sent', passOtpReq.status === 200);
    const passOtp = passOtpReq.data.devOtp || '123456';

    const passReg = await request('/auth/verify-otp-register', {
      method: 'POST',
      body: {
        name: 'Priya Sharma',
        email: passEmail,
        phone: passPhone,
        password: 'Password123!',
        role: 'passenger',
        gender: 'female',
        otp: passOtp
      }
    });
    assert('Passenger Verified & Registered', passReg.status === 201 || passReg.status === 200, passReg.data.message);
    const passToken = passReg.data.token || passReg.data.data?.token;
    const passUser = passReg.data.user || passReg.data.data?.user;

    // 4. Passenger Adds Trusted Contact
    const addContact = await request('/safety/trusted-contacts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${passToken}` },
      body: {
        name: 'Mother - Sunita Sharma',
        phone: '+919876543210',
        relationship: 'Mother'
      }
    });
    assert('Trusted Contact Creation', addContact.status === 201 || addContact.status === 200);

    const getContacts = await request('/safety/trusted-contacts', {
      headers: { Authorization: `Bearer ${passToken}` }
    });
    assert('Get Trusted Contacts', getContacts.data.data?.length > 0);

    // 5. Register Driver via OTP
    const driverEmail = `driver_${rand}@test.com`;
    const driverPhone = `+9197${rand}5678`;

    const driverOtpReq = await request('/auth/send-otp', {
      method: 'POST',
      body: { email: driverEmail, phone: driverPhone, name: 'Anita Rathore' }
    });
    assert('Driver OTP Sent', driverOtpReq.status === 200);
    const driverOtp = driverOtpReq.data.devOtp || '123456';

    const driverReg = await request('/auth/verify-otp-register', {
      method: 'POST',
      body: {
        name: 'Anita Rathore',
        email: driverEmail,
        phone: driverPhone,
        password: 'Password123!',
        role: 'driver',
        gender: 'female',
        otp: driverOtp
      }
    });
    assert('Driver Verified & Registered', driverReg.status === 201 || driverReg.status === 200);
    const driverToken = driverReg.data.token || driverReg.data.data?.token;
    const driverUser = driverReg.data.user || driverReg.data.data?.user;

    // Driver sets up vehicle & verification details
    const driverVerifyReq = await request('/driver/verification', {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: {
        licenseNumber: `RJ27-${rand}-DL`,
        licenseExpiry: '2028-12-31',
        vehicleType: 'auto',
        plateNumber: `RJ 27 TA ${rand}`,
        model: 'Bajaj RE EV'
      }
    });
    assert('Driver Verification Submission', driverVerifyReq.status === 200 || driverVerifyReq.status === 201);

    // 6. Admin Approves Driver Verification
    let driverProfileId = driverVerifyReq.data.data?.driver?._id || driverVerifyReq.data.data?._id;
    if (!driverProfileId) {
      const adminDrivers = await request('/admin/drivers', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const d = adminDrivers.data.data?.drivers?.find(dr =>
        dr.user?._id?.toString() === driverUser?._id?.toString() ||
        dr.user?.email === driverEmail
      );
      driverProfileId = d?._id;
    }

    const adminVerify = await request(`/admin/drivers/${driverProfileId}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'verified', notes: 'Credentials and RC verified by Udaipur Transport Desk' }
    });
    assert('Admin Approves Driver Verification', adminVerify.status === 200, adminVerify.data.message);

    // 7. Driver Goes Online
    const driverOnline = await request('/driver/status', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: { isAvailable: true, coordinates: [73.6826, 24.5854] }
    });
    assert('Driver Goes Online', driverOnline.status === 200);

    // 8. Passenger Books Ride
    const bookRide = await request('/rides', {
      method: 'POST',
      headers: { Authorization: `Bearer ${passToken}` },
      body: {
        pickupLocation: {
          address: 'Sukhadia Circle, Panchwati, Udaipur',
          coordinates: [73.6826, 24.5854]
        },
        dropoffLocation: {
          address: 'Celebration Mall, Bhuwana, Udaipur',
          coordinates: [73.7125, 24.6150]
        },
        paymentMethod: 'cash'
      }
    });
    assert('Passenger Books Ride', bookRide.status === 201 || bookRide.status === 200);
    const ride = bookRide.data.data;
    const rideId = ride._id;

    // 9. Driver Accepts Ride
    const acceptRide = await request(`/rides/${rideId}/accept`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driverToken}` }
    });
    assert('Driver Accepts Ride', acceptRide.status === 200);

    // 10. Driver Updates Status (arrived) and starts ride (verifies OTP)
    const arriveStatus = await request(`/rides/${rideId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: { status: 'arrived' }
    });
    assert('Driver Arrived at Pickup', arriveStatus.status === 200);

    // Start Ride with passenger OTP
    const rideOtp = acceptRide.data.data?.otp || ride.otp;
    const startRide = await request(`/rides/${rideId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: { status: 'in_progress', enteredOtp: rideOtp }
    });
    assert('Driver Starts Ride with OTP', startRide.status === 200);

    // 11. Live Ride Sharing (generates public token)
    const shareRide = await request(`/rides/${rideId}/share`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${passToken}` }
    });
    assert('Passenger Generates Share Token', shareRide.status === 200);
    const shareToken = shareRide.data.data.shareToken;

    // Public access to shared ride (unauthenticated)
    const publicShared = await request(`/rides/shared/${shareToken}`);
    assert('Public Shared Ride Tracking', publicShared.status === 200 && publicShared.data.data?.rideId === rideId);

    // 12. Passenger Triggers SOS
    const triggerSos = await request('/safety/sos', {
      method: 'POST',
      headers: { Authorization: `Bearer ${passToken}` },
      body: {
        rideId,
        location: { lat: 24.5912, lng: 73.6934 },
        alertType: 'manual_sos'
      }
    });
    assert('Passenger Triggers SOS', triggerSos.status === 201 || triggerSos.status === 200);
    const incidentId = triggerSos.data.data?._id;

    // Admin Views Incidents & Resolves
    const adminIncidents = await request('/admin/safety/incidents', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert('Admin Receives SOS Incident', adminIncidents.data.data?.some(i => i._id === incidentId));

    const resolveIncident = await request(`/admin/safety/incidents/${incidentId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'resolved', notes: 'Passenger confirmed safe' }
    });
    assert('Admin Resolves Safety Incident', resolveIncident.status === 200);

    // 13. Driver Completes Ride
    const completeRide = await request(`/rides/${rideId}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: { distanceKm: 4.8, durationMins: 14 }
    });
    assert('Driver Completes Ride (Authoritative Fare)', completeRide.status === 200 && completeRide.data.data?.status === 'completed');

    // 14. Passenger Submits 5-Star Rating & Review
    const submitRating = await request(`/rides/${rideId}/rate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${passToken}` },
      body: { rating: 5, review: 'Very polite and smooth ride across Udaipur!' }
    });
    assert('Passenger Submits Rating', submitRating.status === 201 || submitRating.status === 200);

    // 15. Duplicate Rating Prevention Test
    const dupRating = await request(`/rides/${rideId}/rate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${passToken}` },
      body: { rating: 4, review: 'Duplicate attempt' }
    });
    assert('Prevent Duplicate Rating', dupRating.status === 400 || dupRating.status === 403);

    // 16. Admin Analytics Test
    const analytics = await request('/admin/analytics', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert('Admin Aggregations & Analytics', analytics.status === 200 && analytics.data.data?.rides?.completed >= 1);

    // 17. Admin Payment Audit Test (Secrets Excluded)
    const adminPayments = await request('/admin/payments', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert('Admin Payment Auditing', adminPayments.status === 200);
    const anyExposedSecret = adminPayments.data.data?.payments?.some(p => p.razorpaySignature);
    assert('Payment Secrets Never Exposed', !anyExposedSecret);

  } catch (err) {
    console.error('Fatal test error:', err);
    assert('Test Suite Execution', false, err.message);
  }

  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log('\n=======================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('=======================================\n');
}

runTests();
