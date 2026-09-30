import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Loader2, 
  RefreshCw, 
  Car, 
  Star,
  Check,
  X,
  Phone,
  Mail,
  Calendar
} from 'lucide-react';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import adminService from '../../services/adminService';

export default function AdminDrivers() {
  const toast = useToast();
  const [drivers, setDrivers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchDrivers = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminService.getDrivers({
        page,
        limit: 10,
        search,
        verificationStatus: statusFilter
      });
      if (res.data) {
        setDrivers(res.data.drivers || []);
        setPagination(res.data.pagination || { total: 0, page: 1, pages: 1, limit: 10 });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load drivers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers(1);
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDrivers(1);
  };

  const handleVerify = async (status) => {
    if (!selectedDriver) return;
    setIsVerifying(true);
    try {
      const res = await adminService.verifyDriver(selectedDriver._id, status, rejectNotes);
      toast.success(res.message || `Driver partner ${status === 'verified' ? 'approved' : 'rejected'}.`);
      setVerifyModalOpen(false);
      setSelectedDriver(null);
      setRejectNotes('');
      fetchDrivers(pagination.page);
    } catch (err) {
      toast.error(err.message || 'Verification update failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Driver Partner Verification & Fleets"
        subtitle="Manage women driver onboarding, document validation, and partner status."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDrivers(pagination.page)}
            className="text-xs bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin text-purple-600' : ''}`} />
            Refresh
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name, phone, license, or plate..." 
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
            <option value="">All Verification Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="in_review">In Review</option>
            <option value="verified">Verified Partners</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-2" />
            <p className="text-xs text-slate-500 font-semibold">Loading driver partners from database...</p>
          </div>
        ) : drivers.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Car className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No driver partners found</p>
            <p className="text-xs text-slate-400">Try adjusting your search criteria or status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Driver Profile</th>
                  <th className="p-4">Vehicle Details</th>
                  <th className="p-4 text-center">License No.</th>
                  <th className="p-4 text-center">Verification</th>
                  <th className="p-4 text-center">Duty Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {drivers.map((driver) => (
                  <tr key={driver._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                          {driver.user?.name ? driver.user.name.charAt(0).toUpperCase() : 'D'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            {driver.user?.name || 'Driver Partner'}
                            {driver.verificationStatus === 'verified' && (
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" title="Verified" />
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {driver.user?.phone || 'No phone'} • ⭐ {driver.rating || 5.0} ({driver.totalRides || 0} rides)
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">
                      <div className="font-semibold text-xs text-slate-800">
                        {driver.activeVehicle?.plateNumber || 'No plate assigned'}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 uppercase">
                        {driver.activeVehicle?.make || 'Auto'} {driver.activeVehicle?.model || 'E-Rickshaw'}
                      </div>
                    </td>
                    <td className="p-4 text-center font-mono text-xs font-semibold text-slate-700">
                      {driver.licenseNumber}
                    </td>
                    <td className="p-4 text-center">
                      <Badge 
                        variant={
                          driver.verificationStatus === 'verified' ? 'success' :
                          driver.verificationStatus === 'rejected' ? 'danger' : 'warning'
                        } 
                        size="sm"
                      >
                        {driver.verificationStatus.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        driver.isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${driver.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        {driver.isAvailable ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setSelectedDriver(driver);
                            setVerifyModalOpen(true);
                          }}
                          className="text-xs px-2.5 py-1"
                        >
                          Review & Verify
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing page {pagination.page} of {pagination.pages} ({pagination.total} total drivers)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1 || loading}
                onClick={() => fetchDrivers(pagination.page - 1)}
                className="text-xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.pages || loading}
                onClick={() => fetchDrivers(pagination.page + 1)}
                className="text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Driver Verification Modal */}
      {selectedDriver && (
        <Modal
          isOpen={verifyModalOpen}
          onClose={() => setVerifyModalOpen(false)}
          title="Driver Verification & Credentials"
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base">
                {selectedDriver.user?.name?.charAt(0).toUpperCase() || 'D'}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{selectedDriver.user?.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={selectedDriver.verificationStatus === 'verified' ? 'success' : 'warning'} size="sm">
                    {selectedDriver.verificationStatus.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-slate-500 font-mono">⭐ {selectedDriver.rating || 5.0}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-slate-100 bg-white">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Driving License Number</span>
                <span className="font-mono font-bold text-slate-800 text-sm">{selectedDriver.licenseNumber}</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-100 bg-white">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">License Expiry</span>
                <span className="font-medium text-slate-800">
                  {selectedDriver.licenseExpiry ? new Date(selectedDriver.licenseExpiry).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-slate-100 bg-white">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Vehicle</span>
                <span className="font-bold text-slate-800">
                  {selectedDriver.activeVehicle?.plateNumber || 'Pending'} ({selectedDriver.activeVehicle?.type || 'Auto'})
                </span>
              </div>
              <div className="p-3 rounded-lg border border-slate-100 bg-white">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Background Check</span>
                <span className="font-semibold text-slate-800 uppercase">
                  {selectedDriver.backgroundCheckStatus || 'Pending'}
                </span>
              </div>
            </div>

            {selectedDriver.verificationStatus !== 'verified' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Rejection Reason / Notes (if rejecting):</label>
                <input
                  type="text"
                  placeholder="e.g. License photo blurry or expired"
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
                />
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <Button variant="outline" size="sm" onClick={() => setVerifyModalOpen(false)} className="text-xs">
                Cancel
              </Button>
              <div className="flex items-center gap-2">
                {selectedDriver.verificationStatus !== 'rejected' && (
                  <Button
                    variant="danger"
                    size="sm"
                    loading={isVerifying}
                    onClick={() => handleVerify('rejected')}
                    className="text-xs"
                  >
                    <X className="w-3.5 h-3.5 mr-1" /> Reject Verification
                  </Button>
                )}
                {selectedDriver.verificationStatus !== 'verified' && (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={isVerifying}
                    onClick={() => handleVerify('verified')}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" /> Approve & Verify
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
