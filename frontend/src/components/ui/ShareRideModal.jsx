import { useState, useEffect } from 'react';
import { Share2, X, Copy, Check, ShieldCheck, Users, ExternalLink, Power } from 'lucide-react';
import Button from './Button';
import safetyService from '../../services/safetyService';
import { useToast } from '../../context/ToastContext';

export default function ShareRideModal({ isOpen, onClose, ride, onShareUpdated }) {
  const [loading, setLoading] = useState(false);
  const [shareData, setShareData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [contacts, setContacts] = useState([]);
  const toast = useToast();

  useEffect(() => {
    if (isOpen && ride) {
      loadShareAndContacts();
    }
  }, [isOpen, ride]);

  const loadShareAndContacts = async () => {
    try {
      const contactRes = await safetyService.getTrustedContacts();
      setContacts(contactRes.data || []);
      if (ride.isShared && ride.shareToken) {
        setShareData({
          shareToken: ride.shareToken,
          shareUrl: `/shared-ride/${ride.shareToken}`,
          expiresAt: ride.shareExpiresAt,
        });
      }
    } catch (err) {
      console.warn('Error loading contacts:', err.message);
    }
  };

  if (!isOpen || !ride) return null;

  const handleStartShare = async () => {
    setLoading(true);
    try {
      const res = await safetyService.shareRide(ride._id);
      setShareData(res.data);
      toast.success('Live ride share link generated!');
      if (onShareUpdated) onShareUpdated();
    } catch (err) {
      toast.error(err.message || 'Failed to share ride.');
    } finally {
      setLoading(false);
    }
  };

  const handleStopShare = async () => {
    setLoading(true);
    try {
      await safetyService.stopShareRide(ride._id);
      setShareData(null);
      toast.info('Live ride sharing stopped.');
      if (onShareUpdated) onShareUpdated();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to stop sharing.');
    } finally {
      setLoading(false);
    }
  };

  const fullShareUrl = shareData ? `${window.location.origin}/shared-ride/${shareData.shareToken}` : '';

  const handleCopy = () => {
    if (fullShareUrl) {
      navigator.clipboard.writeText(fullShareUrl);
      setCopied(true);
      toast.success('Share link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-13 h-13 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center mx-auto shadow-sm">
            <Share2 className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900">Share Live Ride Status</h3>
          <p className="text-xs text-slate-500">
            Allow family and trusted contacts to track your trip live across Udaipur.
          </p>
        </div>

        {shareData ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-2">
              <span className="text-[11px] font-bold text-purple-700 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-purple-600" /> Active Share Link
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={fullShareUrl}
                  className="w-full text-xs font-mono bg-white p-2.5 rounded-xl border border-purple-200 text-slate-700 truncate"
                />
                <Button
                  onClick={handleCopy}
                  className="shrink-0 text-xs px-3 py-2 bg-purple-600 hover:bg-purple-700"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Trusted Contacts summary */}
            {contacts.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-500" /> Configured Trusted Contacts ({contacts.length})
                </span>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {contacts.map((c) => (
                    <div key={c._id} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs flex justify-between items-center">
                      <span className="font-semibold text-slate-800">{c.name} ({c.relationship})</span>
                      <span className="text-[10px] text-slate-500">{c.phone}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleStopShare}
                loading={loading}
                className="flex-1 justify-center text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <Power className="w-3.5 h-3.5 mr-1" /> Revoke Share
              </Button>
              <a
                href={fullShareUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1"
              >
                <Button className="w-full justify-center text-xs bg-purple-600 hover:bg-purple-700">
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open Link
                </Button>
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>🛡️ <strong>Privacy Protection:</strong> Only minimal trip details (driver name, vehicle model, pickup & dropoff addresses, live GPS) will be visible. Personal phone numbers or private data are never exposed.</p>
            </div>

            <Button
              onClick={handleStartShare}
              loading={loading}
              className="w-full justify-center text-xs bg-purple-600 hover:bg-purple-700 shadow-md py-3"
            >
              <Share2 className="w-4 h-4 mr-1.5" /> Generate Live Share Link
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
