import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, ShieldCheck, Heart } from 'lucide-react';
import { APP_NAME, APP_TAGLINE, ROUTES } from '../constants';
import logoImg from '../assets/logo.png';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Col (2 cols wide) */}
          <div className="lg:col-span-2 space-y-4">
            <Link to={ROUTES.HOME} className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-purple-900/50 p-1 border border-purple-700/40 flex items-center justify-center">
                <img
                  src={logoImg}
                  alt="Sanghini Ride"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-xl font-extrabold text-white tracking-tight">
                  {APP_NAME}
                </span>
                <p className="text-xs text-purple-300 font-medium">
                  {APP_TAGLINE}
                </p>
              </div>
            </Link>

            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Udaipur's dedicated women-focused mobility platform, connecting women riders with background-verified women driver partners for safe, dignified, and reliable journeys.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Safety Operations Centre • Udaipur, Rajasthan</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              Platform
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to={ROUTES.HOME} className="text-slate-400 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to={ROUTES.ABOUT} className="text-slate-400 hover:text-white transition-colors">
                  About Our Mission
                </Link>
              </li>
              <li>
                <Link to={ROUTES.SAFETY} className="text-slate-400 hover:text-white transition-colors">
                  Safety Blueprint
                </Link>
              </li>
              <li>
                <Link to={ROUTES.SUPPORT} className="text-slate-400 hover:text-white transition-colors">
                  Help & FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* User Access */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              Get Started
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to={ROUTES.REGISTER} className="text-slate-400 hover:text-white transition-colors">
                  Passenger Registration
                </Link>
              </li>
              <li>
                <Link to={ROUTES.REGISTER} className="text-slate-400 hover:text-white transition-colors">
                  Drive with Sanghini
                </Link>
              </li>
              <li>
                <Link to={ROUTES.LOGIN} className="text-slate-400 hover:text-white transition-colors">
                  Account Sign In
                </Link>
              </li>
              <li>
                <Link to={ROUTES.SUPPORT} className="text-slate-400 hover:text-white transition-colors">
                  Driver Requirements
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              Udaipur Contact
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>Fatehpura, Udaipur, Rajasthan 313001</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-purple-400 shrink-0" />
                <span>support@sanghiniride.com</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-purple-400 shrink-0" />
                <span>+91 (0294) 240-SANGHINI</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {currentYear} {APP_NAME}. All rights reserved. Designed for Udaipur, Rajasthan.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Driver Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
