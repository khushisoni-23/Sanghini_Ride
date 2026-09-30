import { useState } from 'react';
import { HelpCircle, Mail, Phone, MapPin, Send, MessageSquare, ShieldAlert, CheckCircle2, ChevronDown } from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useToast } from '../context/ToastContext';
import { APP_NAME } from '../constants';
import logoImg from '../assets/logo.png';

const FAQS = [
  {
    category: 'General & Access',
    items: [
      {
        q: 'Who can use Sanghini Ride?',
        a: 'Sanghini Ride is dedicated exclusively to women passengers and verified women drivers in Udaipur to foster a dignified, safe transit environment.',
      },
      {
        q: 'Where will Sanghini Ride be available initially?',
        a: 'We are launching first in Udaipur, Rajasthan, covering major hubs such as Lake Pichola, Sukhadia Circle, MLSU Campus, Fatehpura, and the Railway Station.',
      },
    ],
  },
  {
    category: 'Safety & Drivers',
    items: [
      {
        q: 'How are driver partners verified?',
        a: 'Every driver partner must submit Aadhaar identity proof, commercial driving license, vehicle registration/fitness, and pass police background verification and an in-person interview.',
      },
      {
        q: 'Can male passengers travel with a female passenger?',
        a: 'Sanghini Ride is designed strictly for women passengers and accompanying children (under 12). Male adult co-passengers are not permitted.',
      },
    ],
  },
  {
    category: 'Driver Partner Opportunities',
    items: [
      {
        q: 'What are the criteria to become a Sanghini driver partner?',
        a: 'You must be a female driver with a valid commercial license, registered commercial four-wheeler/auto in Udaipur, and clear criminal record.',
      },
      {
        q: 'How does driver payout work?',
        a: 'Driver partners receive transparent fares with zero surge exploitation and scheduled weekly direct bank transfers.',
      },
    ],
  },
];

export default function Support() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please complete all required fields.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success('Your message has been received by our Udaipur team.');
    }, 600);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-16">
      {/* ─── Header ────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-100/70 text-purple-900 text-xs font-bold uppercase tracking-wider">
          <HelpCircle className="w-4 h-4 text-purple-700" /> Help & Support Centre
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
          How can we <span className="text-brand-gradient">help you?</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed pt-2">
          Have questions about {APP_NAME}, passenger safety, or driver onboarding in Udaipur? We are here to assist.
        </p>
      </div>

      {/* ─── Contact Info & Form Grid ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Contact Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-7 border border-purple-100 bg-gradient-to-br from-white via-purple-50/20 to-purple-50/40">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2.5">
              <MessageSquare className="w-5 h-5 text-purple-700" /> Udaipur Operations Desk
            </h2>

            <div className="space-y-6 text-sm">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Safety & Operations Centre</h3>
                  <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                    Sanghini Mobility Hub, Fatehpura Main Road, Udaipur, Rajasthan 313001
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Email Inquiries</h3>
                  <p className="text-slate-600 text-xs mt-1">support@sanghiniride.com</p>
                  <p className="text-slate-600 text-xs">safety@sanghiniride.com</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Helpline Phone</h3>
                  <p className="text-slate-900 font-semibold text-xs mt-1">+91 (0294) 240-SANGHINI</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">Mon–Sat, 9:00 AM – 7:00 PM</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5 border border-slate-200 bg-slate-50">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Emergency Assistance Notice</h4>
                <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                  For active emergencies during rides, always use the in-app SOS button or dial police helpline 112 directly.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Inquiry Form (7 cols) */}
        <div className="lg:col-span-7">
          <Card className="p-8 border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Send an Inquiry</h2>

            {submitted ? (
              <div className="p-8 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-lg font-bold text-emerald-950">Inquiry Submitted Successfully</h3>
                <p className="text-emerald-800 text-xs max-w-md mx-auto leading-relaxed">
                  Thank you, {formData.name}. Your inquiry has been forwarded to our Udaipur customer operations desk. We will respond within 24 business hours.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', email: '', phone: '', message: '' });
                  }}
                  className="mt-2"
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    placeholder="e.g. Radhika Joshi"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="e.g. radhika@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <Input
                  label="Contact Phone (Optional)"
                  type="tel"
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Your Message <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your question or feedback..."
                    required
                    className="w-full bg-white text-slate-900 placeholder-slate-400 text-sm rounded-xl border border-slate-200 hover:border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/15 focus:outline-none p-3.5 transition-all"
                  />
                </div>

                <Button type="submit" loading={loading} className="w-full sm:w-auto shadow-xs">
                  <Send className="w-4 h-4 mr-2" /> Submit Message
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>

      {/* ─── FAQs ──────────────────────────────────────────────── */}
      <div className="space-y-8 pt-4">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-purple-700">
            Answers & Clarity
          </h2>
          <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {FAQS.map((category, catIdx) => (
            <div key={catIdx} className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-800 pb-2 border-b border-purple-100">
                {category.category}
              </h4>
              <div className="space-y-3">
                {category.items.map((item, itemIdx) => (
                  <Card key={itemIdx} className="p-5 border border-slate-100 space-y-2">
                    <h5 className="font-bold text-slate-900 text-xs leading-snug">{item.q}</h5>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.a}</p>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
