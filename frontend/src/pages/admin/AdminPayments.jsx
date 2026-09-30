import { useState, useEffect } from 'react';
import { CreditCard, Search, Filter, Loader2, RefreshCw, CheckCircle2, XCircle, Clock, Banknote, ShieldAlert, FileText } from 'lucide-react';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import adminService from '../../services/adminService';

export default function AdminPayments() {
  const toast = useToast();
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 12 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);

  const fetchPayments = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminService.getPayments({
        page,
        limit: 12,
        status: statusFilter
      });
      if (res.data) {
        setPayments(res.data.payments || []);
        setPagination(res.data.pagination || { total: 0, page: 1, pages: 1, limit: 12 });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(1);
  }, [statusFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Payment Records & Financial Audit"
        subtitle="Secure transaction verification, invoice reconciliation, and payment status monitoring."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPayments(pagination.page)}
            className="text-xs bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin text-purple-600' : ''}`} />
            Refresh
          </Button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {['', 'successful', 'failed', 'pending'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-colors ${
              statusFilter === status 
                ? 'bg-purple-700 text-white shadow-sm' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {status === '' ? 'All Transactions' : status.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Payments Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-2" />
            <p className="text-xs text-slate-500 font-semibold">Loading payment transactions...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <CreditCard className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No payment records found</p>
            <p className="text-xs text-slate-400">There are no financial transactions matching your filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="p-4">Transaction / Ref</th>
                  <th className="p-4">Passenger</th>
                  <th className="p-4">Method</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-mono font-bold text-purple-900 text-xs">
                        #{p._id.toString().slice(-8)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(p.createdAt).toLocaleString()}
                      </div>
                      {p.invoiceNumber && (
                        <div className="text-[10px] text-slate-500 font-mono">Inv: {p.invoiceNumber}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{p.passenger?.name || 'Passenger'}</div>
                      <div className="text-[10px] font-mono text-slate-500">{p.passenger?.phone}</div>
                    </td>
                    <td className="p-4">
                      <span className="uppercase font-bold text-[11px] px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Badge 
                        variant={
                          p.paymentStatus === 'successful' ? 'success' :
                          p.paymentStatus === 'failed' ? 'danger' : 'warning'
                        }
                        size="sm"
                      >
                        {p.paymentStatus.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-4 text-right font-extrabold text-sm text-slate-900">
                      ₹{p.amount}
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPayment(p)}
                        className="text-xs px-2.5 py-1"
                      >
                        Audit Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing page {pagination.page} of {pagination.pages} ({pagination.total} transactions)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1 || loading}
                onClick={() => fetchPayments(pagination.page - 1)}
                className="text-xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.pages || loading}
                onClick={() => fetchPayments(pagination.page + 1)}
                className="text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Audit Modal */}
      {selectedPayment && (
        <Modal
          isOpen={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          title={`Payment Audit Dossier #${selectedPayment._id.toString().slice(-8)}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-purple-50/50 border border-purple-100">
              <div>
                <div className="text-xs font-bold text-slate-900">Total Transaction Amount</div>
                <div className="text-2xl font-black text-purple-900 mt-0.5">₹{selectedPayment.amount} {selectedPayment.currency || 'INR'}</div>
              </div>
              <Badge 
                variant={
                  selectedPayment.paymentStatus === 'successful' ? 'success' :
                  selectedPayment.paymentStatus === 'failed' ? 'danger' : 'warning'
                }
                size="md"
              >
                {selectedPayment.paymentStatus.toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Method</span>
                <span className="font-bold text-slate-800 uppercase">{selectedPayment.paymentMethod}</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Transaction Date</span>
                <span className="font-medium text-slate-800">{new Date(selectedPayment.createdAt).toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Passenger Name</span>
                <span className="font-bold text-slate-800">{selectedPayment.passenger?.name || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Invoice Reference</span>
                <span className="font-mono text-slate-800 font-semibold">{selectedPayment.invoiceNumber || 'N/A'}</span>
              </div>
            </div>

            {selectedPayment.razorpayPaymentId && (
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50 text-xs">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Razorpay Payment ID</span>
                <span className="font-mono text-slate-800 select-all font-semibold">{selectedPayment.razorpayPaymentId}</span>
              </div>
            )}

            {selectedPayment.failureReason && (
              <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-xs text-rose-800">
                <span className="font-bold block text-[10px] uppercase">Failure Reason</span>
                <span>{selectedPayment.failureReason}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedPayment(null)} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
