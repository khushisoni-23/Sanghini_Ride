import { useState } from 'react';
import {
  Bell,
  Globe,
  Lock,
  Moon,
  Shield,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import { ROUTES, APP_NAME } from '../../constants';

export default function PassengerSettings() {
  const toast = useToast();
  const { language, setLanguage, t } = useLanguage();
  const [notifications, setNotifications] = useState({
    rideUpdates: true,
    safetyBroadcasts: true,
    promotions: false,
  });

  const handleSave = () => {
    toast.success(t('preferencesSaved'));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Page Title Header ────────────────────────────────────── */}
      <PageHeader
        title={t('settingsTitle')}
        subtitle={t('settingsSubtitle')}
        backTo={ROUTES.PASSENGER}
        backLabel={t('overview')}
      />

      {/* ─── Settings Sections ───────────────────────────────────── */}
      <div className="max-w-3xl space-y-6">
        {/* Language Selection */}
        <Card className="p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Globe className="w-4 h-4 text-purple-700" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {t('languagePreference')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'hi-en', label: 'Hindi & English', desc: 'हिंदी / English (Default)' },
              { id: 'hi', label: 'Hindi Only', desc: 'केवल हिंदी' },
              { id: 'raj', label: 'Rajasthani (Marwari)', desc: 'मारवाड़ी / मेवाड़ी (Udaipur)' },
            ].map((lang) => (
              <div
                key={lang.id}
                onClick={() => setLanguage(lang.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  language === lang.id
                    ? 'border-purple-600 bg-purple-50/60 ring-1 ring-purple-600 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="font-bold text-xs text-slate-900">{lang.label}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{lang.desc}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Bell className="w-4 h-4 text-purple-700" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {t('notificationPreference')}
            </span>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
              <div className="text-xs font-semibold text-slate-800">{t('tripAlerts')}</div>
              <input
                type="checkbox"
                checked={notifications.rideUpdates}
                onChange={(e) =>
                  setNotifications({ ...notifications, rideUpdates: e.target.checked })
                }
                className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
              <div className="text-xs font-semibold text-slate-800">{t('safetyAlerts')}</div>
              <input
                type="checkbox"
                checked={notifications.safetyBroadcasts}
                onChange={(e) =>
                  setNotifications({ ...notifications, safetyBroadcasts: e.target.checked })
                }
                className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              />
            </label>
          </div>
        </Card>

        {/* Platform Info */}
        <Card className="p-5 border border-slate-200/80 bg-slate-50/60 text-xs text-slate-600 space-y-2">
          <div className="font-bold text-slate-900">{APP_NAME} Mobile Web Platform</div>
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <span>Version: 1.0.0-phase1</span>
            <span>•</span>
            <span>Udaipur Pilot Edition</span>
          </div>
        </Card>

        <Button variant="primary" size="md" onClick={handleSave} className="font-bold shadow-xs">
          {t('savePreferences')}
        </Button>
      </div>
    </div>
  );
}
