import { useState } from 'react';
import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Clock,
  ShieldCheck,
  User,
  Settings,
  Menu,
  X,
  ShieldAlert,
  ArrowLeft,
  Bell,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { APP_NAME, ROUTES, PASSENGER_NAV_LINKS } from '../constants';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import logoImg from '../assets/logo.png';

export default function PassengerLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.HOME);
  };

  const getNavLabel = (item) => {
    switch (item.path) {
      case ROUTES.PASSENGER:
        return t('overview');
      case ROUTES.PASSENGER_BOOK:
        return t('bookRide');
      case ROUTES.PASSENGER_RIDES:
        return t('myRides');
      case ROUTES.PASSENGER_SAFETY:
        return t('safetyHub');
      case ROUTES.PASSENGER_PROFILE:
        return t('profile');
      case ROUTES.PASSENGER_SETTINGS:
        return t('settings');
      default:
        return item.label;
    }
  };

  const navIconMap = {
    LayoutDashboard,
    MapPin,
    Clock,
    ShieldCheck,
    User,
    Settings,
  };

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col lg:flex-row">
      {/* ─── Desktop Sidebar (Fixed Width) ────────────────────────── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 bg-white border-r border-slate-200/80 shrink-0 sticky top-0 h-screen z-30 justify-between">
        <div className="p-6 space-y-6">
          {/* Logo & Portal Info */}
          <Link
            to={ROUTES.PASSENGER}
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="w-11 h-11 rounded-xl bg-purple-50 p-1 border border-purple-100 flex items-center justify-center group-hover:scale-105 transition-transform">
              <img src={logoImg} alt={APP_NAME} className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                {APP_NAME}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
                <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
                  {t('portalTitle')}
                </span>
              </div>
            </div>
          </Link>

          {/* Quick Book CTA in Sidebar */}
          <Link to={ROUTES.PASSENGER_BOOK} className="block">
            <Button
              variant="primary"
              size="md"
              className="w-full justify-center shadow-sm font-bold bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-800 hover:to-purple-700"
            >
              <MapPin className="w-4 h-4 mr-2" /> {t('bookRide')}
            </Button>
          </Link>

          {/* Nav Links */}
          <nav className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1">
              {t('menu')}
            </div>
            {PASSENGER_NAV_LINKS.map((item) => {
              const Icon = navIconMap[item.icon] || MapPin;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === ROUTES.PASSENGER}
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
                  <span>{getNavLabel(item)}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer (Safety, City badge & Logout) */}
        <div className="p-5 border-t border-slate-100 space-y-4 bg-slate-50/40">
          <div className="p-3.5 rounded-xl bg-purple-50/80 border border-purple-100/90 text-xs text-purple-950 space-y-1.5">
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-700" /> {t('safeZone')}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-200/70 text-purple-900 font-bold">
                UDAIPUR
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {t('safeZoneDesc')}
            </p>
          </div>

          {/* User info */}
          {user && (
            <div className="flex items-center gap-2.5 px-1">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs border border-purple-200">
                {user.name?.[0]?.toUpperCase() || 'P'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">{user.name || 'Passenger'}</div>
                <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
              </div>
            </div>
          )}

          {/* Logout Button */}
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
              <ArrowLeft className="w-3.5 h-3.5" /> {t('backToWebsite')}
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
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="lg:hidden flex items-center gap-2">
              <img src={logoImg} alt={APP_NAME} className="w-7 h-7 object-contain" />
              <span className="font-extrabold text-slate-900 text-sm">{APP_NAME}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">
                Passenger
              </span>
            </div>
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
              <span className="font-medium">{t('cityLabel')}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link to={ROUTES.PASSENGER_SAFETY}>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200/80 transition-colors shadow-2xs cursor-pointer">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                <span>{t('sosHub')}</span>
              </button>
            </Link>

            {/* Logout button in header (desktop) */}
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>

            <Link to={ROUTES.PASSENGER_PROFILE} className="flex items-center gap-2 pl-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs border border-purple-200">
                {user?.name?.[0]?.toUpperCase() || 'P'}
              </div>
            </Link>
          </div>
        </header>

        {/* Dynamic Page Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* ─── Mobile Bottom Navigation ────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 z-30 px-2 py-1.5">
        <div className="grid grid-cols-5 gap-1">
          {PASSENGER_NAV_LINKS.slice(0, 5).map((item) => {
            const Icon = navIconMap[item.icon] || MapPin;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === ROUTES.PASSENGER}
                className={({ isActive: active }) =>
                  `flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[10px] font-semibold transition-all ${
                    active
                      ? 'text-purple-800 font-bold bg-purple-50/90'
                      : 'text-slate-500 hover:text-slate-900'
                  }`
                }
              >
                <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-purple-700' : 'text-slate-400'}`} />
                <span className="truncate">{getNavLabel(item)}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* ─── Mobile Sidebar Overlay Drawer ───────────────────────── */}
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
                    <div className="text-[10px] font-bold text-purple-700">{t('portalTitle')}</div>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <Link to={ROUTES.PASSENGER_BOOK} onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" className="w-full justify-center shadow-xs">
                  <MapPin className="w-4 h-4 mr-2" /> {t('bookRide')}
                </Button>
              </Link>

              <nav className="space-y-1">
                {PASSENGER_NAV_LINKS.map((item) => {
                  const Icon = navIconMap[item.icon] || MapPin;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      end={item.path === ROUTES.PASSENGER}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                          isActive
                            ? 'bg-purple-50 text-purple-900 font-bold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 text-purple-700" />
                      <span>{getNavLabel(item)}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <Link
                to={ROUTES.HOME}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-purple-700"
              >
                <ArrowLeft className="w-4 h-4" /> {t('backToWebsite')}
              </Link>
              <button
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="flex items-center gap-2 text-xs font-semibold text-rose-600 hover:text-rose-700 w-full"
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
