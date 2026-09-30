import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import PassengerLayout from '../layouts/PassengerLayout';
import DriverLayout from '../layouts/DriverLayout';
import AdminLayout from '../layouts/AdminLayout';

// Public Pages
import Home from '../pages/Home';
import About from '../pages/About';
import Safety from '../pages/Safety';
import Support from '../pages/Support';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ComingSoon from '../pages/ComingSoon';
import NotFound from '../pages/NotFound';
import PublicSharedRide from '../pages/PublicSharedRide';
import GuardianDashboard from '../pages/GuardianDashboard';

// Passenger Pages
import PassengerHome from '../pages/passenger/PassengerHome';
import BookRide from '../pages/passenger/BookRide';
import MyRides from '../pages/passenger/MyRides';
import RideDetails from '../pages/passenger/RideDetails';
import PassengerProfile from '../pages/passenger/PassengerProfile';
import PassengerSafety from '../pages/passenger/PassengerSafety';
import PassengerSettings from '../pages/passenger/PassengerSettings';

// Driver Pages
import DriverDashboard from '../pages/driver/DriverDashboard';
import DriverRides from '../pages/driver/DriverRides';
import DriverRideDetail from '../pages/driver/DriverRideDetail';
import DriverProfile from '../pages/driver/DriverProfile';
import DriverVehicle from '../pages/driver/DriverVehicle';
import DriverVerification from '../pages/driver/DriverVerification';
import DriverEarnings from '../pages/driver/DriverEarnings';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminDrivers from '../pages/admin/AdminDrivers';
import AdminRides from '../pages/admin/AdminRides';
import AdminSafety from '../pages/admin/AdminSafety';
import AdminPayments from '../pages/admin/AdminPayments';

// Auth
import ProtectedRoute from '../components/auth/ProtectedRoute';

import { ROUTES } from '../constants';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Shared Ride Tracking — standalone page, no layout/auth needed */}
      <Route path="/shared-ride/:shareToken" element={<PublicSharedRide />} />
      <Route path="/guardian/:shareToken" element={<GuardianDashboard />} />

      {/* Public Routes with MainLayout */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path={ROUTES.ABOUT} element={<About />} />
        <Route path={ROUTES.SAFETY} element={<Safety />} />
        <Route path={ROUTES.SUPPORT} element={<Support />} />
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.REGISTER} element={<Register />} />
      </Route>

      {/* Passenger Routes */}
      <Route element={<ProtectedRoute allowedRoles={['passenger']} />}>
        <Route path="/passenger" element={<PassengerLayout />}>
          <Route index element={<PassengerHome />} />
          <Route path={ROUTES.BOOK} element={<BookRide />} />
          <Route path={ROUTES.MY_RIDES} element={<MyRides />} />
          <Route path={ROUTES.RIDE_DETAILS} element={<RideDetails />} />
          <Route path={ROUTES.PASSENGER_PROFILE} element={<PassengerProfile />} />
          <Route path={ROUTES.PASSENGER_SAFETY} element={<PassengerSafety />} />
          <Route path={ROUTES.PASSENGER_SETTINGS} element={<PassengerSettings />} />
        </Route>
      </Route>

      {/* Driver Routes */}
      <Route element={<ProtectedRoute allowedRoles={['driver']} />}>
        <Route path="/driver" element={<DriverLayout />}>
          <Route index element={<DriverDashboard />} />
          <Route path={ROUTES.DRIVER_RIDES} element={<DriverRides />} />
          <Route path={ROUTES.DRIVER_RIDE_DETAIL} element={<DriverRideDetail />} />
          <Route path={ROUTES.DRIVER_PROFILE} element={<DriverProfile />} />
          <Route path={ROUTES.DRIVER_VEHICLE} element={<DriverVehicle />} />
          <Route path={ROUTES.DRIVER_VERIFICATION} element={<DriverVerification />} />
          <Route path={ROUTES.DRIVER_EARNINGS} element={<DriverEarnings />} />
        </Route>
      </Route>

      {/* Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path={ROUTES.ADMIN_USERS} element={<AdminUsers />} />
          <Route path={ROUTES.ADMIN_DRIVERS} element={<AdminDrivers />} />
          <Route path={ROUTES.ADMIN_RIDES} element={<AdminRides />} />
          <Route path={ROUTES.ADMIN_SAFETY} element={<AdminSafety />} />
          <Route path={ROUTES.ADMIN_PAYMENTS} element={<AdminPayments />} />

          {/* Catch-all for unmapped Admin paths */}
          <Route path="*" element={<ComingSoon title="Admin Feature" description="This admin feature is currently under development." />} />
        </Route>
      </Route>

      {/* Catch-all 404 (Outside any layout or wrap in MainLayout) */}
      <Route path="*" element={<MainLayout />} >
         <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
