import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  ShieldCheck,
  Clock,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Navigation,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { APP_NAME, ROUTES, POPULAR_UDAIPUR_PLACES } from '../../constants';
import heroRiderImg from '../../assets/hero_rider.jpg';
import rideService from '../../services/rideService';

export default function PassengerHome() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [recentRide, setRecentRide] = useState(null);
  const [loadingRide, setLoadingRide] = useState(true);

  const [savedPlaces] = useState([
    { name: 'Home', address: 'Fatehpura, Udaipur', icon: '🏠' },
    { name: 'University / College', address: 'MLSU Campus, University Road', icon: '🎓' },
    { name: 'Shopping Hub', address: 'Celebration Mall, Bhuwana', icon: '🛍️' },
  ]);

  useEffect(() => {
    let isMounted = true;
    const fetchRecent = async () => {
      try {
        const res = await rideService.getMyRides('all');
        if (isMounted && res.success && res.data && res.data.length > 0) {
          setRecentRide(res.data[0]);
        }
      } catch (err) {
        console.error('Error fetching recent ride:', err);
      } finally {
        if (isMounted) setLoadingRide(false);
      }
    };

    fetchRecent();
    return () => { isMounted = false; };
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ─── Page Title Header ────────────────────────────────────── */}
      <PageHeader
        title={`${t('welcomeBack')}, ${user?.name || 'Passenger'}`}
        subtitle={t('whereToTravel')}
        badge={
          <Badge variant="success" size="sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
            {t('verifiedPassenger')}
          </Badge>
        }
        actions={
          <Link to={ROUTES.PASSENGER_BOOK}>
            <Button variant="primary" size="md" className="shadow-xs font-bold">
              <MapPin className="w-4 h-4 mr-1.5" /> {t('bookRide')}
            </Button>
          </Link>
        }
      />

      {/* ─── Hero Action Banner ───────────────────────────────────── */}
      <div className="rounded-3xl bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-950 p-6 sm:p-8 text-white relative overflow-hidden shadow-lg border border-purple-700/40">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
          <div className="md:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-bold tracking-wider backdrop-blur-xs border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> {t('cityRidesTag')}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-snug">
              {t('heroTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-purple-100/90 max-w-xl leading-relaxed">
              {t('heroSubtitle')}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link to={ROUTES.PASSENGER_BOOK}>
                <Button variant="white" size="md" className="font-bold">
                  {t('bookInstantRide')} <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
              <Link to={ROUTES.PASSENGER_SAFETY}>
                <Button variant="outline-white" size="md">
                  <ShieldCheck className="w-4 h-4 mr-1.5" /> {t('safetyHub')}
                </Button>
              </Link>
            </div>
          </div>

          <div className="md:col-span-4 hidden md:flex justify-end">
            <div className="w-48 h-48 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl relative">
              <img
                src={heroRiderImg}
                alt="Sanghini Passenger"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-950/80 via-transparent to-transparent flex items-end p-3">
                <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {t('hundredPercentWomen')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Quick Actions & Saved Places Grid ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Saved Places (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              {t('savedLocations')}
            </h3>
            <span className="text-xs text-purple-700 font-semibold cursor-pointer hover:underline">
              {t('managePlaces')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {savedPlaces.map((place, idx) => (
              <Link
                key={idx}
                to={`${ROUTES.PASSENGER_BOOK}?destination=${encodeURIComponent(place.address)}`}
                className="block group"
              >
                <Card hover className="p-4 border border-slate-200/80 h-full flex flex-col justify-between">
                  <div>
                    <div className="text-2xl mb-2">{place.icon}</div>
                    <div className="font-bold text-slate-900 text-sm group-hover:text-purple-700 transition-colors">
                      {place.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {place.address}
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] font-bold text-purple-700 flex items-center gap-1">
                    {t('bookToHere')} <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {/* Popular Udaipur Hubs Chips */}
          <Card className="p-5 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-purple-700" /> {t('popularHubs')}
              </span>
              <span className="text-[11px] text-slate-400">{t('tapToSelect')}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {POPULAR_UDAIPUR_PLACES.slice(0, 6).map((hub, i) => (
                <Link
                  key={i}
                  to={`${ROUTES.PASSENGER_BOOK}?pickup=${encodeURIComponent(hub)}`}
                  className="px-3 py-1.5 rounded-xl bg-slate-100/80 hover:bg-purple-50 hover:text-purple-900 text-slate-700 text-xs font-medium border border-slate-200/60 transition-all hover:border-purple-200"
                >
                  {hub.split(',')[0]}
                </Link>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Col: Safety Architecture (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              {t('safetyArchitecture')}
            </h3>
            <Link to={ROUTES.PASSENGER_SAFETY} className="text-xs text-purple-700 font-semibold hover:underline">
              {t('viewSafetyHub')}
            </Link>
          </div>

          <Card className="p-6 border border-purple-100 bg-gradient-to-br from-white via-purple-50/20 to-purple-50/40 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{t('emergencyActive')}</h4>
                <p className="text-xs text-slate-500">{t('helplineLinked')}</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-1 text-xs text-slate-600">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-100">
                <span className="font-medium text-slate-700">{t('trustedContacts')}</span>
                <Badge variant="purple" size="sm">2 {t('contactsConfigured')}</Badge>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-100">
                <span className="font-medium text-slate-700">{t('startOtpEnforced')}</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {t('enforced')}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-100">
                <span className="font-medium text-slate-700">{t('driverVerification')}</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {t('hundredPercentWomen')}
                </span>
              </div>
            </div>

            <Link to={ROUTES.PASSENGER_SAFETY} className="block pt-1">
              <Button variant="outline" size="sm" className="w-full justify-center text-xs font-bold">
                {t('manageContactsBtn')}
              </Button>
            </Link>
          </Card>

          {/* Quick Helpline Box */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-200">{t('policeEmergency')}</div>
              <div className="text-[11px] text-slate-400">{t('directDial')}</div>
            </div>
            <span className="font-extrabold text-white text-base bg-rose-600 px-3 py-1 rounded-xl">
              112
            </span>
          </div>
        </div>
      </div>

      {/* ─── Recent Rides / Activity Section ─────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            {t('recentActivity')}
          </h3>
          <Link to={ROUTES.PASSENGER_RIDES} className="text-xs text-purple-700 font-semibold hover:underline">
            {t('viewAllRides')}
          </Link>
        </div>

        {recentRide ? (
          <Link to={`/passenger/rides/${recentRide._id}`} className="block group">
            <Card hover className="p-5 border border-purple-100 bg-purple-50/30 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-purple-100">
                      #{recentRide._id.slice(-8).toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(recentRide.requestedAt || recentRide.createdAt)}
                    </span>
                    <Badge variant={recentRide.status === 'completed' ? 'success' : recentRide.status === 'cancelled' ? 'danger' : 'purple'} size="sm">
                      {recentRide.status}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2 text-slate-800 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>{recentRide.pickupLocation?.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-800 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span>{recentRide.dropoffLocation?.address}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-extrabold text-slate-950">₹{recentRide.fare}</div>
                  <div className="text-xs text-purple-700 font-bold flex items-center justify-end gap-1 mt-1">
                    {t('rideDetails')} <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ) : (
          <Card className="p-8 border border-slate-200/80 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mx-auto border border-purple-100">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">{t('noActiveRides')}</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {t('noRidesDesc')}
            </p>
            <div className="pt-2">
              <Link to={ROUTES.PASSENGER_BOOK}>
                <Button size="sm" variant="primary" className="shadow-xs font-semibold">
                  <MapPin className="w-3.5 h-3.5 mr-1.5" /> {t('bookFirstRide')}
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
