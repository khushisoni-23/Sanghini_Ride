import { useState } from 'react';
import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Car,
  Wallet,
  Truck,
  ShieldAlert,
  User,
  Menu,
  X,
  ArrowLeft,
  Power,
  ShieldCheck,
  PhoneCall,
  Bell,
  LogOut,
} from 'lucide-react';
import { APP_NAME, ROUTES, DRIVER_NAV_LINKS } from '../constants';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';

export default function DriverLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.HOME);
  };

  const navIconMap = {
    LayoutDashboard,
    Car,
    Wallet,
    Truck,
    ShieldAlert,
    User,
  };

  const handleToggleDuty = () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    if (nextState) {
      toast.success('You are now ONLINE in Udaipur. Ready to accept ride requests.');
    } else {
      toast.info('You are now OFFLINE. No new ride requests will be received.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col lg:flex-row">
      {/* ─── Desktop Driver Sidebar ──────────────────────────────── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 bg-white border-r border-slate-200/80 shrink-0 sticky top-0 h-screen z-30 justify-between">
        <div className="p-6 space-y-6">
          {/* Logo & Portal Brand */}
          <Link to={ROUTES.DRIVER} className="flex items-center gap-3 group focus:outline-none">
            <div className="w-11 h-11 rounded-xl bg-purple-50 p-1 border border-purple-100 flex items-center justify-center group-hover:scale-105 transition-transform">
              <img src={logoImg} alt={APP_NAME} className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="text-base font-extrabold text-slate-900 tracking-tight">
                {APP_NAME}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                  Driver Partner Portal
                </span>
              </div>
            </div>
          </Link>

          {/* Duty Status Toggle Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-purple-950 text-white shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-200">Duty Status</span>
              <Badge
                variant={isOnline ? 'success' : 'default'}
                size="sm"
                className={isOnline ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-white/10 text-slate-300 border-white/20'}
              >
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </Badge>
            </div>
            <button
              onClick={handleToggleDuty}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isOnline
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              {isOnline ? 'Go Offline' : 'Go Online (Udaipur)'}
            </button>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1">
              Driver Menu
            </div>
            {DRIVER_NAV_LINKS.map((item) => {
              const Icon = navIconMap[item.icon] || Car;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === ROUTES.DRIVER}
                  className={({ isActive: active }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      active
                        ? 'bg-purple-50 text-purple-900 font-bold border border-purple-100 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-purple-700' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Driver Support Footer */}
        <div className="p-5 border-t border-slate-100 space-y-4 bg-slate-50/40">
          <div className="p-3 rounded-xl bg-purple-50/80 border border-purple-100 text-xs text-slate-700 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-purple-900">
              <PhoneCall className="w-3.5 h-3.5 text-purple-700" /> Driver Desk Helpline
            </div>
            <p className="text-[11px] text-slate-600 font-medium">
              +91 294 240 7264 (24/7 Helpline)
            </p>
          </div>

          {/* User info */}
          {user && (
            <div className="flex items-center gap-2.5 px-1">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs border border-emerald-200">
                {user.name?.[0]?.toUpperCase() || 'D'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">{user.name || 'Driver'}</div>
                <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
              </div>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all border border-rose-100 hover:border-rose-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <Link
              to={ROUTES.HOME}
              className="text-slate-500 hover:text-purple-700 flex items-center gap-1 font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Website
            </Link>
            <Badge variant="default" size="sm">
              Phase 1 Shell
            </Badge>
          </div>
        </div>
      </aside>

      {/* ─── Main Content Area ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden focus:outline-none"
              aria-label="Open driver menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="lg:hidden flex items-center gap-2">
              <img src={logoImg} alt={APP_NAME} className="w-7 h-7 object-contain" />
              <span className="font-extrabold text-slate-900 text-sm">{APP_NAME}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                Driver
              </span>
            </div>
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
              <span className="font-medium">Zone:</span>
              <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                Udaipur Central / Fatehpura
              </span>
            </div>
          </div>

          {/* Quick Duty Toggle & Profile on Mobile/Header */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={handleToggleDuty}
              className={`lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isOnline
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              {isOnline ? 'Online' : 'Offline'}
            </button>

            {/* Logout button in header */}
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>

            <Link to={ROUTES.DRIVER_PROFILE} className="flex items-center gap-2 pl-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs border border-purple-200">
                {user?.name?.[0]?.toUpperCase() || 'D'}
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* ─── Mobile Bottom Navigation ────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 z-30 px-2 py-1.5">
        <div className="grid grid-cols-5 gap-1">
          {DRIVER_NAV_LINKS.slice(0, 5).map((item) => {
            const Icon = navIconMap[item.icon] || Car;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === ROUTES.DRIVER}
                className={({ isActive: active }) =>
                  `flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[10px] font-semibold transition-all ${
                    active
                      ? 'text-purple-800 font-bold bg-purple-50/90'
                      : 'text-slate-500 hover:text-slate-900'
                  }`
                }
              >
                <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-purple-700' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* ─── Mobile Drawer ───────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-white p-6 shadow-2xl flex flex-col justify-between z-10 animate-fade-in">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <img src={logoImg} alt={APP_NAME} className="w-8 h-8 object-contain" />
                  <div>
                    <div className="font-extrabold text-slate-900 text-sm">{APP_NAME}</div>
                    <div className="text-[10px] font-bold text-emerald-700">Driver Partner</div>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {DRIVER_NAV_LINKS.map((item) => {
                  const Icon = navIconMap[item.icon] || Car;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      end={item.path === ROUTES.DRIVER}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                          isActive
                            ? 'bg-purple-50 text-purple-900 font-bold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 text-purple-700" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Link
                to={ROUTES.HOME}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-purple-700"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Homepage
              </Link>
              <button
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="mt-3 flex items-center gap-2 text-xs font-semibold text-rose-600 hover:text-rose-700 w-full"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
