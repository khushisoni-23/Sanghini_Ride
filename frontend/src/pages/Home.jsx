import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  MapPin,
  Users,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Navigation,
  Car,
  Clock,
  PhoneCall,
  Sparkles,
  Award,
  Zap,
  Star,
  ChevronRight,
  Lock,
  HeartHandshake,
  ArrowDownUp,
  Crosshair,
  Search,
  X,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useToast } from '../context/ToastContext';
import { APP_NAME, APP_TAGLINE, ROUTES } from '../constants';
import logoImg from '../assets/logo.png';
import heroRiderImg from '../assets/hero_rider.jpg';
import driverPartnerImg from '../assets/driver_partner.jpg';

const POPULAR_UDAIPUR_PLACES = [
  'Sukhadia Circle, Panchwati',
  'Fateh Sagar Lake Paal, Udaipur',
  'Lake Pichola / City Palace Gate',
  'MLSU Campus, University Road',
  'Celebration Mall, Bhuwana',
  'Udaipur City Railway Station',
  'RNT Medical College & Hospital',
  'Saheliyon Ki Bari, New Bhupalpura',
  'Chetak Circle, Madhuban',
  'Delhi Gate, Bapu Bazaar',
  'Hiran Magri Sector 4, Udaipur',
  'Hiran Magri Sector 14, Udaipur',
  'Maharana Pratap Airport (Dabok)',
  'Goverdhan Vilas, National Highway',
  'Shobhagpura 100 Feet Road',
  'Titardi Chauraha, Udaipur',
];

const VEHICLE_TYPES = [
  {
    id: 'auto',
    name: 'Sanghini Auto',
    desc: 'Quick & affordable city rides',
    capacity: '3 seats',
    eta: '3 min',
    baseFare: 40,
    perKm: 12,
    icon: '🛺',
  },
  {
    id: 'mini',
    name: 'Sanghini Go (Hatchback)',
    desc: 'AC comfort for daily commute',
    capacity: '4 seats',
    eta: '5 min',
    baseFare: 70,
    perKm: 18,
    icon: '🚗',
  },
  {
    id: 'prime',
    name: 'Sanghini Prime Sedan',
    desc: 'Spacious & quiet city travel',
    capacity: '4 seats',
    eta: '6 min',
    baseFare: 110,
    perKm: 24,
    icon: '🚘',
  },
];

