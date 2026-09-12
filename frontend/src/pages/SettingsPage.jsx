import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  HelpCircle, 
  MessageCircle, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Bell, 
  CreditCard, 
  Wallet, 
  Zap, 
  Calculator, 
  Gift, 
  Download, 
  FileText, 
  ExternalLink, 
  ChevronRight, 
  ArrowLeft, 
  CheckCircle2, 
  Lock, 
  LogOut, 
  Building2,
  Share2
} from 'lucide-react';
import { useUser } from '../context/UserContext';

export const SettingsPage = ({
  onBack,
  onNavigate,
  onOpenFAQModal,
  onOpenSupportChat,
  onOpenTermsModal,
  onOpenInstallModal,
  onOpenReferralModal,
  onOpenCalculator
}) => {
  const { user, isAuthenticated, logout, openAuthModal } = useUser();

  // Notification Preferences state
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('susurow_notifications_pref');
      return saved ? JSON.parse(saved) : {
        pushNotifications: true,
        dueReminders: true,
        payoutAlerts: true,
        systemUpdates: true
      };
    } catch {
      return { pushNotifications: true, dueReminders: true, payoutAlerts: true, systemUpdates: true };
    }
  });

  const [toastMessage, setToastMessage] = useState(null);

  const toggleNotification = (key) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    localStorage.setItem('susurow_notifications_pref', JSON.stringify(updated));
    showToast('Preference updated successfully');
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const isVerifiedKYC = Boolean(user && user.kyc_status === 'VERIFIED');

  return (
    <div className="max-w-2xl mx-auto py-4 px-4 space-y-6 animate-in fade-in duration-150 pb-24">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            title="Go Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <SettingsIcon size={22} className="text-sky-600" />
              <span>Settings & Support</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Help center, customer care, notifications, and platform controls
            </p>
          </div>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-xs">
          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 1: CUSTOMER CARE & HELP CENTER                   */}
      {/* ======================================================== */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Help & Customer Care
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
          
          {/* Chat & Live Support */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 shrink-0">
                <MessageCircle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Chat & Support</h3>
                <p className="text-xs text-slate-500">
                  Instant live chat assistance & official WhatsApp support desk
                </p>
                <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Mon – Sat (7:00 AM – 9:00 PM)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                onClick={onOpenSupportChat}
                className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <MessageCircle size={14} />
                <span>Start Chat</span>
              </button>
              <a
                href="https://wa.me/233599360626?text=Hello%20SusuRow%2C%20I%20need%20assistance%20with%20my%20savings%20group."
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <span>WhatsApp</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Help Center & FAQs */}
          <button
            onClick={onOpenFAQModal}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                <HelpCircle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Help Center & FAQs</h3>
                <p className="text-xs text-slate-500">
                  Rotational cycle rules, Mobile Money payouts, and security answers
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400 shrink-0" />
          </button>

          {/* Official Phone Helpline */}
          <div className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
                <Phone size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Official Helpline</h3>
                <p className="text-xs font-mono font-bold text-slate-700">059 936 0626</p>
                <p className="text-[11px] text-slate-500">Direct phone support for urgent transaction resolution</p>
              </div>
            </div>
            <a
              href="tel:0599360626"
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 transition-colors cursor-pointer shrink-0"
            >
              Call Now
            </a>
          </div>

          {/* Email Support */}
          <div className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Email Support Desk</h3>
                <p className="text-xs text-slate-600 font-medium">support@coratechglobal.com</p>
              </div>
            </div>
            <a
              href="mailto:support@coratechglobal.com?subject=SusuRow%20Support%20Inquiry"
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 transition-colors cursor-pointer shrink-0"
            >
              Send Email
            </a>
          </div>

        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 2: NOTIFICATIONS & ALERT SETTINGS                */}
      {/* ======================================================== */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Notification Preferences
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
          
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-slate-700" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Push Notifications</span>
                <span className="text-[11px] text-slate-500">Live notifications for group updates & messages</span>
              </div>
            </div>
            <button
              onClick={() => toggleNotification('pushNotifications')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                notifications.pushNotifications ? 'bg-sky-600' : 'bg-slate-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                notifications.pushNotifications ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap size={18} className="text-amber-600" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Round Due Reminders</span>
                <span className="text-[11px] text-slate-500">Alerts sent 24 hours prior to contribution deadline</span>
              </div>
            </div>
            <button
              onClick={() => toggleNotification('dueReminders')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                notifications.dueReminders ? 'bg-sky-600' : 'bg-slate-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                notifications.dueReminders ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet size={18} className="text-emerald-600" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Payout Arrival Alerts</span>
                <span className="text-[11px] text-slate-500">Instant notification when your lump sum reaches MoMo</span>
              </div>
            </div>
            <button
              onClick={() => toggleNotification('payoutAlerts')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                notifications.payoutAlerts ? 'bg-sky-600' : 'bg-slate-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                notifications.payoutAlerts ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 3: ACCOUNT & WALLETS (SHORTCUTS)                 */}
      {/* ======================================================== */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Account & Wallets
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
          
          <button
            onClick={() => {
              if (!isAuthenticated) openAuthModal();
              else onNavigate('profile', { subpage: 'kyc' });
            }}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck size={18} className="text-slate-700" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Trust & Ghana Card KYC</span>
                <span className="text-[11px] text-slate-500">Identity verification for Bank of Ghana compliance</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isVerifiedKYC 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                {isVerifiedKYC ? 'Verified ✓' : 'Action Required'}
              </span>
              <ChevronRight size={16} className="text-slate-400" />
            </div>
          </button>

          <button
            onClick={() => {
              if (!isAuthenticated) openAuthModal();
              else onNavigate('profile', { subpage: 'payment_methods' });
            }}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <CreditCard size={18} className="text-slate-700" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Mobile Money Wallets</span>
                <span className="text-[11px] text-slate-500">Manage MTN, Telecel, and AT MoMo accounts</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>

          <button
            onClick={() => {
              if (!isAuthenticated) openAuthModal();
              else onNavigate('profile', { subpage: 'auto_payments' });
            }}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Zap size={18} className="text-slate-700" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Auto-Debit & Payment Reminders</span>
                <span className="text-[11px] text-slate-500">Configure prompt times and authorization</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>

        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 4: PLATFORM TOOLS & EXTRAS                       */}
      {/* ======================================================== */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Platform Tools & Rewards
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
          
          <button
            onClick={onOpenCalculator}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Calculator size={18} className="text-sky-600" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Susu Calculator</span>
                <span className="text-[11px] text-slate-500">Calculate lump sum payouts, duration, and cycle returns</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>

          <button
            onClick={onOpenReferralModal}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Gift size={18} className="text-amber-500" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Refer & Earn Program</span>
                <span className="text-[11px] text-slate-500">Invite fellow savers and earn cash bonuses</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>

          <button
            onClick={onOpenInstallModal}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Download size={18} className="text-emerald-600" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Install SusuRow App</span>
                <span className="text-[11px] text-slate-500">Download Android APK or install home screen web app</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>

        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 5: LEGAL & REGULATORY COMPLIANCE                 */}
      {/* ======================================================== */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Governance & Legal
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
          
          <button
            onClick={onOpenTermsModal}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-slate-700" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Terms of Service & Privacy Policy</span>
                <span className="text-[11px] text-slate-500">Bank of Ghana Act 987 & Data Protection Act 843</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 size={18} className="text-sky-600" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Engineered by Coratech Global</span>
                <span className="text-[11px] text-slate-500">Financial technology & enterprise cloud infrastructure</span>
              </div>
            </div>
            <a
              href="https://coratechglobal.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1"
            >
              <span>Visit Site</span>
              <ExternalLink size={12} />
            </a>
          </div>

        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 6: EXECUTIVE ADMIN ACCESS & SIGN OUT             */}
      {/* ======================================================== */}
      <div className="space-y-3 pt-2">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
          
          <button
            onClick={() => onNavigate('admin')}
            className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer text-slate-700"
          >
            <div className="flex items-center gap-3">
              <Lock size={16} className="text-slate-500" />
              <span className="text-xs font-bold">Executive Admin Portal</span>
            </div>
            <ChevronRight size={15} className="text-slate-400" />
          </button>

          {isAuthenticated && (
            <button
              onClick={logout}
              className="w-full p-3.5 flex items-center gap-3 text-left text-red-600 hover:bg-red-50 transition-colors cursor-pointer font-bold text-xs"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          )}

        </div>

        <div className="text-center text-[11px] text-slate-400 font-semibold pt-2">
          SusuRow Ghana v2.4 • Coratech Global Financial Services
        </div>
      </div>

    </div>
  );
};

export default SettingsPage;
