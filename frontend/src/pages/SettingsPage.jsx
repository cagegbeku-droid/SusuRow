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
  LogOut, 
  Building2
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
        payoutAlerts: true
      };
    } catch {
      return { pushNotifications: true, dueReminders: true, payoutAlerts: true };
    }
  });

  const [toastMessage, setToastMessage] = useState(null);

  const toggleNotification = (key) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    localStorage.setItem('susurow_notifications_pref', JSON.stringify(updated));
    showToast('Preference updated');
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const isVerifiedKYC = Boolean(user && user.kyc_status === 'VERIFIED');

  return (
    <div className="max-w-3xl mx-auto py-4 px-4 sm:px-6 space-y-6 animate-in fade-in duration-150 pb-24">
      
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
      {/* 1. ACCOUNT & WALLETS                                     */}
      {/* ======================================================== */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Account & Wallets
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
          
          <button
            onClick={() => {
              if (!isAuthenticated) openAuthModal();
              else onNavigate('profile', { subpage: 'kyc' });
            }}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck size={18} className="text-slate-700" />
              <span className="text-sm font-bold text-slate-900">Trust & Ghana Card KYC</span>
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
              <span className="text-sm font-bold text-slate-900">Mobile Money Wallets</span>
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
              <span className="text-sm font-bold text-slate-900">Automated Payments</span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>

        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. PLATFORM TOOLS & REWARDS                              */}
      {/* ======================================================== */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Platform Tools & Rewards
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
          
          <button
            onClick={onOpenCalculator}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Calculator size={18} className="text-sky-600" />
              <span className="text-sm font-bold text-slate-900">Susu Calculator</span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>

          <button
            onClick={onOpenReferralModal}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Gift size={18} className="text-amber-500" />
              <span className="text-sm font-bold text-slate-900">Refer & Earn Program</span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>

          <button
            onClick={onOpenInstallModal}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Download size={18} className="text-emerald-600" />
              <span className="text-sm font-bold text-slate-900">Install SusuRow App</span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>

        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. GOVERNANCE & LEGAL                                    */}
      {/* ======================================================== */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Governance & Legal
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
          
          <button
            onClick={onOpenTermsModal}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-slate-700" />
              <span className="text-sm font-bold text-slate-900">Terms of Service & Privacy Policy</span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 size={18} className="text-sky-600" />
              <span className="text-sm font-bold text-slate-900">Coratech Global</span>
            </div>
            <a
              href="https://coratechglobal.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1"
            >
              <span>Visit Website</span>
              <ExternalLink size={12} />
            </a>
          </div>

        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. NOTIFICATION PREFERENCES                              */}
      {/* ======================================================== */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Notification Preferences
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
          
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-slate-700" />
              <span className="text-sm font-bold text-slate-900">Push Notifications</span>
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
              <span className="text-sm font-bold text-slate-900">Round Due Reminders</span>
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
              <span className="text-sm font-bold text-slate-900">Payout Alerts</span>
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
      {/* 5. HELP & CUSTOMER CARE                                  */}
      {/* ======================================================== */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Help & Customer Care
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
          
          {/* Chat & Live Support */}
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 shrink-0">
                <MessageCircle size={18} />
              </div>
              <span className="text-sm font-bold text-slate-900">Chat & Support</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onOpenSupportChat}
                className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <span>Live Chat</span>
              </button>
              <a
                href="https://wa.me/233599360626?text=Hello%20SusuRow%2C%20I%20need%20assistance%20with%20my%20savings%20group."
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Help Center & FAQs */}
          <button
            onClick={onOpenFAQModal}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                <HelpCircle size={18} />
              </div>
              <span className="text-sm font-bold text-slate-900">Help Center & FAQs</span>
            </div>
            <ChevronRight size={18} className="text-slate-400 shrink-0" />
          </button>

          {/* Helpline */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
                <Phone size={18} />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 block">Customer Helpline</span>
                <span className="text-xs font-mono font-bold text-slate-600">059 936 0626</span>
              </div>
            </div>
            <a
              href="tel:0599360626"
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 transition-colors cursor-pointer shrink-0"
            >
              Call
            </a>
          </div>

          {/* Email Support */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0">
                <Mail size={18} />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 block">Email Support</span>
                <span className="text-xs text-slate-600 font-medium">support@coratechglobal.com</span>
              </div>
            </div>
            <a
              href="mailto:support@coratechglobal.com?subject=SusuRow%20Support%20Inquiry"
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 transition-colors cursor-pointer shrink-0"
            >
              Email
            </a>
          </div>

        </div>
      </div>

      {/* Sign Out (Authenticated users only) */}
      {isAuthenticated && (
        <div className="pt-2">
          <button
            onClick={logout}
            className="w-full p-3.5 rounded-2xl bg-white border border-slate-200 text-red-600 hover:bg-red-50 flex items-center justify-center gap-2 transition-colors cursor-pointer font-bold text-xs shadow-xs"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      <div className="text-center text-[11px] text-slate-400 font-semibold pt-1">
        SusuRow Ghana • Coratech Global Financial Services
      </div>

    </div>
  );
};

export default SettingsPage;
