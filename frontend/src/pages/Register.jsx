import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  ShieldCheck,
  Car,
  UserCheck,
  KeyRound,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { APP_NAME, ROUTES } from '../constants';
import logoImg from '../assets/logo.png';
import { validateAadhaarNumber } from '../utils/aadhaarValidator';

export default function Register() {
  const [role, setRole] = useState('passenger');
  const [step, setStep] = useState(1); // 1 = Registration Details, 2 = OTP Verification
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    gender: 'female',
    aadhaarNumber: '',
    kycDeclaration: false,
  });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const { register, sendOtp } = useAuth();
  const navigate = useNavigate();

  // Timer countdown for OTP resend
  useEffect(() => {
    let interval = null;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, resendTimer]);

  const validateStep1 = () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.password) {
      setError('Please fill in all required fields.');
      return false;
    }

    if (formData.gender === 'male' || formData.gender === 'man' || formData.gender === 'boy') {
      setError('🌸 Sanghini Ride is strictly a Women-Only platform. Male account creation is prohibited to ensure passenger & driver safety.');
      return false;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid, real email address (e.g. name@gmail.com).');
      return false;
    }
    const cleanPhone = formData.phone.replace(/[\s-]/g, '');
    const phoneRegex = /^(?:\+91|91)?[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian phone number starting with 6, 7, 8, or 9.');
      return false;
    }

    if (!formData.aadhaarNumber || !formData.aadhaarNumber.trim()) {
      setError('Aadhaar Card Number is mandatory for KYC identity verification.');
      return false;
    }

    const cleanAadhaar = formData.aadhaarNumber.replace(/[\s-]/g, '');
    if (!validateAadhaarNumber(cleanAadhaar)) {
      setError('Invalid Aadhaar Card! Please enter a genuine 12-digit Indian Aadhaar card number. Dummy, repeating, or sequential numbers are strictly rejected by UIDAI KYC verification.');
      return false;
    }

    if (!formData.kycDeclaration) {
      setError('Please confirm the female identity & KYC declaration checkbox before proceeding.');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    return true;
  };

  // Step 1: Send OTP to real email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateStep1()) return;

    setLoading(true);
    try {
      await sendOtp({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      });
      setStep(2);
      setResendTimer(60);
      setCanResend(false);
    } catch (err) {
      setError(err.message || 'Failed to send verification code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    setError('');
    setLoading(true);
    try {
      await sendOtp({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      });
      setResendTimer(60);
      setCanResend(false);
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and complete account creation
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code sent to your email.');
      return false;
    }

    setLoading(true);
    try {
      const user = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        role,
        gender: formData.gender,
        aadhaarNumber: formData.aadhaarNumber.trim(),
        otp: otp.trim(),
      });

      // Redirect based on role
      if (user.role === 'driver') navigate(ROUTES.DRIVER, { replace: true });
      else navigate(ROUTES.PASSENGER, { replace: true });
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-50 p-2 border border-purple-100 shadow-2xs mb-2">
            <img src={logoImg} alt="Sanghini Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Join <span className="text-brand-gradient">{APP_NAME}</span>
          </h1>
          <p className="text-xs text-slate-500">
            Dedicated women's mobility & empowerment network in Udaipur
          </p>
        </div>

        {step === 1 && (
          <>
            {/* Role Toggle Selector */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('passenger')}
                className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  role === 'passenger'
                    ? 'border-purple-600 bg-purple-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    role === 'passenger' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Passenger Account</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Safe commutes in Udaipur</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('driver')}
                className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  role === 'driver'
                    ? 'border-purple-600 bg-purple-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    role === 'driver' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Driver Partner</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Drive & earn with dignity</div>
                </div>
              </button>
            </div>

            {/* Card Form - Step 1 */}
            <Card className="p-7 border border-slate-100 shadow-sm space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSendOtp} className="space-y-4">
                <Input
                  label="Full Name *"
                  placeholder="e.g. Pooja Sharma"
                  icon={User}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />

                <Input
                  label="Email Address (Real Verification Code Will Be Sent) *"
                  type="email"
                  placeholder="e.g. yourname@gmail.com"
                  icon={Mail}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />

                <Input
                  label="10-Digit Mobile Number (WhatsApp preferred) *"
                  type="tel"
                  placeholder="e.g. 9829012345"
                  icon={Phone}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />

                <Input
                  label="Password *"
                  type="password"
                  placeholder="Minimum 6 characters"
                  icon={Lock}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />

                <Input
                  label="Confirm Password *"
                  type="password"
                  placeholder="Re-enter your password"
                  icon={Lock}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />

                {/* KYC Gender & Safety Check */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Gender Identity (Women-Only Safety Policy) *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ ...formData, gender: val });
                      if (val === 'male') {
                        setError('🌸 Sanghini Ride is an exclusive Women-Only platform. Male registration is strictly prohibited for safety.');
                      } else {
                        setError('');
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="female">Female (Woman Rider / Partner) ✅</option>
                    <option value="other">Other / Non-Binary</option>
                    <option value="male">Male (Not Permitted ⛔)</option>
                  </select>
                </div>

                {formData.gender === 'male' && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-rose-900">
                      ⛔ Registration Blocked
                    </div>
                    <p className="text-[11px] text-rose-700 leading-relaxed">
                      Sanghini Ride is built exclusively for women riders and women drivers to ensure absolute safety. Male accounts are not permitted on this platform.
                    </p>
                  </div>
                )}

                {/* Aadhaar KYC Input */}
                <Input
                  label="Aadhaar Card Number (12-Digit Govt KYC) *"
                  type="text"
                  placeholder="e.g. 5482 9102 3841"
                  icon={ShieldCheck}
                  value={formData.aadhaarNumber}
                  onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                  required
                />

                {/* Mandatory KYC Declaration Checkbox */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="kycDeclaration"
                    checked={formData.kycDeclaration}
                    onChange={(e) => setFormData({ ...formData, kycDeclaration: e.target.checked })}
                    className="mt-0.5 w-4 h-4 rounded text-purple-700 focus:ring-purple-500 border-slate-300"
                  />
                  <label htmlFor="kycDeclaration" className="text-[11px] font-semibold text-slate-700 leading-snug cursor-pointer select-none">
                    I declare that I am a female rider/driver and my provided Aadhaar & identity details are genuine. I agree to Sanghini's Women-Safety Code of Conduct.
                  </label>
                </div>

                {role === 'driver' && (
                  <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-100 text-xs text-purple-950 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-purple-700" /> Driver Verification Required
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      After registration, your account will be in{' '}
                      <span className="font-bold text-amber-700">pending verification</span> status.
                      You will submit your commercial DL and vehicle papers for verification.
                    </p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  loading={loading} 
                  disabled={formData.gender === 'male'}
                  className="w-full justify-center shadow-xs"
                >
                  Verify Email & Continue <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </form>

              <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
                Already have an account?{' '}
                <Link to={ROUTES.LOGIN} className="font-bold text-purple-700 hover:text-purple-900">
                  Sign In
                </Link>
              </div>
            </Card>
          </>
        )}

        {/* Step 2: OTP Verification Card */}
        {step === 2 && (
          <Card className="p-7 border border-purple-100 shadow-lg space-y-5 bg-gradient-to-b from-white to-purple-50/20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError('');
                }}
                className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-purple-700 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Edit details
              </button>
              <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
                Step 2 of 2
              </span>
            </div>

            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-700 mb-1">
                <Mail className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Enter Verification Code</h2>
              <p className="text-xs text-slate-600">
                We've sent a 6-digit verification code to:
              </p>
              <div className="inline-block px-3 py-1 rounded-lg bg-slate-100 font-mono text-xs font-bold text-slate-800">
                {formData.email}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyAndRegister} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 text-center">
                  6-Digit OTP Code
                </label>
                <div className="relative max-w-xs mx-auto">
                  <KeyRound className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center pl-10 pr-4 py-3 text-2xl font-mono font-bold tracking-widest rounded-xl border border-purple-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-200 outline-none transition-all shadow-inner"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 text-center">
                  Please check your inbox or spam folder. Code expires in 10 minutes.
                </p>
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full justify-center shadow-md bg-purple-600 hover:bg-purple-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Verify & Create Account
              </Button>
            </form>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Didn't receive the email?</span>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={!canResend || loading}
                className={`font-semibold inline-flex items-center gap-1 ${
                  canResend && !loading
                    ? 'text-purple-600 hover:text-purple-800 cursor-pointer'
                    : 'text-slate-400 cursor-not-allowed'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                {canResend ? 'Resend Code' : `Resend in ${resendTimer}s`}
              </button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
