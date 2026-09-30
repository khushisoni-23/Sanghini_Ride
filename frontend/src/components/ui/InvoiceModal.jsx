import { useRef } from 'react';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  MapPin,
  Clock,
  CreditCard,
  Receipt,
  Car,
} from 'lucide-react';

/**
 * Professional Invoice/Receipt Modal for Sanghini Ride
 * Renders a printable, professional receipt with all fare and payment details.
 */
export default function InvoiceModal({ isOpen, onClose, invoice }) {
  const invoiceRef = useRef(null);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    const printContent = invoiceRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber} — Sanghini Ride</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', 'Segoe UI', sans-serif; color: #1e293b; padding: 32px; background: #fff; }
          .invoice-container { max-width: 680px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0; margin-bottom: 24px; }
          .brand { font-size: 22px; font-weight: 800; color: #581c87; }
          .tagline { font-size: 11px; color: #64748b; margin-top: 2px; }
          .invoice-meta { text-align: right; font-size: 12px; color: #475569; }
          .invoice-num { font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 8px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .info-box { background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .info-label { font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
          .info-value { font-size: 13px; font-weight: 600; color: #1e293b; }
          .route-box { background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .route-point { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; }
          .route-point:last-child { margin-bottom: 0; }
          .dot-green { width: 10px; height: 10px; border-radius: 50%; background: #22c55e; margin-top: 3px; flex-shrink: 0; }
          .dot-red { width: 10px; height: 10px; border-radius: 50%; background: #ef4444; margin-top: 3px; flex-shrink: 0; }
          .route-label { font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
          .route-address { font-size: 12px; font-weight: 600; color: #1e293b; margin-top: 2px; }
          .fare-table { width: 100%; border-collapse: collapse; }
          .fare-table td { padding: 8px 0; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
          .fare-table td:last-child { text-align: right; font-weight: 600; }
          .fare-total td { border-top: 2px solid #e2e8f0; border-bottom: none; padding-top: 12px; font-size: 15px; font-weight: 800; }
          .fare-total td:last-child { color: #581c87; font-size: 18px; }
          .payment-badge { display: inline-block; background: #dcfce7; color: #166534; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px; }
          .payment-badge.pending { background: #fef3c7; color: #92400e; }
          .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
          .footer strong { color: #581c87; }
          @media print { body { padding: 16px; } }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const fb = invoice.fareBreakdown || {};
  const isPaid = invoice.paymentInfo?.status === 'PAID';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-100 z-10 transition-all max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-purple-700" />
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Ride Invoice</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg text-purple-700 hover:bg-purple-50 transition-colors"
              title="Print / Download PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Content */}
        <div ref={invoiceRef} className="p-6 space-y-5">
          <div className="invoice-container">
            {/* Header Section */}
            <div className="header flex items-start justify-between pb-4 border-b-2 border-slate-200 mb-5">
              <div>
                <div className="brand text-xl font-extrabold text-purple-900">🚗 Sanghini Ride</div>
                <div className="tagline text-[11px] text-slate-500 mt-0.5">
                  {invoice.company?.tagline || 'Her Journey, Her Way • Udaipur'}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {invoice.company?.city || 'Udaipur, Rajasthan, India'}
                </div>
              </div>
              <div className="text-right">
                <div className="invoice-num text-sm font-bold text-slate-900">
                  {invoice.invoiceNumber}
                </div>
                <div className="text-[11px] text-slate-500">
                  Issued: {formatDate(invoice.issuedAt)}
                </div>
                <div className="mt-1.5">
                  <span
                    className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      isPaid
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isPaid ? '✅ PAID' : '⏳ PENDING'}
                  </span>
                </div>
              </div>
            </div>

            {/* Passenger & Driver Info */}
            <div className="section">
              <div className="section-title text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Passenger & Driver Details
              </div>
              <div className="info-grid grid grid-cols-2 gap-3">
                <div className="info-box bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="info-label text-[10px] font-semibold text-slate-400 uppercase">Passenger</div>
                  <div className="info-value text-xs font-bold text-slate-900 mt-1">
                    {invoice.passenger?.name || 'Sanghini Passenger'}
                  </div>
                  {invoice.passenger?.phone && (
                    <div className="text-[11px] text-slate-500 mt-0.5">{invoice.passenger.phone}</div>
                  )}
                </div>
                <div className="info-box bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="info-label text-[10px] font-semibold text-slate-400 uppercase">Driver</div>
                  <div className="info-value text-xs font-bold text-slate-900 mt-1">
                    {invoice.driver?.name || 'N/A'}
                  </div>
                  {invoice.driver?.licenseNumber && (
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      DL: {invoice.driver.licenseNumber}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Trip Route */}
            <div className="section">
              <div className="section-title text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Trip Route
              </div>
              <div className="route-box bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                <div className="route-point flex items-start gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                  <div>
                    <div className="route-label text-[9px] font-bold text-slate-400 uppercase">Pickup</div>
                    <div className="route-address text-xs font-semibold text-slate-800 mt-0.5">
                      {invoice.tripDetails?.pickupAddress || 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="route-point flex items-start gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 shrink-0" />
                  <div>
                    <div className="route-label text-[9px] font-bold text-slate-400 uppercase">Drop-off</div>
                    <div className="route-address text-xs font-semibold text-slate-800 mt-0.5">
                      {invoice.tripDetails?.dropoffAddress || 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px] text-slate-600">
                      <span className="font-bold">{invoice.tripDetails?.distanceKm || 0}</span> km
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px] text-slate-600">
                      ~<span className="font-bold">{invoice.tripDetails?.durationMins || 0}</span> mins
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fare Breakdown */}
            <div className="section">
              <div className="section-title text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Fare Breakdown
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <table className="fare-table w-full">
                  <tbody>
                    <tr>
                      <td className="py-2 text-xs text-slate-600 border-b border-slate-100">Base Fare</td>
                      <td className="py-2 text-xs text-right font-semibold text-slate-800 border-b border-slate-100">
                        ₹{fb.baseFare || 0}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 text-xs text-slate-600 border-b border-slate-100">
                        Distance Charge ({invoice.tripDetails?.distanceKm || 0} km)
                      </td>
                      <td className="py-2 text-xs text-right font-semibold text-slate-800 border-b border-slate-100">
                        ₹{fb.distanceFare || 0}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 text-xs text-slate-600 border-b border-slate-100">
                        Time Charge (~{invoice.tripDetails?.durationMins || 0} mins)
                      </td>
                      <td className="py-2 text-xs text-right font-semibold text-slate-800 border-b border-slate-100">
                        ₹{fb.timeFare || 0}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 text-xs text-slate-600 border-b border-slate-100">Platform & Safety Fee</td>
                      <td className="py-2 text-xs text-right font-semibold text-emerald-700 border-b border-slate-100">
                        {fb.platformFee > 0 ? `₹${fb.platformFee}` : 'FREE (Pilot)'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 text-xs text-slate-600 border-b border-slate-100">GST / Tax</td>
                      <td className="py-2 text-xs text-right font-semibold text-slate-800 border-b border-slate-100">
                        ₹{fb.tax || 0}
                      </td>
                    </tr>
                    {fb.discount > 0 && (
                      <tr>
                        <td className="py-2 text-xs text-emerald-600 border-b border-slate-100">Discount Applied</td>
                        <td className="py-2 text-xs text-right font-semibold text-emerald-600 border-b border-slate-100">
                          -₹{fb.discount}
                        </td>
                      </tr>
                    )}
                    <tr className="fare-total">
                      <td className="pt-3 text-sm font-bold text-slate-900 border-t-2 border-slate-200">
                        Total Amount
                      </td>
                      <td className="pt-3 text-right text-lg font-extrabold text-purple-900 border-t-2 border-slate-200">
                        ₹{fb.totalFare || invoice.fareBreakdown?.totalFare || 0}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Info */}
            <div className="section">
              <div className="section-title text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Payment Information
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">Method</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                      {invoice.paymentInfo?.method || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">Status</div>
                    <div className="mt-0.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isPaid
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isPaid && <CheckCircle2 className="w-3 h-3" />}
                        {invoice.paymentInfo?.status || 'PENDING'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">Transaction ID</div>
                    <div className="text-[11px] font-mono text-slate-700 mt-0.5">
                      {invoice.paymentInfo?.transactionId || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">Paid At</div>
                    <div className="text-[11px] text-slate-700 mt-0.5">
                      {invoice.paymentInfo?.paidAt ? formatDate(invoice.paymentInfo.paidAt) : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="footer pt-4 border-t border-slate-200 text-center">
              <div className="text-[11px] text-slate-400">
                <strong className="text-purple-800">{invoice.company?.name || 'Sanghini Ride Technologies Pvt. Ltd.'}</strong>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {invoice.company?.supportEmail || 'support@sanghiniride.com'} • {invoice.company?.city || 'Udaipur, Rajasthan'}
              </div>
              <div className="text-[10px] text-slate-300 mt-2">
                This is a computer-generated invoice and does not require a physical signature.
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Bottom Actions */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-between rounded-b-2xl">
          <span className="text-[11px] text-slate-400">
            Ride ID: #{invoice.rideId?.toString().slice(-8).toUpperCase() || 'N/A'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
