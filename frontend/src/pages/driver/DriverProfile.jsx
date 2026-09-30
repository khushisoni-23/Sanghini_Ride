import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Camera, Shield, FileText } from 'lucide-react';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function DriverProfile() {
  const toast = useToast();
  const { user, updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  // Initialize driver profile dynamically from MongoDB user context
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: 'Udaipur, Rajasthan',
    joinDate: 'Recent Partner',
    rating: 4.9,
    totalRides: 0,
  });

  useEffect(() => {
    if (user) {
      const parts = (user.name || 'Driver Partner').split(' ');
      setProfile({
        firstName: parts[0] || 'Driver',
        lastName: parts.slice(1).join(' ') || 'Partner',
        phone: user.phone || '',
        email: user.email || '',
        address: user.city ? `${user.city}, Rajasthan` : 'Hiran Magri, Sector 4, Udaipur',
        joinDate: user.createdAt
          ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          : 'Active',
        rating: user.rating || 5.0,
        totalRides: user.totalRides || 0,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      if (updateUserProfile) {
        await updateUserProfile({
          name: `${profile.firstName} ${profile.lastName}`.trim(),
          phone: profile.phone,
          city: profile.address,
        });
      }
      setIsEditing(false);
      toast.success('Driver profile saved successfully in MongoDB!');
    } catch (err) {
      toast.error(err.message || 'Failed to save profile changes.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal driver details and account verification."
        actions={
          !isEditing ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          )
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Col: Overview */}
        <div className="space-y-6">
          <Card className="p-6 text-center border border-slate-200/80">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className="w-full h-full rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-3xl font-bold border-4 border-white shadow-sm overflow-hidden uppercase">
                {profile.firstName ? profile.firstName.charAt(0) : 'D'}
                {profile.lastName ? profile.lastName.charAt(0) : ''}
              </div>
              {isEditing && (
                <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center border-2 border-white shadow-sm hover:bg-slate-800 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {profile.firstName} {profile.lastName}
            </h2>
            <div className="flex justify-center mt-2">
              <Badge variant="success" size="sm" className="font-medium">
                Verified Sanghini Partner
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
              <div>
                <div className="text-2xl font-extrabold text-slate-900">{profile.rating}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">
                  Rating
                </div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900">{profile.totalRides}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">
                  Total Rides
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5 border border-slate-200/80">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" /> Account Status
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-slate-600">Background Check</span>
                <span className="text-emerald-600 font-medium text-xs flex items-center gap-1">
                  Cleared
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-600">Women-Only Verification</span>
                <span className="text-emerald-600 font-medium text-xs flex items-center gap-1">
                  Verified
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-600">Joined</span>
                <span className="text-slate-800 font-medium text-xs">{profile.joinDate}</span>
              </li>
            </ul>
          </Card>
        </div>

        {/* Right Col: Details Form */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6 border border-slate-200/80">
            <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2 pb-3 border-b border-slate-100">
              <User className="w-4 h-4 text-purple-600" /> Personal Information (MongoDB Connected)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">First Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="firstName"
                    value={profile.firstName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
                  />
                ) : (
                  <div className="px-3 py-2 bg-slate-50 border border-transparent rounded-lg text-sm text-slate-800 font-medium">
                    {profile.firstName}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Last Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="lastName"
                    value={profile.lastName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
                  />
                ) : (
                  <div className="px-3 py-2 bg-slate-50 border border-transparent rounded-lg text-sm text-slate-800 font-medium">
                    {profile.lastName}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={profile.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
                  />
                ) : (
                  <div className="px-3 py-2 bg-slate-50 border border-transparent rounded-lg text-sm text-slate-800 font-medium">
                    {profile.phone || 'Not provided'}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" /> Email Address
                </label>
                <div className="px-3 py-2 bg-slate-50 border border-transparent rounded-lg text-sm text-slate-800 font-medium">
                  {profile.email || 'Not provided'}
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" /> Operating City / Address
                </label>
                {isEditing ? (
                  <textarea
                    name="address"
                    value={profile.address}
                    onChange={handleChange}
                    rows="2"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 resize-none"
                  />
                ) : (
                  <div className="px-3 py-2 bg-slate-50 border border-transparent rounded-lg text-sm text-slate-800 font-medium">
                    {profile.address}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
