import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Search, Filter, Loader2, AlertCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { ROUTES } from '../../constants';
import rideService from '../../services/rideService';

export default function DriverRides() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRides = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await rideService.getMyRides('all');
      if (res.success && res.data) {
        setRides(res.data);
      }
    } catch (err) {
      console.error('Error fetching driver rides:', err);
      setError(err.message || 'Failed to fetch ride history from MongoDB.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, []);

  const filteredRides = rides.filter((r) => {
    const q = searchQuery.toLowerCase();
    const idStr = r._id ? `#${r._id.slice(-8).toUpperCase()}` : '';
    const pickup = r.pickupLocation?.address || '';
    const dropoff = r.dropoffLocation?.address || '';
    return idStr.toLowerCase().includes(q) || pickup.toLowerCase().includes(q) || dropoff.toLowerCase().includes(q);
  });

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
      case 'completed':
        return <Badge variant="success" size="sm">COMPLETED</Badge>;
      case 'accepted':
      case 'driver_arriving':
      case 'arrived':
      case 'in_progress':
        return <Badge variant="purple" size="sm">ACTIVE</Badge>;
      case 'cancelled':
        return <Badge variant="danger" size="sm">CANCELLED</Badge>;
      default:
        return <Badge variant="default" size="sm">{status.toUpperCase()}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Ride History"
        subtitle="View all your past trips and earnings stored in MongoDB."
        actions={
          <Button variant="outline" size="sm" onClick={fetchRides} className="hidden sm:flex">
            Refresh
          </Button>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Ride ID or location..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 transition-shadow"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
          <p className="text-xs font-semibold">Loading driver ride history from MongoDB...</p>
        </div>
      ) : error ? (
        <Card className="p-8 text-center space-y-3 border-rose-200 bg-rose-50/50">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-xs font-bold text-rose-800">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchRides}>
            Try Again
          </Button>
        </Card>
      ) : filteredRides.length === 0 ? (
        <EmptyState
          icon="Car"
          title="No Ride History Found"
          description={searchQuery ? 'No trips match your search query.' : 'You have not accepted or completed any rides yet.'}
        />
      ) : (
        <div className="space-y-4">
          {filteredRides.map((ride) => {
            const formattedId = `#${ride._id.slice(-8).toUpperCase()}`;

            return (
              <Link key={ride._id} to={`/driver/rides/${ride._id}`} className="block group">
                <Card hover className="p-4 sm:p-5 border border-slate-200/80">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                        {formattedId}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3" /> {formatDate(ride.createdAt)}
                      </span>
                    </div>
                    {getStatusBadge(ride.status)}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-3 relative flex-1">
                      <div className="absolute left-[7px] top-4 bottom-4 w-px bg-slate-200" />

                      <div className="flex items-start gap-3 relative z-10">
                        <div className="w-3.5 h-3.5 rounded-full bg-emerald-100 border-2 border-emerald-500 mt-0.5 shrink-0" />
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Pickup</div>
                          <div className="text-xs font-semibold text-slate-800">{ride.pickupLocation?.address}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 relative z-10">
                        <div className="w-3.5 h-3.5 rounded-full bg-rose-100 border-2 border-rose-500 mt-0.5 shrink-0" />
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Drop-off</div>
                          <div className="text-xs font-semibold text-slate-800">{ride.dropoffLocation?.address}</div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 bg-slate-50 p-3 rounded-xl border border-slate-100 sm:w-32">
                      <div className="text-[10px] text-slate-500 font-medium mb-1">Earned</div>
                      <div className={`text-lg font-extrabold ${ride.status === 'cancelled' ? 'text-slate-400' : 'text-slate-900'}`}>
                        ₹{ride.fare}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
