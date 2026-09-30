import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants';
import { Loader } from 'lucide-react';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Role based access
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on current actual role
    if (user.role === 'passenger') return <Navigate to={ROUTES.PASSENGER} replace />;
    if (user.role === 'driver') return <Navigate to={ROUTES.DRIVER} replace />;
    if (user.role === 'admin') return <Navigate to={ROUTES.ADMIN} replace />;
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
