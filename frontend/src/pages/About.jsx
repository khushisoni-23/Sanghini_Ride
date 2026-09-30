import { Heart, ShieldCheck, MapPin, Target, Users2, Sparkles, AlertCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import { APP_NAME, APP_TAGLINE } from '../constants';
import logoImg from '../assets/logo.png';

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Uncompromising Safety',
    description:
      'We never cut corners on security. Every driver undergoes multi-step verification, criminal background checks, and identity validation before entering the platform.',
  },
  {
    icon: Heart,
    title: 'Dignity & Respect',
    description:
      'Providing women with a harassment-free, comfortable, and respectful transportation experience where they feel completely in control of their commute.',
  },
  {
    icon: Users2,
    title: 'Economic Empowerment',
    description:
      'Enabling local women in Udaipur to earn sustainable, independent livelihoods with fair compensation, flexible work schedules, and a supportive network.',
  },
  {
    icon: MapPin,
    title: 'Local-First Architecture',
    description:
      'Built specifically around the geographic and cultural context of Udaipur, addressing specific commute patterns across university campuses, markets, and hospitals.',
  },
];

export default function About() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-16">
      {/* ─── Hero / Mission ─────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-50 p-2 border border-purple-100 mb-2">
          <img src={logoImg} alt="Sanghini Ride" className="w-full h-full object-contain" />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100/70 text-purple-900 text-xs font-bold uppercase tracking-wider">
          Our Purpose
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
          Safe Mobility. Built for Women, <span className="text-brand-gradient">by Women.</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed pt-2">
          {APP_NAME} was founded to solve a fundamental urban challenge: enabling women in Udaipur to travel freely, safely, and with total peace of mind at any hour.
        </p>
      </div>

      {/* ─── Story & Philosophy ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <Card className="p-8 sm:p-10 border border-purple-100 bg-gradient-to-br from-purple-50/50 via-white to-white space-y-4">
          <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Why Sanghini Ride in Udaipur?
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            In many Indian cities, women face concerns regarding safety, availability, and conduct during late-night or early-morning commutes. Public transport can be crowded, and traditional ride-sharing platforms lack tailored safety mechanisms.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            Sanghini Ride bridges this gap in Udaipur by introducing a dedicated platform where both passengers and drivers are women. We create safe commutes for students, healthcare workers, professionals, and travelers across the City of Lakes.
          </p>
        </Card>

        <div className="space-y-4">
          <Card className="p-6 border border-slate-100">
            <h3 className="font-bold text-slate-900 text-base mb-1">For Passengers</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Travel anytime with verified female drivers, live route sharing with family, one-click emergency SOS, and transparent upfront pricing without hidden charges.
            </p>
          </Card>

          <Card className="p-6 border border-slate-100">
            <h3 className="font-bold text-slate-900 text-base mb-1">For Driver Partners</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Earn an independent income with women-only passengers, full insurance support, localized dispatching, and rapid emergency backup.
            </p>
          </Card>

          <Card className="p-6 border border-slate-100">
            <h3 className="font-bold text-slate-900 text-base mb-1">For the Community</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Building a network of trusted transportation that elevates social mobility and economic participation for women across Rajasthan.
            </p>
          </Card>
        </div>
      </div>

      {/* ─── Core Values Grid ───────────────────────────────────── */}
      <div className="space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-purple-700">
            What Guides Us
          </h2>
          <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Our Core Values
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {VALUES.map((val, i) => {
            const Icon = val.icon;
            return (
              <Card key={i} hover className="p-7 border border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mb-4 border border-purple-100">
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-lg mb-2">{val.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{val.description}</p>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ─── Transparent Status Notice ──────────────────────────── */}
      <Card className="p-6 border border-slate-200 bg-slate-50 text-slate-700 flex items-start gap-4">
        <AlertCircle className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-900">Project Development Status</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            {APP_NAME} is currently establishing the platform architecture and safety frameworks in Phase 0. Real passenger accounts, live vehicle matching, digital payment gateways, and pilot driver onboarding in Udaipur will launch in the upcoming phases.
          </p>
        </div>
      </Card>
    </div>
  );
}
