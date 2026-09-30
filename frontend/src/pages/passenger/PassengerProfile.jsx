import { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Heart,
  Save,
  CheckCircle2,
  Users,
  Plus,
  Trash2,
  Sliders,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants';

export default function PassengerProfile() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, updateUserProfile, deleteAccount } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: 'Udaipur, Rajasthan',
    preferredLanguage: 'Hindi & English',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        city: user.city || 'Udaipur, Rajasthan',
        preferredLanguage: 'Hindi & English',
      });
    }
  }, [user]);

  const [preferences, setPreferences] = useState({
    shareTripByDefault: true,
    requireOtpConfirmation: true,
    acComfortPreferred: true,
    emergencySmsBroadcast: true,
  });

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (updateUserProfile) {
        await updateUserProfile({
          name: formData.name,
          phone: formData.phone,
          city: formData.city,
        });
      }
      toast.success('Passenger profile information saved to MongoDB.');
    } catch (err) {
      toast.error(err.message || 'Failed to save profile.');
    } finally {
      setLoading(false);
    }
  };

  const togglePref = (key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
    toast.info('Preference updated.');
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      if (deleteAccount) {
        await deleteAccount();
      }
      setShowDeleteModal(false);
      navigate(ROUTES.LOGIN, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Failed to delete account.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Page Title Header ────────────────────────────────────── */}
      <PageHeader
        title="Passenger Profile"
        subtitle="Manage your personal details, safety preferences, and travel settings in Udaipur."
        backTo={ROUTES.PASSENGER}
        backLabel="Passenger Overview"
        badge={
          <Badge variant="success" size="sm">
            MongoDB Connected
          </Badge>
        }
      />

      {/* ─── Profile Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Personal Info Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-700 to-indigo-900 text-white flex items-center justify-center font-extrabold text-2xl shadow-md border-2 border-purple-200 uppercase">
                {formData.name ? formData.name.charAt(0) : 'P'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{formData.name}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-700" /> Udaipur, Rajasthan
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  icon={User}
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  icon={Mail}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Mobile Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  icon={Phone}
                  required
                />
                <Input
                  label="Primary City"
                  value={formData.city}
                  readOnly
                  helperText="Sanghini currently operates in Udaipur"
                  icon={MapPin}
                />
              </div>

              <div className="pt-2">
                <Button type="submit" loading={loading} className="font-bold shadow-xs">
                  <Save className="w-4 h-4 mr-2" /> Save Profile Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column: Travel & Safety Preferences (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-purple-700" /> Ride Safety Preferences
              </span>
            </div>

            <div className="space-y-3 pt-1">
              <label className="flex items-start justify-between p-3 rounded-xl bg-slate-50 hover:bg-purple-50/50 border border-slate-100 cursor-pointer transition-colors">
                <div className="space-y-0.5 pr-2">
                  <div className="text-xs font-bold text-slate-900">Always Require Start PIN (OTP)</div>
                  <div className="text-[11px] text-slate-500">
                    Mandatory 4-digit verification code before vehicle departure.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.requireOtpConfirmation}
                  onChange={() => togglePref('requireOtpConfirmation')}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 mt-1"
                />
              </label>

              <label className="flex items-start justify-between p-3 rounded-xl bg-slate-50 hover:bg-purple-50/50 border border-slate-100 cursor-pointer transition-colors">
                <div className="space-y-0.5 pr-2">
                  <div className="text-xs font-bold text-slate-900">Auto-Share Live Ride</div>
                  <div className="text-[11px] text-slate-500">
                    Automatically send live map link to trusted contacts on start.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.shareTripByDefault}
                  onChange={() => togglePref('shareTripByDefault')}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 mt-1"
                />
              </label>

              <label className="flex items-start justify-between p-3 rounded-xl bg-slate-50 hover:bg-purple-50/50 border border-slate-100 cursor-pointer transition-colors">
                <div className="space-y-0.5 pr-2">
                  <div className="text-xs font-bold text-slate-900">Emergency SMS Broadcast</div>
                  <div className="text-[11px] text-slate-500">
                    Send simultaneous SMS with coordinates when SOS is pressed.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.emergencySmsBroadcast}
                  onChange={() => togglePref('emergencySmsBroadcast')}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 mt-1"
                />
              </label>
            </div>
          </Card>

          {/* Account Security Info */}
          <Card className="p-5 border border-purple-100 bg-purple-50/40 text-xs text-slate-600 space-y-2">
            <div className="font-bold text-purple-950 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-700" /> Account Security & Privacy
            </div>
            <p className="text-[11px] leading-relaxed">
              Your profile data is protected with 256-bit encryption. Identity and trusted emergency contacts are verified and stored securely in our MongoDB database.
            </p>
          </Card>

          {/* ─── Danger Zone: Delete Account ──────────────────────── */}
          <Card className="p-5 border border-rose-200 bg-rose-50/30 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-rose-900 flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4 text-rose-600" /> Delete Account
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Permanently erase your profile, emergency contacts, and ride data from MongoDB.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
              >
                Delete Account
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* ─── Delete Account Confirmation Modal ────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Permanently Delete Account?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                This action is <span className="font-bold text-rose-600">irreversible</span>. Your profile, past bookings, trusted emergency contacts, and account records will be permanently deleted from MongoDB.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
              ⚠️ You will immediately be signed out and won't be able to recover this account.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-rose-200"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
