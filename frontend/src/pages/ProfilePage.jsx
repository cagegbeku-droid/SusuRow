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
  Printer,
  ExternalLink,
  MessageCircle,
  Mail,
  Shield,
  BookOpen,
  Info,
  LogOut,
  Building,
  Briefcase,
  Users,
  Settings as SettingsIcon,
  RefreshCw
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { 
  updateProfile, 
  submitKYC, 
  setSecurityPIN, 
  configureWallets, 
  getUserTransactions,
  resolveMoMoAccount
} from '../api/client';

export const ProfilePage = ({ onBack, onOpenReferralModal, onOpenTermsModal }) => {
  const { user, isAuthenticated, logout, openAuthModal, refreshProfile } = useUser();
  
  // Navigation: null = Main menu list; string = active subpage
  const [activeSubpage, setActiveSubpage] = useState(null); 
  
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [avatarError, setAvatarError] = useState(false);

  // MoMo live account resolution state
  const [momoResolving, setMomoResolving] = useState(false);
  const [resolvedAccountName, setResolvedAccountName] = useState(user?.momo_account_name || null);

  // Real transactions from backend
  const [transactions, setTransactions] = useState([]);
  const [txFilter, setTxFilter] = useState('ALL');
  const [txLoading, setTxLoading] = useState(false);

  // Notifications toggles
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('susurow_notifications_pref');
      return saved ? JSON.parse(saved) : {
        pushNotifications: true,
        dueReminders: true,
        payoutAlerts: true,
        memberJoins: true
      };
    } catch {
      return { pushNotifications: true, dueReminders: true, payoutAlerts: true, memberJoins: true };
    }
  });

  const toggleNotification = (key) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    localStorage.setItem('susurow_notifications_pref', JSON.stringify(updated));
    triggerSuccess('Settings updated.');
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
    next_of_kin_relation: 'Sibling'
  });

  const [walletsForm, setWalletsForm] = useState({
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
        next_of_kin_relation: user.next_of_kin_relation || 'Sibling'
      });

      setWalletsForm({
        primary_wallet_provider: user.primary_wallet_provider || user.momo_provider || 'MTN',
        primary_wallet_number: user.primary_wallet_number || user.phone_number || '',
        bank_name: user.bank_name || '',
        bank_account_number: user.bank_account_number || '',
        pin: '',
        confirm_pin: ''
      });

      if (user.momo_account_name) {
        setResolvedAccountName(user.momo_account_name);
      } else if (user.phone_number) {
        handleResolveMoMo(user.phone_number, user.momo_provider || 'MTN');
      }

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

  // Live MoMo resolution via Paystack/Telecom switch
  const handleResolveMoMo = async (phoneNum, provider) => {
    if (!phoneNum || phoneNum.replace(/[^\d]/g, '').length < 9) return;
    try {
      setMomoResolving(true);
      const res = await resolveMoMoAccount({ phone_number: phoneNum, provider });
      if (res?.success && res?.account_name) {
        setResolvedAccountName(res.account_name);
        return res.account_name;
      }
    } catch {
      // Quiet fallback
    } finally {
      setMomoResolving(false);
    }
    return null;
  };

  // Handle phone change: auto detect network, auto resolve MoMo name, auto set as payment & withdrawal method
  const handlePhoneInputChange = async (newPhone) => {
    let clean = newPhone.replace(/[^\d]/g, '');
    let detectedProvider = personalForm.momo_provider;

    if (clean.startsWith('024') || clean.startsWith('054') || clean.startsWith('055') || clean.startsWith('059') || clean.startsWith('053')) {
      detectedProvider = 'MTN';
    } else if (clean.startsWith('020') || clean.startsWith('050')) {
      detectedProvider = 'TELECEL';
    } else if (clean.startsWith('026') || clean.startsWith('056') || clean.startsWith('027') || clean.startsWith('057')) {
      detectedProvider = 'AT';
    }

    setPersonalForm(prev => ({
      ...prev,
      phone_number: newPhone,
      momo_provider: detectedProvider
    }));

    // Auto set this phone number as payment & withdrawal method
    setWalletsForm(prev => ({
      ...prev,
      primary_wallet_number: newPhone,
      primary_wallet_provider: detectedProvider
    }));

    // If 10 digits, auto resolve the registered MoMo subscriber name
    if (clean.length === 10) {
      const resolvedName = await handleResolveMoMo(newPhone, detectedProvider);
      if (resolvedName && (!personalForm.full_name || personalForm.full_name.startsWith('Saver '))) {
        setPersonalForm(prev => ({ ...prev, full_name: resolvedName }));
      }
    }
  };

  // Automatic Ghana Card Hyphenation: GHA-XXXXXXXXX-X
  const handleGhanaCardChange = (e) => {
    let val = e.target.value.toUpperCase();
    let clean = val.replace(/[^A-Z0-9]/g, '');
    
    if (!clean) {
      setKycForm(prev => ({ ...prev, ghana_card_number: '' }));
      return;
    }

    if (!clean.startsWith('GHA')) {
      clean = 'GHA' + clean;
    }

    let formatted = '';
    if (clean.length <= 3) {
      formatted = clean;
    } else {
      formatted = clean.substring(0, 3) + '-';
      const rest = clean.substring(3);
      if (rest.length <= 9) {
        formatted += rest;
      } else {
        formatted += rest.substring(0, 9) + '-' + rest.substring(9, 10);
      }
    }

    setKycForm(prev => ({ ...prev, ghana_card_number: formatted }));
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="py-24 text-center space-y-4 max-w-sm mx-auto px-4">
        <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto border border-sky-200 shadow-xs">
          <User size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Sign In to View Profile</h2>
        <p className="text-xs text-slate-600">
          Manage your verified identity, wallets, and savings statement.
        </p>
        <button
          onClick={openAuthModal}
          className="px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-xs cursor-pointer transition-all active:scale-95"
        >
          Sign In / Create Account
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
      setErrorMsg('Valid 10-digit Ghanaian phone number is required (e.g. 0599360626).');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await updateProfile(personalForm);
      await configureWallets({
        primary_wallet_provider: personalForm.momo_provider,
        primary_wallet_number: personalForm.phone_number
      });
      await refreshProfile();
      triggerSuccess('Personal info saved. This MoMo number is now your active Payment & Withdrawal wallet.');
      handleResolveMoMo(personalForm.phone_number, personalForm.momo_provider);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to update details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitKYC = async (e) => {
    e.preventDefault();
    if (!kycForm.ghana_card_number.trim()) {
      setErrorMsg('Please enter your Ghana Card PIN (GHA-XXXXXXXXX-X).');
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
      triggerSuccess('Ghana Card KYC submitted and approved successfully!');
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'KYC submission failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleWalletsSubmit = async (e) => {
    e.preventDefault();
    if (!walletsForm.primary_wallet_number.trim()) {
      setErrorMsg('Please enter your payout phone or bank account number.');
      return;
    }

    if (walletsForm.pin) {
      if (walletsForm.pin !== walletsForm.confirm_pin) {
        setErrorMsg('PINs do not match.');
        return;
      }
      if (!/^\d{4}$/.test(walletsForm.pin)) {
        setErrorMsg('PIN must be 4 numeric digits.');
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
      triggerSuccess('Wallets configured successfully!');
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

  const maskedPhone = (phone) => {
    if (!phone) return '*** ****';
    const clean = phone.replace(/[^\d]/g, '');
    if (clean.length < 4) return phone;
    return `*** ${clean.slice(-4)}`;
  };

  const totalContributions = transactions
    .filter(t => t.type === 'CONTRIBUTION')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalPayouts = transactions
    .filter(t => t.type === 'PAYOUT')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const filteredTransactions = transactions.filter(t => {
    if (txFilter === 'ALL') return true;
    return t.type === txFilter;
  });

  // ==========================================
  // SUBPAGE 1: SETTINGS / NOTIFICATIONS
  // ==========================================
  if (activeSubpage === 'settings') {
    return (
      <div className="max-w-md mx-auto py-4 px-4 space-y-6 animate-in fade-in duration-150 pb-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveSubpage(null)}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-900 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-lg font-bold text-slate-900">Settings</h2>
        </div>

        <div className="space-y-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Notifications
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-xs">
            <div className="p-4 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">Push Notifications</span>
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
              <div>
                <span className="text-sm font-bold text-slate-900 block">Round Due Reminders</span>
                <span className="text-xs text-slate-600">24 hours before contribution</span>
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
              <div>
                <span className="text-sm font-bold text-slate-900 block">Payout Alerts</span>
                <span className="text-xs text-slate-600">When pot arrives in MoMo</span>
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
      </div>
    );
  }

  // ==========================================
  // SUBPAGE 2: PAYMENT METHODS (Contribution Wallets)
  // ==========================================
  if (activeSubpage === 'payment_methods') {
    return (
      <div className="max-w-md mx-auto py-4 px-4 space-y-6 animate-in fade-in duration-150 pb-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveSubpage(null)}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-900 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Payment Methods</h2>
            <p className="text-xs text-slate-600">Used for paying your circle contributions</p>
          </div>
        </div>

        {/* Existing Card Display */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-4">
          <div className="w-12 h-9 rounded-lg bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center border border-amber-500/30 shrink-0">
            {user.momo_provider || 'MTN'}
          </div>
          <div className="border-l border-slate-200 pl-4 flex-1">
            <span className="font-mono text-sm font-bold text-slate-900 tracking-wider">
              {maskedPhone(user.phone_number)}
            </span>
            <div className="text-xs font-bold text-slate-700">
              {resolvedAccountName ? `Account: ${resolvedAccountName}` : `${user.momo_provider || 'MTN'} Mobile Money`}
            </div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Active"></span>
        </div>

        {/* Edit / Link MoMo Phone Form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Change MoMo Payment Number</h3>
          
          <form onSubmit={handleUpdatePersonal} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">Network Provider</label>
              <select
                value={personalForm.momo_provider}
                onChange={(e) => setPersonalForm({ ...personalForm, momo_provider: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
              >
                <option value="MTN">MTN Mobile Money (*170#)</option>
                <option value="TELECEL">Telecel Cash (*110#)</option>
                <option value="AT">AT Money (*110#)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">Mobile Money Phone Number</label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="0599360626"
                  value={personalForm.phone_number}
                  onChange={(e) => handlePhoneInputChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => handleResolveMoMo(personalForm.phone_number, personalForm.momo_provider)}
                  disabled={momoResolving}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold cursor-pointer transition-colors"
                >
                  {momoResolving ? 'Checking...' : 'Verify'}
                </button>
              </div>

              {resolvedAccountName && (
                <div className="p-2.5 mt-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>Registered MoMo Name: {resolvedAccountName} ✓</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
              💡 This number is automatically saved as both your contribution wallet and your pot withdrawal wallet until you change it.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all active:scale-95"
            >
              {loading ? 'Saving...' : 'Save Payment & Withdrawal Method'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // SUBPAGE 3: WITHDRAWAL METHODS (Payout Wallets)
  // ==========================================
  if (activeSubpage === 'withdrawal_methods') {
    return (
      <div className="max-w-md mx-auto py-4 px-4 space-y-6 animate-in fade-in duration-150 pb-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveSubpage(null)}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-900 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Withdrawal Methods</h2>
            <p className="text-xs text-slate-600">Where your lump sum pot goes</p>
          </div>
        </div>

        {/* Existing Payout Display */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-4">
          <div className="w-12 h-9 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
            {walletsForm.primary_wallet_provider === 'BANK' ? 'BANK' : walletsForm.primary_wallet_provider}
          </div>
          <div className="border-l border-slate-200 pl-4 flex-1">
            <span className="font-mono text-sm font-bold text-slate-900 tracking-wider">
              {maskedPhone(walletsForm.primary_wallet_number)}
            </span>
            <div className="text-xs font-bold text-slate-700">
              {resolvedAccountName ? `Account: ${resolvedAccountName}` : (walletsForm.primary_wallet_provider === 'BANK' ? (walletsForm.bank_name || 'Bank Account') : `${walletsForm.primary_wallet_provider} MoMo`)}
            </div>
          </div>
          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
            Active Wallet
          </span>
        </div>

        {/* Update Payout Form */}
        <form onSubmit={handleWalletsSubmit} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Configure Payout Destination</h3>

          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">Destination Provider</label>
            <select
              value={walletsForm.primary_wallet_provider}
              onChange={(e) => setWalletsForm({ ...walletsForm, primary_wallet_provider: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
            >
              <option value="MTN">MTN Mobile Money (*170#)</option>
              <option value="TELECEL">Telecel Cash (*110#)</option>
              <option value="AT">AT Money (*110#)</option>
              <option value="BANK">Bank Account</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              {walletsForm.primary_wallet_provider === 'BANK' ? 'Bank Account Number' : 'MoMo Phone Number'}
            </label>
            <input
              type="text"
              required
              placeholder="0599360626"
              value={walletsForm.primary_wallet_number}
              onChange={(e) => setWalletsForm({ ...walletsForm, primary_wallet_number: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900"
            />
          </div>

          {walletsForm.primary_wallet_provider === 'BANK' && (
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">Bank Name</label>
              <input
                type="text"
                placeholder="e.g. GCB, Ecobank, Absa"
                value={walletsForm.bank_name}
                onChange={(e) => setWalletsForm({ ...walletsForm, bank_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                4-Digit PIN {user.has_security_pin ? '(Change)' : '(New)'}
              </label>
              <input
                type="password"
                maxLength={4}
                placeholder="••••"
                value={walletsForm.pin}
                onChange={(e) => setWalletsForm({ ...walletsForm, pin: e.target.value.replace(/[^\d]/g, '') })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold tracking-widest text-center text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">Confirm PIN</label>
              <input
                type="password"
                maxLength={4}
                placeholder="••••"
                value={walletsForm.confirm_pin}
                onChange={(e) => setWalletsForm({ ...walletsForm, confirm_pin: e.target.value.replace(/[^\d]/g, '') })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold tracking-widest text-center text-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all active:scale-95"
          >
            {loading ? 'Saving...' : 'Save Withdrawal Wallet & PIN'}
          </button>
        </form>
      </div>
    );
  }

  // ==========================================
  // SUBPAGE 4: TRUST & IDENTITY (KYC - Clean without signature)
  // ==========================================
  if (activeSubpage === 'kyc') {
    return (
      <div className="max-w-md mx-auto py-4 px-4 space-y-6 animate-in fade-in duration-150 pb-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveSubpage(null)}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-900 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-lg font-bold text-slate-900">KYC Verification</h2>
        </div>

        {/* Approved Banner if verified */}
        {isVerifiedKYC ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
              <Check size={32} className="stroke-[3]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Approved</h3>
              <p className="text-xs text-slate-600 mt-0.5">Your account is verified with Ghana Card & Telecom MoMo</p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle size={20} className="text-amber-700 shrink-0" />
            <div className="text-xs text-amber-900 font-bold">
              Complete your Ghana Card verification to participate in rotating pot payouts.
            </div>
          </div>
        )}

        {/* Status Rows with Checkmarks */}
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-xs">
          
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User size={16} className="text-slate-700" />
              <span className="text-xs font-bold text-slate-900">Personal Information</span>
            </div>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${user.full_name ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              <Check size={12} className="stroke-[3]" />
            </div>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck size={16} className="text-slate-700" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Identity Verification</span>
                <span className="text-xs font-mono text-slate-700">{user.ghana_card_number || 'GHA-XXXXXXXXX-X'}</span>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isVerifiedKYC ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              <Check size={12} className="stroke-[3]" />
            </div>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users size={16} className="text-slate-700" />
              <span className="text-xs font-bold text-slate-900">Emergency Contact (Next of Kin)</span>
            </div>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${user.next_of_kin_name ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              <Check size={12} className="stroke-[3]" />
            </div>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone size={16} className="text-slate-700" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">MoMo Name Match</span>
                <span className="text-xs text-slate-700">
                  {resolvedAccountName ? `Verified: ${resolvedAccountName}` : 'Auto-confirmed via Telecom'}
                </span>
              </div>
            </div>
            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
              <Check size={12} className="stroke-[3]" />
            </div>
          </div>

        </div>

        {/* KYC Form with Automatic Hyphenation (NO SIGNATURE) */}
        <form onSubmit={handleSubmitKYC} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {isVerifiedKYC ? 'Update Ghana Card & Emergency Contact' : 'Submit Ghana Card & Emergency Contact'}
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              Ghana Card PIN (Auto-hyphenated)
            </label>
            <input
              type="text"
              required
              placeholder="GHA-712345678-9"
              value={kycForm.ghana_card_number}
              onChange={handleGhanaCardChange}
              maxLength={15}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 tracking-wider"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">Emergency Contact Full Name</label>
            <input
              type="text"
              required
              placeholder="Full Legal Name"
              value={kycForm.next_of_kin_name}
              onChange={(e) => setKycForm({ ...kycForm, next_of_kin_name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">Contact Phone</label>
              <input
                type="tel"
                required
                placeholder="024 123 4567"
                value={kycForm.next_of_kin_phone}
                onChange={(e) => setKycForm({ ...kycForm, next_of_kin_phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">Relationship</label>
              <select
                value={kycForm.next_of_kin_relation}
                onChange={(e) => setKycForm({ ...kycForm, next_of_kin_relation: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
              >
                <option value="Spouse">Spouse</option>
                <option value="Sibling">Sibling</option>
                <option value="Parent">Parent</option>
                <option value="Child">Child</option>
                <option value="Relative">Relative</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all active:scale-95"
          >
            {loading ? 'Submitting...' : 'Submit Verification'}
          </button>
        </form>
      </div>
    );
  }

  // ==========================================
  // SUBPAGE 5: REQUEST STATEMENT (PDF / Printable)
  // ==========================================
  if (activeSubpage === 'statement') {
    return (
      <div className="max-w-2xl mx-auto py-4 px-4 space-y-6 animate-in fade-in duration-150 pb-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveSubpage(null)}
              className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-900 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Request Statement</h2>
              <p className="text-xs text-slate-600">Official proof of rotational savings</p>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer size={14} />
            <span>Print PDF</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">SusuRow Ghana Savings Statement</h3>
              <p className="text-xs text-slate-600">Coratech Global Financial Services</p>
            </div>
            <div className="text-right text-xs">
              <span className="font-mono font-bold text-slate-900">{new Date().toLocaleDateString()}</span>
              <p className="text-xs text-emerald-700 font-bold">Verified Ledger</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] uppercase text-slate-700 font-bold">Saver</span>
              <p className="font-bold text-slate-900">{user.full_name}</p>
              <p className="font-mono font-bold text-slate-700">{user.phone_number}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-700 font-bold">Ghana Card</span>
              <p className="font-mono font-bold text-slate-900">{user.ghana_card_number || 'N/A'}</p>
              <p className="text-emerald-700 font-bold text-xs">{isVerifiedKYC ? 'Verified ✓' : 'Unverified'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-sky-50 rounded-xl border border-sky-100">
              <span className="text-[10px] uppercase text-sky-900 font-bold">Total Contributions</span>
              <p className="text-lg font-black font-mono text-sky-900">GH₵{totalContributions.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-[10px] uppercase text-emerald-900 font-bold">Total Payouts Won</span>
              <p className="text-lg font-black font-mono text-emerald-900">GH₵{totalPayouts.toFixed(2)}</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 text-slate-900 text-[10px] uppercase border-b border-slate-200 font-bold">
                <tr>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Group</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-700 font-sans text-xs font-bold">
                      No recorded transactions yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map(t => (
                    <tr key={t.id}>
                      <td className="p-2.5 text-slate-700 font-bold">{t.created_at ? new Date(t.created_at).toLocaleDateString() : 'N/A'}</td>
                      <td className="p-2.5 text-slate-900 font-sans font-bold">{t.group_name}</td>
                      <td className="p-2.5 text-slate-800 font-bold">{t.type}</td>
                      <td className="p-2.5 text-right font-black text-slate-900">
                        {t.type === 'CONTRIBUTION' ? '-' : '+'}GH₵{Number(t.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // SUBPAGE 6: ALL TRANSACTIONS
  // ==========================================
  if (activeSubpage === 'transactions') {
    return (
      <div className="max-w-2xl mx-auto py-4 px-4 space-y-6 animate-in fade-in duration-150 pb-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveSubpage(null)}
              className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-900 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <h2 className="text-lg font-bold text-slate-900">All Transactions</h2>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {['ALL', 'CONTRIBUTION', 'PAYOUT'].map(f => (
              <button
                key={f}
                onClick={() => setTxFilter(f)}
                className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                  txFilter === f ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                {f === 'ALL' ? 'All' : f === 'CONTRIBUTION' ? 'Paid' : 'Payouts'}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-xs overflow-hidden">
          {txLoading ? (
            <div className="p-8 text-center text-slate-600 font-bold text-xs">Loading transactions...</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-slate-600 font-bold text-xs">No transactions recorded yet.</div>
          ) : (
            filteredTransactions.map(t => (
              <div key={t.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    t.type === 'CONTRIBUTION' ? 'bg-sky-50 text-sky-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {t.type === 'CONTRIBUTION' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{t.group_name}</h4>
                    <p className="text-xs text-slate-700 font-mono font-bold">{t.reference} • {t.momo_provider}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-black text-xs text-slate-900">
                    {t.type === 'CONTRIBUTION' ? '-' : '+'}GH₵{Number(t.amount).toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-600 font-mono font-bold">
                    {t.created_at ? new Date(t.created_at).toLocaleDateString() : 'Recent'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // SUBPAGE 7: LEGAL (Susu Constitution)
  // ==========================================
  if (activeSubpage === 'legal') {
    return (
      <div className="max-w-md mx-auto py-4 px-4 space-y-6 animate-in fade-in duration-150 pb-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveSubpage(null)}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-900 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-lg font-bold text-slate-900">Legal & Constitution</h2>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 text-xs text-slate-900 shadow-xs">
          <div>
            <h4 className="font-black text-slate-900 text-sm">Rotational Fairness</h4>
            <p className="text-slate-700 mt-1 leading-relaxed">
              Turns progress in strict sequential, random ballot, or bidding order. No participant may withdraw ahead of their allocated round.
            </p>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <h4 className="font-black text-slate-900 text-sm">Default Policy</h4>
            <p className="text-slate-700 mt-1 leading-relaxed">
              If a member is 24h late on contribution, upfront commitment deposits are utilized to cover the winner pot, and the emergency contact is notified.
            </p>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <h4 className="font-black text-slate-900 text-sm">Data Privacy</h4>
            <p className="text-slate-700 mt-1 leading-relaxed">
              Compliant with the Data Protection Act of Ghana. Credentials and identities are stored with end-to-end encryption.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // SUBPAGE 8: GET HELP
  // ==========================================
  if (activeSubpage === 'help') {
    return (
      <div className="max-w-md mx-auto py-4 px-4 space-y-6 animate-in fade-in duration-150 pb-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveSubpage(null)}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-900 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-lg font-bold text-slate-900">Get Help</h2>
        </div>

        <div className="space-y-3">
          <details className="bg-white rounded-2xl border border-slate-200 p-4 text-xs group shadow-xs">
            <summary className="font-bold text-slate-900 cursor-pointer flex justify-between items-center">
              <span>How does Susu rotational savings work?</span>
              <ChevronRight size={14} className="group-open:rotate-90 transition-transform text-slate-600" />
            </summary>
            <p className="text-slate-700 mt-2 leading-relaxed font-medium">
              Members contribute a set amount each cycle. Every round, one member receives the entire collective pot until all members have had their turn.
            </p>
          </details>

          <details className="bg-white rounded-2xl border border-slate-200 p-4 text-xs group shadow-xs">
            <summary className="font-bold text-slate-900 cursor-pointer flex justify-between items-center">
              <span>How do I receive my pot?</span>
              <ChevronRight size={14} className="group-open:rotate-90 transition-transform text-slate-600" />
            </summary>
            <p className="text-slate-700 mt-2 leading-relaxed font-medium">
              When all contributions for your round are collected, the system automatically disburses the full pot directly to your verified Mobile Money wallet.
            </p>
          </details>

          <details className="bg-white rounded-2xl border border-slate-200 p-4 text-xs group shadow-xs">
            <summary className="font-bold text-slate-900 cursor-pointer flex justify-between items-center">
              <span>What if someone doesn't pay?</span>
              <ChevronRight size={14} className="group-open:rotate-90 transition-transform text-slate-600" />
            </summary>
            <p className="text-slate-700 mt-2 leading-relaxed font-medium">
              Circles utilize security escrow deposits and automatic SMS recovery to protect the recipient's payout.
            </p>
          </details>
        </div>
      </div>
    );
  }

  // ==========================================
  // SUBPAGE 9: CONTACT US (Helpline 0599360626)
  // ==========================================
  if (activeSubpage === 'contact') {
    return (
      <div className="max-w-md mx-auto py-4 px-4 space-y-6 animate-in fade-in duration-150 pb-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveSubpage(null)}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-900 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-lg font-bold text-slate-900">Contact Us</h2>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-xs">
          <a
            href="https://wa.me/233599360626?text=Hello%20SusuRow%20Support"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <MessageCircle size={20} className="text-emerald-600" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">WhatsApp Support</h4>
                <p className="text-xs text-slate-700 font-bold">Chat with our support team on WhatsApp</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-600" />
          </a>

          <a
            href="tel:0599360626"
            className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Phone size={20} className="text-sky-600" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Ghanaian Helpline</h4>
                <p className="text-xs text-slate-900 font-mono font-black">0599360626</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-600" />
          </a>

          <a
            href="mailto:support@coratechglobal.com"
            className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Mail size={20} className="text-slate-800" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Email Desk</h4>
                <p className="text-xs text-slate-700 font-bold">support@coratechglobal.com</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-600" />
          </a>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN PROFILE MENU LIST
  // ==========================================
  return (
    <div className="max-w-md mx-auto py-4 px-4 space-y-6 animate-in fade-in duration-150 pb-20">
      
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-900 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          title="Back to Marketplace"
        >
          <ArrowLeft size={16} />
        </button>
        <h2 className="text-lg font-bold text-slate-900">Profile & Settings</h2>
        <div className="w-9"></div>
      </div>

      {/* User Identity Card (Header) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-sky-600 text-white font-bold text-xl flex items-center justify-center shadow-xs overflow-hidden shrink-0">
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

        <div className="flex-1 min-w-0 space-y-0.5">
          <h3 className="text-sm font-bold text-slate-900 truncate">
            {user.full_name || 'Ghana Saver'}
          </h3>
          <p className="text-xs font-mono font-bold text-slate-700 truncate">
            {user.phone_number || user.email || 'No Phone Linked'}
          </p>
          <div className="flex items-center gap-2 pt-0.5">
            {isVerifiedKYC ? (
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <ShieldCheck size={11} className="text-emerald-600" /> Ghana Card Verified ✓
              </span>
            ) : (
              <span className="text-[10px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                KYC Pending
              </span>
            )}
            <span className="text-[10px] text-slate-700 font-mono font-bold">{user.trust_score || 100}% Trust</span>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-xs">
          <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Profile Menu Groups */}
      <div className="space-y-4">
        
        {/* Section 1: Wallets & Identity */}
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-xs">
          
          <button
            onClick={() => setActiveSubpage('kyc')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <ShieldCheck size={18} className="text-slate-900" />
              <span className="text-xs font-bold text-slate-900">Trust & Identity (KYC)</span>
            </div>
            <div className="flex items-center gap-2">
              {isVerifiedKYC && <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">Verified</span>}
              <ChevronRight size={15} className="text-slate-600" />
            </div>
          </button>

          <button
            onClick={() => setActiveSubpage('payment_methods')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <CreditCard size={18} className="text-slate-900" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Payment Methods</span>
                <span className="text-[11px] text-slate-700 font-medium">How you pay into circles</span>
              </div>
            </div>
            <ChevronRight size={15} className="text-slate-600" />
          </button>

          <button
            onClick={() => setActiveSubpage('withdrawal_methods')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <Wallet size={18} className="text-slate-900" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Withdrawal Methods</span>
                <span className="text-[11px] text-slate-700 font-medium">Where your lump sum pot goes</span>
              </div>
            </div>
            <ChevronRight size={15} className="text-slate-600" />
          </button>

        </div>

        {/* Section 2: Statements & Ledger */}
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-xs">
          
          <button
            onClick={() => setActiveSubpage('statement')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <FileText size={18} className="text-slate-900" />
              <span className="text-xs font-bold text-slate-900">Request Statement</span>
            </div>
            <ChevronRight size={15} className="text-slate-600" />
          </button>

          <button
            onClick={() => setActiveSubpage('transactions')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <ArrowDownLeft size={18} className="text-slate-900" />
              <span className="text-xs font-bold text-slate-900">All Transactions</span>
            </div>
            <ChevronRight size={15} className="text-slate-600" />
          </button>

        </div>

        {/* Section 3: Settings, Legal, Help */}
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-xs">
          
          <button
            onClick={() => setActiveSubpage('settings')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <SettingsIcon size={18} className="text-slate-900" />
              <span className="text-xs font-bold text-slate-900">Settings</span>
            </div>
            <ChevronRight size={15} className="text-slate-600" />
          </button>

          <button
            onClick={() => setActiveSubpage('legal')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <BookOpen size={18} className="text-slate-900" />
              <span className="text-xs font-bold text-slate-900">Legal</span>
            </div>
            <ChevronRight size={15} className="text-slate-600" />
          </button>

          <button
            onClick={() => setActiveSubpage('help')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <Info size={18} className="text-slate-900" />
              <span className="text-xs font-bold text-slate-900">Get Help</span>
            </div>
            <ChevronRight size={15} className="text-slate-600" />
          </button>

          <button
            onClick={() => setActiveSubpage('contact')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <Phone size={18} className="text-slate-900" />
              <span className="text-xs font-bold text-slate-900">Contact Us (0599360626)</span>
            </div>
            <ChevronRight size={15} className="text-slate-600" />
          </button>

        </div>

        {/* Section 4: Sign Out */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
          <button
            onClick={logout}
            className="w-full p-4 flex items-center gap-3.5 text-left text-red-600 hover:bg-red-50 transition-colors cursor-pointer rounded-2xl"
          >
            <LogOut size={18} className="text-red-600" />
            <span className="text-xs font-bold">Sign out</span>
          </button>
        </div>

      </div>

    </div>
  );
};
