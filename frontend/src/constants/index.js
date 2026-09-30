// ─── Application Constants ──────────────────────────────────────
export const APP_NAME = 'Sanghini Ride';
export const APP_TAGLINE = 'Her Journey, Her Way';
export const APP_SUBTITLE = 'Safe Rides. Stronger Women.';
export const APP_DESCRIPTION =
  'A women-focused, local-first mobility platform starting in Udaipur that connects women passengers with verified women drivers.';

export const LAUNCH_CITY = 'Udaipur, Rajasthan';
export const CITY_CODE = 'UDR';

// ─── User Roles ─────────────────────────────────────────────────
export const ROLES = {
  PASSENGER: 'PASSENGER',
  DRIVER: 'DRIVER',
  ADMIN: 'ADMIN',
};

// ─── Route Paths ────────────────────────────────────────────────
export const ROUTES = {
  // Public
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  ABOUT: '/about',
  SAFETY: '/safety',
  SUPPORT: '/support',

  // Passenger Shell
  PASSENGER: '/passenger',
  PASSENGER_HOME: '/passenger',
  PASSENGER_BOOK: '/passenger/book-ride',
  BOOK: '/passenger/book-ride',
  PASSENGER_RIDES: '/passenger/rides',
  MY_RIDES: '/passenger/rides',
  PASSENGER_RIDE_DETAIL: '/passenger/rides/:id',
  RIDE_DETAILS: '/passenger/rides/:id',
  PASSENGER_PROFILE: '/passenger/profile',
  PASSENGER_SAFETY: '/passenger/safety',
  PASSENGER_SETTINGS: '/passenger/settings',

  // Driver Shell
  DRIVER: '/driver',
  DRIVER_DASHBOARD: '/driver',
  DRIVER_RIDES: '/driver/rides',
  DRIVER_RIDE_DETAIL: '/driver/rides/:id',
  DRIVER_PROFILE: '/driver/profile',
  DRIVER_VEHICLE: '/driver/vehicle',
  DRIVER_VERIFICATION: '/driver/verification',
  DRIVER_EARNINGS: '/driver/earnings',

  // Admin Shell
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_DRIVERS: '/admin/drivers',
  ADMIN_RIDES: '/admin/rides',
  ADMIN_SAFETY: '/admin/safety',
  ADMIN_PAYMENTS: '/admin/payments',
  ADMIN_SUPPORT: '/admin/support',
  ADMIN_SETTINGS: '/admin/settings',
};

// ─── API Endpoints ──────────────────────────────────────────────
export const API_ENDPOINTS = {
  HEALTH: '/health',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
  },
  RIDES: {
    ESTIMATE: '/rides/estimate',
    BOOK: '/rides/book',
    ACTIVE: '/rides/active',
    HISTORY: '/rides/history',
    DETAIL: (id) => `/rides/${id}`,
    CANCEL: (id) => `/rides/${id}/cancel`,
  },
  DRIVER: {
    STATUS: '/driver/status',
    REQUESTS: '/driver/requests',
    VERIFICATION: '/driver/verification',
    VEHICLE: '/driver/vehicle',
    EARNINGS: '/driver/earnings',
  },
  SAFETY: {
    SOS: '/safety/sos',
    TRUSTED_CONTACTS: '/safety/trusted-contacts',
    SHARE_TRIP: '/safety/share-trip',
  },
  ADMIN: {
    ANALYTICS: '/admin/analytics',
    USERS: '/admin/users',
    USER_STATUS: (id) => `/admin/users/${id}/status`,
    DRIVERS: '/admin/drivers',
    VERIFY_DRIVER: (id) => `/admin/drivers/${id}/verify`,
    DRIVER_STATUS: (id) => `/admin/drivers/${id}/status`,
    RIDES: '/admin/rides',
    RIDE_DETAIL: (id) => `/admin/rides/${id}`,
    PAYMENTS: '/admin/payments',
    SAFETY_INCIDENTS: '/admin/safety/incidents',
    INCIDENT_STATUS: (id) => `/admin/safety/incidents/${id}/status`,
  },
};

// ─── Public Navigation Links ────────────────────────────────────
export const NAV_LINKS = [
  { label: 'Home', path: ROUTES.HOME },
  { label: 'About', path: ROUTES.ABOUT },
  { label: 'Safety', path: ROUTES.SAFETY },
  { label: 'Support', path: ROUTES.SUPPORT },
];

