import { useState } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import {
  Activity,
  Compass,
  UserCheck,
  Users,
  AlertTriangle,
  MessageSquare,
  Sliders,
  Menu,
  X,
  ArrowLeft,
  ShieldCheck,
  Building2,
  Radio,
  CreditCard,
} from 'lucide-react';
import { APP_NAME, ROUTES, ADMIN_NAV_LINKS } from '../constants';
import Badge from '../components/ui/Badge';
import logoImg from '../assets/logo.png';

export default function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navIconMap = {
    Activity,
    Compass,
    UserCheck,
    Users,
    AlertTriangle,
    MessageSquare,
    Sliders,
    CreditCard,
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col lg:flex-row">
      {/* ─── Desktop Admin Sidebar ───────────────────────────────── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 bg-slate-950 text-slate-300 border-r border-slate-800 shrink-0 sticky top-0 h-screen z-30 justify-between">
        <div className="p-6 space-y-6">
          {/* Logo & Portal Identity */}
          <Link to={ROUTES.ADMIN} className="flex items-center gap-3 group focus:outline-none">
            <div className="w-11 h-11 rounded-xl bg-purple-900/50 p-1 border border-purple-700/50 flex items-center justify-center group-hover:scale-105 transition-transform">
              <img src={logoImg} alt={APP_NAME} className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="text-base font-extrabold text-white tracking-tight">
                {APP_NAME}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
                  Admin Console
                </span>
              </div>
            </div>
          </Link>

          {/* Operations Status Card */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Udaipur Hub</span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> ACTIVE
              </span>
            </div>
            <div className="text-[11px] text-slate-400 leading-snug">
              Safety monitoring & dispatch telemetry operational.
            </div>
          </div>

          {/* Admin Navigation */}
          <nav className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pb-1">
              Operations Management
            </div>
            {ADMIN_NAV_LINKS.map((item) => {
              const Icon = navIconMap[item.icon] || Activity;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === ROUTES.ADMIN}
                  className={({ isActive: active }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      active
                        ? 'bg-purple-600/20 text-purple-200 font-bold border border-purple-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`
                  }
                >
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-purple-400' : 'text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-5 border-t border-slate-900 bg-slate-950/80 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <Link
              to={ROUTES.HOME}
              className="text-slate-400 hover:text-white flex items-center gap-1.5 font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Website
            </Link>
            <Badge variant="purple" size="sm" className="bg-purple-950 text-purple-300 border-purple-800">
              Admin
            </Badge>
          </div>
        </div>
      </aside>

      {/* ─── Main Content Area ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 pb-12">
        {/* Admin Top Header */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden focus:outline-none"
              aria-label="Open admin menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="lg:hidden flex items-center gap-2">
              <img src={logoImg} alt={APP_NAME} className="w-7 h-7 object-contain" />
              <span className="font-extrabold text-slate-900 text-sm">{APP_NAME}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-200 font-bold">
                Admin
              </span>
            </div>
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Platform Command:</span>
              <span className="bg-purple-50 text-purple-800 font-bold px-2.5 py-0.5 rounded-md border border-purple-100">
                City Pilot — Udaipur
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>Safety Telemetry Live</span>
            </div>

            <div className="w-8 h-8 rounded-xl bg-slate-900 text-purple-200 flex items-center justify-center font-bold text-xs">
              A
            </div>
          </div>
        </header>

        {/* Dynamic Admin Page Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* ─── Mobile Drawer ───────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-slate-950 text-slate-200 p-6 shadow-2xl flex flex-col justify-between z-10 animate-fade-in">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <img src={logoImg} alt={APP_NAME} className="w-8 h-8 object-contain" />
                  <div>
                    <div className="font-extrabold text-white text-sm">{APP_NAME}</div>
                    <div className="text-[10px] font-bold text-purple-300">Admin Console</div>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {ADMIN_NAV_LINKS.map((item) => {
                  const Icon = navIconMap[item.icon] || Activity;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      end={item.path === ROUTES.ADMIN}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                          isActive
                            ? 'bg-purple-600/20 text-purple-200 font-bold border border-purple-500/30'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 text-purple-400" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <Link
                to={ROUTES.HOME}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Homepage
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
