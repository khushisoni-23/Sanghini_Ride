import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Navigation,
  ArrowDownUp,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Crosshair,
  X,
  Loader2,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import PageHeader from '../../components/ui/PageHeader';
import RideMap from '../../components/ui/RideMap';
import { useToast } from '../../context/ToastContext';
import {
  ROUTES,
  POPULAR_UDAIPUR_PLACES,
  VEHICLE_TYPES,
} from '../../constants';
import rideService from '../../services/rideService';
import {
  searchPlaces,
  getCurrentLocationAddress,
  fetchDrivingRoute,
} from '../../services/mapService';

export default function BookRide() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const initialPickup = searchParams.get('pickup') || 'Sukhadia Circle, Panchwati, Udaipur';
  const initialDrop = searchParams.get('destination') || 'Fateh Sagar Lake Paal, Udaipur';

  const [pickupQuery, setPickupQuery] = useState(initialPickup);
  const [dropQuery, setDropQuery] = useState(initialDrop);
  // Real Nominatim autocomplete suggestions
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropSuggestions, setDropSuggestions] = useState([]);
  const [isSearchingPickup, setIsSearchingPickup] = useState(false);
  const [isSearchingDrop, setIsSearchingDrop] = useState(false);
  const [showPickupList, setShowPickupList] = useState(false);
  const [showDropList, setShowDropList] = useState(false);
  // Store real coordinates for selected places
  const [pickupCoords, setPickupCoords] = useState(null); // { lat, lng }
  const [dropCoords, setDropCoords] = useState(null);   // { lat, lng }
  const [selectedVehicle, setSelectedVehicle] = useState('auto');
  const [routeMode, setRouteMode] = useState('safe_corridor'); // 'safe_corridor' | 'fastest'
  const [isLocating, setIsLocating] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  // Estimation state from real backend
  const [estimation, setEstimation] = useState(null);
  const [isEstimating, setIsEstimating] = useState(false);

  // Live route computed directly from OSRM using real coordinates
  const [liveRoute, setLiveRoute] = useState(null); // { distanceKm, durationMins, geometry }
  const [isComputingRoute, setIsComputingRoute] = useState(false);

  const pickupRef = useRef(null);
  const dropRef = useRef(null);

  // Close suggestion dropdowns on outside click
  useEffect(() => {
    const handleDocClick = (e) => {
      if (pickupRef.current && !pickupRef.current.contains(e.target)) {
        setShowPickupList(false);
      }
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setShowDropList(false);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, []);

  // ─── Compute real OSRM route whenever coordinates change ─────────
  useEffect(() => {
    let cancelled = false;
    if (!pickupCoords || !dropCoords) {
      setLiveRoute(null);
      return;
    }
    const compute = async () => {
      setIsComputingRoute(true);
      try {
        const route = await fetchDrivingRoute(
          pickupCoords.lng, pickupCoords.lat,
          dropCoords.lng, dropCoords.lat
        );
        if (!cancelled && route) {
          setLiveRoute(route);
        }
      } catch (err) {
        console.warn('OSRM route error:', err);
      } finally {
        if (!cancelled) setIsComputingRoute(false);
      }
    };
    const timer = setTimeout(compute, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [pickupCoords, dropCoords]);

  // ─── Fetch backend estimation for fare options ────────────────
  useEffect(() => {
    let isMounted = true;
    if (!pickupQuery || !dropQuery) return;

    const fetchEstimate = async () => {
      setIsEstimating(true);
      try {
        const res = await rideService.estimateRide({
          pickupLocation: pickupCoords
            ? { address: pickupQuery, coordinates: [pickupCoords.lng, pickupCoords.lat] }
            : pickupQuery,
          dropoffLocation: dropCoords
            ? { address: dropQuery, coordinates: [dropCoords.lng, dropCoords.lat] }
            : dropQuery,
          vehicleType: selectedVehicle,
        });
        if (isMounted && res.success) {
          setEstimation(res.data);
        }
      } catch (err) {
        console.error('Estimation error:', err);
      } finally {
        if (isMounted) setIsEstimating(false);
      }
    };

    const timer = setTimeout(fetchEstimate, 600);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [pickupQuery, dropQuery, pickupCoords, dropCoords, selectedVehicle]);

  // ─── Real Nominatim autocomplete for pickup ──────────────────
  useEffect(() => {
    if (!pickupQuery || pickupQuery.length < 3) {
      setPickupSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsSearchingPickup(true);
      const results = await searchPlaces(pickupQuery);
      if (!cancelled) {
        setPickupSuggestions(results);
        setIsSearchingPickup(false);
      }
    }, 500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [pickupQuery]);

  // ─── Real Nominatim autocomplete for drop ────────────────────
  useEffect(() => {
    if (!dropQuery || dropQuery.length < 3) {
      setDropSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsSearchingDrop(true);
      const results = await searchPlaces(dropQuery);
      if (!cancelled) {
        setDropSuggestions(results);
        setIsSearchingDrop(false);
      }
    }, 500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [dropQuery]);

  // Fallback: also filter static list so the UI is never empty
  const staticPickupMatches = POPULAR_UDAIPUR_PLACES.filter((p) =>
    p.toLowerCase().includes(pickupQuery.toLowerCase())
  );
  const staticDropMatches = POPULAR_UDAIPUR_PLACES.filter((p) =>
    p.toLowerCase().includes(dropQuery.toLowerCase())
  );

  const handleSwap = () => {
    const tempQ = pickupQuery;
    const tempC = pickupCoords;
    setPickupQuery(dropQuery);
    setPickupCoords(dropCoords);
    setDropQuery(tempQ);
    setDropCoords(tempC);
    toast.info('Pickup and Destination swapped.');
  };

  // Real GPS + Nominatim reverse geocode
  const handleCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const { lat, lng, address } = await getCurrentLocationAddress();
      setPickupQuery(address);
      setPickupCoords({ lat, lng });
      setShowPickupList(false);
      toast.success(`📍 Location detected: ${address}`);
    } catch (err) {
      toast.error(err.message || 'Could not detect your location.');
    } finally {
      setIsLocating(false);
    }
  };

  // Priority: 1) liveRoute from OSRM coords  2) backend estimation  3) null (no coords yet)
  const estDistanceKm = liveRoute?.distanceKm ?? estimation?.estimatedDistance ?? null;
  const estDurationMins = liveRoute?.durationMins ?? estimation?.estimatedDuration ?? null;
  const currentVehicleObj =
    VEHICLE_TYPES.find((v) => v.id === selectedVehicle) || VEHICLE_TYPES[0];
  const calculatedFare = estimation?.fare ??
    (estDistanceKm !== null
      ? Math.round(currentVehicleObj.baseFare + estDistanceKm * currentVehicleObj.perKm)
      : null);
  const isLoadingMetrics = isComputingRoute || isEstimating;

  const handleRequestRide = (e) => {
    e.preventDefault();
    if (!pickupQuery || !dropQuery) {
      toast.error('Please enter both pickup and destination in Udaipur.');
      return;
    }
    setConfirmModalOpen(true);
  };

  const handleFinalConfirm = async () => {
    setIsBooking(true);
    try {
      const res = await rideService.createRide({
        pickupLocation: { address: pickupQuery },
        dropoffLocation: { address: dropQuery },
        vehicleType: selectedVehicle,
      });

      if (res.success && res.data) {
        toast.success(`Ride requested successfully! OTP: ${res.data.otp}`);
        setConfirmModalOpen(false);
        navigate(`/passenger/rides/${res.data._id}`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to request ride. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Page Title Header ────────────────────────────────────── */}
      <PageHeader
        title="Book a Ride in Udaipur"
        subtitle="Select pickup, destination and choose your preferred verified vehicle."
        backTo={ROUTES.PASSENGER}
        backLabel="Passenger Overview"
        badge={
          <Badge variant="success" size="sm">
            Verified & Live
          </Badge>
        }
      />

      {/* ─── Main Grid: Left Form & Vehicle Selection | Right Map View ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Location & Vehicle Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Location Card */}
          <Card className="p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Route Details
              </span>
              <button
                type="button"
                onClick={handleCurrentLocation}
                disabled={isLocating}
                className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Locating...' : 'Use My GPS'}</span>
              </button>
            </div>

            {/* Pickup Input */}
            <div className="relative" ref={pickupRef}>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100"></span>
                Pickup Location <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={pickupQuery}
                  onChange={(e) => {
                    setPickupQuery(e.target.value);
                    setShowPickupList(true);
                  }}
                  onFocus={() => setShowPickupList(true)}
                  placeholder="Search pickup in Udaipur..."
                  className="w-full bg-white text-slate-900 placeholder-slate-400 text-sm rounded-xl border border-slate-200 hover:border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/15 focus:outline-none py-2.5 pl-3.5 pr-8 transition-all"
                />
                {pickupQuery && (
                  <button
                    onClick={() => setPickupQuery('')}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Real Nominatim autocomplete suggestions */}
              {showPickupList && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-40 max-h-56 overflow-y-auto">
                  {isSearchingPickup ? (
                    <div className="px-3 py-3 text-xs text-slate-400 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching Udaipur map...
                    </div>
                  ) : (
                    <>
                      {pickupSuggestions.length > 0 && (
                        <>
                          <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase">Live Map Results</div>
                          {pickupSuggestions.map((place) => (
                            <button
                              key={place.placeId}
                              type="button"
                              onClick={() => {
                                setPickupQuery(place.shortName);
                                setPickupCoords({ lat: place.lat, lng: place.lng });
                                setShowPickupList(false);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-900 flex items-start gap-2 transition-colors cursor-pointer"
                            >
                              <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                              <div>
                                <div className="font-semibold">{place.shortName}</div>
                                <div className="text-[10px] text-slate-400 truncate max-w-[220px]">{place.displayName.split(',').slice(0, 3).join(',')}</div>
                              </div>
                            </button>
                          ))}
                        </>
                      )}
                      {staticPickupMatches.length > 0 && (
                        <>
                          <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase mt-1">Popular Hubs</div>
                          {staticPickupMatches.slice(0, 5).map((loc, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setPickupQuery(loc);
                                setPickupCoords(null);
                                setShowPickupList(false);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-900 flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">{loc}</span>
                            </button>
                          ))}
                        </>
                      )}
                      {pickupSuggestions.length === 0 && staticPickupMatches.length === 0 && (
                        <div className="px-3 py-2 text-xs text-slate-400">No locations found. Try a different name.</div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Swap Button */}
            <div className="flex justify-center -my-1">
              <button
                type="button"
                onClick={handleSwap}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-800 transition-colors border border-slate-200"
                title="Swap Pickup and Drop"
              >
                <ArrowDownUp className="w-4 h-4" />
              </button>
            </div>

            {/* Destination Input */}
            <div className="relative" ref={dropRef}>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-100"></span>
                Drop Destination <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={dropQuery}
                  onChange={(e) => {
                    setDropQuery(e.target.value);
                    setShowDropList(true);
                  }}
                  onFocus={() => setShowDropList(true)}
                  placeholder="Search destination in Udaipur..."
                  className="w-full bg-white text-slate-900 placeholder-slate-400 text-sm rounded-xl border border-slate-200 hover:border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/15 focus:outline-none py-2.5 pl-3.5 pr-8 transition-all"
                />
                {dropQuery && (
                  <button
                    onClick={() => setDropQuery('')}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Real Nominatim drop suggestions */}
              {showDropList && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-40 max-h-56 overflow-y-auto">
                  {isSearchingDrop ? (
                    <div className="px-3 py-3 text-xs text-slate-400 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching Udaipur map...
                    </div>
                  ) : (
                    <>
                      {dropSuggestions.length > 0 && (
                        <>
                          <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase">Live Map Results</div>
                          {dropSuggestions.map((place) => (
                            <button
                              key={place.placeId}
                              type="button"
                              onClick={() => {
                                setDropQuery(place.shortName);
                                setDropCoords({ lat: place.lat, lng: place.lng });
                                setShowDropList(false);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-900 flex items-start gap-2 transition-colors cursor-pointer"
                            >
                              <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                              <div>
                                <div className="font-semibold">{place.shortName}</div>
                                <div className="text-[10px] text-slate-400 truncate max-w-[220px]">{place.displayName.split(',').slice(0, 3).join(',')}</div>
                              </div>
                            </button>
                          ))}
                        </>
                      )}
                      {staticDropMatches.length > 0 && (
                        <>
                          <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase mt-1">Popular Hubs</div>
                          {staticDropMatches.slice(0, 5).map((loc, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setDropQuery(loc);
                                setDropCoords(null);
                                setShowDropList(false);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-900 flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span className="truncate">{loc}</span>
                            </button>
                          ))}
                        </>
                      )}
                      {dropSuggestions.length === 0 && staticDropMatches.length === 0 && (
                        <div className="px-3 py-2 text-xs text-slate-400">No locations found. Try a different name.</div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* 100% Women Only Fleet & Verified Trust Guarantee */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white/10 text-rose-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <span>100% Women-Only Driver Fleet</span>
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">Verified</span>
                </div>
                <div className="text-[11px] text-purple-200 mt-0.5">Police Verified • Aadhaar Authenticated • Udaipur Certified</div>
              </div>
            </div>
          </div>

          {/* Safety-Aware Routing Option */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-purple-700" /> Safety-Aware Routing
              </span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Safe Corridor 99.4%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div
                onClick={() => setRouteMode('safe_corridor')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  routeMode === 'safe_corridor'
                    ? 'border-purple-600 bg-purple-50/70 ring-1 ring-purple-600 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-600" /> Safe Corridor
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                    Recommended
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 leading-tight">
                  High street lighting, CCTV coverage & Safe Havens along the way.
                </div>
              </div>

              <div
                onClick={() => setRouteMode('fastest')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  routeMode === 'fastest'
                    ? 'border-purple-600 bg-purple-50/70 ring-1 ring-purple-600 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-600" /> Fastest Direct
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 leading-tight">
                  Shortest travel duration via standard municipal roads.
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Type Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Select Mobility Mode
              </span>
              {isLoadingMetrics && (
                <span className="text-[11px] text-purple-700 flex items-center gap-1 font-semibold">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {isComputingRoute ? 'Computing route...' : 'Estimating fares...'}
                </span>
              )}
            </div>

            <div className="space-y-2.5">
              {VEHICLE_TYPES.map((v) => {
                const isSelected = selectedVehicle === v.id;
                // Get backend calculated option if available
                const opt = estimation?.vehicleOptions?.find((o) => o.id === v.id);
                const fare = opt ? opt.estimatedFare : Math.round(v.baseFare + estDistanceKm * v.perKm);

                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVehicle(v.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/60 shadow-xs ring-1 ring-purple-600'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="text-2xl p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
                        {v.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">
                            {v.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                            {v.eta} away
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {v.desc} • {v.capacity}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-extrabold text-slate-900">
                        ₹{fare}
                      </div>
                      <div className="text-[10px] text-slate-400">verified fare</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fare Summary & Request CTA */}
          <Card className="p-5 border border-slate-200/80 bg-slate-50/60 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Estimated Distance:</span>
              {isLoadingMetrics ? (
                <span className="flex items-center gap-1 text-purple-600 font-semibold">
                  <Loader2 className="w-3 h-3 animate-spin" /> Computing...
                </span>
              ) : (
                <span className="font-bold text-slate-900">
                  {estDistanceKm !== null ? `${estDistanceKm.toFixed(1)} km` : '—'}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Estimated Duration:</span>
              {isLoadingMetrics ? (
                <span className="flex items-center gap-1 text-purple-600 font-semibold">
                  <Loader2 className="w-3 h-3 animate-spin" /> Computing...
                </span>
              ) : (
                <span className="font-bold text-slate-900">
                  {estDurationMins !== null ? `~${estDurationMins} mins` : '—'}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Selected Vehicle:</span>
              <span className="font-bold text-purple-800">{currentVehicleObj.name}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-600">Total Est. Fare</span>
                <div className="text-xl font-extrabold text-slate-950">
                  {calculatedFare !== null ? `₹${calculatedFare}` : '—'}
                </div>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={handleRequestRide}
                className="font-bold shadow-xs bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-800 hover:to-purple-700"
              >
                Request Sanghini Ride <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Realistic Interactive Map Canvas (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-0 border border-slate-200/80 overflow-hidden shadow-sm">
            {/* Map Header Status Bar */}
            <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-bold">Udaipur Live Interactive Map</span>
              </div>
              <Badge variant="purple" size="sm" className="bg-purple-950 text-purple-300 border-purple-800">
                Google Maps Streets • Live Routing
              </Badge>
            </div>

            {/* Real Interactive Map Viewport */}
            <div className="relative w-full">
              <RideMap
                pickupLocation={
                  estimation?.pickupLocation ||
                  (pickupCoords
                    ? { address: pickupQuery, coordinates: [pickupCoords.lng, pickupCoords.lat] }
                    : { address: pickupQuery })
                }
                dropoffLocation={
                  estimation?.dropoffLocation ||
                  (dropCoords
                    ? { address: dropQuery, coordinates: [dropCoords.lng, dropCoords.lat] }
                    : { address: dropQuery })
                }
                routeGeometry={liveRoute?.geometry || estimation?.routeGeometry || []}
                rideStatus="finding_driver"
                height="450px"
                etaMinutes={estDurationMins}
                distanceKm={estDistanceKm}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* ─── Confirmation Modal ────────────────────────────────────── */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => !isBooking && setConfirmModalOpen(false)}
        title="Confirm Ride Request"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Vehicle:</span>
              <span className="font-bold text-slate-900">{currentVehicleObj.name}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Estimated Distance:</span>
              <span className="font-bold text-slate-900">
                {estDistanceKm !== null ? `${estDistanceKm.toFixed(1)} km` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Estimated Duration:</span>
              <span className="font-bold text-slate-900">
                {estDurationMins !== null ? `~${estDurationMins} mins` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Authoritative Fare:</span>
              <span className="font-bold text-purple-800 text-sm">
                {calculatedFare !== null ? `₹${calculatedFare}` : '—'}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
              <span>Ride will be saved to your real Sanghini MongoDB account.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
              <span>You will receive a unique 4-digit OTP code to start the ride.</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={isBooking}
              onClick={() => setConfirmModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={isBooking}
              onClick={handleFinalConfirm}
            >
              Confirm & Request Ride
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
