import React, { useState, useEffect } from 'react';
import { 
  User, 
  ShieldCheck, 
  KeyRound, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowLeft, 
  Phone, 
  Check, 
  CreditCard, 
  Lock, 
  ChevronRight, 
  HelpCircle,
  Bell,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  Download,
  Printer,
  ExternalLink,
  MessageCircle,
  Mail,
  Shield,
  BookOpen,
  Info,
  LogOut,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { 
  updateProfile, 
  submitKYC, 
  setSecurityPIN, 
  configureWallets, 
  deactivateAccount, 
  deleteAccount,
  getUserTransactions
} from '../api/client';
import { SignatureCanvas } from '../components/SignatureCanvas';

export const ProfilePage = ({ onBack, onOpenReferralModal, onOpenTermsModal }) => {
  const { user, isAuthenticated, logout, openAuthModal, refreshProfile } = useUser();
  const [activeTab, setActiveTab] = useState('identity'); // identity, kyc, wallets, statement, history, rules, help
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [avatarError, setAvatarError] = useState(false);

  // Real transactions from backend
  const [transactions, setTransactions] = useState([]);
  const [txFilter, setTxFilter] = useState('ALL'); // ALL, CONTRIBUTION, PAYOUT
  const [txLoading, setTxLoading] = useState(false);

  // Settings / Notifications state (saved locally or with profile)
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('susurow_notifications_pref');
      return saved ? JSON.parse(saved) : {
        dueReminders: true,
        payoutAlerts: true,
        memberJoins: true
      };
    } catch {
      return { dueReminders: true, payoutAlerts: true, memberJoins: true };
    }
  });

  const toggleNotification = (key) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    localStorage.setItem('susurow_notifications_pref', JSON.stringify(updated));
    triggerSuccess('Notification preference updated.');
  };

  // Form States
  const [personalForm, setPersonalForm] = useState({
    full_name: '',
    phone_number: '',
    momo_provider: 'MTN',
    email: ''
  });

  const [kycForm, setKycForm] = useState({
    ghana_card_number: '',
    next_of_kin_name: '',
    next_of_kin_phone: '',
    next_of_kin_relation: 'Sibling',
    signature_data: ''
  });

  const [walletsForm, setWalletsForm] = useState({
    contribution_provider: 'MTN',
    contribution_phone: '',
    primary_wallet_provider: 'MTN',
    primary_wallet_number: '',
    bank_name: '',
    bank_account_number: '',
    pin: '',
    confirm_pin: ''
  });

  useEffect(() => {
    if (user) {
      setPersonalForm({
        full_name: user.full_name || '',
        phone_number: user.phone_number || '',
        momo_provider: user.momo_provider || 'MTN',
        email: user.email || ''
      });

      setKycForm({
        ghana_card_number: user.ghana_card_number || '',
        next_of_kin_name: user.next_of_kin_name || '',
        next_of_kin_phone: user.next_of_kin_phone || '',
        next_of_kin_relation: user.next_of_kin_relation || 'Sibling',
        signature_data: user.signature_data || ''
      });

      setWalletsForm({
        contribution_provider: user.momo_provider || 'MTN',
        contribution_phone: user.phone_number || '',
        primary_wallet_provider: user.primary_wallet_provider || user.momo_provider || 'MTN',
        primary_wallet_number: user.primary_wallet_number || user.phone_number || '',
        bank_name: user.bank_name || '',
        bank_account_number: user.bank_account_number || '',
        pin: '',
        confirm_pin: ''
      });

      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    try {
      setTxLoading(true);
      const data = await getUserTransactions();
      setTransactions(data || []);
    } catch (err) {
      console.warn('Failed to load transactions:', err);
    } finally {
      setTxLoading(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto px-4">
        <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto border border-sky-200 shadow-xs">
          <User size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Sign In to View Profile</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Manage your verified Ghana Card identity, contribution & payout wallets, security PIN, and official savings statement.
        </p>
        <button
          onClick={openAuthModal}
          className="px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-xs cursor-pointer transition-all active:scale-95"
        >
          Sign In with Phone or Google
        </button>
      </div>
    );
  }

  const triggerSuccess = (msg) => {
    setSaveSuccess(msg);
    setTimeout(() => setSaveSuccess(null), 3500);
  };

  const handleUpdatePersonal = async (e) => {
    e.preventDefault();
    if (!personalForm.full_name.trim()) {
      setErrorMsg('Full Legal Name is required.');
      return;
    }
    if (!personalForm.phone_number.trim() || personalForm.phone_number.replace(/[^\d]/g, '').length < 9) {
      setErrorMsg('A valid Ghanaian phone number is compulsory (e.g. 024 123 4567).');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await updateProfile(personalForm);
      await refreshProfile();
      triggerSuccess('Personal information saved successfully.');
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to update personal details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitKYC = async (e) => {
    e.preventDefault();
    if (!kycForm.ghana_card_number.trim()) {
      setErrorMsg('Please enter your Ghana Card Number (GHA-XXXXXXXXX-X).');
      return;
    }
    if (!kycForm.next_of_kin_name.trim() || !kycForm.next_of_kin_phone.trim()) {
      setErrorMsg('Emergency Contact (Next of Kin) name and phone are compulsory.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await submitKYC(kycForm);
      await refreshProfile();
      triggerSuccess('Ghana Card KYC submitted and verified successfully!');
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'KYC verification submission failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleWalletsSubmit = async (e) => {
    e.preventDefault();
    if (!walletsForm.primary_wallet_number.trim()) {
      setErrorMsg('Please enter your primary payout phone or bank account number.');
      return;
    }

    if (walletsForm.pin) {
      if (walletsForm.pin !== walletsForm.confirm_pin) {
        setErrorMsg('PINs do not match. Please re-enter your 4-digit PIN.');
        return;
      }
      if (!/^\d{4}$/.test(walletsForm.pin)) {
        setErrorMsg('PIN must be exactly 4 numeric digits.');
        return;
      }
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await configureWallets({
        primary_wallet_provider: walletsForm.primary_wallet_provider,
        primary_wallet_number: walletsForm.primary_wallet_number,
        bank_name: walletsForm.bank_name,
        bank_account_number: walletsForm.bank_account_number
      });

      if (walletsForm.pin) {
        await setSecurityPIN(walletsForm.pin);
      }

      await refreshProfile();
      triggerSuccess('Contribution & Payout Wallets configured successfully!');
      setWalletsForm(prev => ({ ...prev, pin: '', confirm_pin: '' }));
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to save wallet configuration.');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '₵';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const isVerifiedKYC = user.kyc_status === 'VERIFIED';

  const filteredTransactions = transactions.filter(t => {
    if (txFilter === 'ALL') return true;
    return t.type === txFilter;
  });

  const totalContributions = transactions
    .filter(t => t.type === 'CONTRIBUTION')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalPayouts = transactions
    .filter(t => t.type === 'PAYOUT')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const handlePrintStatement = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 animate-in fade-in duration-150">
      
      {/* 🧭 Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft size={14} />
          <span>Back to Marketplace</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 bg-white px-3.5 py-1.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-500" />
            <span>{user.points || 50} Reward Points</span>
          </span>
        </div>
      </div>

      {/* 👤 User Identity Card (Header) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-sky-600 text-white font-bold text-2xl flex items-center justify-center shadow-xs overflow-hidden shrink-0 ring-4 ring-sky-50">
              {user.avatar_url && !avatarError ? (
                <img 
                  src={user.avatar_url} 
                  alt={user.full_name} 
                  onError={() => setAvatarError(true)}
                  className="w-full h-full object-cover" 
                />
              ) : (
                <span>{getInitials(user.full_name)}</span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                  {user.full_name || 'Ghana Saver'}
                </h1>

                {isVerifiedKYC ? (
                  <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck size={12} className="text-emerald-600" />
                    <span>Ghana Card Verified ✓</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <AlertCircle size={12} className="text-amber-600" />
                    <span>Identity Unverified</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                <span>{user.phone_number || 'No Phone Linked'}</span>
                <span>•</span>
                <span>{user.momo_provider || 'MTN'} MoMo</span>
                <span>•</span>
                <span className="text-amber-600 font-bold">{user.trust_score || 100}% Trust</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenReferralModal}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-2xl border border-slate-200 cursor-pointer transition-colors shadow-xs"
            >
              Refer Friends
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-2xl border border-red-200 cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>

        </div>
      </div>

      {/* 📑 Profile Subsections Navigation Bar */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 min-w-max">
          {[
            { id: 'identity', label: 'Identity & Info', icon: User },
            { id: 'kyc', label: 'Trust & KYC', icon: ShieldCheck },
            { id: 'wallets', label: 'Wallets & Payouts', icon: Wallet },
            { id: 'alerts', label: 'Alerts & Settings', icon: Bell },
            { id: 'history', label: 'Transaction History', icon: ArrowDownLeft },
            { id: 'statement', label: 'Savings Statement', icon: FileText },
            { id: 'rules', label: 'Rules & Legal', icon: BookOpen },
            { id: 'help', label: 'Help & Support', icon: MessageCircle }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-sky-600' : 'text-slate-400'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Alert Messages */}
      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-xs">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-xs">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. IDENTITY & PERSONAL INFO */}
      {activeTab === 'identity' && (
        <div className="bg-white rounded-3xl p-6 space-y-5 border border-slate-200 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">Personal & Identity Information</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Your legal name and mobile money contact details registered with SusuRow.
            </p>
          </div>

          <form onSubmit={handleUpdatePersonal} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Legal Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Your Full Legal Name"
                  value={personalForm.full_name}
                  onChange={(e) => setPersonalForm({ ...personalForm, full_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number (Compulsory) <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="024 123 4567"
                  value={personalForm.phone_number}
                  onChange={(e) => setPersonalForm({ ...personalForm, phone_number: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Mobile Money Network
                </label>
                <select
                  value={personalForm.momo_provider}
                  onChange={(e) => setPersonalForm({ ...personalForm, momo_provider: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="MTN">MTN Mobile Money (*170#)</option>
                  <option value="TELECEL">Telecel Cash (*110#)</option>
                  <option value="AT">AT Money (*110#)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="your.email@gmail.com"
                  value={personalForm.email}
                  onChange={(e) => setPersonalForm({ ...personalForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-2xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <span>Save Personal Info</span>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. TRUST & IDENTITY (KYC) */}
      {activeTab === 'kyc' && (
        <div className="bg-white rounded-3xl p-6 space-y-5 border border-slate-200 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">Trust & Identity Verification (Ghana Card)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Essential to prevent group default. Your Ghana Card ID and emergency contact protect communal savings.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-start gap-3">
            <Shield className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-900">MoMo Name Match Guarantee</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                SusuRow automatically confirms that your Ghana Card legal name matches your Mobile Money SIM registration before cycle pots are disbursed.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmitKYC} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ghana Card PIN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="GHA-712345678-9"
                  value={kycForm.ghana_card_number}
                  onChange={(e) => setKycForm({ ...kycForm, ghana_card_number: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Emergency Contact (Next of Kin) Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Emergency Contact Name"
                  value={kycForm.next_of_kin_name}
                  onChange={(e) => setKycForm({ ...kycForm, next_of_kin_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Emergency Contact Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="024 123 4567"
                  value={kycForm.next_of_kin_phone}
                  onChange={(e) => setKycForm({ ...kycForm, next_of_kin_phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Relationship to Emergency Contact
                </label>
                <select
                  value={kycForm.next_of_kin_relation}
                  onChange={(e) => setKycForm({ ...kycForm, next_of_kin_relation: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="Spouse">Spouse / Partner</option>
                  <option value="Sibling">Brother / Sister</option>
                  <option value="Parent">Parent (Mother / Father)</option>
                  <option value="Child">Child (Son / Daughter)</option>
                  <option value="Relative">Other Relative</option>
                </select>
              </div>

            </div>

            {/* Signature Canvas */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Digital Signature (Draw with finger or mouse)
              </label>
              <SignatureCanvas
                initialSignature={kycForm.signature_data}
                onSave={(sigData) => setKycForm({ ...kycForm, signature_data: sigData })}
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-2xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <span>Submit & Verify Ghana Card</span>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. WALLETS & PAYOUTS */}
      {activeTab === 'wallets' && (
        <div className="bg-white rounded-3xl p-6 space-y-6 border border-slate-200 shadow-xs">
          
          {/* Contribution Wallets Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Contribution Wallets</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  How you pay into your circles. Saves primary MoMo number used for round payments.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                Inbound
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  {user.momo_provider === 'TELECEL' ? 'TEL' : user.momo_provider === 'AT' ? 'AT' : 'MTN'}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{user.momo_provider || 'MTN'} Mobile Money</p>
                  <p className="text-xs font-mono text-slate-500">{user.phone_number}</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <Check size={12} /> Active
              </span>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Payout Wallets Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Payout Wallets</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Where your lump sum pot goes. Verified personal MoMo or Bank account to receive payouts.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Outbound
              </span>
            </div>

            <form onSubmit={handleWalletsSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payout Destination Provider
                  </label>
                  <select
                    value={walletsForm.primary_wallet_provider}
                    onChange={(e) => setWalletsForm({ ...walletsForm, primary_wallet_provider: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="MTN">MTN Mobile Money (*170#)</option>
                    <option value="TELECEL">Telecel Cash (*110#)</option>
                    <option value="AT">AT Money (*110#)</option>
                    <option value="BANK">Ghana Commercial Bank Account</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payout MoMo Phone / Bank Account <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="024 123 4567"
                    value={walletsForm.primary_wallet_number}
                    onChange={(e) => setWalletsForm({ ...walletsForm, primary_wallet_number: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                {walletsForm.primary_wallet_provider === 'BANK' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
                      <input
                        type="text"
                        placeholder="e.g. GCB, Ecobank, Stanbic, Absa"
                        value={walletsForm.bank_name}
                        onChange={(e) => setWalletsForm({ ...walletsForm, bank_name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Bank Account Number</label>
                      <input
                        type="text"
                        placeholder="Account Number"
                        value={walletsForm.bank_account_number}
                        onChange={(e) => setWalletsForm({ ...walletsForm, bank_account_number: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-mono text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    4-Digit Security PIN {user.has_security_pin ? '(Update PIN)' : '(Create PIN)'}
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={walletsForm.pin}
                    onChange={(e) => setWalletsForm({ ...walletsForm, pin: e.target.value.replace(/[^\d]/g, '') })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-mono font-bold tracking-widest text-center text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm 4-Digit PIN
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={walletsForm.confirm_pin}
                    onChange={(e) => setWalletsForm({ ...walletsForm, confirm_pin: e.target.value.replace(/[^\d]/g, '') })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-mono font-bold tracking-widest text-center text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-2xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <span>Save Payout Wallets & PIN</span>}
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

      {/* 4. ALERTS & NOTIFICATIONS */}
      {activeTab === 'alerts' && (
        <div className="bg-white rounded-3xl p-6 space-y-5 border border-slate-200 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">Notifications & Alerts Settings</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Control SMS and in-app alerts for rotation payments and cycle payouts.
            </p>
          </div>

          <div className="space-y-3 divide-y divide-slate-100">
            
            <div className="pt-3 flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-900">Round Due Reminders</h4>
                <p className="text-[11px] text-slate-500">
                  Receive SMS & push alert 24 hours before your circle payment is due.
                </p>
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

            <div className="pt-3 flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-900">Payout Alerts</h4>
                <p className="text-[11px] text-slate-500">
                  Instant notification when the full rotation pot lands in your Mobile Money wallet.
                </p>
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

            <div className="pt-3 flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-900">New Member Joins</h4>
                <p className="text-[11px] text-slate-500">
                  Alert when a peer saver joins or completes enrollment in your groups.
                </p>
              </div>
              <button
                onClick={() => toggleNotification('memberJoins')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  notifications.memberJoins ? 'bg-sky-600' : 'bg-slate-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications.memberJoins ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. TRANSACTION HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl p-6 space-y-5 border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Transaction History</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                All contributions paid into groups and pot payouts received.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              {['ALL', 'CONTRIBUTION', 'PAYOUT'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setTxFilter(tab)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    txFilter === tab
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab === 'ALL' ? 'All' : tab === 'CONTRIBUTION' ? 'Contributions' : 'Pot Payouts'}
                </button>
              ))}
            </div>
          </div>

          {txLoading ? (
            <div className="py-12 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-sky-600 mx-auto" />
              <p className="text-xs text-slate-400">Loading transaction ledger...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-8 text-center space-y-2 rounded-2xl bg-slate-50 border border-slate-100">
              <Info className="w-6 h-6 text-slate-400 mx-auto" />
              <h4 className="text-xs font-bold text-slate-800">No Transactions Yet</h4>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Your contributions and rotational payouts will appear here automatically as rounds proceed.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3.5">Type</th>
                    <th className="py-3 px-3.5">Group</th>
                    <th className="py-3 px-3.5">Amount</th>
                    <th className="py-3 px-3.5">Network</th>
                    <th className="py-3 px-3.5">Reference</th>
                    <th className="py-3 px-3.5">Status</th>
                    <th className="py-3 px-3.5 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3.5 font-bold">
                        {tx.type === 'CONTRIBUTION' ? (
                          <span className="inline-flex items-center gap-1 text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full text-[10px] border border-sky-200">
                            <ArrowUpRight size={11} /> Contribution
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] border border-emerald-200">
                            <ArrowDownLeft size={11} /> Pot Payout
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 font-semibold text-slate-900">{tx.group_name}</td>
                      <td className="py-3 px-3.5 font-bold font-mono text-slate-900">
                        {tx.type === 'CONTRIBUTION' ? '-' : '+'}GH₵{Number(tx.amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600">{tx.momo_provider}</td>
                      <td className="py-3 px-3.5 font-mono text-[10px] text-slate-500">{tx.reference}</td>
                      <td className="py-3 px-3.5">
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] border border-emerald-200">
                          {tx.status || 'CONFIRMED'}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right text-slate-500 font-mono text-[11px]">
                        {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : 'Recent'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 6. SAVINGS STATEMENT (PRINTABLE & DOWNLOADABLE) */}
      {activeTab === 'statement' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-200 shadow-xs print:shadow-none print:border-none">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-600 text-white font-black text-sm flex items-center justify-center">
                  ₵
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">SusuRow Official Savings Statement</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Coratech Global Digital Financial Services • Ghana</p>
                </div>
              </div>
            </div>

            <button
              onClick={handlePrintStatement}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-2xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95 self-start sm:self-auto"
            >
              <Printer size={14} />
              <span>Print / Save as PDF</span>
            </button>
          </div>

          {/* Statement Header Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Account Holder</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{user.full_name}</p>
              <p className="font-mono text-slate-600 mt-0.5">{user.phone_number}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Identity Status</span>
              <p className="text-sm font-bold text-emerald-700 mt-0.5">
                {isVerifiedKYC ? 'Ghana Card Verified ✓' : 'Unverified'}
              </p>
              <p className="font-mono text-slate-600 mt-0.5">{user.ghana_card_number || 'No ID on file'}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Statement Date</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{new Date().toLocaleDateString()}</p>
              <p className="text-slate-500 mt-0.5">Proof of Rotational Credit</p>
            </div>
          </div>

          {/* Totals Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100">
              <span className="text-[10px] font-bold uppercase text-sky-800">Total Contributions Paid</span>
              <p className="text-2xl font-bold font-mono text-sky-700 mt-1">
                GH₵{totalContributions.toFixed(2)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
              <span className="text-[10px] font-bold uppercase text-emerald-800">Total Pot Payouts Received</span>
              <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                GH₵{totalPayouts.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Statement Items Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900">Verified Cycle Ledger</h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Activity</th>
                    <th className="py-2.5 px-3">Circle Name</th>
                    <th className="py-2.5 px-3">Reference</th>
                    <th className="py-2.5 px-3 text-right">Amount (GHS)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 text-xs font-sans">
                        No transactions recorded for this period.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((t) => (
                      <tr key={t.id}>
                        <td className="py-2.5 px-3 text-slate-500">
                          {t.created_at ? new Date(t.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-2.5 px-3 font-sans font-bold">
                          {t.type === 'CONTRIBUTION' ? 'Round Contribution' : 'Pot Disbursement'}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-800">{t.group_name}</td>
                        <td className="py-2.5 px-3 text-slate-500 text-[10px]">{t.reference}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {t.type === 'CONTRIBUTION' ? '-' : '+'}GH₵{Number(t.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
            <span>Verified by SusuRow Cryptographic Ledger • Coratech Global</span>
            <span>Bank of Ghana Mobile Money ROSCA Standards</span>
          </div>

        </div>
      )}

      {/* 7. SUSU RULES & LEGAL */}
      {activeTab === 'rules' && (
        <div className="bg-white rounded-3xl p-6 space-y-6 border border-slate-200 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">Susu Rules, Constitution & Default Policy</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Plain-language operating principles that protect every saver's funds.
            </p>
          </div>

          <div className="space-y-4 text-xs text-slate-700">
            
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <h4 className="font-bold text-slate-900 text-sm">1. Rotational Fairness & Turn Protection</h4>
              <p className="text-slate-600 leading-relaxed">
                In Sequential groups, turns progress 1, 2, 3... to N in exact order. In Ballot groups, a transparent cryptographic draw assigns turns. In Bidding groups, members bid discounts to win immediate pots. No member can jump their turn or withdraw ahead of schedule.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1.5">
              <h4 className="font-bold text-amber-900 text-sm">2. Commitment Escrow Deposit</h4>
              <p className="text-amber-800 leading-relaxed">
                Some circles require an upfront Security Deposit. This deposit is locked safely in the smart escrow pot until the final round completes, at which point it is automatically returned to the saver in full.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200 space-y-1.5">
              <h4 className="font-bold text-red-900 text-sm">3. Default Policy & Late Payment Penalties</h4>
              <p className="text-red-800 leading-relaxed">
                If a member fails to contribute on their due date:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-red-700 text-[11px]">
                <li><strong>24-Hour Grace Period:</strong> Automated SMS reminders are dispatched.</li>
                <li><strong>Deposit Forfeiture:</strong> If unpaid after 24h, the member's upfront commitment deposit covers the missing amount for the winner.</li>
                <li><strong>Emergency Contact Recovery:</strong> The member's Next of Kin and guarantor are alerted.</li>
                <li><strong>Trust Score Penalty:</strong> The member's trust score drops, barring them from joining new circles.</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <h4 className="font-bold text-slate-900 text-sm">4. Data Privacy & Bank of Ghana Standards</h4>
              <p className="text-slate-600 leading-relaxed">
                SusuRow encrypts all personal identification numbers and Mobile Money credentials with Bank of Ghana compliant security protocols. Your funds never sit in private unmonitored accounts.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* 8. HELP CENTER & SUPPORT */}
      {activeTab === 'help' && (
        <div className="bg-white rounded-3xl p-6 space-y-6 border border-slate-200 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">Help Center & Support Desk</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Instant answers and direct access to the Coratech Global support team.
            </p>
          </div>

          {/* Quick Contact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            <a
              href="https://wa.me/233241234567?text=Hello%20SusuRow%20Support"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 transition-colors flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <MessageCircle size={20} className="text-emerald-600" />
                <ExternalLink size={12} className="text-emerald-500" />
              </div>
              <div className="mt-3">
                <p className="text-xs font-bold">WhatsApp Support</p>
                <p className="text-[10px] text-emerald-700">Chat with support team</p>
              </div>
            </a>

            <a
              href="tel:+233241234567"
              className="p-4 rounded-2xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-900 transition-colors flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <Phone size={20} className="text-sky-600" />
                <ExternalLink size={12} className="text-sky-500" />
              </div>
              <div className="mt-3">
                <p className="text-xs font-bold">Helpline (Ghana)</p>
                <p className="text-[10px] text-sky-700">Mon - Sat: 8am - 6pm</p>
              </div>
            </a>

            <a
              href="mailto:support@coratechglobal.com"
              className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 transition-colors flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <Mail size={20} className="text-slate-600" />
                <ExternalLink size={12} className="text-slate-400" />
              </div>
              <div className="mt-3">
                <p className="text-xs font-bold">Email Support</p>
                <p className="text-[10px] text-slate-500">support@coratechglobal.com</p>
              </div>
            </a>

          </div>

          {/* FAQs Accordion */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Frequently Asked Questions</h3>

            <div className="space-y-2 text-xs">
              <details className="group rounded-2xl border border-slate-200 bg-slate-50 p-3.5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between font-bold text-slate-900">
                  <span>How does Susu rotational savings work?</span>
                  <ChevronRight size={14} className="transition group-open:rotate-90 text-slate-400" />
                </summary>
                <p className="mt-2 text-[11px] text-slate-600 leading-relaxed">
                  A group of peer savers pool a fixed contribution (e.g. GH₵200) every cycle (daily, weekly, monthly). In each round, one member takes home the entire lump sum (e.g. GH₵2,000) with zero loan interest until all members have taken their turn.
                </p>
              </details>

              <details className="group rounded-2xl border border-slate-200 bg-slate-50 p-3.5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between font-bold text-slate-900">
                  <span>What is the difference between Sequential, Ballot, and Bidding?</span>
                  <ChevronRight size={14} className="transition group-open:rotate-90 text-slate-400" />
                </summary>
                <p className="mt-2 text-[11px] text-slate-600 leading-relaxed">
                  Sequential pays members in fixed registration order. Ballot draws turns randomly using verifiable random lottery. Bidding lets members auction a discount if they need urgent funds early.
                </p>
              </details>

              <details className="group rounded-2xl border border-slate-200 bg-slate-50 p-3.5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between font-bold text-slate-900">
                  <span>How are my payouts disbursed?</span>
                  <ChevronRight size={14} className="transition group-open:rotate-90 text-slate-400" />
                </summary>
                <p className="mt-2 text-[11px] text-slate-600 leading-relaxed">
                  When all contributions for a round are received, the full pot is automatically sent directly to your registered Mobile Money wallet (MTN, Telecel, or AT Money) via automated payment rails.
                </p>
              </details>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
