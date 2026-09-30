import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  MapPin,
  Calendar,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import { ROUTES } from '../../constants';
import rideService from '../../services/rideService';

export default function MyRides() {
  const [activeTab, setActiveTab] = useState('all');
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRides = async (statusTab) => {
    setLoading(true);
    setError('');
    try {
      const res = await rideService.getMyRides(statusTab);
      if (res.success) {
        setRides(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching my rides:', err);
      setError(err.message || 'Failed to load rides from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides(activeTab);
  }, [activeTab]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'requested':
      case 'finding_driver':
        return <Badge variant="warning">Finding Driver</Badge>;
      case 'accepted':
      case 'driver_arriving':
      case 'arrived':
        return <Badge variant="info">Driver On Way</Badge>;
      case 'in_progress':
        return <Badge variant="purple">In Progress</Badge>;
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Page Title Header ────────────────────────────────────── */}
      <PageHeader
        title="My Rides History"
        subtitle="View all your real, active, and past journeys across Udaipur."
        backTo={ROUTES.PASSENGER}
        backLabel="Passenger Overview"
        actions={
          <Link to={ROUTES.PASSENGER_BOOK}>
            <Button variant="primary" size="md" className="font-bold shadow-xs">
              <MapPin className="w-4 h-4 mr-1.5" /> Book New Ride
            </Button>
          </Link>
        }
      />

      {/* ─── Filter Tabs ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200/80">
        {[
          { id: 'all', label: 'All Trips' },
          { id: 'active', label: 'Active Rides' },
          { id: 'completed', label: 'Completed' },
          { id: 'cancelled', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Error state ─────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => fetchRides(activeTab)} className="ml-auto font-bold underline">
            Retry
          </button>
        </div>
      )}

      {/* ─── Loading State ────────────────────────────────────────── */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
          <p className="text-xs font-semibold">Loading real rides from MongoDB...</p>
        </div>
      ) : rides.length > 0 ? (
        /* ─── Rides List ──────────────────────────────────────────── */
        <div className="space-y-3.5">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Showing {rides.length} trip(s) from database</span>
            <Badge variant="purple" size="sm">Real MongoDB Data</Badge>
          </div>

          {rides.map((ride) => (
            <Link
              key={ride._id}
              to={`/passenger/rides/${ride._id}`}
              className="block group"
            >
              <Card hover className="p-5 border border-slate-200/80 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2.5 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                        #{ride._id.slice(-8).toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(ride.requestedAt || ride.createdAt)}
                      </span>
                      {getStatusBadge(ride.status)}
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0"></span>
                        <span className="font-semibold text-slate-800">{ride.pickupLocation?.address}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0"></span>
                        <span className="font-semibold text-slate-800">{ride.dropoffLocation?.address}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    <div className="text-right">
                      <div className="text-base font-extrabold text-slate-900">₹{ride.fare}</div>
                      <div className="text-[11px] text-slate-500">
                        {ride.estimatedDistance ? `${ride.estimatedDistance} km` : 'Sanghini Ride'}
                      </div>
                    </div>
                    <div className="mt-2 text-xs font-bold text-purple-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      View Details <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        /* ─── Empty State ─────────────────────────────────────────── */
        <Card className="p-12 border border-slate-200/80 text-center">
          <EmptyState
            icon={Clock}
            title={
              activeTab === 'active'
                ? 'No active rides in progress'
                : activeTab === 'completed'
                ? 'No completed rides yet'
                : activeTab === 'cancelled'
                ? 'No cancelled rides'
                : 'No ride history yet'
            }
            description="Book your first safe journey across Udaipur with Sanghini Ride!"
            action={
              <Link to={ROUTES.PASSENGER_BOOK}>
                <Button variant="primary" size="sm" className="font-bold">
                  <MapPin className="w-3.5 h-3.5 mr-1" /> Book a Ride Now
                </Button>
              </Link>
            }
          />
        </Card>
      )}
    </div>
  );
}