export default function Home() {
  const [pickup, setPickup] = useState('Sukhadia Circle, Panchwati');
  const [drop, setDrop] = useState('Fateh Sagar Lake Paal, Udaipur');
  const [pickupQuery, setPickupQuery] = useState('Sukhadia Circle, Panchwati');
  const [dropQuery, setDropQuery] = useState('Fateh Sagar Lake Paal, Udaipur');
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropSuggestions, setShowDropSuggestions] = useState(false);
  
  const [selectedVehicle, setSelectedVehicle] = useState('auto');
  const [rideBooked, setRideBooked] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  
  const toast = useToast();
  const pickupRef = useRef(null);
  const dropRef = useRef(null);

  // Filter suggestions based on what user types
  const filteredPickupPlaces = POPULAR_UDAIPUR_PLACES.filter((p) =>
    p.toLowerCase().includes(pickupQuery.toLowerCase())
  );

  const filteredDropPlaces = POPULAR_UDAIPUR_PLACES.filter((p) =>
    p.toLowerCase().includes(dropQuery.toLowerCase())
  );

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickupRef.current && !pickupRef.current.contains(e.target)) {
        setShowPickupSuggestions(false);
      }
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setShowDropSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Distance estimation based on location strings
  const estDistanceKm = Math.max(3.2, Math.min(18.5, ((pickupQuery.length + dropQuery.length) % 12) + 3.5));
  const currentVehicle = VEHICLE_TYPES.find((v) => v.id === selectedVehicle) || VEHICLE_TYPES[0];
  const calculatedFare = Math.round(currentVehicle.baseFare + estDistanceKm * currentVehicle.perKm);

  const handleSwapLocations = () => {
    const tempP = pickupQuery;
    setPickupQuery(dropQuery);
    setPickup(dropQuery);
    setDropQuery(tempP);
    setDrop(tempP);
    toast.info('Pickup and Destination swapped.');
  };

  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    setTimeout(() => {
      setIsLocating(false);
      const loc = 'Current Location (Fatehpura, Udaipur)';
      setPickupQuery(loc);
      setPickup(loc);
      setShowPickupSuggestions(false);
      toast.success('GPS Location Detected: Fatehpura, Udaipur');
    }, 500);
  };

  const handleBookRide = (e) => {
    e.preventDefault();
    if (!pickupQuery.trim() || !dropQuery.trim()) {
      toast.error('Please enter both pickup and destination locations.');
      return;
    }
    if (pickupQuery.trim().toLowerCase() === dropQuery.trim().toLowerCase()) {
      toast.error('Pickup and destination cannot be identical.');
      return;
    }
    setRideBooked(true);
    toast.success(`Pilot Ride Confirmed: ${currentVehicle.name} • Approx ₹${calculatedFare}`);
  };

  return (
    <div className="space-y-24 pb-24 overflow-hidden">
      
      {/* ─── Hero Section ────────────────────────────────────────── */}
      <section className="relative pt-8 pb-16 lg:pt-12 lg:pb-24 border-b border-slate-100 bg-gradient-to-b from-purple-50/70 via-purple-50/20 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Heading & Key Value Prop */}
            <div className="lg:col-span-6 space-y-6 text-left">
              
              {/* Udaipur Live Pill */}
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-purple-100 border border-purple-200 text-purple-900 text-xs font-bold tracking-wide shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-ping"></span>
                <span>Udaipur’s 1st Women-Exclusive Ride Platform</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-tight">
                Her Journey, <br className="hidden sm:block" />
                <span className="text-gradient-purple">Her Safety, Her Way.</span>
              </h1>

              {/* Clean Clear Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                Book safe rides with background-verified female drivers in Udaipur. Type any pickup or destination, get instant upfront fares, live tracking, and 24/7 SOS safety backup.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                <Link to={ROUTES.REGISTER}>
                  <Button size="lg" className="w-full sm:w-auto shadow-md">
                    Book a Safe Ride <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to={ROUTES.SAFETY}>
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    <ShieldCheck className="w-4 h-4 text-purple-700 mr-2" /> Safety Standards
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-slate-200/80 grid grid-cols-3 gap-3 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>100% Women Drivers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Police Verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>24/7 SOS Desk</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual with Glow + Rapido-Style Interactive Ride Planner */}
            <div className="lg:col-span-6 relative">
              
              {/* Image Container with Glow, Gradient Rim & Hover Animation */}
              <div className="relative group">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-purple-600 via-purple-400 to-pink-500 rounded-[2rem] blur-xl opacity-30 group-hover:opacity-50 transition duration-700"></div>

                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900">
                  <img
                    src={heroRiderImg}
                    alt="Passenger in Udaipur ride"
                    className="w-full h-80 sm:h-[25rem] object-cover object-center transform transition duration-700 ease-out group-hover:scale-105"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent pointer-events-none"></div>
                  
                  {/* Floating Safety Badge */}
                  <div className="absolute top-4 right-4 animate-float">
                    <div className="backdrop-blur-md bg-white/90 px-3 py-1.5 rounded-full shadow-lg border border-purple-100 flex items-center gap-2 text-xs font-bold text-purple-900">
                      <ShieldCheck className="w-4 h-4 text-purple-700" />
                      <span>100% Safe Zone</span>
                    </div>
                  </div>

                  {/* Bottom Info Bar on Image */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs backdrop-blur-md bg-slate-900/60 px-4 py-2.5 rounded-2xl border border-white/20">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-purple-300" />
                      <span className="font-semibold">Udaipur City Pilot Route</span>
                    </div>
                    <span className="bg-emerald-500 text-white font-bold px-2.5 py-0.5 rounded-full text-[10px] tracking-wide">
                      ACTIVE PILOT
                    </span>
                  </div>
                </div>
              </div>

              {/* Rapido-Style Interactive Ride Booking Card (Freeform Inputs + Autocomplete) */}
              <div className="mt-6 sm:-mt-16 relative z-30 sm:px-3">
                <Card className="p-5 sm:p-6 border border-purple-100 shadow-float bg-white/98 backdrop-blur-xl">
                  
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-purple-50 p-1 flex items-center justify-center border border-purple-100">
                        <img src={logoImg} alt="Sanghini" className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm">Where do you want to go?</h3>
                        <p className="text-[11px] text-slate-500">Type any address in Udaipur</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
                      Live Fare
                    </span>
                  </div>

                  <form onSubmit={handleBookRide} className="space-y-3">
                    
                    {/* Location Inputs with Swap button */}
                    <div className="relative space-y-2.5">
                      
                      {/* Pickup Input */}
                      <div ref={pickupRef} className="relative">
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-purple-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-purple-600/10 transition-all">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                          <input
                            type="text"
                            value={pickupQuery}
                            onChange={(e) => {
                              setPickupQuery(e.target.value);
                              setShowPickupSuggestions(true);
                            }}
                            onFocus={() => setShowPickupSuggestions(true)}
                            placeholder="Enter any pickup location / landmark..."
                            className="w-full bg-transparent text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none"
                          />
                          {pickupQuery && (
                            <button
                              type="button"
                              onClick={() => {
                                setPickupQuery('');
                                setShowPickupSuggestions(true);
                              }}
                              className="text-slate-400 hover:text-slate-600 p-0.5"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={handleUseCurrentLocation}
                            title="Use Current Location"
                            className="text-purple-700 hover:text-purple-900 p-1 rounded-lg hover:bg-purple-50 transition-colors shrink-0"
                          >
                            <Crosshair className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
                          </button>
                        </div>

                        {/* Pickup Autocomplete Suggestions Popup */}
                        {showPickupSuggestions && (
                          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 max-h-48 overflow-y-auto py-1 animate-slide-up">
                            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Popular & Recent in Udaipur
                            </div>
                            {filteredPickupPlaces.length > 0 ? (
                              filteredPickupPlaces.map((place, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setPickupQuery(place);
                                    setPickup(place);
                                    setShowPickupSuggestions(false);
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-900 flex items-center gap-2 transition-colors"
                                >
                                  <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                  <span className="truncate">{place}</span>
                                </button>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-xs text-slate-500 flex items-center justify-between">
                                <span>Use typed: "{pickupQuery}"</span>
                                <button
                                  type="button"
                                  onClick={() => setShowPickupSuggestions(false)}
                                  className="text-purple-700 font-bold text-[11px]"
                                >
                                  Set Location
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Swap Button In Center */}
                      <div className="flex justify-end pr-2 -my-1">
                        <button
                          type="button"
                          onClick={handleSwapLocations}
                          className="p-1 rounded-lg bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-800 text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="Swap Pickup & Destination"
                        >
                          <ArrowDownUp className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Swap</span>
                        </button>
                      </div>

                      {/* Drop Destination Input */}
                      <div ref={dropRef} className="relative">
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-purple-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-purple-600/10 transition-all">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
                          <input
                            type="text"
                            value={dropQuery}
                            onChange={(e) => {
                              setDropQuery(e.target.value);
                              setShowDropSuggestions(true);
                            }}
                            onFocus={() => setShowDropSuggestions(true)}
                            placeholder="Enter drop destination / area..."
                            className="w-full bg-transparent text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none"
                          />
                          {dropQuery && (
                            <button
                              type="button"
                              onClick={() => {
                                setDropQuery('');
                                setShowDropSuggestions(true);
                              }}
                              className="text-slate-400 hover:text-slate-600 p-0.5"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Drop Autocomplete Suggestions Popup */}
                        {showDropSuggestions && (
                          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 max-h-48 overflow-y-auto py-1 animate-slide-up">
                            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Popular & Recent in Udaipur
                            </div>
                            {filteredDropPlaces.length > 0 ? (
                              filteredDropPlaces.map((place, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setDropQuery(place);
                                    setDrop(place);
                                    setShowDropSuggestions(false);
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-900 flex items-center gap-2 transition-colors"
                                >
                                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                  <span className="truncate">{place}</span>
                                </button>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-xs text-slate-500 flex items-center justify-between">
                                <span>Use typed: "{dropQuery}"</span>
                                <button
                                  type="button"
                                  onClick={() => setShowDropSuggestions(false)}
                                  className="text-purple-700 font-bold text-[11px]"
                                >
                                  Set Location
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Vehicle Type Radio Cards */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {VEHICLE_TYPES.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVehicle(v.id)}
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            selectedVehicle === v.id
                              ? 'border-purple-600 bg-purple-50/80 shadow-xs ring-1 ring-purple-600'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="text-xl mb-0.5">{v.icon}</div>
                          <div className="text-[11px] font-bold text-slate-900 truncate">{v.name.split(' ')[1] || v.name}</div>
                          <div className="text-[10px] font-extrabold text-purple-700">₹{Math.round(v.baseFare + estDistanceKm * v.perKm)}</div>
                        </button>
                      ))}
                    </div>

                    {/* Book Action Button */}
                    <Button type="submit" className="w-full justify-center shadow-xs">
                      Book {currentVehicle.name.split(' ')[1] || currentVehicle.name} • ₹{calculatedFare} ({currentVehicle.eta})
                    </Button>
                  </form>

                  {/* Dynamic Assigned Driver Simulation State */}
                  {rideBooked && (
                    <div className="mt-3.5 pt-3.5 border-t border-purple-100 bg-purple-50/60 p-3 rounded-2xl border border-purple-200 animate-slide-up space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-purple-700 text-white font-bold flex items-center justify-center text-xs">
                            KM
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                              Kavita Meena <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                            </div>
                            <div className="text-[10px] text-slate-500">Sanghini Verified • 4.9 ★</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] uppercase font-bold text-slate-400">Security OTP</div>
                          <div className="text-xs font-extrabold tracking-widest text-purple-800 bg-white px-2 py-0.5 rounded-md border border-purple-200">
                            7492
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-700 bg-white p-2 rounded-xl border border-purple-100">
                        <span>RJ 27 CF 4512 (EV Auto)</span>
                        <span className="text-emerald-600 flex items-center gap-1 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> 3 min away
                        </span>
                      </div>
                    </div>
                  )}

                </Card>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ─── 4 Pillars of Safety & Trust ─────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-purple-700" /> Why Sanghini Ride
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Designed for Peace of Mind
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Every feature is purpose-built to give women passengers and drivers absolute safety, comfort, and control.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-7 rounded-3xl bg-white border border-slate-100 shadow-sm card-hover-effect space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">100% Women-Only Community</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Exclusively female passengers and certified female drivers, eliminating fear and discomfort in urban travel.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-white border border-slate-100 shadow-sm card-hover-effect space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Navigation className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">Live GPS Route Share</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Share your live location, driver details, and vehicle plate with loved ones via WhatsApp in a single tap.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-white border border-slate-100 shadow-sm card-hover-effect space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">Mandatory Ride OTP</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              The ride starts only when you provide the 4-digit security OTP to your driver, preventing false starts or wrong pickups.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-white border border-slate-100 shadow-sm card-hover-effect space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <PhoneCall className="w-6 h-6 text-purple-700" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">Udaipur SOS Desk</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              One-touch emergency button notifying our dedicated local operations team and Rajasthan Police emergency lines.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Driver Partner Empowerment Section ──────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-purple-950 via-purple-900 to-slate-950 rounded-3xl text-white p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-2xl">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Content (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-800/80 border border-purple-600 text-purple-200 text-xs font-bold">
                <HeartHandshake className="w-4 h-4 text-purple-300" /> Drive with Sanghini in Udaipur
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white">
                Earn With Dignity. <br />
                <span className="text-purple-300">Own Your Independence.</span>
              </h2>

              <p className="text-sm sm:text-base text-purple-100/90 leading-relaxed max-w-xl">
                Become a verified female driver partner in Udaipur. Drive comfortably with women-only passengers, flexible working shifts, guaranteed safety coverage, and transparent payouts.
              </p>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-purple-100 pt-2">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-300 shrink-0" />
                  <span>Flexible Hours (Day / Evening)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-300 shrink-0" />
                  <span>100% Women Passengers</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-300 shrink-0" />
                  <span>Weekly Direct Bank Transfer</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-300 shrink-0" />
                  <span>24/7 Roadside Emergency Aid</span>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3.5">
                <Link to={ROUTES.REGISTER}>
                  <Button variant="white" size="lg" className="w-full sm:w-auto">
                    Apply as Driver Partner <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to={ROUTES.SUPPORT}>
                  <Button variant="outline-white" size="lg" className="w-full sm:w-auto">
                    View Onboarding Requirements
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Photo (5 cols) */}
            <div className="lg:col-span-5 relative">
              <div className="rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl">
                <img
                  src={driverPartnerImg}
                  alt="Sanghini Driver Partner in Udaipur"
                  className="w-full h-80 sm:h-96 object-cover object-center"
                />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-purple-900/95 border border-purple-600/50 p-3.5 rounded-2xl backdrop-blur-md text-xs space-y-1 shadow-xl">
                <div className="font-extrabold text-white">Pooja Sharma</div>
                <div className="text-purple-300 text-[11px]">Sanghini Pilot Driver • Udaipur</div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ─── How It Works (Simple 3 Steps) ───────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-bold uppercase tracking-wider">
            <Clock className="w-4 h-4 text-purple-700" /> Easy & Seamless
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            How It Works
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Booking a safe, verified ride in Udaipur takes less than 30 seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-700 text-white font-extrabold text-base flex items-center justify-center">
              01
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">Choose Your Route</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Type any pickup and drop location in Udaipur. View upfront fares with zero hidden charges.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-700 text-white font-extrabold text-base flex items-center justify-center">
              02
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">Verify Driver & OTP</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Check driver name, photo, and car registration. Share the 4-digit security OTP to begin the trip.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-700 text-white font-extrabold text-base flex items-center justify-center">
              03
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">Arrive Safely</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enjoy continuous GPS monitoring, automatic trusted contact updates, and 24/7 operations support.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Ready to Ride Callout Banner (Fixed White Buttons!) ──── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-purple-800 via-purple-700 to-purple-900 text-white p-8 sm:p-12 text-center space-y-6 shadow-xl relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Ready for Safe, Dignified Travel in Udaipur?
            </h2>
            <p className="text-sm sm:text-base text-purple-100 leading-relaxed">
              Join hundreds of women passengers and driver partners preparing for the official launch.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to={ROUTES.REGISTER}>
              <Button variant="white" size="lg" className="w-full sm:w-auto">
                Create Free Account <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to={ROUTES.ABOUT}>
              <Button variant="outline-white" size="lg" className="w-full sm:w-auto">
                Learn More About Our Mission
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
