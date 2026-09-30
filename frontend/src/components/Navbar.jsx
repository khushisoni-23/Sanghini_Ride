import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  ArrowRight,
  LogOut,
  LayoutDashboard,
  Bell,
  CheckCheck,
  Car,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { APP_NAME, NAV_LINKS, ROUTES } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import Button from './ui/Button';
import logoImg from '../assets/logo.png';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const notifDropdownRef = useRef(null);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.HOME, { replace: true });
  };

  // Get the dashboard path for the current user role
  const getDashboardPath = () => {
    if (!user) return ROUTES.LOGIN;
    if (user.role === 'admin') return ROUTES.ADMIN;
    if (user.role === 'driver') return ROUTES.DRIVER;
    return ROUTES.PASSENGER;
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ride_requested':
      case 'ride_offered':
      case 'driver_accepted':
      case 'driver_arriving':
      case 'driver_arrived':
      case 'ride_started':
        return <Car className="w-4 h-4 text-purple-600" />;
      case 'ride_completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'ride_cancelled':
      case 'no_driver_available':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const handleNotificationClick = (item) => {
    if (!item.isRead) {
      markAsRead(item._id);
    }
    setNotificationOpen(false);

    if (item.ride) {
      const rideId = typeof item.ride === 'object' ? item.ride._id : item.ride;
      if (user?.role === 'driver') {
        navigate(`/driver/rides/${rideId}`);
      } else {
        navigate(`/passenger/rides/${rideId}`);
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-100/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & Name */}
          <Link
            to={ROUTES.HOME}
            className="flex items-center gap-3.5 group focus:outline-none"
            aria-label="Sanghini Ride Home"
          >
            <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-purple-50/80 p-1 border border-purple-100 transition-transform group-hover:scale-105">
              <img
                src={logoImg}
                alt="Sanghini Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-purple-800 transition-colors">
                {APP_NAME}
              </span>
              <span className="text-[11px] font-medium tracking-wide text-purple-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                Udaipur, Rajasthan
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'text-purple-800 bg-purple-50/80 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right CTA Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {/* ─── Notification Bell with Dropdown ───────────────── */}
                <div className="relative" ref={notifDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setNotificationOpen(!notificationOpen)}
                    className="relative p-2.5 rounded-xl text-slate-600 hover:text-purple-900 hover:bg-purple-50 border border-slate-200 transition-all cursor-pointer focus:outline-none"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center shadow-md animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {notificationOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white/95 backdrop-blur-lg border border-slate-200 shadow-2xl z-50 overflow-hidden animate-slide-up">
                      <div className="px-4 py-3 bg-purple-900 text-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-purple-300" />
                          <span className="font-bold text-xs">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded-md bg-purple-800 text-[10px] font-bold text-purple-200">
                              {unreadCount} unread
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllAsRead}
                            className="text-[11px] text-purple-200 hover:text-white font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-500 space-y-1">
                            <Bell className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                            <p className="font-semibold text-slate-700">No notifications yet</p>
                            <p className="text-[11px] text-slate-400">Live ride and driver updates will appear here.</p>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n._id}
                              onClick={() => handleNotificationClick(n)}
                              className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 ${
                                !n.isRead ? 'bg-purple-50/40' : ''
                              }`}
                            >
                              <div className="w-8 h-8 rounded-xl bg-purple-100/80 flex items-center justify-center shrink-0 mt-0.5">
                                {getNotificationIcon(n.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <h4 className="text-xs font-bold text-slate-900 truncate">{n.title}</h4>
                                  <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                                    {formatRelativeTime(n.createdAt)}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">{n.message}</p>
                              </div>
                              {!n.isRead && (
                                <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0 mt-1.5" />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Link to={getDashboardPath()}>
                  <Button variant="ghost" size="sm" className="text-slate-700 font-semibold">
                    <LayoutDashboard className="w-4 h-4 mr-1.5" />
                    Dashboard
                  </Button>
                </Link>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs border border-purple-200">
                    {user.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLogout} className="font-semibold">
                    <LogOut className="w-3.5 h-3.5 mr-1" /> Logout
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link to={ROUTES.LOGIN}>
                  <Button variant="ghost" size="sm" className="text-slate-700 font-semibold">
                    Sign In
                  </Button>
                </Link>
                <Link to={ROUTES.REGISTER}>
                  <Button variant="primary" size="sm" className="font-semibold shadow-xs">
                    Join Sanghini <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {user && (
              <button
                type="button"
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-2 rounded-xl text-slate-600 hover:text-purple-900 hover:bg-purple-50 focus:outline-none"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse" />
                )}
              </button>
            )}

            {user ? (
              <Link to={getDashboardPath()}>
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                  {user.name?.charAt(0)?.toUpperCase()}
                </div>
              </Link>
            ) : (
              <Link to={ROUTES.REGISTER}>
                <Button variant="primary" size="sm" className="text-xs px-3 py-1.5">
                  Join
                </Button>
              </Link>
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-b border-slate-100 bg-white px-4 pt-2 pb-6 space-y-3 shadow-lg">
          <div className="flex flex-col space-y-1">
            {NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? 'text-purple-800 bg-purple-50 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            {user ? (
              <>
                <Link to={getDashboardPath()} onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full justify-center">
                    <LayoutDashboard className="w-4 h-4 mr-1.5" /> My Dashboard
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full justify-center text-red-600"
                  onClick={() => {
                    handleLogout();
                    setMobileOpen(false);
                  }}
                >
                  <LogOut className="w-4 h-4 mr-1.5" /> Logout
                </Button>
              </>
            ) : (
              <>
                <Link to={ROUTES.LOGIN} onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full justify-center">
                    Sign In
                  </Button>
                </Link>
                <Link to={ROUTES.REGISTER} onClick={() => setMobileOpen(false)}>
                  <Button variant="primary" className="w-full justify-center">
                    Create Account <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
