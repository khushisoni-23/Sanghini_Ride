import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { APP_NAME, ROUTES } from '../constants';
import logoImg from '../assets/logo.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in your credentials.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      // Redirect based on role
      if (user.role === 'admin') navigate(ROUTES.ADMIN, { replace: true });
      else if (user.role === 'driver') navigate(ROUTES.DRIVER, { replace: true });
      else navigate(ROUTES.PASSENGER, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-50 p-2 border border-purple-100 shadow-2xs mb-2">
            <img src={logoImg} alt="Sanghini Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Sign In to <span className="text-brand-gradient">{APP_NAME}</span>
          </h1>
          <p className="text-xs text-slate-500">
            Safe mobility and driver partner portal for Udaipur
          </p>
        </div>

        {/* Card Form */}
        <Card className="p-7 border border-slate-100 shadow-sm space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email Address or Mobile Number"
              type="text"
              placeholder="e.g. yourname@gmail.com or 9828312345"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex items-center justify-end text-xs pt-1">
              <button
                type="button"
                className="text-purple-700 hover:text-purple-900 font-semibold"
              >
                Forgot password?
              </button>
            </div>

            <Button type="submit" loading={loading} className="w-full justify-center shadow-xs">
              Sign In <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to={ROUTES.REGISTER} className="font-bold text-purple-700 hover:text-purple-900">
              Create an account
            </Link>
          </div>
        </Card>

        {/* Security Info */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
          <span>Protected by Sanghini Safety & Verification Architecture</span>
        </div>

      </div>
    </div>
  );
}
