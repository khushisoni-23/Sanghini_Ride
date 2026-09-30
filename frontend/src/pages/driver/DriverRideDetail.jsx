import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Phone,
  MessageSquare,
  Shield,
  Star,
  Loader2,
  Lock,
  Radio,
  Locate,
  CreditCard,
  Banknote,
  Receipt,
  XCircle,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import RideMap from '../../components/ui/RideMap';
import InvoiceModal from '../../components/ui/InvoiceModal';
import RatingModal from '../../components/ui/RatingModal';
import { useToast } from '../../context/ToastContext';
import { ROUTES } from '../../constants';
import rideService from '../../services/rideService';
import driverService from '../../services/driverService';
import paymentService from '../../services/paymentService';
import {
  getSocket,
  joinRideRoom,
  leaveRideRoom,
  emitDriverLocation,
} from '../../services/socketService';

export default function DriverRideDetail() {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Driver GPS Location state
  const [driverCoords, setDriverCoords] = useState([73.6826, 24.5854]);
  const [heading, setHeading] = useState(0);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  // Phase 9: Payment & Invoice state
  const [isConfirmingCash, setIsConfirmingCash] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);

  // Rating state
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  const geoWatchRef = useRef(null);

  const fetchRide = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await rideService.getRideById(id);
      if (res.success && res.data) {
        setRide(res.data);
        if (res.data.driverLocation?.coordinates) {
          setDriverCoords(res.data.driverLocation.coordinates);
          setHeading(res.data.driverLocation.heading || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching driver ride detail:', err);
      setError(err.message || 'Failed to fetch ride details or access denied.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRide();
  }, [id]);

  // Real-time Socket.IO Connection & Listeners
  useEffect(() => {
    if (!id) return;

    const socket = getSocket();
    joinRideRoom(id);

    const handleStatusChanged = (data) => {
      console.log('⚡ Driver received ride event:', data);
      if (data.ride) {
        setRide(data.ride);
      } else if (data.status) {
        setRide((prev) => (prev ? { ...prev, status: data.status } : prev));
      }

      if (data.status === 'cancelled') {
        toast.warning('⚠️ Passenger has cancelled this ride request.');
      }
    };

    // Phase 9: Listen for payment events
    const handlePaymentSuccess = (data) => {
      console.log('💰 Payment confirmed event received:', data);
      setRide((prev) =>
        prev ? { ...prev, paymentStatus: 'paid', paymentMethod: data.paymentMethod } : prev
      );
      toast.success(`💳 Payment of ₹${data.amount} received! Invoice: ${data.invoiceNumber}`);
    };

    const handlePaymentFailed = (data) => {
      console.log('❌ Payment failed event:', data);
      toast.error(`Payment issue: ${data.reason || 'Transaction failed'}`);
    };

    const handleConnect = () => {
      joinRideRoom(id);
      socket.emit('ride:sync', { rideId: id });
    };

    const handleSynced = (data) => {
      if (data.ride) {
        setRide(data.ride);
      }
    };

    socket.on('connect', handleConnect);
    socket.on('ride:synced', handleSynced);
    socket.on('ride:status_changed', handleStatusChanged);
    socket.on('ride_cancelled', handleStatusChanged);
    socket.on('ride_completed', handleStatusChanged);
    socket.on('ride_started', handleStatusChanged);
    socket.on('driver_arrived', handleStatusChanged);
    socket.on('driver_arriving', handleStatusChanged);
    socket.on('payment:successful', handlePaymentSuccess);
    socket.on('payment:failed', handlePaymentFailed);

    return () => {
      leaveRideRoom(id);
      socket.off('connect', handleConnect);
      socket.off('ride:synced', handleSynced);
      socket.off('ride:status_changed', handleStatusChanged);
      socket.off('ride_cancelled', handleStatusChanged);
      socket.off('ride_completed', handleStatusChanged);
      socket.off('ride_started', handleStatusChanged);
      socket.off('driver_arrived', handleStatusChanged);
      socket.off('driver_arriving', handleStatusChanged);
      socket.off('payment:successful', handlePaymentSuccess);
      socket.off('payment:failed', handlePaymentFailed);
    };
  }, [id, toast]);

  // GPS Location Watcher for Driver
  useEffect(() => {
    if (navigator.geolocation && ride && ['accepted', 'driver_arriving', 'arrived', 'in_progress'].includes(ride.status)) {
      geoWatchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = [pos.coords.longitude, pos.coords.latitude];
          const newHeading = pos.coords.heading || 0;
          const speed = pos.coords.speed || 0;
          setDriverCoords(coords);
          setHeading(newHeading);

          // Emit live location over socket & HTTP
          emitDriverLocation({
            coordinates: coords,
            heading: newHeading,
            speed,
            rideId: id,
          });
          driverService.updateLocation({
            coordinates: coords,
            heading: newHeading,
            speed,
            rideId: id,
          }).catch(() => {});
        },
        (err) => {
          // Geolocation unavailable or denied
        },
        { enableHighAccuracy: true, maximumAge: 4000, timeout: 8000 }
      );
    }

    return () => {
      if (geoWatchRef.current) {
        navigator.geolocation.clearWatch(geoWatchRef.current);
      }
    };
  }, [ride, id]);

  const handleUpdateStatus = async (newStatus) => {
    if (newStatus === 'in_progress' && ride.otp) {
      if (enteredOtp && enteredOtp.trim() !== ride.otp.trim()) {
        setOtpError('Invalid OTP code. Please enter the 4-digit code provided by passenger.');
        return;
      }
      setOtpError('');
    }

    setIsUpdating(true);
    try {
      const res = await rideService.updateRideStatus(id, newStatus);
      if (res.success && res.data) {
        toast.success(`Ride status updated to '${newStatus}'.`);
        setRide(res.data);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update status.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Phase 9: Cash Collection Handler
  const handleConfirmCashCollection = async () => {
    setIsConfirmingCash(true);
    try {
      const verifyRes = await paymentService.verifyPayment({
        rideId: id,
        paymentMethod: 'cash',
      });

      if (verifyRes.success) {
        setRide((prev) =>
          prev ? { ...prev, paymentStatus: 'paid', paymentMethod: 'cash' } : prev
        );
        toast.success(`✅ Cash payment of ₹${ride.fare} confirmed and recorded.`);
      } else {
        throw new Error(verifyRes.message || 'Failed to confirm cash collection');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to confirm cash payment.');
    } finally {
      setIsConfirmingCash(false);
    }
  };

  // Phase 9: View Invoice
  const handleViewInvoice = async () => {
    setIsLoadingInvoice(true);
    try {
      const res = await paymentService.getInvoice(id);
      if (res.success && res.data) {
        setInvoiceData(res.data);
        setInvoiceModalOpen(true);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load invoice.');
    } finally {
      setIsLoadingInvoice(false);
    }
  };

  // Helper for simulating driver movement along route during testing
  const handleSimulateMovement = () => {
    if (!ride) return;
    const target =
      ride.status === 'in_progress'
        ? ride.dropoffLocation?.coordinates?.coordinates || [73.6763, 24.5960]
        : ride.pickupLocation?.coordinates?.coordinates || [73.6914, 24.6008];

    // Nudge driver coords closer to target
    const [currentLng, currentLat] = driverCoords;
    const [targetLng, targetLat] = target;

    const nextLng = currentLng + (targetLng - currentLng) * 0.35;
    const nextLat = currentLat + (targetLat - currentLat) * 0.35;
    const nextCoords = [parseFloat(nextLng.toFixed(6)), parseFloat(nextLat.toFixed(6))];

    setDriverCoords(nextCoords);

    emitDriverLocation({
      coordinates: nextCoords,
      heading: (heading + 45) % 360,
      speed: 28,
      rideId: id,
    });

    driverService.updateLocation({
      coordinates: nextCoords,
      heading: (heading + 45) % 360,
      speed: 28,
      rideId: id,
    }).catch(() => {});

    toast.info(`📍 Driver moved to: [${nextCoords[1]}, ${nextCoords[0]}]`);
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500 space-y-3 max-w-4xl mx-auto">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
        <p className="text-xs font-semibold">Loading ride details from MongoDB...</p>
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader title="Ride Details" backTo={ROUTES.DRIVER_RIDES} backLabel="All Rides" />
        <Card className="p-10 border border-slate-200 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">{error || 'Ride not found'}</h3>
          <Link to={ROUTES.DRIVER_RIDES}>
            <Button variant="outline" size="sm">
              Back to Ride History
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const formattedId = `#${ride._id.slice(-8).toUpperCase()}`;
  const isActive = ['accepted', 'driver_arriving', 'arrived', 'in_progress'].includes(ride.status);
  const isCompleted = ride.status === 'completed';
  const isPaymentDone = ride.paymentStatus === 'paid';
  const needsCashCollection = isCompleted && !isPaymentDone;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" size="sm">COMPLETED</Badge>;
      case 'accepted':
      case 'driver_arriving':
      case 'arrived':
      case 'in_progress':
        return <Badge variant="purple" size="sm">{status.replace('_', ' ').toUpperCase()}</Badge>;
      case 'cancelled':
        return <Badge variant="danger" size="sm">CANCELLED</Badge>;
      default:
        return <Badge variant="default" size="sm">{status.toUpperCase()}</Badge>;
    }
  };

  const getPaymentBadge = () => {
    if (isPaymentDone) {
      return (
        <Badge variant="success" size="sm">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Paid
        </Badge>
      );
    }
    if (ride.paymentStatus === 'failed') {
      return (
        <Badge variant="danger" size="sm">
          <XCircle className="w-3 h-3 mr-1" /> Failed
        </Badge>
      );
    }
    if (isCompleted) {
      return (
        <Badge variant="warning" size="sm">
          Pending Collection
        </Badge>
      );
    }
    return null;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <PageHeader
        title={`Ride ${formattedId}`}
        subtitle="Live navigation and real-time trip status update."
        backTo={ROUTES.DRIVER_RIDES}
        backLabel="Ride History"
        badge={getStatusBadge(ride.status)}
        actions={
          isActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSimulateMovement}
              className="text-xs font-bold text-purple-700 border-purple-200 hover:bg-purple-50"
            >
              <Locate className="w-3.5 h-3.5 mr-1.5" /> Simulate Step Movement
            </Button>
          )
        }
      />

      {/* ─── Live Navigation Map ───────────────────────────────────── */}
      <Card className="p-0 border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold">Driver Live Navigation Map</span>
          </div>
          <div className="text-[11px] text-purple-300 font-mono">
            {ride.status === 'in_progress' ? 'En Route to Destination' : 'En Route to Pickup'}
          </div>
        </div>

        <RideMap
          pickupLocation={ride.pickupLocation}
          dropoffLocation={ride.dropoffLocation}
          driverLocation={{ coordinates: driverCoords, heading }}
          routeGeometry={ride.routeGeometry || []}
          rideStatus={ride.status}
          height="380px"
          etaMinutes={ride.currentEtaMinutes || ride.estimatedDuration}
          distanceKm={ride.currentDistanceKm || ride.estimatedDistance}
        />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Route Details & Actions (2 cols) */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6 border border-slate-200/80">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-purple-600" /> Route & Pick/Drop Details
            </h3>

            <div className="space-y-6 relative ml-2">
              <div className="absolute left-[11px] top-6 bottom-6 w-0.5 bg-slate-200" />

              <div className="flex items-start gap-4 relative z-10">
                <div className="w-6 h-6 rounded-full bg-emerald-100 border-4 border-white flex items-center justify-center shrink-0 shadow-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pickup Point</div>
                    <div className="text-xs font-semibold text-slate-500">{formatDate(ride.requestedAt)}</div>
                  </div>
                  <div className="text-sm font-semibold text-slate-800">{ride.pickupLocation?.address}</div>
                </div>
              </div>

              <div className="flex items-start gap-4 relative z-10">
                <div className="w-6 h-6 rounded-full bg-rose-100 border-4 border-white flex items-center justify-center shrink-0 shadow-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Drop-off Point</div>
                    <div className="text-xs font-semibold text-slate-500">
                      {ride.completedAt ? formatDate(ride.completedAt) : `Est. ~${ride.estimatedDuration || 15}m`}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-slate-800">{ride.dropoffLocation?.address}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Duration</div>
                  <div className="text-sm font-bold text-slate-900">~{ride.estimatedDuration || 15} min</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Distance</div>
                  <div className="text-sm font-bold text-slate-900">{ride.estimatedDistance || 0} km</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Card for Active Ride State Management */}
          {isActive && (
            <Card className="p-6 border border-purple-200 bg-purple-50/50 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900">
                  Trip Execution & Status Control
                </h3>
                <Badge variant="purple" size="sm">
                  {ride.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              {/* Status progression actions */}
              <div className="flex flex-col gap-3">
                {ride.status === 'accepted' && (
                  <div className="space-y-2">
                    <p className="text-xs text-purple-950 font-medium">
                      Drive to passenger pickup address at <strong>{ride.pickupLocation?.address}</strong>.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        loading={isUpdating}
                        onClick={() => handleUpdateStatus('driver_arriving')}
                        className="w-full justify-center text-xs font-bold"
                      >
                        On My Way to Pickup
                      </Button>
                      <Button
                        variant="primary"
                        loading={isUpdating}
                        onClick={() => handleUpdateStatus('arrived')}
                        className="w-full justify-center text-xs font-bold bg-purple-700 hover:bg-purple-800"
                      >
                        Arrived at Pickup Location
                      </Button>
                    </div>
                  </div>
                )}

                {ride.status === 'driver_arriving' && (
                  <Button
                    variant="primary"
                    loading={isUpdating}
                    onClick={() => handleUpdateStatus('arrived')}
                    className="w-full justify-center text-xs font-bold py-3 bg-purple-700 hover:bg-purple-800"
                  >
                    Mark Arrived at Pickup Location
                  </Button>
                )}

                {ride.status === 'arrived' && (
                  <div className="space-y-3">
                    <p className="text-xs text-purple-950 font-medium">
                      Ask the passenger for their 4-digit verification OTP to start the trip.
                    </p>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="Enter 4-digit OTP"
                        value={enteredOtp}
                        onChange={(e) => {
                          setEnteredOtp(e.target.value);
                          setOtpError('');
                        }}
                        className="px-3 py-2 text-sm font-mono font-bold tracking-widest text-center rounded-xl border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                      />
                      <Button
                        variant="primary"
                        loading={isUpdating}
                        onClick={() => handleUpdateStatus('in_progress')}
                        className="flex-1 justify-center text-xs font-bold py-2.5 bg-emerald-600 hover:bg-emerald-700"
                      >
                        Verify OTP & Start Ride
                      </Button>
                    </div>
                    {otpError && <p className="text-xs text-rose-600 font-semibold">{otpError}</p>}
                    <p className="text-[11px] text-slate-500">
                      Passenger OTP for reference: <strong className="font-mono text-purple-900">{ride.otp}</strong>
                    </p>
                  </div>
                )}

                {ride.status === 'in_progress' && (
                  <div className="space-y-2">
                    <p className="text-xs text-purple-950 font-medium">
                      Trip in progress to <strong>{ride.dropoffLocation?.address}</strong>.
                    </p>
                    <Button
                      variant="success"
                      loading={isUpdating}
                      onClick={async () => {
                        setIsUpdating(true);
                        try {
                          const res = await rideService.completeRide(id);
                          if (res.success && res.data) {
                            toast.success('✅ Ride completed successfully!');
                            setRide(res.data.ride || res.data);
                          }
                        } catch (err) {
                          toast.error(err.message || 'Failed to complete ride.');
                        } finally {
                          setIsUpdating(false);
                        }
                      }}
                      className="w-full justify-center text-xs font-bold py-3 bg-emerald-600 hover:bg-emerald-700 shadow-md"
                    >
                      Complete Trip & Collect Cash/UPI ₹{ride.fare}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* ─── Phase 9: Earnings & Fare Breakdown Card (enhanced) ── */}
          <Card className="p-6 border border-slate-200/80">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px]">₹</span>
                Earnings & Fare Breakdown
              </span>
              {getPaymentBadge()}
            </h3>

            <div className="space-y-3 text-sm">
              {ride.fareBreakdown?.baseFare !== undefined && (
                <div className="flex justify-between text-slate-600">
                  <span>Base Fare</span>
                  <span className="font-semibold">₹{ride.fareBreakdown.baseFare}</span>
                </div>
              )}
              {ride.fareBreakdown?.distanceFare !== undefined && (
                <div className="flex justify-between text-slate-600">
                  <span>Distance ({ride.estimatedDistance || 0} km)</span>
                  <span className="font-semibold">₹{ride.fareBreakdown.distanceFare}</span>
                </div>
              )}
              {ride.fareBreakdown?.timeFare !== undefined && (
                <div className="flex justify-between text-slate-600">
                  <span>Time (~{ride.estimatedDuration || 0} mins)</span>
                  <span className="font-semibold">₹{ride.fareBreakdown.timeFare}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Trip Fare</span>
                <span>₹{ride.fare}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Platform Commission (0% Pilot)</span>
                <span className="text-emerald-700 font-semibold">₹0</span>
              </div>
              {ride.fareBreakdown?.tax > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>GST / Tax</span>
                  <span>₹{ride.fareBreakdown.tax}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-900">Total Net Earned</span>
                <span className="text-xl font-extrabold text-emerald-600">₹{ride.fare}</span>
              </div>
            </div>

            {/* Payment Status for completed rides */}
            {isCompleted && (
              <div className="mt-4 space-y-3">
                {isPaymentDone && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-bold">Payment Received</div>
                      <div className="text-[11px] text-emerald-700 mt-0.5">
                        {ride.paymentMethod === 'cash' ? 'Cash collected' : 'Online payment'} • ₹{ride.fare}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* ─── Phase 9: Cash Collection Action Card ──────────────── */}
          {needsCashCollection && (
            <Card className="p-6 border-2 border-amber-200 bg-amber-50/50 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-amber-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    Collect Payment from Passenger
                  </h3>
                </div>
                <Badge variant="warning" size="sm">Pending</Badge>
              </div>

              <p className="text-xs text-amber-900">
                Trip is complete. Collect <span className="font-extrabold text-amber-950">₹{ride.fare}</span> from the passenger via Cash or UPI QR, then confirm collection below.
              </p>

              <div className="p-3 rounded-xl bg-white border border-amber-200 text-xs text-slate-600 space-y-1">
                <div className="font-bold text-slate-700">Payment Amount: ₹{ride.fare}</div>
                <div className="text-[11px]">Accept cash notes or scan passenger's UPI QR code directly.</div>
              </div>

              <Button
                variant="primary"
                size="md"
                loading={isConfirmingCash}
                onClick={handleConfirmCashCollection}
                className="w-full justify-center text-sm font-bold py-3 bg-emerald-600 hover:bg-emerald-700 shadow-md"
              >
                <Banknote className="w-4 h-4 mr-2" />
                Confirm Cash Collected • ₹{ride.fare}
              </Button>
            </Card>
          )}

          {/* ─── Phase 9: View Invoice Card (after payment) ────────── */}
          {isPaymentDone && isCompleted && (
            <Card className="p-5 border border-emerald-200 bg-emerald-50/30 space-y-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                  Trip Invoice
                </span>
              </div>
              <p className="text-[11px] text-emerald-800">
                Payment of ₹{ride.fare} has been confirmed. View the detailed trip invoice.
              </p>
              <Button
                variant="outline"
                size="sm"
                loading={isLoadingInvoice}
                onClick={handleViewInvoice}
                className="w-full justify-center text-xs font-bold text-emerald-800 border-emerald-300 hover:bg-emerald-100"
              >
                <Receipt className="w-3.5 h-3.5 mr-1.5" /> View Trip Invoice
              </Button>
            </Card>
          )}

          {/* ─── Rate Passenger Card (after payment, if not yet rated) ── */}
          {isCompleted && isPaymentDone && !hasRated && !ride.hasDriverRated && (
            <Card className="p-5 border border-amber-200 bg-amber-50/30 space-y-3">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Rate Passenger
                </span>
              </div>
              <p className="text-[11px] text-amber-800">
                How was the passenger? Your feedback helps improve the Sanghini community.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRatingModalOpen(true)}
                className="w-full justify-center text-xs font-bold text-amber-800 border-amber-300 hover:bg-amber-100"
              >
                <Star className="w-3.5 h-3.5 mr-1.5" /> Rate & Review Passenger
              </Button>
            </Card>
          )}
        </div>

        {/* Right Column: Passenger Info & Safety (1 col) */}
        <div className="space-y-6">
          <Card className="p-6 border border-slate-200/80 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto text-xl font-bold border border-purple-200">
              {ride.passenger?.name ? ride.passenger.name.charAt(0) : 'P'}
            </div>
            <h3 className="font-bold text-slate-900 text-base">{ride.passenger?.name || 'Passenger'}</h3>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                <Star className="w-3 h-3 fill-current" /> 4.9
              </span>
              <span>•</span>
              <span>Verified Passenger</span>
            </div>

            {isActive && ride.passenger?.phone && (
              <div className="pt-2">
                <a href={`tel:${ride.passenger.phone}`}>
                  <Button variant="outline" size="sm" className="w-full justify-center text-xs font-bold">
                    <Phone className="w-3.5 h-3.5 mr-1.5" /> Call Passenger ({ride.passenger.phone})
                  </Button>
                </a>
              </div>
            )}
          </Card>

          <Card className="p-5 border border-purple-100 bg-purple-50/40 text-xs text-slate-600 space-y-2">
            <h4 className="font-bold text-purple-900 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-purple-700" /> Udaipur Sanghini Protocol
            </h4>
            <p className="text-[11px] leading-relaxed">
              Always ensure passenger safety, confirm the destination, and collect payment directly via cash or UPI QR upon destination arrival.
            </p>
          </Card>
        </div>
      </div>

      {/* ─── Phase 9: Invoice Modal ──────────────────────────────── */}
      <InvoiceModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        invoice={invoiceData}
      />

      {/* ─── Driver Rating Modal ─────────────────────────────────── */}
      <RatingModal
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        ride={ride}
        onRatingSubmitted={() => {
          setHasRated(true);
          fetchRide();
        }}
      />
    </div>
  );
}
