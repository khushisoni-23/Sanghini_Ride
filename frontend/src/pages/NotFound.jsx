import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { ROUTES } from '../constants';
import logoImg from '../assets/logo.png';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
      <Card className="max-w-md w-full p-8 text-center border border-slate-100 shadow-sm space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-purple-50 p-1.5 flex items-center justify-center mx-auto border border-purple-100">
          <img src={logoImg} alt="Sanghini Logo" className="w-full h-full object-contain" />
        </div>

        <div className="space-y-2">
          <span className="text-4xl font-extrabold text-purple-900 tracking-tight">404</span>
          <h1 className="text-xl font-bold text-slate-900">Page Not Found</h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            The page you are trying to access does not exist or has been relocated.
          </p>
        </div>

        <div className="pt-2">
          <Link to={ROUTES.HOME}>
            <Button size="sm" className="shadow-xs">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Home
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
