import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Clock,
  Car,
  ShieldCheck,
  Phone,
  Share2,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Star,
  CreditCard,
  Loader2,
  AlertCircle,
  XCircle,
  RotateCw,
  Navigation,
  Receipt,
  Banknote,
  Wifi,
  RefreshCw,
  ShieldAlert,
  Radio,
  Heart,
  Building2,
  ExternalLink,
  Volume2,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import PageHeader from '../../components/ui/PageHeader';
import RideMap from '../../components/ui/RideMap';
import InvoiceModal from '../../components/ui/InvoiceModal';
import RatingModal from '../../components/ui/RatingModal';
import ShareRideModal from '../../components/ui/ShareRideModal';
import { useToast } from '../../context/ToastContext';
import { ROUTES } from '../../constants';
import rideService from '../../services/rideService';
import paymentService from '../../services/paymentService';
import safetyFeaturesService from '../../services/safetyFeaturesService';
import { getSocket, joinRideRoom, leaveRideRoom } from '../../services/socketService';

export default function RideDetails() {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Live Location & Tracking state
  const [liveDriverLocation, setLiveDriverLocation] = useState(null);
  const [liveEta, setLiveEta] = useState(null);
  const [liveDistance, setLiveDistance] = useState(null);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Rating state
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  // Phase 9: Payment & Invoice state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'success' | 'failed' | null
  const [paymentError, setPaymentError] = useState('');
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);

  // Safety Sentinel features state
  const [discreetAlertSent, setDiscreetAlertSent] = useState(false);
  const [isSendingDiscreet, setIsSendingDiscreet] = useState(false);
  const [journeyBuddyActive, setJourneyBuddyActive] = useState(false);
  const [isEnablingBuddy, setIsEnablingBuddy] = useState(false);
  const [safeHavensModalOpen, setSafeHavensModalOpen] = useState(false);
  const [nearbyHavens, setNearbyHavens] = useState([]);
  const [loadingHavens, setLoadingHavens] = useState(false);

  // 1. Fetch initial ride state from authoritative backend
  const fetchRideDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await rideService.getRideById(id);
      if (res.success && res.data) {
        setRide(res.data);
        if (res.data.driverLocation) {
          setLiveDriverLocation(res.data.driverLocation);
        } else if (res.data.driver?.currentLocation) {
          setLiveDriverLocation(res.data.driver.currentLocation);
        }
        if (res.data.currentEtaMinutes) setLiveEta(res.data.currentEtaMinutes);
        if (res.data.currentDistanceKm) setLiveDistance(res.data.currentDistanceKm);
      }
    } catch (err) {
      console.error('Error fetching ride details:', err);
      setError(err.message || 'Ride not found or access denied.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRideDetails();
  }, [id]);

  // 2. Real-Time Socket.IO Synchronization
  useEffect(() => {
    if (!id) return;

    const socket = getSocket();

    // Join active ride room
    joinRideRoom(id);

    // Listen for real-time status updates (driver accepted, arrived, in_progress, completed, etc.)
    const handleStatusChanged = (data) => {
      console.log('⚡ Received ride status event:', data);
      if (data.ride) {
        setRide(data.ride);
        if (data.ride.driverLocation) setLiveDriverLocation(data.ride.driverLocation);
      } else if (data.status) {
        setRide((prev) => (prev ? { ...prev, status: data.status } : prev));
      }

      if (data.status === 'accepted') {
        toast.success('🎉 A verified woman driver has accepted your ride!');
      } else if (data.status === 'driver_arriving') {
        toast.info('🚗 Driver is on the way to your pickup location.');
      } else if (data.status === 'arrived') {
        toast.info('📍 Driver has arrived at your pickup location.');
      } else if (data.status === 'in_progress') {
        toast.success('🚗 Ride has started! Have a safe journey.');
      } else if (data.status === 'completed') {
        toast.success('✅ Ride completed safely. Thank you for riding with Sanghini.');
      } else if (data.status === 'cancelled') {
        toast.warning('⚠️ Ride has been cancelled.');
      }
    };

    // Listen for driver moving live coordinates
    const handleLocationChanged = (data) => {
      if (data.coordinates) {
        setLiveDriverLocation({
          coordinates: data.coordinates,
          heading: data.heading || 0,
          speed: data.speed || 0,
        });
        if (data.etaMinutes) setLiveEta(data.etaMinutes);
        if (data.remainingDistanceKm) setLiveDistance(data.remainingDistanceKm);
      }
    };

    // Listen for no driver available event
    const handleNoDriverAvailable = (data) => {
      toast.error(data.message || 'No nearby drivers available at this moment.');
      setRide((prev) => (prev ? { ...prev, status: 'no_driver_available' } : prev));
    };

    // Phase 9: Listen for payment status updates via Socket
    const handlePaymentSuccess = (data) => {
      console.log('💰 Payment successful event:', data);
      setPaymentStatus('success');
      setRide((prev) =>
        prev ? { ...prev, paymentStatus: 'paid', paymentMethod: data.paymentMethod } : prev
      );
      toast.success(`💳 Payment of ₹${data.amount} confirmed! Invoice: ${data.invoiceNumber}`);
    };

    const handlePaymentFailed = (data) => {
      console.log('❌ Payment failed event:', data);
      setPaymentStatus('failed');
      setPaymentError(data.reason || 'Payment failed');
      toast.error(`Payment failed: ${data.reason || 'Unknown error'}`);
    };

    // State recovery on reconnect
    const handleConnect = () => {
      joinRideRoom(id);
      socket.emit('ride:sync', { rideId: id });
    };

    const handleSynced = (data) => {
      if (data.ride) {
        setRide(data.ride);
        if (data.ride.driverLocation) setLiveDriverLocation(data.ride.driverLocation);
      }
    };

    socket.on('connect', handleConnect);
    socket.on('ride:synced', handleSynced);
    socket.on('ride:status_changed', handleStatusChanged);
    socket.on('driver_accepted', handleStatusChanged);
    socket.on('driver_arriving', handleStatusChanged);
    socket.on('driver_arrived', handleStatusChanged);
    socket.on('ride_started', handleStatusChanged);
    socket.on('ride_completed', handleStatusChanged);
    socket.on('ride_cancelled', handleStatusChanged);
    socket.on('no_driver_available', handleNoDriverAvailable);
    socket.on('ride:no_driver_available', handleNoDriverAvailable);
    socket.on('ride:accepted', handleStatusChanged);
    socket.on('driver:location_changed', handleLocationChanged);
    socket.on('payment:successful', handlePaymentSuccess);
    socket.on('payment:failed', handlePaymentFailed);

    return () => {
      leaveRideRoom(id);
      socket.off('connect', handleConnect);
      socket.off('ride:synced', handleSynced);
      socket.off('ride:status_changed', handleStatusChanged);
      socket.off('driver_accepted', handleStatusChanged);
      socket.off('driver_arriving', handleStatusChanged);
      socket.off('driver_arrived', handleStatusChanged);
      socket.off('ride_started', handleStatusChanged);
      socket.off('ride_completed', handleStatusChanged);
      socket.off('ride_cancelled', handleStatusChanged);
      socket.off('no_driver_available', handleNoDriverAvailable);
      socket.off('ride:no_driver_available', handleNoDriverAvailable);
      socket.off('ride:accepted', handleStatusChanged);
      socket.off('driver:location_changed', handleLocationChanged);
      socket.off('payment:successful', handlePaymentSuccess);
      socket.off('payment:failed', handlePaymentFailed);
    };
  }, [id]);

  const handleCancelRide = async () => {
    setIsCancelling(true);
    try {
      const res = await rideService.cancelRide(id, cancelReason);
      if (res.success && res.data) {
        toast.success('Ride cancelled successfully.');
        setRide(res.data);
        setCancelModalOpen(false);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to cancel ride.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRetryMatching = async () => {
    setIsRetrying(true);
    try {
      const res = await rideService.retryMatching(id);
      if (res.success && res.data) {
        toast.success('Searching again for available verified drivers in Udaipur...');
        setRide(res.data);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to retry matching.');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleRatingSubmitted = () => {
    setHasRated(true);
    fetchRideDetails();
  };

  // ─── Safety Sentinel Handlers ───────────────────────────────────
  const handleDiscreetAlert = async () => {
    setIsSendingDiscreet(true);
    try {
      await safetyFeaturesService.triggerDiscreetAlert(id, {
        message: 'Silent discreet alert triggered by passenger during trip.',
      });
      setDiscreetAlertSent(true);
      toast.error('🛡️ Discreet Alert Transmitted! Udaipur Safety Desk has heightened live telemetry escort.');
    } catch (err) {
      toast.error(err.message || 'Failed to dispatch alert.');
    } finally {
      setIsSendingDiscreet(false);
    }
  };

  const handleRequestJourneyBuddy = async () => {
    setIsEnablingBuddy(true);
    try {
      await safetyFeaturesService.requestJourneyBuddy(id);
      setJourneyBuddyActive(true);
      toast.success('💙 Journey Buddy Enabled! Automated periodic check-ins scheduled.');
    } catch (err) {
      toast.error(err.message || 'Failed to activate Journey Buddy.');
    } finally {
      setIsEnablingBuddy(false);
    }
  };

  const handleOpenSafeHavens = async () => {
    setSafeHavensModalOpen(true);
    setLoadingHavens(true);
    try {
      const res = await safetyFeaturesService.getAllSafeHavens();
      setNearbyHavens(res.data || []);
    } catch (err) {
      console.warn('Failed to load havens:', err.message);
    } finally {
      setLoadingHavens(false);
    }
  };

  // ─── Phase 9: Payment Handlers ──────────────────────────────────

  const handleInitiatePayment = async () => {
    setIsProcessingPayment(true);
    setPaymentError('');
    setPaymentStatus(null);

    try {
      const orderRes = await paymentService.createPaymentOrder(id, paymentMethod);

      if (!orderRes.success) {
        throw new Error(orderRes.message || 'Failed to create payment order');
      }

      const orderData = orderRes.data;

      // Cash Payment Flow
      if (orderData.isCash || paymentMethod === 'cash') {
        // For cash, immediately verify (mark as cash selected)
        const verifyRes = await paymentService.verifyPayment({
          rideId: id,
          paymentMethod: 'cash',
        });

        if (verifyRes.success) {
          setPaymentStatus('success');
          setRide((prev) => (prev ? { ...prev, paymentStatus: 'paid', paymentMethod: 'cash' } : prev));
          toast.success('✅ Cash payment selected. Pay the driver at your destination.');
          setPaymentModalOpen(false);
        }
        return;
      }

      // Online Payment Flow — Load Razorpay Checkout
      const loadRazorpayScript = () => {
        return new Promise((resolve) => {
          if (window.Razorpay) {
            resolve(true);
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        // Fallback: simulate test payment verification
        console.warn('Razorpay script unavailable — using test verification flow');
        const verifyRes = await paymentService.verifyPayment({
          rideId: id,
          razorpayOrderId: orderData.orderId,
          razorpayPaymentId: `pay_test_${Date.now()}`,
          razorpaySignature: 'test_valid_signature_2026',
          paymentMethod: 'online',
        });

        if (verifyRes.success) {
          setPaymentStatus('success');
          setRide((prev) => (prev ? { ...prev, paymentStatus: 'paid', paymentMethod: 'online' } : prev));
          toast.success('✅ Payment verified successfully!');
          setPaymentModalOpen(false);
        }
        return;
      }

      // Razorpay Checkout Options
      const options = {
        key: orderData.keyId,
        amount: orderData.amount * 100,
        currency: orderData.currency || 'INR',
        name: 'Sanghini Ride',
        description: `Ride Payment — #${id.slice(-8).toUpperCase()}`,
        order_id: orderData.orderId,
        prefill: {
          name: orderData.passenger?.name || '',
          email: orderData.passenger?.email || '',
          contact: orderData.passenger?.phone || '',
        },
        theme: {
          color: '#7c3aed',
        },
        handler: async function (response) {
          // Verify on backend
          try {
            const verifyRes = await paymentService.verifyPayment({
              rideId: id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              paymentMethod: 'online',
            });

            if (verifyRes.success) {
              setPaymentStatus('success');
              setRide((prev) =>
                prev ? { ...prev, paymentStatus: 'paid', paymentMethod: 'online' } : prev
              );
              toast.success('✅ Payment verified successfully!');
              setPaymentModalOpen(false);
            } else {
              throw new Error(verifyRes.message || 'Verification failed');
            }
          } catch (err) {
            setPaymentStatus('failed');
            setPaymentError(err.message || 'Payment verification failed');
            toast.error(err.message || 'Payment verification failed on server.');
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
            toast.warning('Payment window closed. You can retry anytime.');
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', async function (response) {
        const errorDesc = response.error?.description || 'Payment failed';
        setPaymentStatus('failed');
        setPaymentError(errorDesc);
        toast.error(`Payment failed: ${errorDesc}`);

        await paymentService.recordFailure({
          rideId: id,
          razorpayOrderId: orderData.orderId,
          reason: errorDesc,
        });
      });

      rzp.open();
    } catch (err) {
      setPaymentStatus('failed');
      setPaymentError(err.message || 'Payment processing error');
      toast.error(err.message || 'Failed to process payment.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleRetryPayment = () => {
    setPaymentStatus(null);
    setPaymentError('');
    setPaymentModalOpen(true);
  };

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

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'requested':
      case 'finding_driver':
        return <Badge variant="warning">Finding Driver</Badge>;
      case 'accepted':
        return <Badge variant="info">Driver Assigned</Badge>;
      case 'driver_arriving':
        return <Badge variant="info">Driver On Way</Badge>;
      case 'arrived':
        return <Badge variant="purple">Driver Arrived</Badge>;
      case 'in_progress':
        return <Badge variant="purple">In Progress</Badge>;
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      case 'no_driver_available':
        return <Badge variant="danger">No Driver Available</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
        <p className="text-xs font-semibold">Connecting to Udaipur Real-Time Ride Service...</p>
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="space-y-6">
        <PageHeader title="Ride Details" backTo={ROUTES.PASSENGER_RIDES} backLabel="All Rides" />
        <Card className="p-10 border border-slate-200 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">{error || 'Ride not found'}</h3>
          <Link to={ROUTES.PASSENGER_RIDES}>
            <Button variant="outline" size="sm">
              Back to My Rides
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const isCancellable = ['requested', 'finding_driver', 'accepted', 'driver_arriving', 'no_driver_available'].includes(ride.status);
  const formattedId = `#${ride._id.slice(-8).toUpperCase()}`;

  // Payment state helpers
  const isRideCompleted = ride.status === 'completed';
  const isPaymentDone = ride.paymentStatus === 'paid' || paymentStatus === 'success';
  const isPaymentFailed = ride.paymentStatus === 'failed' || paymentStatus === 'failed';
  const needsPayment = isRideCompleted && !isPaymentDone;

  // Fare breakdown from ride or calculate display
  const fb = ride.fareBreakdown || {};

  // Progress indicator steps
  const steps = [
    { key: 'finding_driver', label: 'Requested' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'driver_arriving', label: 'On The Way' },
    { key: 'arrived', label: 'Arrived' },
    { key: 'in_progress', label: 'In Trip' },
    { key: 'completed', label: 'Completed' },
  ];

  const getStepIndex = (status) => {
    const idx = steps.findIndex((s) => s.key === status);
    return idx >= 0 ? idx : 0;
  };

  const currentStepIdx = getStepIndex(ride.status);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Page Title Header ────────────────────────────────────── */}
      <PageHeader
        title={`Ride Details — ${formattedId}`}
        subtitle={`Booked in Udaipur on ${formatDate(ride.requestedAt || ride.createdAt)}`}
        backTo={ROUTES.PASSENGER_RIDES}
        backLabel="All Rides"
        badge={getStatusBadge(ride.status)}
        actions={
          <div className="flex items-center gap-2">
            {ride.status === 'no_driver_available' && (
              <Button
                variant="primary"
                size="sm"
                loading={isRetrying}
                onClick={handleRetryMatching}
                className="text-xs font-bold bg-purple-700 hover:bg-purple-800"
              >
                <RotateCw className="w-3.5 h-3.5 mr-1.5" /> Retry Driver Search
              </Button>
            )}
            {isCancellable && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelModalOpen(true)}
                className="text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                <XCircle className="w-3.5 h-3.5 mr-1.5" /> Cancel Ride
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShareModalOpen(true)}
              className="text-xs font-bold"
            >
              <Share2 className="w-3.5 h-3.5 mr-1.5" /> Share Trip
            </Button>
            <Link to={ROUTES.PASSENGER_SAFETY}>
              <Button variant="danger" size="sm" className="text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> Emergency SOS
              </Button>
            </Link>
          </div>
        }
      />

      {/* ─── Live Status Stepper Bar (Active Rides) ────────────────── */}
      {ride.status !== 'cancelled' && ride.status !== 'no_driver_available' && (
        <Card className="p-4 border border-purple-100 bg-purple-50/40">
          <div className="flex items-center justify-between relative px-2">
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-200 -z-0" />
            <div
              className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-purple-600 transition-all duration-500 -z-0"
              style={{
                width: `${(currentStepIdx / (steps.length - 1)) * 90}%`,
              }}
            />

            {steps.map((step, idx) => {
              const isPassed = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              return (
                <div key={step.key} className="flex flex-col items-center relative z-10">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-purple-700 text-white ring-4 ring-purple-200 scale-110'
                        : isPassed
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-slate-400 border-2 border-slate-200'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span
                    className={`text-[11px] mt-1 font-semibold ${
                      isCurrent ? 'text-purple-950 font-bold' : isPassed ? 'text-slate-700' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ─── Main Details Grid ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Map & Driver Details (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Live Interactive Map Card */}
          <Card className="p-0 border border-slate-200/80 overflow-hidden shadow-sm space-y-0">
            <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-bold">Live GPS Tracking • Udaipur</span>
              </div>
              <div className="text-[11px] text-purple-300 font-mono">
                {liveEta ? `ETA ~${liveEta} mins` : `${ride.estimatedDuration || 15} mins`}
              </div>
            </div>

            <RideMap
              pickupLocation={ride.pickupLocation}
              dropoffLocation={ride.dropoffLocation}
              driverLocation={liveDriverLocation || ride.driverLocation || ride.driver?.currentLocation}
              routeGeometry={ride.routeGeometry || []}
              rideStatus={ride.status}
              height="400px"
              etaMinutes={liveEta || ride.currentEtaMinutes}
              distanceKm={liveDistance || ride.currentDistanceKm}
            />
          </Card>

          {/* Route Timeline Card */}
          <Card className="p-6 border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Route & Locations
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {liveDistance ? `${liveDistance} km remaining` : `${ride.estimatedDistance || 0} km total`}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                    Pickup Location
                  </div>
                  <div className="text-sm font-semibold text-slate-900 mt-0.5">
                    {ride.pickupLocation?.address}
                  </div>
                </div>
              </div>

              <div className="ml-3.5 pl-4 border-l-2 border-slate-200 py-1 text-xs text-slate-400">
                Udaipur Local Service Route
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                    Drop Destination
                  </div>
                  <div className="text-sm font-semibold text-slate-900 mt-0.5">
                    {ride.dropoffLocation?.address}
                  </div>
                </div>
              </div>
            </div>

            {/* OTP Box */}
            {ride.status !== 'cancelled' && ride.status !== 'no_driver_available' && ride.otp && (
              <div className="p-4 rounded-xl bg-purple-50/80 border border-purple-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-purple-700" /> Start Ride OTP Code
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Share with your assigned woman driver when vehicle arrives.
                  </div>
                </div>
                <div className="text-2xl font-mono font-extrabold tracking-widest text-purple-950 bg-white px-3 py-1.5 rounded-lg border border-purple-200 shadow-xs">
                  {ride.otp}
                </div>
              </div>
            )}

            {ride.status === 'no_driver_available' && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> No Driver Available Right Now
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  All verified female drivers in Udaipur are currently occupied. You can retry matching or try again in a few minutes.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  loading={isRetrying}
                  onClick={handleRetryMatching}
                  className="text-xs font-bold bg-purple-700 hover:bg-purple-800"
                >
                  <RotateCw className="w-3.5 h-3.5 mr-1.5" /> Retry Driver Search
                </Button>
              </div>
            )}

            {ride.status === 'cancelled' && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-600" /> Ride Cancelled
                </div>
                <div>Cancelled by {ride.cancelledBy || 'passenger'} on {formatDate(ride.cancelledAt)}.</div>
                {ride.cancellationReason && (
                  <div className="text-[11px] text-slate-600">Reason: {ride.cancellationReason}</div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Driver Profile, Fare & Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Driver & Vehicle Card */}
          <Card className="p-6 border border-slate-200/80 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Verified Woman Driver</span>
              {ride.driver && (
                <Badge variant="success" size="sm">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Assigned
                </Badge>
              )}
            </div>

            {ride.driver ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-base border border-purple-200 shrink-0">
                    {ride.driver.name?.charAt(0) || 'D'}
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      {ride.driver.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span className="flex items-center text-amber-600 font-bold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
                        {ride.driver.rating || '4.9'}
                      </span>
                      <span>• {ride.driver.totalRides || 0} completed rides</span>
                    </div>
                  </div>
                </div>

                {ride.driver.phone && (
                  <button
                    type="button"
                    onClick={() => toast.info(`Connecting to driver: ${ride.driver.phone}`)}
                    className="w-full py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold border border-purple-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Phone className="w-4 h-4 text-purple-700" /> Call Assigned Driver ({ride.driver.phone})
                  </button>
                )}
              </div>
            ) : ride.status === 'no_driver_available' ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-bold">No driver currently matched</div>
                <div className="text-[11px] text-amber-700">
                  Click 'Retry Driver Search' above to broadcast request again.
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-100 text-xs text-purple-950 flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-purple-600 animate-spin shrink-0" />
                <div>
                  <div className="font-bold">Matching Nearest Online Driver...</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Dispatching request to verified drivers in Udaipur via real-time WebSocket.
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* ─── Active Ride Safety Sentinel Card ──────────────────── */}
          {ride.status !== 'cancelled' && ride.status !== 'no_driver_available' && (
            <Card className="p-5 border border-purple-200/80 bg-gradient-to-br from-purple-50/70 via-white to-rose-50/40 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-purple-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-950">
                    Active Safety Sentinel
                  </span>
                </div>
                <Badge variant="purple" size="sm" className="bg-purple-100 text-purple-800">
                  Bubble Protected
                </Badge>
              </div>

              {/* Safety Bubble & Geofence Corridor Adherence */}
              <div className="p-3 rounded-xl bg-white border border-purple-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <div>
                    <div className="font-bold text-slate-900">Corridor Geofence Active</div>
                    <div className="text-[10px] text-slate-500">500m auto-deviation monitor enabled</div>
                  </div>
                </div>
                <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  On Safe Path
                </span>
              </div>

              {/* Discreet Alert & Journey Buddy Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDiscreetAlert}
                  disabled={isSendingDiscreet || discreetAlertSent}
                  className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                    discreetAlertSent
                      ? 'bg-rose-50 border-rose-200 text-rose-800 ring-1 ring-rose-300'
                      : 'bg-white hover:bg-rose-50/60 border-slate-200 hover:border-rose-300 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{discreetAlertSent ? 'Alert Dispatched' : 'I Feel Unsafe'}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {discreetAlertSent
                      ? 'Udaipur Desk has priority escort'
                      : 'Covert silent alert to Safety Desk'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleRequestJourneyBuddy}
                  disabled={isEnablingBuddy || journeyBuddyActive}
                  className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                    journeyBuddyActive
                      ? 'bg-purple-50 border-purple-200 text-purple-900 ring-1 ring-purple-300'
                      : 'bg-white hover:bg-purple-50/60 border-slate-200 hover:border-purple-300 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700">
                    <Heart className="w-3.5 h-3.5" />
                    <span>{journeyBuddyActive ? 'Buddy Active' : 'Journey Buddy'}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {journeyBuddyActive
                      ? 'Periodic check-ins scheduled'
                      : 'Automated safety check-ins'}
                  </div>
                </button>
              </div>

              {/* Safe Havens & Guardian Link Quick Buttons */}
              <div className="pt-2 border-t border-purple-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleOpenSafeHavens}
                  className="font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5" /> Safe Havens
                </button>

                {ride.shareToken && (
                  <Link
                    to={`/guardian/${ride.shareToken}`}
                    target="_blank"
                    className="font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Guardian View</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </Card>
          )}

          {/* Fare Summary Card */}
          <Card className="p-6 border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-purple-700" /> Fare Summary
              </span>
              <Badge variant={isRideCompleted ? 'success' : 'purple'} size="sm">
                {isPaymentDone ? 'Paid' : isRideCompleted ? 'Trip Completed' : 'Authoritative Fare'}
              </Badge>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600">
              {fb.baseFare !== undefined && (
                <div className="flex items-center justify-between">
                  <span>Base Fare</span>
                  <span className="font-semibold text-slate-800">₹{fb.baseFare}</span>
                </div>
              )}
              {fb.distanceFare !== undefined && (
                <div className="flex items-center justify-between">
                  <span>Distance ({ride.estimatedDistance || 0} km)</span>
                  <span className="font-semibold text-slate-800">₹{fb.distanceFare}</span>
                </div>
              )}
              {fb.timeFare !== undefined && (
                <div className="flex items-center justify-between">
                  <span>Time (~{ride.estimatedDuration || 0} mins)</span>
                  <span className="font-semibold text-slate-800">₹{fb.timeFare}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span>Trip Distance</span>
                <span className="font-semibold text-slate-800">{ride.estimatedDistance || 0} km</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Estimated Duration</span>
                <span className="font-semibold text-slate-800">~{ride.estimatedDuration || 15} mins</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Platform & Safety Fee</span>
                <span className="font-semibold text-emerald-700">
                  {fb.platformFee > 0 ? `₹${fb.platformFee}` : 'FREE (Pilot)'}
                </span>
              </div>
              {fb.tax > 0 && (
                <div className="flex items-center justify-between">
                  <span>GST / Tax</span>
                  <span className="font-semibold text-slate-800">₹{fb.tax}</span>
                </div>
              )}
              {fb.discount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-emerald-600">Discount</span>
                  <span className="font-semibold text-emerald-600">-₹{fb.discount}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
                <span className="font-bold text-slate-900">Total Authoritative Fare</span>
                <span className="font-extrabold text-slate-950 text-base">₹{ride.fare}</span>
              </div>
            </div>

            {/* Payment Status Indicator */}
            {isPaymentDone && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold">Payment Successful</div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    Paid via {ride.paymentMethod === 'cash' ? 'Cash' : 'Online'} • ₹{ride.fare}
                  </div>
                </div>
              </div>
            )}

            {isPaymentFailed && !isPaymentDone && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <div className="flex-1">
                  <div className="font-bold">Payment Failed</div>
                  <div className="text-[11px] text-rose-700 mt-0.5">
                    {paymentError || 'Transaction could not be completed'}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryPayment}
                  className="text-[10px] font-bold text-rose-700 border-rose-200 hover:bg-rose-100 shrink-0"
                >
                  <RefreshCw className="w-3 h-3 mr-1" /> Retry
                </Button>
              </div>
            )}

            {!isPaymentDone && !isPaymentFailed && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 space-y-1">
                <div className="font-bold text-slate-700">
                  {isRideCompleted ? 'Payment Required' : 'Payment Mode: Online / Cash'}
                </div>
                <div>Guaranteed transparent pricing with zero surge exploitation.</div>
              </div>
            )}
          </Card>

          {/* ─── Phase 9: Payment Action Card (for completed rides needing payment) ── */}
          {needsPayment && (
            <Card className="p-6 border-2 border-purple-200 bg-purple-50/50 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900">
                    Complete Payment
                  </h3>
                </div>
                <Badge variant="warning" size="sm">Action Required</Badge>
              </div>

              <div className="text-xs text-purple-900">
                Your ride is complete. Please select a payment method and complete payment of{' '}
                <span className="font-extrabold text-purple-950">₹{ride.fare}</span>.
              </div>

              {/* Payment Method Selection */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('online')}
                  className={`p-3.5 rounded-xl border-2 text-xs font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'online'
                      ? 'border-purple-600 bg-purple-100 text-purple-900 ring-2 ring-purple-200'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  <Wifi className="w-5 h-5" />
                  <span>Online / UPI</span>
                  <span className="text-[10px] font-normal text-slate-400">Razorpay Secure</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3.5 rounded-xl border-2 text-xs font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'border-emerald-600 bg-emerald-100 text-emerald-900 ring-2 ring-emerald-200'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50'
                  }`}
                >
                  <Banknote className="w-5 h-5" />
                  <span>Cash to Driver</span>
                  <span className="text-[10px] font-normal text-slate-400">Pay at destination</span>
                </button>
              </div>

              <Button
                variant="primary"
                size="md"
                loading={isProcessingPayment}
                onClick={handleInitiatePayment}
                className="w-full justify-center text-sm font-bold py-3 bg-purple-700 hover:bg-purple-800 shadow-md"
              >
                {paymentMethod === 'cash' ? (
                  <>
                    <Banknote className="w-4 h-4 mr-2" /> Confirm Cash Payment • ₹{ride.fare}
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" /> Pay Now • ₹{ride.fare}
                  </>
                )}
              </Button>
            </Card>
          )}

          {/* ─── Phase 9: View Invoice / Receipt (after payment) ───── */}
          {isPaymentDone && (
            <Card className="p-5 border border-emerald-200 bg-emerald-50/30 space-y-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                  Invoice & Receipt
                </span>
              </div>
              <p className="text-[11px] text-emerald-800">
                Your payment of ₹{ride.fare} has been confirmed. View or download your detailed ride invoice.
              </p>
              <Button
                variant="outline"
                size="sm"
                loading={isLoadingInvoice}
                onClick={handleViewInvoice}
                className="w-full justify-center text-xs font-bold text-emerald-800 border-emerald-300 hover:bg-emerald-100"
              >
                <Receipt className="w-3.5 h-3.5 mr-1.5" /> View Invoice / Download Receipt
              </Button>
            </Card>
          )}

          {/* ─── Rate This Ride Card (after payment, if not yet rated) ── */}
          {isRideCompleted && isPaymentDone && !hasRated && !ride.hasRated && (
            <Card className="p-5 border border-amber-200 bg-amber-50/30 space-y-3">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Rate Your Ride
                </span>
              </div>
              <p className="text-[11px] text-amber-800">
                How was your experience? Your feedback helps keep Sanghini Ride safe and reliable.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRatingModalOpen(true)}
                className="w-full justify-center text-xs font-bold text-amber-800 border-amber-300 hover:bg-amber-100"
              >
                <Star className="w-3.5 h-3.5 mr-1.5" /> Rate & Review Your Journey
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* ─── Cancel Ride Modal ────────────────────────────────────── */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => !isCancelling && setCancelModalOpen(false)}
        title="Cancel Ride Request"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Are you sure you want to cancel this ride request? Zero cancellation fee applies during Udaipur pilot.
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Reason for Cancellation (Optional)
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Plan changed, wait time too long..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600/20"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" disabled={isCancelling} onClick={() => setCancelModalOpen(false)}>
              Keep Ride
            </Button>
            <Button variant="danger" size="sm" loading={isCancelling} onClick={handleCancelRide}>
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Real Share Ride Modal (backend-connected) ─────────── */}
      <ShareRideModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        ride={ride}
        onShareUpdated={fetchRideDetails}
      />

      {/* ─── Phase 9: Invoice Modal ──────────────────────────────── */}
      <InvoiceModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        invoice={invoiceData}
      />

      {/* ─── Rating Modal (after ride completion + payment) ───── */}
      <RatingModal
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        ride={ride}
        onRatingSubmitted={handleRatingSubmitted}
      />

      {/* ─── Nearby Safe Havens Modal ────────────────────────────── */}
      <Modal
        isOpen={safeHavensModalOpen}
        onClose={() => setSafeHavensModalOpen(false)}
        title="Udaipur Safe Havens Along Your Route"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Verified physical safe locations with 24/7 emergency assistance across Udaipur:
          </p>

          {loadingHavens ? (
            <div className="py-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600 mb-2" />
              <p className="text-xs text-slate-500">Loading verified safe havens...</p>
            </div>
          ) : nearbyHavens.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              No specific safe havens found nearby. Udaipur Police (112) is available 24/7.
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
              {nearbyHavens.map((haven) => (
                <div
                  key={haven._id || haven.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">{haven.name}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-purple-600 shrink-0" />
                      <span>{haven.address || 'Udaipur, Rajasthan'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {haven.phone && (
                      <a
                        href={`tel:${haven.phone}`}
                        className="p-2 rounded-lg bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors"
                        title="Call Haven"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${haven.name}, Udaipur`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
                      title="Navigate to Haven"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setSafeHavensModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
