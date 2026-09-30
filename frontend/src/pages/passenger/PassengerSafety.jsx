import { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  Users,
  Share2,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Heart,
  Radio,
  Lock,
  MapPin,
  Info,
  Loader2,
  Mic,
  MicOff,
  Volume2,
  Eye,
  EyeOff,
  Navigation,
  Clock,
  Building2,
  Hospital,
  Home,
  Fuel,
  ThumbsUp,
  AlertCircle,
  ExternalLink,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import PageHeader from '../../components/ui/PageHeader';
import { useToast } from '../../context/ToastContext';
import { ROUTES, EMERGENCY_HELPLINES } from '../../constants';
import safetyService from '../../services/safetyService';
import safetyFeaturesService from '../../services/safetyFeaturesService';

const HAVEN_TYPE_LABELS = {
  all: 'All Safe Havens',
  police_booth: 'Police Stations & Booths',
  hospital: '24/7 Hospitals',
  women_shelter: "Women's Shelters",
  safe_shop: 'Verified Partner Shops',
  petrol_station: 'Safe Fuel Hubs',
};

export default function PassengerSafety() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('sos'); // 'sos' | 'havens' | 'signals' | 'bubble' | 'voice' | 'privacy'

  // SOS & Contacts
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [addContactModalOpen, setAddContactModalOpen] = useState(false);
  const [isTriggeringSos, setIsTriggeringSos] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [savingContact, setSavingContact] = useState(false);
  const [deletingContactId, setDeletingContactId] = useState(null);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relationship: 'Mother' });

  // Safe Havens
  const [safeHavens, setSafeHavens] = useState([]);
  const [loadingHavens, setLoadingHavens] = useState(false);
  const [havenFilter, setHavenFilter] = useState('all');

  // Community Signals
  const [signals, setSignals] = useState([]);
  const [loadingSignals, setLoadingSignals] = useState(false);
  const [newSignalModalOpen, setNewSignalModalOpen] = useState(false);
  const [postingSignal, setPostingSignal] = useState(false);
  const [newSignalData, setNewSignalData] = useState({
    signalType: 'unlit_road',
    severity: 'medium',
    description: '',
    address: 'Chetak Circle, Udaipur',
  });

  // Time-Aware & Safety Bubble Status
  const [timeSafety, setTimeSafety] = useState(null);
  const [loadingTimeSafety, setLoadingTimeSafety] = useState(false);

  // Privacy Controls State (saved to localStorage)
  const [privacySettings, setPrivacySettings] = useState(() => {
    const saved = localStorage.getItem('sanghini_privacy');
    return saved
      ? JSON.parse(saved)
      : {
          numberMasking: true,
          stealthTracking: false,
          incognitoDropoff: true,
          autoPurgeHistory: false,
        };
  });

  // Voice Assistant State
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('');
  const recognitionRef = useRef(null);

  // Fetch initial contacts & time safety
  useEffect(() => {
    fetchContacts();
    fetchTimeSafety();
  }, []);

  // Fetch Safe Havens when tab opens
  useEffect(() => {
    if (activeTab === 'havens' && safeHavens.length === 0) {
      fetchSafeHavens();
    } else if (activeTab === 'signals' && signals.length === 0) {
      fetchCommunitySignals();
    }
  }, [activeTab]);

  const fetchContacts = async () => {
    setLoadingContacts(true);
    try {
      const res = await safetyService.getTrustedContacts();
      setContacts(res.data || []);
    } catch (err) {
      console.warn('Failed to load trusted contacts:', err.message);
    } finally {
      setLoadingContacts(false);
    }
  };

  const fetchSafeHavens = async () => {
    setLoadingHavens(true);
    try {
      const res = await safetyFeaturesService.getAllSafeHavens();
      setSafeHavens(res.data || []);
    } catch (err) {
      console.warn('Failed to load safe havens:', err.message);
    } finally {
      setLoadingHavens(false);
    }
  };

  const fetchCommunitySignals = async () => {
    setLoadingSignals(true);
    try {
      // Default to Udaipur central coordinates
      const res = await safetyFeaturesService.getNearbySignals({
        lat: 24.5854,
        lng: 73.7125,
        radiusKm: 15,
      });
      setSignals(res.data || []);
    } catch (err) {
      console.warn('Failed to load signals:', err.message);
    } finally {
      setLoadingSignals(false);
    }
  };

  const fetchTimeSafety = async () => {
    setLoadingTimeSafety(true);
    try {
      const res = await safetyFeaturesService.getTimeAwareSafety();
      setTimeSafety(res.data);
    } catch (err) {
      console.warn('Failed to load time safety:', err.message);
    } finally {
      setLoadingTimeSafety(false);
    }
  };

  const handleTriggerSOS = async () => {
    setIsTriggeringSos(true);
    try {
      let location = null;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          );
          location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        } catch {
          // GPS unavailable
        }
      }

      await safetyService.triggerSOS(null, location);
      toast.error('🚨 SOS ALERT TRIGGERED! Udaipur Safety Desk and all trusted contacts have been notified.');
      setSosModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to trigger SOS. Please call 112 directly.');
    } finally {
      setIsTriggeringSos(false);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phone) {
      toast.error('Please enter contact name and phone.');
      return;
    }
    if (contacts.length >= 5) {
      toast.error('You can add a maximum of 5 trusted contacts.');
      return;
    }

    setSavingContact(true);
    try {
      const res = await safetyService.addTrustedContact({
        name: newContact.name,
        phone: newContact.phone,
        relationship: newContact.relationship,
      });
      if (res.success || res.data) {
        toast.success('Trusted contact added successfully.');
        setNewContact({ name: '', phone: '', relationship: 'Mother' });
        setAddContactModalOpen(false);
        fetchContacts();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to add contact.');
    } finally {
      setSavingContact(false);
    }
  };

  const handleRemoveContact = async (contactId) => {
    setDeletingContactId(contactId);
    try {
      await safetyService.deleteTrustedContact(contactId);
      toast.info('Trusted contact removed.');
      fetchContacts();
    } catch (err) {
      toast.error(err.message || 'Failed to remove contact.');
    } finally {
      setDeletingContactId(null);
    }
  };

  const handlePostSignal = async (e) => {
    e.preventDefault();
    setPostingSignal(true);
    try {
      await safetyFeaturesService.postCommunitySignal({
        signalType: newSignalData.signalType,
        severity: newSignalData.severity,
        description: newSignalData.description,
        location: {
          address: newSignalData.address,
          coordinates: [73.7125, 24.5854], // Udaipur central fallback
        },
      });
      toast.success('🛡️ Safety hazard signal broadcasted to Udaipur community!');
      setNewSignalModalOpen(false);
      setNewSignalData({
        signalType: 'unlit_road',
        severity: 'medium',
        description: '',
        address: 'Chetak Circle, Udaipur',
      });
      fetchCommunitySignals();
    } catch (err) {
      toast.error(err.message || 'Failed to post signal.');
    } finally {
      setPostingSignal(false);
    }
  };

  const handleConfirmSignal = async (signalId) => {
    try {
      await safetyFeaturesService.confirmSignal(signalId);
      toast.success('Signal confirmed. Thank you for keeping Udaipur safe!');
      fetchCommunitySignals();
    } catch (err) {
      toast.error(err.message || 'Failed to confirm signal.');
    }
  };

  const handlePrivacyToggle = (key) => {
    const updated = { ...privacySettings, [key]: !privacySettings[key] };
    setPrivacySettings(updated);
    localStorage.setItem('sanghini_privacy', JSON.stringify(updated));
    toast.success('Privacy preference updated.');
  };

  // Voice Assistant Setup with Web Speech API
  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleVoiceAssistant = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.warning('Speech recognition is not supported in this browser. Please use Google Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceTranscript('Listening... Speak a command (e.g., "Help", "Safe Haven", "Call Police")');
    };

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript.toLowerCase();
      setVoiceTranscript(`"${text}"`);
      handleVoiceCommand(text);
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
      setVoiceTranscript('Could not hear clearly. Please try again.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleVoiceCommand = (text) => {
    if (text.includes('help') || text.includes('sos') || text.includes('emergency') || text.includes('khatra')) {
      const resp = 'Emergency trigger recognized. Opening SOS Command Desk now.';
      setAssistantResponse(resp);
      speak(resp);
      setSosModalOpen(true);
    } else if (text.includes('police') || text.includes('police station')) {
      const resp = 'Calling Udaipur Police Helpline 112.';
      setAssistantResponse(resp);
      speak(resp);
      window.location.href = 'tel:112';
    } else if (text.includes('safe haven') || text.includes('hospital') || text.includes('shelter')) {
      const resp = 'Navigating to nearest verified Safe Havens in Udaipur.';
      setAssistantResponse(resp);
      speak(resp);
      setActiveTab('havens');
    } else if (text.includes('bubble') || text.includes('score')) {
      const resp = 'Your Safety Bubble is active. Udaipur Corridor Security is optimal.';
      setAssistantResponse(resp);
      speak(resp);
      setActiveTab('bubble');
    } else {
      const resp = `Command "${text}" received. Sanghini Safety Command is active and monitoring your safety.`;
      setAssistantResponse(resp);
      speak(resp);
    }
  };

  const filteredHavens =
    havenFilter === 'all'
      ? safeHavens
      : safeHavens.filter((h) => h.type === havenFilter);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Page Title Header ────────────────────────────────────── */}
      <PageHeader
        title="Sanghini Safety & Protection Command"
        subtitle="14-layer women safety ecosystem active across Udaipur, Rajasthan."
        backTo={ROUTES.PASSENGER}
        backLabel="Passenger Overview"
        badge={
          <Badge variant="purple" size="sm" className="font-bold">
            🛡️ Udaipur 24/7 Shield Active
          </Badge>
        }
      />

      {/* ─── Emergency SOS Hero Card ──────────────────────────────── */}
      <div className="rounded-3xl bg-gradient-to-br from-rose-950 via-rose-900 to-purple-950 p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-rose-700/40">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
          <div className="md:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold tracking-wider border border-rose-500/30">
              <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> Layer 1: Instant SOS & Udaipur Police Bridge
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-snug">
              Instant 1-Tap Emergency SOS
            </h2>
            <p className="text-xs sm:text-sm text-rose-100/90 max-w-xl leading-relaxed">
              Instantly transmits live GPS coordinates to our 24/7 Udaipur Command Desk, notifies your Trusted Circle via SMS/WhatsApp, and dials priority emergency dispatch.
            </p>
          </div>

          <div className="md:col-span-4 flex justify-start md:justify-end">
            <button
              onClick={() => setSosModalOpen(true)}
              className="px-6 py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-extrabold text-sm shadow-2xl flex items-center gap-3 transition-transform hover:scale-105 cursor-pointer ring-4 ring-rose-500/30"
            >
              <ShieldAlert className="w-6 h-6 animate-pulse" />
              <span>TRIGGER SOS</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Feature Navigation Tabs ──────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-none">
        {[
          { id: 'sos', label: 'Trusted Circle & SOS', icon: Users },
          { id: 'havens', label: 'Safe Haven Network', icon: Building2 },
          { id: 'signals', label: 'Community Signals', icon: AlertTriangle },
          { id: 'bubble', label: 'Safety Bubble & Night Shield', icon: ShieldCheck },
          { id: 'voice', label: 'Voice Assistance', icon: Mic },
          { id: 'privacy', label: 'Privacy Controls', icon: Lock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-purple-700 text-white shadow-md shadow-purple-200'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-purple-200' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: SOS & TRUSTED CIRCLE ──────────────────────────── */}
      {activeTab === 'sos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Trusted Contacts */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-700" /> Trusted Emergency Circle
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Up to 5 verified family members or guardians who receive live telemetry and SOS pings.
                </p>
              </div>
              {contacts.length < 5 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddContactModalOpen(true)}
                  className="text-xs font-bold shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Guardian
                </Button>
              )}
            </div>

            {loadingContacts ? (
              <div className="py-10 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600 mb-2" />
                <p className="text-xs text-slate-500 font-semibold">Loading trusted circle...</p>
              </div>
            ) : contacts.length === 0 ? (
              <Card className="p-8 border border-slate-200 text-center space-y-3">
                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No trusted guardians added yet</p>
                <p className="text-xs text-slate-500">Add trusted family members to receive automatic ride alerts.</p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setAddContactModalOpen(true)}
                  className="text-xs font-bold bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Your First Guardian
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <Card key={contact._id} className="p-4 border border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
                        {contact.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {contact.name} {contact.relationship ? `(${contact.relationship})` : ''}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{contact.phone}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="purple" size="sm">Active Circle</Badge>
                      <button
                        onClick={() => handleRemoveContact(contact._id)}
                        disabled={deletingContactId === contact._id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                        title="Remove Contact"
                      >
                        {deletingContactId === contact._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Udaipur Helplines */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Official 24/7 Udaipur Helplines
            </h3>

            <Card className="p-5 border border-slate-200/80 space-y-3">
              {EMERGENCY_HELPLINES.map((hl, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900">{hl.name}</div>
                    <div className="text-[11px] text-slate-500">24/7 Priority Emergency Desk</div>
                  </div>
                  <a
                    href={`tel:${hl.number}`}
                    className={`font-mono font-extrabold text-sm px-2.5 py-1 rounded-lg hover:scale-105 transition-transform ${
                      hl.primary
                        ? 'bg-rose-100 text-rose-900'
                        : 'bg-purple-100 text-purple-900'
                    }`}
                  >
                    {hl.number}
                  </a>
                </div>
              ))}
            </Card>

            <Card className="p-4 border border-purple-100 bg-purple-50/60 text-xs text-purple-950 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-700" /> Family / Guardian Live Dashboard
              </div>
              <p className="text-[11px] text-purple-800 leading-relaxed">
                When you book any ride, you can share a dedicated live Guardian Dashboard link with family members. They can track your exact GPS route, view driver verification details, and send you safety pings without needing to log in.
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* ─── TAB 2: SAFE HAVEN NETWORK ────────────────────────────── */}
      {activeTab === 'havens' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-700" /> Udaipur Safe Haven Network
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Verified 24/7 safe physical zones across Udaipur (Police Stations, Hospitals, Pink Booths, Safe Hubs).
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {Object.entries(HAVEN_TYPE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setHavenFilter(key)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                    havenFilter === key
                      ? 'bg-purple-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loadingHavens ? (
            <div className="py-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600 mb-2" />
              <p className="text-xs text-slate-500 font-semibold">Loading Udaipur Safe Havens...</p>
            </div>
          ) : filteredHavens.length === 0 ? (
            <Card className="p-8 border border-slate-200 text-center space-y-2">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No Safe Havens Found in this category</p>
              <p className="text-xs text-slate-500">Switch filter to view all verified Udaipur safe zones.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHavens.map((haven) => (
                <Card key={haven._id || haven.id} className="p-4 border border-slate-200/80 hover:shadow-md transition-shadow space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-extrabold text-slate-900">{haven.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-purple-600 shrink-0" />
                        <span className="truncate">{haven.address || 'Udaipur, Rajasthan'}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      24/7 Verified
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl">
                    <span className="font-semibold text-slate-700">Facilities: </span>
                    {haven.facilities?.join(', ') || 'Security Guard, First Aid, CCTV, Water, Phone'}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    {haven.phone ? (
                      <a
                        href={`tel:${haven.phone}`}
                        className="inline-flex items-center gap-1 font-bold text-purple-700 hover:text-purple-900"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call Haven
                      </a>
                    ) : (
                      <span className="text-slate-400">Toll Free Help</span>
                    )}

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${haven.name}, Udaipur`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-purple-700"
                    >
                      <Navigation className="w-3.5 h-3.5" /> Navigate <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: COMMUNITY SAFETY SIGNALS ──────────────────────── */}
      {activeTab === 'signals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Udaipur Community Safety Signals
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Crowdsourced road safety signals (poor street lighting, checkpoint, road hazards).
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setNewSignalModalOpen(true)}
              className="text-xs font-bold bg-amber-600 hover:bg-amber-700"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Report Hazard
            </Button>
          </div>

          {loadingSignals ? (
            <div className="py-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-600 mb-2" />
              <p className="text-xs text-slate-500 font-semibold">Loading community signals...</p>
            </div>
          ) : signals.length === 0 ? (
            <Card className="p-8 border border-slate-200 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No active hazard signals reported in Udaipur right now</p>
              <p className="text-xs text-slate-500">The city corridors are currently clear and monitored.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {signals.map((sig) => (
                <Card key={sig._id} className="p-4 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 capitalize">
                          {sig.signalType?.replace('_', ' ')}
                        </span>
                        <Badge
                          variant={sig.severity === 'high' ? 'danger' : 'warning'}
                          size="sm"
                          className="capitalize"
                        >
                          {sig.severity} priority
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{sig.description || 'Reported by verified commuter'}</p>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-1.5 font-mono">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{sig.location?.address || 'Udaipur, Rajasthan'}</span>
                        <span>•</span>
                        <span>{sig.confirmations || 1} verified votes</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConfirmSignal(sig._id)}
                      className="text-xs font-bold text-slate-700 hover:text-purple-700"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 mr-1" /> Confirm Signal
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 4: SAFETY BUBBLE & NIGHT SHIELD ───────────────────── */}
      {activeTab === 'bubble' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-5 h-5 text-purple-700" />
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Dynamic Safety Bubble</h4>
                <p className="text-[11px] text-slate-500">Automatic route geofencing & corridor deviation sentinel</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-purple-950">500m Auto-Geofence Deviation Protection</div>
                  <div className="text-[11px] text-purple-800 mt-0.5">
                    If your ride deviates by more than 500 meters from the approved Udaipur road corridor, our safety desk receives an instant audible alert.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                <Radio className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Live Telemetry Ping Rate</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Driver coordinates synchronized every 5 seconds over secure Socket.IO channel.
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Clock className="w-5 h-5 text-purple-700" />
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Time-Aware Night Shield</h4>
                <p className="text-[11px] text-slate-500">Autonomous risk modulation based on Udaipur time of day</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Current Time Mode:</span>
                  <span className="font-bold text-emerald-400">
                    {timeSafety?.timeWindow || 'Active Monitoring Window'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Night Escort Mode:</span>
                  <span className="font-bold text-purple-300">
                    {timeSafety?.nightModeActive ? 'Active (Heightened)' : 'Standard Daylight Protocol'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Automated Check-in Interval:</span>
                  <span className="font-bold text-white">Every 5-10 minutes</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                After 8:00 PM in Udaipur, Sanghini automatically enables Journey Buddy check-in prompts and elevates GPS tracking priority.
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* ─── TAB 5: VOICE ASSISTANCE ──────────────────────────────── */}
      {activeTab === 'voice' && (
        <Card className="p-6 border border-slate-200/80 space-y-6 max-w-2xl mx-auto text-center">
          <div className="space-y-2">
            <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-inner">
              <Mic className={`w-8 h-8 ${isListening ? 'animate-bounce text-rose-600' : ''}`} />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">Hands-Free Voice Safety Assistant</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Speak voice commands in English or Hindi to instantly trigger safety protocols without touching your phone.
            </p>
          </div>

          <div className="flex justify-center">
            <button
              onClick={toggleVoiceAssistant}
              className={`px-8 py-4 rounded-2xl font-extrabold text-sm flex items-center gap-3 transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-700 text-white ring-4 ring-rose-200 animate-pulse'
                  : 'bg-purple-700 hover:bg-purple-800 text-white shadow-lg shadow-purple-200'
              }`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              <span>{isListening ? 'Stop Listening' : 'Start Voice Assistant'}</span>
            </button>
          </div>

          {voiceTranscript && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
              <div className="font-semibold text-slate-500 text-[10px] uppercase">Recognized Speech:</div>
              <div className="font-mono text-sm font-bold text-slate-900">{voiceTranscript}</div>
            </div>
          )}

          {assistantResponse && (
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-1 flex items-center gap-2 text-left">
              <Volume2 className="w-5 h-5 text-purple-700 shrink-0" />
              <div>
                <div className="font-bold">Sanghini Voice Feedback:</div>
                <div>{assistantResponse}</div>
              </div>
            </div>
          )}

          <div className="text-left bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="text-xs font-bold text-slate-800">Supported Voice Triggers:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
              <div className="p-2 rounded-lg bg-white border border-slate-200/80 font-mono">
                🎤 "Help" / "SOS" / "Khatra"
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200/80 font-mono">
                🎤 "Call Police" / "112"
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200/80 font-mono">
                🎤 "Find Safe Haven" / "Hospital"
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200/80 font-mono">
                🎤 "Check Safety Bubble"
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ─── TAB 6: PRIVACY CONTROLS ──────────────────────────────── */}
      {activeTab === 'privacy' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <Card className="p-6 border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Lock className="w-4 h-4 text-purple-700" />
              <h4 className="font-bold text-slate-900 text-sm">Personal Privacy & Stealth Modes</h4>
            </div>

            <div className="space-y-3">
              {[
                {
                  key: 'numberMasking',
                  title: 'Virtual Phone Number Masking',
                  desc: 'Drivers only see a virtual temporary relay number, protecting your real mobile number.',
                },
                {
                  key: 'incognitoDropoff',
                  title: 'Incognito Drop-off Precision',
                  desc: 'Obscures exact house/apartment number on driver navigation to protect residential privacy.',
                },
                {
                  key: 'stealthTracking',
                  title: 'Stealth Telemetry Mode',
                  desc: 'Suppresses public notifications and hides ride summary from device lock screen.',
                },
                {
                  key: 'autoPurgeHistory',
                  title: 'Auto-Purge Location History',
                  desc: 'Automatically remove precise coordinate waypoints 48 hours after safe ride completion.',
                },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:border-purple-300 transition-colors"
                >
                  <div className="space-y-0.5 pr-4">
                    <div className="text-xs font-bold text-slate-900">{item.title}</div>
                    <div className="text-[11px] text-slate-500">{item.desc}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!privacySettings[item.key]}
                    onChange={() => handlePrivacyToggle(item.key)}
                    className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 shrink-0"
                  />
                </label>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ─── MODAL: Add Contact ───────────────────────────────────── */}
      <Modal
        isOpen={addContactModalOpen}
        onClose={() => setAddContactModalOpen(false)}
        title="Add Trusted Circle Guardian"
        size="md"
      >
        <form onSubmit={handleAddContact} className="space-y-4">
          <Input
            label="Guardian Full Name"
            placeholder="e.g. Suman Sharma"
            value={newContact.name}
            onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
            required
          />
          <Input
            label="Mobile Phone (WhatsApp enabled)"
            type="tel"
            placeholder="+91 9876543210"
            value={newContact.phone}
            onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
            required
          />
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Relationship
            </label>
            <select
              value={newContact.relationship}
              onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
              className="w-full bg-white text-slate-900 text-sm rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:border-purple-600"
            >
              <option value="Mother">Mother</option>
              <option value="Sister">Sister</option>
              <option value="Father">Father</option>
              <option value="Friend">Friend</option>
              <option value="Guardian">Guardian</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setAddContactModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={savingContact}>
              Save Guardian
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL: Report Signal ─────────────────────────────────── */}
      <Modal
        isOpen={newSignalModalOpen}
        onClose={() => setNewSignalModalOpen(false)}
        title="Report Road Safety Hazard"
        size="md"
      >
        <form onSubmit={handlePostSignal} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Hazard Type
            </label>
            <select
              value={newSignalData.signalType}
              onChange={(e) => setNewSignalData({ ...newSignalData, signalType: e.target.value })}
              className="w-full bg-white text-slate-900 text-sm rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:border-purple-600"
            >
              <option value="unlit_road">Unlit Road / No Streetlights</option>
              <option value="suspicious_activity">Suspicious Group / Activity</option>
              <option value="roadblock">Road Block / Construction</option>
              <option value="police_checkpoint">Police Checkpoint Active</option>
              <option value="safe_haven">Temporary Safe Haven Active</option>
            </select>
          </div>

          <Input
            label="Udaipur Location / Landmark"
            placeholder="e.g. Chetak Circle to Mohta Park road"
            value={newSignalData.address}
            onChange={(e) => setNewSignalData({ ...newSignalData, address: e.target.value })}
            required
          />

          <Input
            label="Additional Details"
            placeholder="e.g. Streetlights are completely off near the junction"
            value={newSignalData.description}
            onChange={(e) => setNewSignalData({ ...newSignalData, description: e.target.value })}
          />

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setNewSignalModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={postingSignal} className="bg-amber-600 hover:bg-amber-700">
              Broadcast Signal
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL: SOS Confirmation ──────────────────────────────── */}
      <Modal
        isOpen={sosModalOpen}
        onClose={() => !isTriggeringSos && setSosModalOpen(false)}
        title="Confirm Emergency SOS Alert"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" /> Are you in immediate danger?
            </div>
            <p className="leading-relaxed">
              Clicking <strong>Confirm SOS</strong> will immediately:
            </p>
            <ul className="list-disc list-inside text-[11px] space-y-1 text-rose-800 ml-1">
              <li>Record your precise GPS coordinates in our Safety Desk database</li>
              <li>Dispatch high-priority alert to Udaipur Operations Desk</li>
              <li>Transmit instant SMS coordinates to all {contacts.length} registered guardians</li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" disabled={isTriggeringSos} onClick={() => setSosModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" loading={isTriggeringSos} onClick={handleTriggerSOS}>
              <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Confirm SOS Alert
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
