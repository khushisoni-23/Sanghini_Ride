import { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Search, Filter, Loader2, RefreshCw, Car, User, CheckCircle2, AlertTriangle, CreditCard, Shield } from 'lucide-react';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import adminService from '../../services/adminService';

export default function AdminRides() {
  const toast = useToast();
  const [rides, setRides] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 12 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRide, setSelectedRide] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [rideDetails, setRideDetails] = useState(null);

  const fetchRides = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminService.getRides({
        page,
        limit: 12,
        search,
        status: statusFilter
      });
      if (res.data) {
        setRides(res.data.rides || []);
        setPagination(res.data.pagination || { total: 0, page: 1, pages: 1, limit: 12 });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load rides.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides(1);
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRides(1);
  };

  const handleOpenDetails = async (ride) => {
    setSelectedRide(ride);
    setLoadingDetails(true);
    try {
      const res = await adminService.getRideDetails(ride._id);
      if (res.data) {
        setRideDetails(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch deep ride details, using basic:', err);
      setRideDetails(ride);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Live Trips & Fleet Monitoring"
        subtitle="Real-time ride management, routing telemetry, and trip audit."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchRides(pagination.page)}
            className="text-xs bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin text-purple-600' : ''}`} />
            Refresh
          </Button>
        }
      />

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by Ride ID, passenger, driver, or address..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-purple-600"
          >
            <option value="">All Ride Statuses</option>
            <option value="in_progress">In Progress</option>
            <option value="accepted">Accepted / Arriving</option>
            <option value="finding_driver">Searching Driver</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Rides Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-2" />
          <p className="text-xs text-slate-500 font-semibold">Loading trips from database...</p>
        </div>
      ) : rides.length === 0 ? (
        <Card className="p-12 text-center space-y-3 border border-slate-200">
          <Car className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No rides found</p>
          <p className="text-xs text-slate-400">There are no trips matching your search filter.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rides.map((ride) => (
            <Card 
              key={ride._id} 
              onClick={() => handleOpenDetails(ride)}
              className="p-5 border border-slate-200/80 hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[10px] font-bold font-mono text-purple-900 bg-purple-50 px-2 py-1 rounded-md border border-purple-100">
                      #{ride._id.toString().slice(-6)}
                    </span>
                  </div>
                  <Badge 
                    variant={
                      ride.status === 'completed' ? 'success' : 
                      ride.status === 'in_progress' ? 'purple' : 
                      ride.status === 'cancelled' ? 'danger' : 'warning'
                    } 
                    size="sm"
                  >
                    {ride.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>

                <div className="space-y-2 mb-3 pb-3 border-b border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Passenger</span>
                    <span className="font-bold text-slate-800">{ride.passenger?.name || 'Passenger'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Driver</span>
                    <span className="font-bold text-slate-800">
                      {ride.driver?.user?.name || (ride.status === 'finding_driver' ? 'Matching...' : 'None')}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 relative mb-4">
                  <div className="flex items-start gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                    <div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">Pickup</div>
                      <div className="text-xs font-semibold text-slate-800 line-clamp-1">{ride.pickupLocation?.address}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 shrink-0" />
                    <div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">Dropoff</div>
                      <div className="text-xs font-semibold text-slate-800 line-clamp-1">{ride.dropoffLocation?.address}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                  <Clock className="w-3.5 h-3.5" /> ~{ride.estimatedDuration || 15} min ({ride.estimatedDistance || 0} km)
                </div>
                <div className="text-sm font-extrabold text-slate-900">₹{ride.fare || 0}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing page {pagination.page} of {pagination.pages} ({pagination.total} trips recorded)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1 || loading}
              onClick={() => fetchRides(pagination.page - 1)}
              className="text-xs"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.pages || loading}
              onClick={() => fetchRides(pagination.page + 1)}
              className="text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Detailed Ride Modal */}
      {selectedRide && (
        <Modal
          isOpen={!!selectedRide}
          onClose={() => {
            setSelectedRide(null);
            setRideDetails(null);
          }}
          title={`Trip Dossier #${selectedRide._id.toString().slice(-6)}`}
          size="lg"
        >
          {loadingDetails ? (
            <div className="py-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600 mb-2" />
              <p className="text-xs text-slate-500">Loading trip telemetry and payments...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-purple-50/50 border border-purple-100">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Status: <span className="uppercase text-purple-900">{rideDetails?.status || selectedRide.status}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Requested on {new Date(selectedRide.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-extrabold text-emerald-700">₹{rideDetails?.fare || selectedRide.fare}</div>
                  <div className="text-[10px] text-slate-500 capitalize">{selectedRide.paymentMethod || 'cash'}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Passenger Details</div>
                  <div className="font-bold text-slate-800">{selectedRide.passenger?.name || 'N/A'}</div>
                  <div className="text-slate-500 font-mono text-[11px]">{selectedRide.passenger?.phone || 'No phone'}</div>
                  <div className="text-slate-500 font-mono text-[11px]">{selectedRide.passenger?.email || ''}</div>
                </div>

                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Driver Details</div>
                  <div className="font-bold text-slate-800">{selectedRide.driver?.user?.name || 'No driver assigned'}</div>
                  <div className="text-slate-500 font-mono text-[11px]">{selectedRide.driver?.user?.phone || ''}</div>
                  <div className="text-slate-500 font-medium text-[11px]">
                    Vehicle: {selectedRide.vehicle?.plateNumber || 'Auto'}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 space-y-2 text-xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Route Details</div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-700">Pickup: </span>
                    <span className="text-slate-800">{selectedRide.pickupLocation?.address}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-700">Dropoff: </span>
                    <span className="text-slate-800">{selectedRide.dropoffLocation?.address}</span>
                  </div>
                </div>
              </div>

              {rideDetails?.payments && rideDetails.payments.length > 0 && (
                <div className="p-3 rounded-xl border border-slate-100 bg-white space-y-1.5 text-xs">
                  <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-purple-600" /> Payment Audit
                  </div>
                  {rideDetails.payments.map((p) => (
                    <div key={p._id} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-50 last:border-0">
                      <span>Method: <strong className="uppercase">{p.paymentMethod}</strong> • Status: <strong className="text-emerald-700 uppercase">{p.paymentStatus}</strong></span>
                      <span className="font-bold text-slate-900">₹{p.amount}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setSelectedRide(null);
                    setRideDetails(null);
                  }}
                  className="text-xs"
                >
                  Close Dossier
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
