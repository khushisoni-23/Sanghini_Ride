import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, Shield } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { ROUTES } from '../constants';
import logoImg from '../assets/logo.png';

export default function ComingSoon({
  title = 'Feature In Progress',
  description = 'This feature is currently being engineered as part of our upcoming roadmap for Udaipur.',
}) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
      <Card className="max-w-md w-full p-8 text-center border border-purple-100 shadow-sm space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-purple-50 p-1.5 flex items-center justify-center mx-auto border border-purple-100">
          <img src={logoImg} alt="Sanghini Logo" className="w-full h-full object-contain" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100/70 text-purple-900 text-xs font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 text-purple-700" /> Upcoming Roadmap
          </div>
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">{title}</h1>
          <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">{description}</p>
        </div>

        <div className="pt-2">
          <Link to={ROUTES.HOME}>
            <Button variant="outline" size="sm" className="shadow-2xs">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Return to Home
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
