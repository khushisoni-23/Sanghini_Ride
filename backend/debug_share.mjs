import http from 'http';

const BASE_URL = 'http://localhost:5000/api';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const reqOptions = {
      method: options.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    };
    const req = http.request(url, reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: body ? JSON.parse(body) : {} }); }
        catch (e) { resolve({ status: res.statusCode, raw: body }); }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function run() {
  const rand = Math.floor(1000 + Math.random() * 9000);
  const passEmail = `passenger_dbg_${rand}@test.com`;
  const passPhone = `+9198${rand}1234`;
  const driverEmail = `driver_dbg_${rand}@test.com`;
  const driverPhone = `+9197${rand}5678`;

  // Admin login
  const adminLogin = await request('/auth/login', { method: 'POST', body: { email: 'admin@sanghini.com', password: 'Admin@12345' }});
  const adminToken = adminLogin.data.token || adminLogin.data.data?.token;
  console.log('Admin login:', adminLogin.status);

  // Passenger
  const passOtpReq = await request('/auth/send-otp', { method: 'POST', body: { email: passEmail, phone: passPhone, name: 'Debug Passenger' }});
  const passOtp = passOtpReq.data.devOtp;
  const passReg = await request('/auth/verify-otp-register', { method: 'POST', body: { name: 'Debug Passenger', email: passEmail, phone: passPhone, password: 'Password123!', role: 'passenger', gender: 'female', otp: passOtp }});
  const passToken = passReg.data.token || passReg.data.data?.token;
  console.log('Passenger reg:', passReg.status);

  // Driver
  const driverOtpReq = await request('/auth/send-otp', { method: 'POST', body: { email: driverEmail, phone: driverPhone, name: 'Debug Driver' }});
  const driverOtp = driverOtpReq.data.devOtp;
  const driverReg = await request('/auth/verify-otp-register', { method: 'POST', body: { name: 'Debug Driver', email: driverEmail, phone: driverPhone, password: 'Password123!', role: 'driver', gender: 'female', otp: driverOtp }});
  const driverToken = driverReg.data.token || driverReg.data.data?.token;
  const driverUser = driverReg.data.user || driverReg.data.data?.user;
  console.log('Driver reg:', driverReg.status);

  // Verification
  const verifyReq = await request('/driver/verification', { method: 'POST', headers: { Authorization: `Bearer ${driverToken}` }, body: { licenseNumber: `RJ27-${rand}-DL`, licenseExpiry: '2028-12-31', vehicleType: 'auto', plateNumber: `RJ 27 TA ${rand}`, model: 'Bajaj RE EV' }});
  console.log('Driver verify submit:', verifyReq.status, JSON.stringify(verifyReq.data));

  const driverProfileId = verifyReq.data.data?.driver?._id;
  const adminVerify = await request(`/admin/drivers/${driverProfileId}/verify`, { method: 'PATCH', headers: { Authorization: `Bearer ${adminToken}` }, body: { status: 'verified' }});
  console.log('Admin verify:', adminVerify.status, adminVerify.data.message);

  // Driver online
  const onlineReq = await request('/driver/status', { method: 'PATCH', headers: { Authorization: `Bearer ${driverToken}` }, body: { isAvailable: true, coordinates: [73.6826, 24.5854] }});
  console.log('Driver online:', onlineReq.status, onlineReq.data.message);

  // Book ride
  const bookRide = await request('/rides', { method: 'POST', headers: { Authorization: `Bearer ${passToken}` }, body: { pickupLocation: { address: 'Sukhadia Circle', coordinates: [73.6826, 24.5854] }, dropoffLocation: { address: 'Bhuwana', coordinates: [73.7125, 24.6150] }, paymentMethod: 'cash' }});
  const rideId = bookRide.data.data?._id;
  console.log('Book ride:', bookRide.status, 'rideId:', rideId);

  // Accept
  const acceptRide = await request(`/rides/${rideId}/accept`, { method: 'PATCH', headers: { Authorization: `Bearer ${driverToken}` }});
  console.log('Accept ride:', acceptRide.status);

  // Start ride
  const rideOtp = acceptRide.data.data?.otp;
  await request(`/rides/${rideId}/status`, { method: 'PATCH', headers: { Authorization: `Bearer ${driverToken}` }, body: { status: 'arrived' }});
  const startRide = await request(`/rides/${rideId}/status`, { method: 'PATCH', headers: { Authorization: `Bearer ${driverToken}` }, body: { status: 'in_progress', enteredOtp: rideOtp }});
  console.log('Start ride:', startRide.status);

  // Share ride
  const shareRide = await request(`/rides/${rideId}/share`, { method: 'POST', headers: { Authorization: `Bearer ${passToken}` }});
  console.log('Share ride:', shareRide.status, JSON.stringify(shareRide.data));
  const shareToken = shareRide.data.data?.shareToken;
  console.log('Share token:', shareToken);

  // Public access
  const publicShared = await request(`/rides/shared/${shareToken}`);
  console.log('Public shared status:', publicShared.status);
  console.log('Public shared data:', JSON.stringify(publicShared.data, null, 2));
  console.log('\nrideId from share:', publicShared.data.data?.rideId, ' === ', rideId, '?', publicShared.data.data?.rideId === rideId);
}

run().catch(console.error);
