import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Car,
  Wallet,
  Clock,
  MapPin,
  CheckCircle2,
  Navigation,
  Power,
  TrendingUp,
  Loader2,
  Phone,
  AlertCircle,
  Radio,
  Compass,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';
import RideMap from '../../components/ui/RideMap';
import { useToast } from '../../context/ToastContext';
import { ROUTES } from '../../constants';
import driverService from '../../services/driverService';
import rideService from '../../services/rideService';
import {
  getSocket,
  emitDriverLocation,
  emitDriverDuty,
} from '../../services/socketService';

export default function DriverDashboard() {
  const toast = useToast();
  const navigate = useNavigate();

  const [isOnline, setIsOnline] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Driver Location & GPS state
  const [driverCoords, setDriverCoords] = useState([73.6826, 24.5854]);
  const [gpsActive, setGpsActive] = useState(false);

  // Pending request & Active ride state from backend MongoDB
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [earningsSummary, setEarningsSummary] = useState({
    todayEarnings: 0,
    totalEarnings: 0,
    completedRidesCount: 0,
    todayRidesCount: 0,
  });

  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const geoWatchId = useRef(null);

  // 1. Fetch Driver Status & Earnings on mount
  const fetchDriverState = useCallback(async () => {
    try {
      const [statusRes, earningsRes, activeRes] = await Promise.all([
        driverService.getDriverStatus(),
        driverService.getEarningsSummary(),
        rideService.getMyRides('active'),
      ]);

      if (statusRes.success) {
        setIsOnline(Boolean(statusRes.data?.isOnline));
        if (statusRes.data?.currentLocation?.coordinates) {
          setDriverCoords(statusRes.data.currentLocation.coordinates);
        }
        if (statusRes.data?.activeRide) {
          setActiveRide(statusRes.data.activeRide);
        }
      }

      if (earningsRes.success && earningsRes.data) {
        setEarningsSummary(earningsRes.data);
      }

      if (activeRes.success && activeRes.data && activeRes.data.length > 0) {
        setActiveRide(activeRes.data[0]);
      }
    } catch (err) {
      console.error('Error fetching driver state:', err);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchDriverState();
  }, [fetchDriverState]);

  // 2. Real-Time Socket.IO Synchronization
  useEffect(() => {
    const socket = getSocket();

    // Listen for new ride requests dispatched nearby in Udaipur
    const handleNewRide = (data) => {
      console.log('⚡ New ride request received via socket:', data);
      if (data.ride) {
        setPendingRequests((prev) => {
          if (prev.some((r) => r._id === data.ride._id)) return prev;
          toast.info(`🔔 New Ride Request: ${data.ride.pickupLocation?.address || 'Pickup'} (₹${data.ride.fare})`);
          return [data.ride, ...prev];
        });
      }
    };

    // When a ride is accepted by another driver or cancelled
    const handleRideTaken = ({ rideId }) => {
      setPendingRequests((prev) => prev.filter((r) => r._id !== rideId));
    };

    const handleRideCancelled = ({ rideId }) => {
      setPendingRequests((prev) => prev.filter((r) => r._id !== rideId));
      setActiveRide((prev) => {
        if (prev && prev._id === rideId) {
          toast.warning('⚠️ Current ride was cancelled by the passenger.');
          return null;
        }
        return prev;
      });
    };

    socket.on('ride:new_request', handleNewRide);
    socket.on('ride:taken', handleRideTaken);
    socket.on('ride:cancelled', handleRideCancelled);

    return () => {
      socket.off('ride:new_request', handleNewRide);
      socket.off('ride:taken', handleRideTaken);
      socket.off('ride:cancelled', handleRideCancelled);
    };
  }, [toast]);

  // 3. Fetch pending requests when driver is online and has no active ride
  const fetchRequests = useCallback(async () => {
    if (!isOnline || activeRide) {
      setPendingRequests([]);
      return;
    }
    try {
      const res = await driverService.getPendingRequests();
      if (res.success && res.data) {
        setPendingRequests(res.data);
      }
    } catch (err) {
      console.error('Error fetching pending requests:', err);
    }
  }, [isOnline, activeRide]);

  useEffect(() => {
    fetchRequests();
    let interval = null;
    if (isOnline && !activeRide) {
      interval = setInterval(fetchRequests, 6000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOnline, activeRide, fetchRequests]);

  // 4. GPS Geolocation Tracking & Broadcasting
  useEffect(() => {
    if (isOnline && navigator.geolocation) {
      geoWatchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = [pos.coords.longitude, pos.coords.latitude];
          const heading = pos.coords.heading || 0;
          const speed = pos.coords.speed || 0;
          setDriverCoords(coords);
          setGpsActive(true);

          // Emit over socket & update API
          emitDriverLocation({
            coordinates: coords,
            heading,
            speed,
            rideId: activeRide?._id,
          });
          driverService.updateLocation({
            coordinates: coords,
            heading,
            speed,
            rideId: activeRide?._id,
          }).catch(() => {});
        },
        (err) => {
          // If browser location is denied, use default Udaipur coords
          setGpsActive(false);
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
    } else {
      if (geoWatchId.current) {
        navigator.geolocation.clearWatch(geoWatchId.current);
        geoWatchId.current = null;
      }
      setGpsActive(false);
    }

    return () => {
      if (geoWatchId.current) {
        navigator.geolocation.clearWatch(geoWatchId.current);
      }
    };
  }, [isOnline, activeRide]);

  // Handle duty status toggle
  const handleToggleDuty = async () => {
    try {
      const nextState = !isOnline;
      const res = await driverService.updateOnlineStatus(nextState);
      if (res.success) {
        setIsOnline(Boolean(res.data?.isOnline ?? nextState));
        emitDriverDuty(Boolean(res.data?.isOnline ?? nextState));
        if (nextState) {
          toast.success('You are now ONLINE. You will receive ride requests in Udaipur.');
          fetchRequests();
        } else {
          toast.info('You are now OFFLINE.');
          setPendingRequests([]);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update duty status.');
    }
  };

  // Handle Accept Ride
  const handleAcceptRequest = async (rideId) => {
    setIsProcessingAction(true);
    try {
      const res = await rideService.acceptRide(rideId);
      if (res.success && res.data) {
        toast.success('Ride Accepted! Navigate to passenger pickup point.');
        setActiveRide(res.data);
        setPendingRequests((prev) => prev.filter((r) => r._id !== rideId));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to accept ride.');
      fetchRequests();
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle Decline Request
  const handleDeclineRequest = async (rideId) => {
    try {
      await rideService.declineRide(rideId);
      toast.info('Ride request declined.');
      setPendingRequests((prev) => prev.filter((r) => r._id !== rideId));
    } catch (err) {
      setPendingRequests((prev) => prev.filter((r) => r._id !== rideId));
    }
  };

  // Handle Status Update (Arrived, Start Ride, Complete Ride)
  const handleUpdateStatus = async (newStatus) => {
    if (!activeRide) return;
    setIsProcessingAction(true);
    try {
      const res = await rideService.updateRideStatus(activeRide._id, newStatus);
      if (res.success && res.data) {
        if (newStatus === 'completed') {
          toast.success(`Ride Completed! Earned ₹${res.data.fare}`);
          setActiveRide(null);
          // Refresh earnings
          const earningsRes = await driverService.getEarningsSummary();
          if (earningsRes.success) setEarningsSummary(earningsRes.data);
        } else if (newStatus === 'arrived') {
          toast.success('Status updated: Arrived at pickup point.');
          setActiveRide(res.data);
        } else if (newStatus === 'in_progress') {
          toast.success('Ride Started! Drive safely to destination.');
          setActiveRide(res.data);
        } else {
          setActiveRide(res.data);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update ride status.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const activeRequest = pendingRequests.length > 0 ? pendingRequests[0] : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Driver Partner Dashboard"
        subtitle="Manage your duty status and view live requests in Udaipur."
        badge={
          <Badge variant={isOnline ? 'success' : 'default'} size="sm">
            {isOnline ? 'Online - Receiving Requests' : 'Offline'}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            {isOnline && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 font-semibold">
                <Radio className={`w-3.5 h-3.5 ${gpsActive ? 'text-emerald-600 animate-pulse' : 'text-purple-600'}`} />
                <span>{gpsActive ? 'Live GPS Active' : 'Udaipur Fleet Online'}</span>
              </div>
            )}
            <Button
              variant={isOnline ? 'danger' : 'primary'}
              size="md"
              onClick={handleToggleDuty}
              disabled={loadingStatus || isProcessingAction}
              className="font-bold shadow-xs"
            >
              <Power className="w-4 h-4 mr-1.5" />
              {isOnline ? 'Go Offline' : 'Go Online'}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Status & Active Actions (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Ride View (When Driver has accepted a ride) */}
          {activeRide ? (
            <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-purple-950 p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-purple-700/40 animate-slide-up space-y-5">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold tracking-wider border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Active Ride — {activeRide.status.replace('_', ' ').toUpperCase()}
                </div>
                <div className="text-base font-extrabold text-purple-200">
                  ₹{activeRide.fare}
                </div>
              </div>

              {/* Mini Map View in Driver Active Card */}
              <div className="rounded-2xl overflow-hidden border border-white/20 shadow-md">
                <RideMap
                  pickupLocation={activeRide.pickupLocation}
                  dropoffLocation={activeRide.dropoffLocation}
                  driverLocation={{ coordinates: driverCoords }}
                  routeGeometry={activeRide.routeGeometry || []}
                  rideStatus={activeRide.status}
                  height="220px"
                  showControls={false}
                />
              </div>

              {/* Route Info */}
              <div className="space-y-3 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Pickup Point</div>
                    <div className="text-sm font-semibold text-white">{activeRide.pickupLocation?.address}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Navigation className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-rose-300 uppercase tracking-wider">Drop-off Destination</div>
                    <div className="text-sm font-semibold text-white">{activeRide.dropoffLocation?.address}</div>
                  </div>
                </div>
              </div>

              {/* Passenger & OTP Info */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                <div>
                  <span className="text-purple-300">Passenger: </span>
                  <span className="font-bold text-white">{activeRide.passenger?.name || 'Passenger'}</span>
                  {activeRide.passenger?.phone && (
                    <span className="text-slate-300 text-[11px] block sm:inline sm:ml-2">({activeRide.passenger.phone})</span>
                  )}
                </div>
                {activeRide.otp && (
                  <div className="bg-purple-950/80 px-2.5 py-1 rounded-md border border-purple-500/30 text-emerald-300 font-mono font-bold">
                    Start OTP: {activeRide.otp}
                  </div>
                )}
              </div>

              {/* Status Action Buttons */}
              <div className="grid grid-cols-1 gap-3 pt-1">
                {activeRide.status === 'accepted' && (
                  <Button
                    variant="white"
                    loading={isProcessingAction}
                    onClick={() => handleUpdateStatus('arrived')}
                    className="w-full justify-center text-xs font-bold py-3"
                  >
                    Mark Arrived at Pickup
                  </Button>
                )}
                {(activeRide.status === 'arrived' || activeRide.status === 'driver_arriving') && (
                  <Button
                    variant="white"
                    loading={isProcessingAction}
                    onClick={() => handleUpdateStatus('in_progress')}
                    className="w-full justify-center text-xs font-bold py-3"
                  >
                    Start Ride (Passenger Onboard)
                  </Button>
                )}
                {activeRide.status === 'in_progress' && (
                  <Button
                    variant="white"
                    loading={isProcessingAction}
                    onClick={() => handleUpdateStatus('completed')}
                    className="w-full justify-center text-xs font-bold py-3 text-emerald-950 hover:bg-emerald-50"
                  >
                    Complete Ride & Collect ₹{activeRide.fare}
                  </Button>
                )}
                <Link to={`/driver/rides/${activeRide._id}`} className="block w-full">
                  <Button variant="outline-white" size="sm" className="w-full justify-center text-xs">
                    View Full Live Navigation & Ride Details
                  </Button>
                </Link>
              </div>
            </div>
          ) : isOnline && activeRequest ? (
            /* Pending Ride Request Card */
            <div className="rounded-3xl bg-gradient-to-br from-purple-900 to-indigo-900 p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-purple-700/40 animate-slide-up space-y-5">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold tracking-wider border border-rose-500/30">
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span> New Nearby Ride Request
                </div>
                <div className="text-base font-extrabold text-purple-200">
                  ₹{activeRequest.fare}
                </div>
              </div>

              <div className="space-y-3 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                      Pickup ({activeRequest.distanceToPickupKm ? `${activeRequest.distanceToPickupKm.toFixed(1)} km away` : `${activeRequest.estimatedDistance || 2} km away`})
                    </div>
                    <div className="text-sm font-semibold text-white">{activeRequest.pickupLocation?.address}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Navigation className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-rose-300 uppercase tracking-wider">
                      Drop-off (~{activeRequest.estimatedDuration || 12} min trip)
                    </div>
                    <div className="text-sm font-semibold text-white">{activeRequest.dropoffLocation?.address}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  variant="outline-white"
                  disabled={isProcessingAction}
                  onClick={() => handleDeclineRequest(activeRequest._id)}
                  className="w-full justify-center text-xs"
                >
                  Decline
                </Button>
                <Button
                  variant="white"
                  loading={isProcessingAction}
                  onClick={() => handleAcceptRequest(activeRequest._id)}
                  className="w-full justify-center text-xs font-bold"
                >
                  Accept Request
                </Button>
              </div>
            </div>
          ) : (
            /* Offline or Searching State Card */
            <Card className="p-8 border border-slate-200/80 text-center space-y-4 bg-slate-50">
              <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-2">
                <Car className={`w-8 h-8 ${isOnline ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {isOnline ? 'Looking for rides in Udaipur...' : 'You are currently offline'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isOnline
                  ? 'Stay in the Udaipur City limits. Real-time ride requests created by women passengers will appear here instantly.'
                  : 'Go online to start receiving ride requests from women passengers in Udaipur.'}
              </p>
              {!isOnline && (
                <Button variant="primary" size="md" onClick={handleToggleDuty} className="mt-2 font-bold">
                  <Power className="w-4 h-4 mr-1.5" /> Go Online Now
                </Button>
              )}
            </Card>
          )}

          {/* Quick Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to={ROUTES.DRIVER_RIDES} className="block group">
              <Card hover className="p-5 border border-slate-200/80 h-full flex flex-col justify-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-purple-700 transition-colors">Ride History</h4>
                    <p className="text-[11px] text-slate-500">View MongoDB past trips</p>
                  </div>
                </div>
              </Card>
            </Link>
            <Link to={ROUTES.DRIVER_VERIFICATION} className="block group">
              <Card hover className="p-5 border border-slate-200/80 h-full flex flex-col justify-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">Verification</h4>
                    <p className="text-[11px] text-slate-500">Your documents are approved</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Right Col: Earnings & Stats (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 border border-slate-200/80 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-emerald-600" /> Today's Summary
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                {new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-slate-500 font-medium">Authoritative Earnings</div>
              <div className="text-3xl font-extrabold text-slate-900">₹{earningsSummary.todayEarnings}</div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-slate-500 mb-0.5">Completed Today</div>
                <div className="font-bold text-slate-900 text-lg">{earningsSummary.todayRidesCount}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-slate-500 mb-0.5">Total Trips</div>
                <div className="font-bold text-slate-900 text-lg">{earningsSummary.completedRidesCount}</div>
              </div>
            </div>

            <Link to={ROUTES.DRIVER_EARNINGS} className="block w-full">
              <Button variant="outline" size="sm" className="w-full justify-center">
                View Earnings Statement
              </Button>
            </Link>
          </Card>

          <Card className="p-5 border border-purple-100 bg-purple-50/40 text-xs text-slate-600 space-y-2">
            <div className="font-bold text-purple-900 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-purple-700" /> Udaipur Demand Hotspots
            </div>
            <p className="text-[11px] leading-relaxed">
              High demand currently near MLSU Campus, Sukhadia Circle, and City Palace. Verified female drivers receive priority dispatch.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
