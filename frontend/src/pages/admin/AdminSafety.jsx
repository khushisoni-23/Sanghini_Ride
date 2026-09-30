import { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  PhoneCall, 
  CheckCircle2, 
  Navigation, 
  Loader2, 
  RefreshCw, 
  Check, 
  XCircle,
  ExternalLink
} from 'lucide-react';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';
import adminService from '../../services/adminService';
import { getSocket } from '../../services/socketService';

export default function AdminSafety() {
  const toast = useToast();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await adminService.getSafetyIncidents({ status: statusFilter });
      if (res.data) {
        setIncidents(res.data || []);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load safety alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 15000); // 15s poll

    // Real-time socket listener for instant SOS escalation
    const socket = getSocket();
    if (socket) {
      socket.on('safety:sos_alert', () => {
        toast.error('🚨 HIGH PRIORITY: New SOS Alert Triggered in Udaipur!');
        fetchIncidents();
      });
      socket.on('safety:incident_updated', () => {
        fetchIncidents();
      });
    }

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off('safety:sos_alert');
        socket.off('safety:incident_updated');
      }
    };
  }, [statusFilter]);

  const handleUpdateStatus = async (incidentId, status, notes = '') => {
    setUpdatingId(incidentId);
    try {
      const res = await adminService.updateIncidentStatus(incidentId, status, notes);
      toast.success(res.message || `Incident status updated to ${status}.`);
      fetchIncidents();
    } catch (err) {
      toast.error(err.message || 'Failed to update incident.');
    } finally {
      setUpdatingId(null);
    }
  };

  const activeCount = incidents.filter(i => ['triggered', 'acknowledged'].includes(i.status)).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="SOS & Safety Incident Command Desk"
        subtitle="Live emergency triage, distress response, and Udaipur police dispatch."
        badge={
          <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2 shadow-sm ${
            activeCount > 0 
              ? 'animate-pulse bg-rose-100 text-rose-800 border-rose-200' 
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${activeCount > 0 ? 'bg-rose-600' : 'bg-emerald-500'}`} />
            {activeCount > 0 ? `${activeCount} Active SOS Alert${activeCount > 1 ? 's' : ''}` : 'All Clear • Zero Active Alerts'}
          </div>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchIncidents}
            className="text-xs bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin text-purple-600' : ''}`} />
            Refresh
          </Button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {['', 'triggered', 'acknowledged', 'resolved', 'false_alarm'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-colors ${
              statusFilter === status 
                ? 'bg-purple-700 text-white shadow-sm' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {status === '' ? 'All Incidents' : status.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Alerts List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 mb-2 px-1 flex items-center justify-between">
            <span>Incident Records ({incidents.length})</span>
          </h3>
          
          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-2" />
              <p className="text-xs text-slate-500 font-semibold">Syncing safety desk incidents...</p>
            </div>
          ) : incidents.length === 0 ? (
            <Card className="p-12 text-center space-y-3 border border-slate-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No safety incidents found</p>
              <p className="text-xs text-slate-400">All rides in Udaipur are currently operating safely without active distress signals.</p>
            </Card>
          ) : (
            incidents.map((incident) => {
              const isActive = ['triggered', 'acknowledged'].includes(incident.status);
              const lat = incident.location?.coordinates?.[1];
              const lng = incident.location?.coordinates?.[0];

              return (
                <Card 
                  key={incident._id} 
                  className={`p-0 overflow-hidden border ${
                    isActive ? 'border-rose-300 shadow-md ring-1 ring-rose-200' : 'border-slate-200/80 opacity-80'
                  }`}
                >
                  <div className={`p-4 ${isActive ? 'bg-rose-50/70' : 'bg-slate-50'} border-b border-slate-100 flex justify-between items-center`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-200 text-slate-500'
                      }`}>
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div>
                        <div className={`font-bold text-sm ${isActive ? 'text-rose-950' : 'text-slate-700'}`}>
                          {incident.alertType === 'manual_sos' ? 'Passenger Emergency SOS Triggered' : 'Safety Deviation Flag'}
                        </div>
                        <div className="text-xs font-mono text-slate-500 mt-0.5">
                          ID: #{incident._id.toString().slice(-6)} • Ride: {incident.ride ? `#${incident.ride._id?.toString().slice(-6) || incident.ride.toString().slice(-6)}` : 'Standby'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={
                          incident.status === 'triggered' ? 'danger' :
                          incident.status === 'acknowledged' ? 'warning' : 'success'
                        } 
                        size="sm"
                      >
                        {incident.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <div className="text-[10px] text-slate-400 mt-1 font-medium">
                        {new Date(incident.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Passenger</div>
                        <div className="font-bold text-xs text-slate-800">{incident.passenger?.name || 'Passenger'}</div>
                        <div className="text-[11px] font-mono text-slate-500">{incident.passenger?.phone}</div>
                        {incident.passenger?.phone && (
                          <a href={`tel:${incident.passenger.phone}`} className="block mt-2">
                            <Button variant="outline" size="sm" className="w-full justify-center text-xs h-7 bg-white">
                              <PhoneCall className="w-3 h-3 mr-1 text-emerald-600" /> Call Passenger
                            </Button>
                          </a>
                        )}
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Driver Partner</div>
                        <div className="font-bold text-xs text-slate-800">{incident.driver?.user?.name || 'Assigned Driver'}</div>
                        <div className="text-[11px] font-mono text-slate-500">{incident.driver?.user?.phone || 'No phone'}</div>
                        {incident.driver?.user?.phone && (
                          <a href={`tel:${incident.driver.user.phone}`} className="block mt-2">
                            <Button variant="outline" size="sm" className="w-full justify-center text-xs h-7 bg-white">
                              <PhoneCall className="w-3 h-3 mr-1 text-purple-600" /> Call Driver
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Coordinates & Map Link */}
                    <div className="flex items-center justify-between text-xs text-slate-700 bg-blue-50/60 p-3 rounded-xl border border-blue-100">
                      <div className="flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-blue-600 shrink-0" />
                        <div>
                          <span className="font-semibold text-slate-800">Distress Coordinates: </span>
                          <span className="font-mono text-[11px] text-blue-900">
                            {lat && lng ? `${lat.toFixed(5)}, ${lng.toFixed(5)} (Udaipur)` : 'GPS Pending / Cellular Fallback'}
                          </span>
                        </div>
                      </div>
                      {lat && lng && (
                        <a 
                          href={`https://www.google.com/maps?q=${lat},${lng}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 text-[11px]"
                        >
                          View Map <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {/* Action Controls */}
                    {isActive && (
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                        {incident.status === 'triggered' && (
                          <Button 
                            variant="primary" 
                            size="sm" 
                            loading={updatingId === incident._id}
                            onClick={() => handleUpdateStatus(incident._id, 'acknowledged')}
                            className="bg-purple-700 hover:bg-purple-800 text-xs"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" /> Acknowledge Alert
                          </Button>
                        )}
                        <Button 
                          variant="success" 
                          size="sm" 
                          loading={updatingId === incident._id}
                          onClick={() => handleUpdateStatus(incident._id, 'resolved', 'Verified safe with passenger.')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark Resolved (Safe)
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          loading={updatingId === incident._id}
                          onClick={() => handleUpdateStatus(incident._id, 'false_alarm', 'Passenger confirmed accidental press.')}
                          className="text-xs text-slate-600"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" /> False Alarm
                        </Button>
                        <a href="tel:112" className="ml-auto">
                          <Button variant="danger" size="sm" className="text-xs bg-rose-600 hover:bg-rose-700 shadow-sm">
                            <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Call 112 (Police)
                          </Button>
                        </a>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Right Col: Standard Operating Procedure & Contacts */}
        <div className="space-y-6">
          <Card className="p-6 border border-slate-200/80 bg-slate-900 text-white space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" /> Udaipur SOS Emergency Protocol
            </h3>
            
            <ol className="space-y-3 text-xs text-slate-300 font-medium list-decimal list-inside">
              <li>
                <strong className="text-white">Call Passenger:</strong> Verify distress immediately. Listen for threats or background distress.
              </li>
              <li>
                <strong className="text-white">Call Driver Partner:</strong> Inquire on location, route status, and passenger condition.
              </li>
              <li>
                <strong className="text-white">Police Escalation:</strong> If danger confirmed or passenger uncontactable, immediately dispatch Udaipur Police (112) with GPS coordinates.
              </li>
              <li>
                <strong className="text-white">Notify Circle:</strong> Check trusted contacts linked to this passenger.
              </li>
              <li>
                <strong className="text-white">Close Incident:</strong> Update incident status to Resolved once passenger safety is confirmed.
              </li>
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
