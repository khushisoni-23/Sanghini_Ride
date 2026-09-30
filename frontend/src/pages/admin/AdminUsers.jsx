import { useState, useEffect } from 'react';
import { Search, Filter, ShieldCheck, Mail, Phone, Clock, Loader2, UserX, UserCheck, RefreshCw, X, Trash2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import adminService from '../../services/adminService';

export default function AdminUsers() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminService.getUsers({
        page,
        limit: 10,
        search,
        role: roleFilter,
        status: statusFilter
      });
      if (res.data) {
        setUsers(res.data.users || []);
        setPagination(res.data.pagination || { total: 0, page: 1, pages: 1, limit: 10 });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleToggleStatus = async (user) => {
    setUpdatingId(user._id);
    try {
      const res = await adminService.toggleUserStatus(user._id, !user.isActive);
      toast.success(res.message || 'User status updated successfully.');
      fetchUsers(pagination.page);
      if (selectedUser && selectedUser._id === user._id) {
        setSelectedUser({ ...selectedUser, isActive: !user.isActive });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update user status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to permanently delete account for ${user.name} (${user.email}) from MongoDB? This action cannot be undone.`)) {
      return;
    }
    setUpdatingId(user._id);
    try {
      const res = await adminService.deleteUser(user._id);
      toast.success(res.message || 'User permanently deleted from MongoDB.');
      if (selectedUser && selectedUser._id === user._id) {
        setSelectedUser(null);
      }
      fetchUsers(pagination.page);
    } catch (err) {
      toast.error(err.message || 'Failed to delete user.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="User & Passenger Accounts"
        subtitle="Manage and audit registered Sanghini users and accounts."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchUsers(pagination.page)}
            className="text-xs bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin text-purple-600' : ''}`} />
            Refresh
          </Button>
        }
      />

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name, email, or phone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-purple-600"
          >
            <option value="">All Roles</option>
            <option value="passenger">Passengers</option>
            <option value="driver">Drivers</option>
            <option value="admin">Admins</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-purple-600"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive / Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-2" />
            <p className="text-xs text-slate-500 font-semibold">Loading users from database...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-sm font-bold text-slate-700">No users found</p>
            <p className="text-xs text-slate-400">Try adjusting your search criteria or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">User Details</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4 text-center">Role</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            {u.name}
                            {u.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" title="Verified" />}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            ID: {u._id.toString().slice(-6)} • Joined {new Date(u.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="flex items-center gap-1.5 font-mono text-[11px]"><Mail className="w-3 h-3 text-slate-400" /> {u.email}</span>
                        <span className="flex items-center gap-1.5 font-mono text-[11px]"><Phone className="w-3 h-3 text-slate-400" /> {u.phone}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant={u.role === 'admin' ? 'purple' : u.role === 'driver' ? 'warning' : 'default'} size="sm">
                        {u.role.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant={u.isActive ? 'success' : 'danger'} size="sm">
                        {u.isActive ? 'Active' : 'Suspended'}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUser(u)}
                          className="text-xs px-2.5 py-1"
                        >
                          Details
                        </Button>
                        {u.role !== 'admin' && (
                          <>
                            <Button
                              variant={u.isActive ? 'danger' : 'primary'}
                              size="sm"
                              loading={updatingId === u._id}
                              onClick={() => handleToggleStatus(u)}
                              className="text-xs px-2.5 py-1"
                            >
                              {u.isActive ? 'Suspend' : 'Activate'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              loading={updatingId === u._id}
                              onClick={() => handleDeleteUser(u)}
                              className="text-xs px-2 py-1 text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                              title="Delete Account Permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
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
              Showing page {pagination.page} of {pagination.pages} ({pagination.total} total users)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1 || loading}
                onClick={() => fetchUsers(pagination.page - 1)}
                className="text-xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.pages || loading}
                onClick={() => fetchUsers(pagination.page + 1)}
                className="text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <Modal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title="User Account Dossier"
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-purple-50/50 border border-purple-100">
              <div className="w-12 h-12 rounded-full bg-purple-200 text-purple-800 flex items-center justify-center font-bold text-lg">
                {selectedUser.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">{selectedUser.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="purple" size="sm">{selectedUser.role.toUpperCase()}</Badge>
                  <Badge variant={selectedUser.isActive ? 'success' : 'danger'} size="sm">
                    {selectedUser.isActive ? 'ACTIVE' : 'SUSPENDED'}
                  </Badge>
                  {selectedUser.isVerified && <Badge variant="success" size="sm">VERIFIED</Badge>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Email Address</span>
                <span className="font-semibold text-slate-800 font-mono">{selectedUser.email}</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Mobile Phone</span>
                <span className="font-semibold text-slate-800 font-mono">{selectedUser.phone}</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">City</span>
                <span className="font-semibold text-slate-800">{selectedUser.city || 'Udaipur'}</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Account Created</span>
                <span className="font-semibold text-slate-800">{new Date(selectedUser.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              {selectedUser.role !== 'admin' && (
                <Button
                  variant={selectedUser.isActive ? 'danger' : 'primary'}
                  size="sm"
                  loading={updatingId === selectedUser._id}
                  onClick={() => handleToggleStatus(selectedUser)}
                  className="text-xs"
                >
                  {selectedUser.isActive ? 'Suspend User' : 'Activate User'}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setSelectedUser(null)} className="text-xs ml-auto">
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
