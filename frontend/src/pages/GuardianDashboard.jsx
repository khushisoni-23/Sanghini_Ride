import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck, MapPin, Phone, AlertTriangle, Car, Navigation,
  Clock, MessageCircle, RefreshCw, Heart, Shield, X, Send,
  Siren, Home, Hospital, Building2, Fuel, ChevronRight, Star,
  Moon, Sun, CheckCircle, Wifi, WifiOff,
} from 'lucide-react';
import safetyFeaturesService from '../services/safetyFeaturesService';
import Loading from '../components/ui/Loading';
import logoImg from '../assets/logo.png';

const STATUS_CONFIG = {
  requested: { label: 'Searching Driver', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  finding_driver: { label: 'Finding Driver', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  accepted: { label: 'Driver Assigned', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  driver_arriving: { label: 'Driver En Route', color: 'text-purple-600 bg-purple-50 border-purple-200' },
  arrived: { label: 'Driver Arrived', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  in_progress: { label: '🔴 LIVE — Ride In Progress', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  completed: { label: 'Trip Completed ✓', color: 'text-slate-600 bg-slate-50 border-slate-200' },
  cancelled: { label: 'Trip Cancelled', color: 'text-red-600 bg-red-50 border-red-200' },
};

const HAVEN_TYPE_CONFIG = {
  police_booth: { icon: Shield, color: 'text-blue-700 bg-blue-50 border-blue-200', label: 'Police Booth' },
  hospital: { icon: Hospital, color: 'text-red-700 bg-red-50 border-red-200', label: 'Hospital' },
  women_shelter: { icon: Home, color: 'text-rose-700 bg-rose-50 border-rose-200', label: "Women's Shelter" },
  safe_shop: { icon: Building2, color: 'text-emerald-700 bg-emerald-50 border-emerald-200', label: 'Safe Shop' },
  petrol_station: { icon: Fuel, color: 'text-amber-700 bg-amber-50 border-amber-200', label: 'Fuel Station' },
  govt_office: { icon: Building2, color: 'text-slate-700 bg-slate-50 border-slate-200', label: 'Govt. Office' },
};

export default function GuardianDashboard() {
  const { shareToken } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [showPingModal, setShowPingModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [pingName, setPingName] = useState('');
  const [pingMessage, setPingMessage] = useState('');
  const [pingSent, setPingSent] = useState(false);
  const [pinging, setPinging] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const fetchDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await safetyFeaturesService.getGuardianDashboard(shareToken);
      setData(res.data);
      setLastRefreshed(new Date());
      setError('');
    } catch (err) {
      setError(err.message || 'This guardian link is invalid or expired.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [shareToken]);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(() => fetchDashboard(true), 12000);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchDashboard]);

  const handlePing = async () => {
    if (!pingName.trim()) return;
    setPinging(true);
    try {
      await safetyFeaturesService.guardianPing(shareToken, {
        guardianName: pingName,
        message: pingMessage || `${pingName} is checking on you. Please respond when safe. 💙`,
      });
      setPingSent(true);
      setTimeout(() => {
        setPingSent(false);
        setShowPingModal(false);
        setPingName('');
        setPingMessage('');
      }, 3000);
    } catch (err) {
      alert('Could not send ping: ' + err.message);
    } finally {
      setPinging(false);
    }
  };

  if (loading) {
    return <Loading fullScreen text="Loading Guardian Safety Dashboard..." />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-950 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-rose-600" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">Link Expired</h1>
          <p className="text-sm text-slate-500">{error || 'This guardian link is no longer active.'}</p>
          <p className="text-xs text-slate-400">If you have concerns, please contact emergency services directly.</p>
          <a
            href="tel:112"
            className="flex items-center justify-center gap-2 mt-4 px-6 py-3 rounded-2xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 transition-colors"
          >
            <Phone className="w-4 h-4" /> Call 112 Emergency
          </a>
          <a
            href="tel:1090"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-700 transition-colors"
          >
            <Shield className="w-4 h-4" /> Women Helpline 1090
          </a>
        </div>
      </div>
    );
  }

  const { passengerName, driver, tripDetails, latestLocation, rideStatus, hasActiveSos, nearbyHavens, timeAwareSafety } = data;
  const statusCfg = STATUS_CONFIG[rideStatus] || STATUS_CONFIG.requested;
  const isNight = timeAwareSafety?.isNight;

  return (
    <div className={`min-h-screen font-sans ${isNight ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* ─── HEADER ───────────────────────────────────────────────── */}
      <header className={`sticky top-0 z-30 ${isNight ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border-b px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm`}>
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="Sanghini Ride" className="w-8 h-8 object-contain" />
          <div>
            <div className={`text-sm font-extrabold tracking-tight ${isNight ? 'text-white' : 'text-slate-900'}`}>
              Sanghini Ride
            </div>
            <div className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">Guardian Safety Dashboard</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <Wifi className="w-2.5 h-2.5" /> Live
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
              <WifiOff className="w-2.5 h-2.5" /> Offline
            </span>
          )}
          <button
            onClick={() => fetchDashboard()}
            className="p-1.5 rounded-lg text-slate-500 hover:text-purple-700 hover:bg-purple-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ─── SOS ACTIVE BANNER ────────────────────────────────────── */}
      {hasActiveSos && (
        <div className="bg-rose-600 text-white px-4 py-3 flex items-center gap-3">
          <Siren className="w-5 h-5 animate-pulse" />
          <div>
            <div className="text-sm font-extrabold">🚨 EMERGENCY SOS ACTIVE</div>
            <div className="text-xs opacity-90">{passengerName} has triggered an emergency SOS. The Sanghini safety desk has been alerted.</div>
          </div>
          <a href="tel:112" className="ml-auto shrink-0 bg-white text-rose-700 font-bold text-xs px-3 py-1.5 rounded-xl hover:bg-rose-50">
            Call 112
          </a>
        </div>
      )}

      {/* ─── TIME AWARE SAFETY BANNER ─────────────────────────────── */}
      {isNight && (
        <div className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white px-4 py-2.5 flex items-center gap-2.5">
          <Moon className="w-4 h-4 text-indigo-300 shrink-0" />
          <p className="text-xs font-semibold text-indigo-100">{timeAwareSafety?.message}</p>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* ─── PASSENGER STATUS CARD ──────────────────────────────── */}
        <div className={`rounded-3xl p-5 border shadow-sm ${isNight ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>Passenger</div>
              <h1 className={`text-xl font-extrabold tracking-tight ${isNight ? 'text-white' : 'text-slate-900'}`}>
                {passengerName}'s Ride
              </h1>
              <div className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full border text-xs font-bold ${statusCfg.color}`}>
                {rideStatus === 'in_progress' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                {statusCfg.label}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0">
              <Heart className="w-6 h-6 text-purple-700" />
            </div>
          </div>

          {/* Trip route */}
          <div className={`mt-4 p-3.5 rounded-2xl space-y-2 ${isNight ? 'bg-slate-800' : 'bg-slate-50'}`}>
            <div className="flex items-start gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
              <div>
                <div className={`text-[10px] font-bold uppercase tracking-wider ${isNight ? 'text-slate-400' : 'text-slate-400'}`}>From</div>
                <div className={`text-xs font-semibold ${isNight ? 'text-slate-200' : 'text-slate-800'}`}>{tripDetails?.pickupAddress || '—'}</div>
              </div>
            </div>
            <div className="ml-[5px] h-4 border-l border-dashed border-slate-300 dark:border-slate-600" />
            <div className="flex items-start gap-2.5">
              <div className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0" />
              <div>
                <div className={`text-[10px] font-bold uppercase tracking-wider ${isNight ? 'text-slate-400' : 'text-slate-400'}`}>To</div>
                <div className={`text-xs font-semibold ${isNight ? 'text-slate-200' : 'text-slate-800'}`}>{tripDetails?.dropoffAddress || '—'}</div>
              </div>
            </div>
          </div>

          {tripDetails?.estimatedDistanceKm && (
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Navigation className="w-3 h-3" />{tripDetails.estimatedDistanceKm} km</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{tripDetails.estimatedDurationMins} min</span>
              {tripDetails.fare && <span className="font-bold text-slate-700">₹{tripDetails.fare}</span>}
            </div>
          )}
        </div>

        {/* ─── DRIVER INFO ────────────────────────────────────────── */}
        {driver && (
          <div className={`rounded-3xl p-5 border shadow-sm ${isNight ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>Driver Details</div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center font-extrabold text-purple-800">
                {driver.firstName?.[0] || 'D'}
              </div>
              <div className="flex-1">
                <div className={`text-sm font-bold ${isNight ? 'text-white' : 'text-slate-900'}`}>
                  {driver.firstName} (Verified ✓)
                </div>
                <div className="flex items-center gap-1 text-amber-600 text-xs">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="font-bold">{driver.rating?.toFixed(1)}</span>
                </div>
              </div>
              <div className={`text-right text-xs ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>
                <div className="font-bold">{driver.vehicle?.make} {driver.vehicle?.model}</div>
                {driver.vehicle?.color && <div>{driver.vehicle.color}</div>}
                {driver.vehicle?.plateNumber && (
                  <div className={`font-mono font-bold mt-0.5 px-2 py-0.5 rounded-lg text-[10px] ${isNight ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-800'}`}>
                    {driver.vehicle.plateNumber}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── LIVE LOCATION ──────────────────────────────────────── */}
        <div className={`rounded-3xl p-5 border shadow-sm ${isNight ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`text-[10px] font-bold uppercase tracking-wider ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>Live Location</div>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Auto-refreshing
            </span>
          </div>
          <div className={`rounded-2xl overflow-hidden border h-40 flex items-center justify-center relative ${isNight ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
            {/* Map placeholder — shows coordinates */}
            <div className="text-center space-y-2">
              <MapPin className={`w-8 h-8 mx-auto ${hasActiveSos ? 'text-rose-500 animate-bounce' : 'text-purple-600'}`} />
              <div className={`text-xs font-bold ${isNight ? 'text-slate-300' : 'text-slate-700'}`}>
                {latestLocation?.coordinates?.[1]?.toFixed(5)}°N, {latestLocation?.coordinates?.[0]?.toFixed(5)}°E
              </div>
              <div className={`text-[11px] ${isNight ? 'text-slate-500' : 'text-slate-400'}`}>
                Updated {latestLocation?.updatedAt ? new Date(latestLocation.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
              </div>
              <a
                href={`https://maps.google.com/?q=${latestLocation?.coordinates?.[1]},${latestLocation?.coordinates?.[0]}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 text-white text-[10px] font-bold hover:bg-purple-700 transition-colors"
              >
                <Navigation className="w-3 h-3" /> Open in Google Maps
              </a>
            </div>
          </div>
          {lastRefreshed && (
            <div className={`text-[10px] text-center mt-2 ${isNight ? 'text-slate-600' : 'text-slate-400'}`}>
              Dashboard refreshed at {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          )}
        </div>

        {/* ─── GUARDIAN ACTIONS ───────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowPingModal(true)}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition-all active:scale-95 shadow-lg shadow-purple-600/30"
          >
            <MessageCircle className="w-5 h-5" />
            Send Check-In Ping
          </button>
          <button
            onClick={() => setShowSosModal(true)}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-all active:scale-95 shadow-lg shadow-rose-600/30"
          >
            <Siren className="w-5 h-5 animate-pulse" />
            Emergency Actions
          </button>
        </div>

        {/* ─── NEARBY SAFE HAVENS ─────────────────────────────────── */}
        {nearbyHavens && nearbyHavens.length > 0 && (
          <div className={`rounded-3xl p-5 border shadow-sm ${isNight ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>
              🛡️ Nearby Safe Havens Along Route
            </div>
            <div className="space-y-2">
              {nearbyHavens.slice(0, 4).map((haven, i) => {
                const cfg = HAVEN_TYPE_CONFIG[haven.type] || HAVEN_TYPE_CONFIG.govt_office;
                const Icon = cfg.icon;
                return (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl border ${isNight ? 'bg-slate-800 border-slate-700' : cfg.color}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isNight ? 'bg-slate-700' : 'bg-white/70'}`}>
                      <Icon className="w-4 h-4 text-current" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-bold truncate ${isNight ? 'text-slate-200' : 'text-slate-900'}`}>{haven.name}</div>
                      <div className={`text-[10px] truncate ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>{haven.address}</div>
                      {haven.is24Hours && (
                        <span className="text-[9px] font-bold text-emerald-600">24 Hours</span>
                      )}
                    </div>
                    {haven.phone && (
                      <a href={`tel:${haven.phone}`} className="shrink-0">
                        <Phone className="w-3.5 h-3.5 text-current" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── EMERGENCY HELPLINES ─────────────────────────────────  */}
        <div className={`rounded-3xl p-5 border shadow-sm ${isNight ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>Emergency Helplines</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Police', number: '112', color: 'bg-rose-600' },
              { label: 'Women Helpline', number: '1090', color: 'bg-purple-600' },
              { label: 'Ambulance', number: '108', color: 'bg-emerald-600' },
              { label: 'Udaipur Desk', number: '+912942407264', color: 'bg-slate-700' },
            ].map((h) => (
              <a
                key={h.number}
                href={`tel:${h.number}`}
                className={`flex flex-col items-center gap-1 p-3 rounded-2xl ${h.color} text-white text-center hover:opacity-90 active:scale-95 transition-all`}
              >
                <Phone className="w-4 h-4" />
                <div className="text-[10px] font-bold">{h.label}</div>
                <div className="text-xs font-extrabold">{h.number}</div>
              </a>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={`text-center text-[10px] pb-6 ${isNight ? 'text-slate-600' : 'text-slate-400'}`}>
          Sanghini Ride • Her Journey, Her Way • Udaipur, Rajasthan
        </div>
      </div>

      {/* ─── PING MODAL ─────────────────────────────────────────────── */}
      {showPingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base">Send Check-In Ping</h3>
              <button onClick={() => setShowPingModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            {pingSent ? (
              <div className="text-center py-6 space-y-2">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-7 h-7 text-emerald-600" />
                </div>
                <p className="font-bold text-slate-900 text-sm">Ping Sent!</p>
                <p className="text-xs text-slate-500">{passengerName} has been notified.</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-500">Send a discreet check-in message to {passengerName}. They'll receive an in-app notification.</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Your Name *</label>
                    <input
                      type="text"
                      value={pingName}
                      onChange={(e) => setPingName(e.target.value)}
                      placeholder="e.g., Mom, Dad, Sister..."
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Message (optional)</label>
                    <textarea
                      value={pingMessage}
                      onChange={(e) => setPingMessage(e.target.value)}
                      rows={2}
                      placeholder="Checking on you. Stay safe! 💙"
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none"
                    />
                  </div>
                </div>
                <button
                  onClick={handlePing}
                  disabled={pinging || !pingName.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white font-bold text-sm py-3 rounded-2xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {pinging ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {pinging ? 'Sending...' : 'Send Ping'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── SOS MODAL ──────────────────────────────────────────────── */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-rose-700 text-base flex items-center gap-2">
                <Siren className="w-5 h-5 animate-pulse" /> Emergency Actions
              </h3>
              <button onClick={() => setShowSosModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">If you believe {passengerName} is in danger, take immediate action:</p>
            <div className="space-y-2.5">
              <a href="tel:112" className="flex items-center gap-3 p-4 rounded-2xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors">
                <Phone className="w-5 h-5" />
                <div>
                  <div className="text-sm">Call Police — 112</div>
                  <div className="text-xs opacity-80">Immediate emergency response</div>
                </div>
              </a>
              <a href="tel:1090" className="flex items-center gap-3 p-4 rounded-2xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors">
                <Shield className="w-5 h-5" />
                <div>
                  <div className="text-sm">Women Helpline — 1090</div>
                  <div className="text-xs opacity-80">Rajasthan women safety line</div>
                </div>
              </a>
              <a
                href={`https://maps.google.com/?q=${latestLocation?.coordinates?.[1]},${latestLocation?.coordinates?.[0]}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-4 rounded-2xl bg-slate-800 text-white font-bold hover:bg-slate-900 transition-colors"
              >
                <MapPin className="w-5 h-5" />
                <div>
                  <div className="text-sm">Share Last Known Location</div>
                  <div className="text-xs opacity-80">Open in Google Maps</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