// ─── Passenger Navigation Links ─────────────────────────────────
export const PASSENGER_NAV_LINKS = [
  { label: 'Overview', path: ROUTES.PASSENGER, icon: 'LayoutDashboard' },
  { label: 'Book a Ride', path: ROUTES.PASSENGER_BOOK, icon: 'MapPin' },
  { label: 'My Rides', path: ROUTES.PASSENGER_RIDES, icon: 'Clock' },
  { label: 'Safety Hub', path: ROUTES.PASSENGER_SAFETY, icon: 'ShieldCheck' },
  { label: 'Profile', path: ROUTES.PASSENGER_PROFILE, icon: 'User' },
  { label: 'Settings', path: ROUTES.PASSENGER_SETTINGS, icon: 'Settings' },
];

// ─── Driver Navigation Links ────────────────────────────────────
export const DRIVER_NAV_LINKS = [
  { label: 'Dashboard', path: ROUTES.DRIVER, icon: 'LayoutDashboard' },
  { label: 'Ride History', path: ROUTES.DRIVER_RIDES, icon: 'Car' },
  { label: 'Earnings', path: ROUTES.DRIVER_EARNINGS, icon: 'Wallet' },
  { label: 'Vehicle Details', path: ROUTES.DRIVER_VEHICLE, icon: 'Truck' },
  { label: 'Verification', path: ROUTES.DRIVER_VERIFICATION, icon: 'ShieldAlert' },
  { label: 'Profile', path: ROUTES.DRIVER_PROFILE, icon: 'User' },
];

// ─── Admin Navigation Links ─────────────────────────────────────
export const ADMIN_NAV_LINKS = [
  { label: 'Operations', path: ROUTES.ADMIN, icon: 'Activity' },
  { label: 'Live Rides', path: ROUTES.ADMIN_RIDES, icon: 'Compass' },
  { label: 'Driver Verification', path: ROUTES.ADMIN_DRIVERS, icon: 'UserCheck' },
  { label: 'Passenger Accounts', path: ROUTES.ADMIN_USERS, icon: 'Users' },
  { label: 'Payment Audits', path: ROUTES.ADMIN_PAYMENTS, icon: 'CreditCard' },
  { label: 'SOS & Safety Desk', path: ROUTES.ADMIN_SAFETY, icon: 'AlertTriangle' },
  { label: 'Support Tickets', path: ROUTES.ADMIN_SUPPORT, icon: 'MessageSquare' },
  { label: 'City Settings', path: ROUTES.ADMIN_SETTINGS, icon: 'Sliders' },
];

// ─── Popular Udaipur Places ─────────────────────────────────────
export const POPULAR_UDAIPUR_PLACES = [
  'Sukhadia Circle, Panchwati, Udaipur',
  'Fateh Sagar Lake Paal, Udaipur',
  'Lake Pichola / City Palace Gate, Udaipur',
  'MLSU Campus, University Road, Udaipur',
  'Celebration Mall, Bhuwana, Udaipur',
  'Udaipur City Railway Station',
  'RNT Medical College & Hospital, Udaipur',
  'Saheliyon Ki Bari, New Bhupalpura, Udaipur',
  'Chetak Circle, Madhuban, Udaipur',
  'Delhi Gate, Bapu Bazaar, Udaipur',
  'Hiran Magri Sector 4, Udaipur',
  'Hiran Magri Sector 14, Udaipur',
  'Maharana Pratap Airport (Dabok), Udaipur',
  'Goverdhan Vilas, NH 8, Udaipur',
  'Shobhagpura 100 Feet Road, Udaipur',
  'Titardi Chauraha, Udaipur',
];

// ─── Vehicle Types ──────────────────────────────────────────────
export const VEHICLE_TYPES = [
  {
    id: 'auto',
    name: 'Sanghini Auto',
    desc: 'Quick & affordable city transit',
    capacity: '3 seats',
    eta: '3 min',
    baseFare: 40,
    perKm: 12,
    icon: '🛺',
  },
  {
    id: 'mini',
    name: 'Sanghini Go (Hatchback)',
    desc: 'AC comfort for daily commute',
    capacity: '4 seats',
    eta: '5 min',
    baseFare: 70,
    perKm: 18,
    icon: '🚗',
  },
  {
    id: 'prime',
    name: 'Sanghini Prime Sedan',
    desc: 'Spacious & quiet city travel',
    capacity: '4 seats',
    eta: '6 min',
    baseFare: 110,
    perKm: 24,
    icon: '🚘',
  },
];

// ─── Helplines ──────────────────────────────────────────────────
export const EMERGENCY_HELPLINES = [
  { name: 'Police Emergency', number: '112', primary: true },
  { name: 'Women Helpline (Rajasthan)', number: '1090', primary: true },
  { name: 'Sanghini Udaipur Desk', number: '+91 294 240 7264', primary: false },
  { name: 'Ambulance', number: '108', primary: false },
];
