import {
  ShieldCheck,
  UserCheck,
  MapPin,
  PhoneCall,
  Users,
  AlertTriangle,
  FileCheck2,
  Lock,
  CheckCircle2,
  AlertCircle,
  Phone,
  Radio,
} from 'lucide-react';
import Card from '../components/ui/Card';
import { APP_NAME } from '../constants';
import logoImg from '../assets/logo.png';

const SAFETY_PILLARS = [
  {
    icon: UserCheck,
    title: '1. Multi-Step Driver Verification',
    points: [
      'Comprehensive Aadhaar and identity authentication.',
      'Commercial driving license & RTO registration validation.',
      'Mandatory police background clearance.',
      'In-person interview and route familiarity test in Udaipur.',
    ],
  },
  {
    icon: Lock,
    title: '2. Four-Digit Ride OTP',
    points: [
      'Every ride generates a unique 4-digit code.',
      'The driver must enter your OTP to begin the meter/trip.',
      'Prevents entering the wrong vehicle or unauthorized drivers.',
      'Ensures both parties confirm identity before departure.',
    ],
  },
  {
    icon: MapPin,
    title: '3. Live GPS Trip Monitoring',
    points: [
      'Active GPS telemetry from pickup to destination.',
      'Automated deviation alerts if the vehicle drifts off route.',
      'Real-time speed and stationary pause detection.',
      'Visible to the Sanghini Udaipur Operations team.',
    ],
  },
  {
    icon: Users,
    title: '4. Instant Trusted Contacts Sharing',
    points: [
      'Share your live trip with up to 5 family members or friends.',
      'They receive live map tracking, driver name, photo & vehicle number.',
      'Works via WhatsApp or direct secure web link.',
      'No app installation required for your emergency contacts.',
    ],
  },
  {
    icon: AlertTriangle,
    title: '5. Integrated SOS Emergency Response',
    points: [
      'Prominent, accessible emergency button on every active ride screen.',
      'Instant alert dispatched with exact coordinates to Udaipur Safety Hub.',
      'Simultaneous SMS broadcast to all your trusted contacts.',
      'Direct integration with local police helpline (112 / 1090).',
    ],
  },
  {
    icon: FileCheck2,
    title: '6. Post-Ride Quality & Accountability',
    points: [
      'Two-way rating system ensuring mutual respect.',
      'Strict zero-tolerance policy for harassment or safety breaches.',
      'Immediate investigation and driver suspension for safety flags.',
      'Regular vehicle maintenance checks and cleanliness standards.',
    ],
  },
];

export default function Safety() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-16">
      {/* ─── Hero ──────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-purple-700" /> Complete Safety Blueprint
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
          Your Safety is <span className="text-gradient-purple">Non-Negotiable.</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed pt-2">
          From the moment you request a ride until you arrive safely at your doorstep, Sanghini Ride's multi-layered safety architecture protects your journey across Udaipur.
        </p>
      </div>

      {/* ─── 6 Safety Pillars ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SAFETY_PILLARS.map((pillar, i) => {
          const Icon = pillar.icon;
          return (
            <Card key={i} className="p-7 border border-slate-100 shadow-sm card-hover-effect flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-5 font-bold">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base mb-4 tracking-tight">
                  {pillar.title}
                </h3>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  {pillar.points.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ─── SOS Protocol Highlight (Fixed High-Contrast Beautiful Card) ── */}
      <div className="rounded-3xl bg-gradient-to-br from-purple-950 via-purple-900 to-slate-950 p-8 sm:p-12 text-white shadow-2xl border border-purple-800/40 relative overflow-hidden">
        {/* Glow behind card */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
          
          <div className="lg:col-span-7 space-y-4 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold uppercase tracking-wider border border-rose-500/30">
              <Radio className="w-3.5 h-3.5 animate-pulse text-rose-400" /> 24/7 Safety Command Center
            </div>
            
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              What Happens When You Press SOS?
            </h2>
            
            <p className="text-sm sm:text-base text-purple-100/90 leading-relaxed max-w-xl">
              When triggered, our system broadcasts your live vehicle coordinates to our Udaipur response desk, immediately notifies your 5 pre-configured trusted contacts with a live tracking link, and opens an instant voice channel to verify your situation.
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-purple-200">
              <CheckCircle2 className="w-4 h-4 text-purple-300" />
              <span>Direct priority integration with Rajasthan Emergency Dispatch</span>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white/10 backdrop-blur-xl p-6 sm:p-7 rounded-2xl border border-white/20 shadow-xl space-y-4">
            <h3 className="text-xs font-extrabold text-purple-200 uppercase tracking-wider pb-2 border-b border-white/15">
              Emergency Helplines (Udaipur & Rajasthan)
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-white/10">
                <span className="text-purple-100">Police Emergency</span>
                <span className="font-extrabold text-white text-sm bg-white/15 px-2.5 py-0.5 rounded-md">112</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/10">
                <span className="text-purple-100">Women Helpline (Rajasthan)</span>
                <span className="font-extrabold text-white text-sm bg-white/15 px-2.5 py-0.5 rounded-md">1090</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-purple-100">Sanghini Udaipur Desk</span>
                <span className="font-extrabold text-amber-300 text-xs tracking-wide">+91 (0294) 240-SANGHINI</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
