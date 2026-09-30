import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, MapPin, Navigation, Clock, AlertTriangle, Car, Star, RefreshCw } from 'lucide-react';
import RideMap from '../components/ui/RideMap';
import Loading from '../components/ui/Loading';
import ErrorState from '../components/ui/ErrorState';
import safetyService from '../services/safetyService';
import logoImg from '../assets/logo.png';

export default function PublicSharedRide() {
  const { shareToken } = useParams();
  const [sharedRide, setSharedRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSharedData();
    const interval = setInterval(fetchSharedData, 10000); // Auto-refresh location every 10s
    return () => clearInterval(interval);
  }, [shareToken]);

  const fetchSharedData = async () => {
    try {
      const res = await safetyService.getSharedRidePublic(shareToken);
      setSharedRide(res.data);
      setError('');
    } catch (err) {
      setError(err.message || 'Shared ride link has expired or is invalid.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading fullScreen text="Loading live shared trip status..." />;
  }

  if (error || !sharedRide) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <ErrorState
          title="Share Link Expired or Invalid"
          message={error || 'This live ride share link is no longer active.'}
          action={
            <Link to="/" className="px-5 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs shadow-md">
              Go to Sanghini Ride Home
            </Link>
          }
        />
      </div>
    );
  }

  const { passengerName, driver, tripDetails, latestLocation, rideStatus, hasActiveSos } = sharedRide;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="Sanghini Logo" className="w-9 h-9 object-contain" />
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight">Sanghini Ride</h1>
            <p className="text-[11px] text-purple-700 font-semibold">Live Trip Protection • Udaipur</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Live Tracking Active
          </span>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Emergency SOS Banner if Active */}
        {hasActiveSos && (
          <div className="p-4 rounded-2xl bg-red-600 text-white shadow-lg flex items-center justify-between animate-bounce">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="font-extrabold text-sm">EMERGENCY SOS ALERT TRIGGERED</h3>
                <p className="text-xs text-red-100">
                  An emergency alert has been activated on this trip. Safety desk & emergency responders are notified.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tracking Ride For</span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">{passengerName}'s Journey</h2>
            <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-purple-600" /> Monitored by Sanghini Safety Control Room
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-bold text-slate-400">Current Trip Status</span>
            <div className="mt-1">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800 border border-purple-200 uppercase tracking-wide">
                {rideStatus.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Live Map Box */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 space-y-3">
          <div className="flex items-center justify-between text-xs px-2">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-purple-600" /> Live Vehicle Position
            </span>
            <button
              onClick={fetchSharedData}
              className="text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          <div className="h-72 sm:h-96 rounded-2xl overflow-hidden border border-slate-100">
            <RideMap
              pickupLocation={{ coordinates: { coordinates: [73.6914, 24.6008] } }}
              dropoffLocation={{ coordinates: { coordinates: [73.6763, 24.5960] } }}
              driverLocation={{ coordinates: latestLocation?.coordinates || [73.6914, 24.6008] }}
              rideStatus={rideStatus}
            />
          </div>
        </div>

        {/* Driver & Vehicle Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verified Driver Partner</span>
            {driver ? (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-extrabold text-lg">
                  {driver.firstName[0]}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{driver.firstName}</h4>
                  <div className="flex items-center gap-1 text-xs text-amber-600 font-bold mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {driver.rating} Rating
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Searching for partner...</p>
            )}
          </div>

          {/* Vehicle Info */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vehicle Details</span>
            {driver?.vehicle ? (
              <div className="space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                  <Car className="w-4 h-4 text-purple-600" /> {driver.vehicle.color} {driver.vehicle.make} {driver.vehicle.model}
                </div>
                <div className="text-xs font-mono font-bold text-purple-800 bg-purple-50 py-1 px-2.5 rounded-lg w-fit">
                  {driver.vehicle.plateNumber}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Sanghini Verified Auto/Vehicle</p>
            )}
          </div>
        </div>

        {/* Trip Route Locations */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trip Route</span>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-[11px] font-bold text-slate-400">PICKUP POINT</div>
                <div className="text-xs font-bold text-slate-800">{tripDetails?.pickupAddress}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-[11px] font-bold text-slate-400">DESTINATION</div>
                <div className="text-xs font-bold text-slate-800">{tripDetails?.dropoffAddress}</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
