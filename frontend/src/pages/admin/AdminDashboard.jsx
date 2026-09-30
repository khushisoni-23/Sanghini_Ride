import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldAlert, 
  Users, 
  Car, 
  MapPin, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  Star,
  RefreshCw,
  CreditCard,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { ROUTES } from '../../constants';
import adminService from '../../services/adminService';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAnalytics();
      if (res.data) {
        setData(res.data);
      } else if (res.success && res.data) {
        setData(res.data);
      }
      setError('');
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
      setError(err.message || 'Failed to load real-time analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000); // 30s live auto-refresh
    return () => clearInterval(interval);
  }, []);

  const users = data?.users || { total: 0, passengers: 0, drivers: 0 };
  const drivers = data?.drivers || { total: 0, verified: 0, pending: 0, activeOnline: 0 };
  const rides = data?.rides || { total: 0, completed: 0, cancelled: 0, active: 0 };
  const financials = data?.financials || { totalRevenue: 0, successfulPayments: 0, failedPayments: 0 };
  const safety = data?.safety || { activeIncidents: 0, totalIncidents: 0 };
  const ratings = data?.ratings || { average: 5.0, totalRatings: 0 };
  const recentRides = data?.recentRides || [];
  const statusDistribution = data?.statusDistribution || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Udaipur City Operations"
        subtitle="Real-time monitoring, live driver telemetry, and safety center."
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAnalytics}
              disabled={loading}
              className="text-xs bg-white border-slate-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin text-purple-600' : ''}`} />
              Refresh
            </Button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200 text-xs font-bold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Systems Operational
            </div>
          </div>
        }
      />

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAnalytics} className="text-xs bg-white">Retry</Button>
        </div>
      )}

      {/* Safety Alert Critical Banner if any active incident exists */}
      {safety.activeIncidents > 0 && (
        <div className="p-4 rounded-2xl bg-rose-600 text-white shadow-lg flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 shrink-0" />
            <div>
              <div className="font-extrabold text-sm tracking-wide">
                CRITICAL: {safety.activeIncidents} ACTIVE SOS INCIDENT{safety.activeIncidents > 1 ? 'S' : ''} DETECTED
              </div>
              <div className="text-xs text-rose-100">
                Udaipur emergency safety desk intervention required immediately.
              </div>
            </div>
          </div>
          <Link to={ROUTES.ADMIN_SAFETY}>
            <Button variant="outline" size="sm" className="bg-white text-rose-700 font-bold border-white hover:bg-rose-50 text-xs">
              Open Safety Desk
            </Button>
          </Link>
        </div>
      )}

      {/* Top Stat Cards with Real Aggregated Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="p-4 border-l-4 border-l-purple-500 border-slate-200/80 shadow-sm">
          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-purple-600" /> Active Rides
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {loading && !data ? <Loader2 className="w-5 h-5 animate-spin text-slate-400 mt-1" /> : rides.active}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{rides.total} total booked</div>
        </Card>
        
        <Card className="p-4 border-l-4 border-l-emerald-500 border-slate-200/80 shadow-sm">
          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5 text-emerald-600" /> Online Drivers
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {loading && !data ? <Loader2 className="w-5 h-5 animate-spin text-slate-400 mt-1" /> : drivers.activeOnline}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{drivers.verified} verified total</div>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500 border-slate-200/80 shadow-sm">
          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Verif.
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {loading && !data ? <Loader2 className="w-5 h-5 animate-spin text-slate-400 mt-1" /> : drivers.pending}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Awaiting review</div>
        </Card>

        <Card className={`p-4 border-l-4 border-slate-200/80 shadow-sm ${safety.activeIncidents > 0 ? 'border-l-red-500 bg-red-50' : 'border-l-emerald-500'}`}>
          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <ShieldAlert className={`w-3.5 h-3.5 ${safety.activeIncidents > 0 ? 'text-red-600' : 'text-emerald-600'}`} /> Safety Alerts
          </div>
          <div className={`text-2xl font-extrabold ${safety.activeIncidents > 0 ? 'text-red-700' : 'text-slate-900'}`}>
            {loading && !data ? <Loader2 className="w-5 h-5 animate-spin text-slate-400 mt-1" /> : safety.activeIncidents}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{safety.totalIncidents} total logged</div>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-500 border-slate-200/80 shadow-sm">
          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-600" /> Total Users
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {loading && !data ? <Loader2 className="w-5 h-5 animate-spin text-slate-400 mt-1" /> : users.total}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{users.passengers} passengers</div>
        </Card>

        <Card className="p-4 border-l-4 border-l-indigo-500 border-slate-200/80 shadow-sm">
          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" /> Revenue (₹)
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {loading && !data ? <Loader2 className="w-5 h-5 animate-spin text-slate-400 mt-1" /> : `₹${financials.totalRevenue}`}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{financials.successfulPayments} paid trips</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Operational Area */}
        <div className="lg:col-span-8 space-y-6">
          {/* Action Required Board for Driver Verifications */}
          {drivers.pending > 0 ? (
            <Card className="p-6 border border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-sm">
              <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Verification Action Required
              </h3>
              
              <div className="flex items-center justify-between p-3.5 bg-white border border-amber-200/80 rounded-xl shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      {drivers.pending} Driver Partner Application{drivers.pending > 1 ? 's' : ''} Pending
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Driver documentation & licenses need background verification review.
                    </div>
                  </div>
                </div>
                <Link to={ROUTES.ADMIN_DRIVERS}>
                  <Button variant="primary" size="sm" className="text-xs bg-amber-600 hover:bg-amber-700">
                    Review Drivers
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <Card className="p-5 border border-emerald-200 bg-emerald-50/40 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs text-emerald-900">
                <span className="font-bold">All driver verifications are up to date.</span> No pending onboarding requests.
              </div>
            </Card>
          )}

          {/* Quick Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to={ROUTES.ADMIN_RIDES} className="block group">
              <Card hover className="p-5 border border-slate-200/80 bg-slate-50/50 group-hover:border-purple-300 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <Badge variant="purple" size="sm">{rides.active} Active Now</Badge>
                </div>
                <h4 className="font-bold text-slate-900 text-base mb-1">Rides Management</h4>
                <p className="text-xs text-slate-500">Inspect live rides, routes, pickup/dropoff points and trip fares.</p>
              </Card>
            </Link>
            
            <Link to={ROUTES.ADMIN_SAFETY} className="block group">
              <Card hover className="p-5 border border-slate-200/80 bg-slate-50/50 group-hover:border-rose-300 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    safety.activeIncidents > 0 ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-slate-200 text-slate-600'
                  }`}>
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <Badge variant={safety.activeIncidents > 0 ? 'danger' : 'success'} size="sm">
                    {safety.activeIncidents > 0 ? `${safety.activeIncidents} Active Alert` : 'All Secure'}
                  </Badge>
                </div>
                <h4 className="font-bold text-slate-900 text-base mb-1">SOS & Safety Desk</h4>
                <p className="text-xs text-slate-500">Live emergency incident triage and resolution monitoring.</p>
              </Card>
            </Link>
          </div>

          {/* Recent Rides Table */}
          <Card className="p-6 border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-600" /> Recent Trip Activity
              </h3>
              <Link to={ROUTES.ADMIN_RIDES} className="text-xs font-bold text-purple-600 hover:text-purple-700">
                View All Rides →
              </Link>
            </div>

            {recentRides.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No recent rides recorded yet in the system.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="pb-3">Ride ID</th>
                      <th className="pb-3">Passenger</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Fare</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {recentRides.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 font-mono text-[11px] text-purple-900 font-bold">
                          #{r._id.toString().slice(-6)}
                        </td>
                        <td className="py-2.5 font-medium text-slate-900">
                          {r.passenger?.name || 'Passenger'}
                        </td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            r.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                            r.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {r.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-extrabold text-slate-900">
                          ₹{r.fare || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right Sidebar: Status Breakdown & Platform Metrics */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-5 border border-slate-200/80 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" /> Ride Status Distribution
            </h3>

            {statusDistribution.length === 0 ? (
              <p className="text-xs text-slate-400">No rides data to distribute.</p>
            ) : (
              <div className="space-y-2.5 text-xs">
                {statusDistribution.map((item) => (
                  <div key={item.status} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                    <span className="capitalize text-slate-600">{item.status.replace('_', ' ')}</span>
                    <Badge variant="purple" size="sm">{item.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5 border border-slate-200/80 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" /> Platform Ratings & Quality
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{ratings.average}</span>
              <span className="text-xs text-slate-500">/ 5.0 rating</span>
            </div>
            <div className="text-xs text-slate-500">
              Aggregated from {ratings.totalRatings} authentic passenger and driver reviews.
            </div>
          </Card>

          <Card className="p-5 border border-slate-200/80 space-y-3 bg-purple-50/30">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-700" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-950">Payment Integrity</h4>
            </div>
            <div className="text-xs text-slate-600 space-y-1.5">
              <div className="flex justify-between">
                <span>Successful Payments:</span>
                <span className="font-bold text-emerald-700">{financials.successfulPayments}</span>
              </div>
              <div className="flex justify-between">
                <span>Failed Payments:</span>
                <span className="font-bold text-rose-700">{financials.failedPayments}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-purple-100">
                <span className="font-semibold text-slate-800">Total Net Fare:</span>
                <span className="font-extrabold text-purple-900">₹{financials.totalRevenue}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
