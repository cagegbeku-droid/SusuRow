import React, { useState, useEffect } from 'react';
import { 
  User, 
  ShieldCheck, 
  KeyRound, 
  Smartphone, 
  Building2, 
  Calendar, 
  Award, 
  Gift, 
  HelpCircle, 
  FileText, 
  RotateCcw, 
  Lock, 
  Trash2, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  ChevronRight, 
  Clock, 
  MessageSquare, 
  HeartHandshake, 
  Camera, 
  RefreshCw, 
  Star,
  Zap,
  Briefcase,
  Layers,
  ArrowLeft,
  Phone,
  Check
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { 
  updateProfile, 
  submitKYC, 
  setSecurityPIN, 
  configureWallets, 
  configureAutoDebit, 
  deactivateAccount, 
  deleteAccount 
} from '../api/client';
import { SignatureCanvas } from '../components/SignatureCanvas';
import { FAQModal } from '../components/FAQModal';
import { RegulatoryModal } from '../components/RegulatoryModal';
import confetti from 'canvas-confetti';

export const ProfilePage = ({ onBack, onOpenReferralModal, onOpenTermsModal }) => {
  const { user, isAuthenticated, logout, openAuthModal, refreshProfile } = useUser();
  const [activeTab, setActiveTab] = useState('overview'); // overview, personal, kyc, wallets, security, support
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [avatarError, setAvatarError] = useState(false);

  // Modals
  const [isFAQOpen, setIsFAQOpen] = useState(false);
  const [isRegulatoryOpen, setIsRegulatoryOpen] = useState(false);
  const [isVersionChecked, setIsVersionChecked] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [ratingSheetOpen, setRatingSheetOpen] = useState(false);
  const [userRating, setUserRating] = useState(null);

  // Form States
  const [personalForm, setPersonalForm] = useState({
    full_name: '',
    phone_number: '',
    momo_provider: 'MTN',
    username: '',
    email: '',
    date_of_birth: '',
    nationality: 'Ghanaian',
    employment_status: 'Employed',
    savings_goal: 'Emergency Fund'
  });

  const [kycForm, setKycForm] = useState({
    ghana_card_number: '',
    next_of_kin_name: '',
    next_of_kin_phone: '',
    next_of_kin_relation: 'Sibling',
    employment_status: 'Employed',
    savings_goal: 'Home / Business Capital',
    signature_data: ''
  });

  const [pinForm, setPinForm] = useState({
    pin: '',
    confirm_pin: ''
  });

  const [walletForm, setWalletForm] = useState({
    primary_wallet_provider: 'MTN',
    primary_wallet_number: '',
    bank_name: '',
    bank_account_number: '',
    bank_branch: ''
  });

  const [autoDebitForm, setAutoDebitForm] = useState({
    enabled: false,
    frequency: 'WEEKLY',
    time: '08:00'
  });

  useEffect(() => {
    if (user) {
      setPersonalForm({
        full_name: user.full_name || '',
        phone_number: user.phone_number || '',
        momo_provider: user.momo_provider || 'MTN',
        username: user.username || '',
        email: user.email || '',
        date_of_birth: user.date_of_birth || '',
        nationality: user.nationality || 'Ghanaian',
        employment_status: user.employment_status || 'Employed',
        savings_goal: user.savings_goal || 'Emergency Fund'
      });

      setKycForm({
        ghana_card_number: user.ghana_card_number || '',
        next_of_kin_name: user.next_of_kin_name || '',
        next_of_kin_phone: user.next_of_kin_phone || '',
        next_of_kin_relation: user.next_of_kin_relation || 'Sibling',
        employment_status: user.employment_status || 'Employed',
        savings_goal: user.savings_goal || 'Home / Business Capital',
        signature_data: user.signature_data || ''
      });

      setWalletForm({
        primary_wallet_provider: user.primary_wallet_provider || user.momo_provider || 'MTN',
        primary_wallet_number: user.primary_wallet_number || user.phone_number || '',
        bank_name: user.bank_name || '',
        bank_account_number: user.bank_account_number || '',
        bank_branch: user.bank_branch || ''
      });

      setAutoDebitForm({
        enabled: user.auto_debit_enabled || false,
        frequency: user.auto_debit_frequency || 'WEEKLY',
        time: user.auto_debit_time || '08:00'
      });
    }
  }, [user]);

  if (!isAuthenticated || !user) {
    return (
      <div className="py-20 text-center space-y-4 max-w-sm mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
          <User size={32} />
        </div>
        <h2 className="text-xl font-black text-white">Sign In to View Profile</h2>
        <p className="text-xs text-slate-400">
          Manage your Ghana Card KYC verification, multi-rail Mobile Money wallets, and reward points.
        </p>
        <button
          onClick={openAuthModal}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-lg cursor-pointer transition-all active:scale-95"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  const triggerSuccess = (msg) => {
    setSaveSuccess(msg);
    setTimeout(() => setSaveSuccess(null), 4000);
  };

  // STEP 1: Personal Info -> Auto Advance to KYC
  const handleUpdatePersonal = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      await updateProfile(personalForm);
      await refreshProfile();
      triggerSuccess('✅ Step 1 Saved! Advancing to Step 2: Ghana Card KYC...');
      setTimeout(() => {
        setActiveTab('kyc');
        window.scrollTo({ top: 120, behavior: 'smooth' });
      }, 1000);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to update personal details.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: KYC -> Auto Advance to Wallets
  const handleSubmitKYC = async (e) => {
    e.preventDefault();
    if (!kycForm.ghana_card_number.trim()) {
      setErrorMsg('Please enter your Ghana Card Number (GHA-XXXXXXXXX-X).');
      return;
    }
    if (!kycForm.next_of_kin_name.trim() || !kycForm.next_of_kin_phone.trim()) {
      setErrorMsg('Next of Kin name and phone are required for anti-default emergency recovery.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await submitKYC(kycForm);
      await refreshProfile();
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      triggerSuccess('🎉 KYC Verified! +100 Points Awarded! Advancing to Step 3: Multi-Rail Wallets...');
      setTimeout(() => {
        setActiveTab('wallets');
        window.scrollTo({ top: 120, behavior: 'smooth' });
      }, 1200);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'KYC verification submission failed.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Wallets -> Auto Advance to Security PIN
  const handleWalletSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      await configureWallets(walletForm);
      await refreshProfile();
      triggerSuccess('✅ Step 3 Saved! Advancing to Step 4: 4-Digit Security PIN...');
      setTimeout(() => {
        setActiveTab('security');
        window.scrollTo({ top: 120, behavior: 'smooth' });
      }, 1000);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to save payout wallet settings.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 4: 4-Digit PIN -> Auto Advance to Complete Overview
  const handleSetPIN = async (e) => {
    e.preventDefault();
    if (pinForm.pin !== pinForm.confirm_pin) {
      setErrorMsg('PINs do not match. Please re-enter.');
      return;
    }
    if (!/^\d{4}$/.test(pinForm.pin)) {
      setErrorMsg('PIN must be exactly 4 numeric digits.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await setSecurityPIN(pinForm.pin);
      await refreshProfile();
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      triggerSuccess('🎉 4-Digit Security PIN Activated! Your Profile is 100% Setup!');
      setPinForm({ pin: '', confirm_pin: '' });
      setTimeout(() => {
        setActiveTab('overview');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to update Security PIN.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoDebitSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      await configureAutoDebit(autoDebitForm.enabled, autoDebitForm.frequency, autoDebitForm.time);
      await refreshProfile();
      triggerSuccess('Automated Top-up settings updated successfully!');
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to configure scheduled top-up.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (window.confirm('Are you sure you want to temporarily deactivate your account?')) {
      try {
        await deactivateAccount();
        triggerSuccess('Account deactivated. You can reactivate anytime by signing back in.');
        setTimeout(logout, 2000);
      } catch (err) {
        setErrorMsg(err.response?.data?.detail || 'Deactivation failed.');
      }
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAccount();
      alert('Your SusuRow account has been permanently deleted.');
      logout();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Account deletion failed.');
      setIsDeleteModalOpen(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '₵';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  // Stepper calculations
  const isPersonalDone = Boolean(user.full_name && user.phone_number);
  const isKycDone = user.kyc_status === 'VERIFIED';
  const isWalletDone = Boolean(user.primary_wallet_number);
  const isPinDone = Boolean(user.has_security_pin);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in duration-200">
      
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#0E1322] hover:bg-[#141A2D] text-slate-300 hover:text-white border border-white/5 text-xs font-bold transition-all cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Marketplace</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
            👑 Tier: {user.tier || 'BRONZE'}
          </span>
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
            {user.points || 50} Reward Points
          </span>
        </div>
      </div>

      {/* 👑 1. USER HEADER & GAMIFICATION CARD */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900/40 via-[#141A2D] to-[#0E1322] border border-blue-500/20 p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white font-black text-2xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.4)] border border-white/10 overflow-hidden">
                {user.avatar_url && !avatarError ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user.full_name} 
                    onError={() => setAvatarError(true)}
                    className="w-full h-full object-cover rounded-3xl" 
                  />
                ) : (
                  <span className="tracking-tighter">{getInitials(user.full_name)}</span>
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#141A2D] flex items-center justify-center text-[9px] text-slate-950 font-black">
                ✓
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  {user.full_name || 'Ghana Saver'}
                </h1>
                {user.kyc_status === 'VERIFIED' ? (
                  <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck size={11} />
                    <span>Verified KYC</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    KYC Pending
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                <span>@{user.username || 'saver'}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone size={11} className="text-slate-500" />
                  <span>{user.phone_number || 'No Phone'}</span>
                </span>
                <span>•</span>
                <span className="text-slate-300">{user.nationality || 'Ghanaian 🇬🇭'}</span>
              </div>
            </div>
          </div>

          {/* Reward & Referral Banner */}
          <div className="flex items-center gap-3">
            <div className="bg-[#0E1322] border border-white/10 rounded-2xl p-3.5 text-center min-w-[120px]">
              <span className="text-[9px] font-bold uppercase text-slate-400">Trust Score</span>
              <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">
                {user.trust_score || 100}%
              </div>
            </div>

            <div className="bg-[#0E1322] border border-white/10 rounded-2xl p-3.5 text-center min-w-[130px]">
              <span className="text-[9px] font-bold uppercase text-slate-400">Total Points</span>
              <div className="text-lg font-black text-amber-400 font-mono mt-0.5 flex items-center justify-center gap-1">
                <Sparkles size={14} />
                <span>{user.points || 50}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 🚀 SETUP PROGRESS STEPPER WIZARD */}
      <div className="bg-[#0E1322] border border-white/10 rounded-3xl p-4 space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-white">
              Account Setup Progress
            </span>
            <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
              {[isPersonalDone, isKycDone, isWalletDone, isPinDone].filter(Boolean).length}/4 Steps Complete
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Tap step to configure</span>
        </div>

        {/* 4-Step Interactive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          
          {/* Step 1 */}
          <button
            onClick={() => setActiveTab('personal')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'personal'
                ? 'bg-blue-600 text-white border-blue-400 shadow-md font-black ring-2 ring-blue-500/30'
                : 'bg-[#141A2D] border-white/5 text-slate-300 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold opacity-80">Step 1</span>
              {isPersonalDone ? <Check size={13} className="text-emerald-400" /> : <div className="w-2 h-2 rounded-full bg-slate-500" />}
            </div>
            <div className="text-xs font-bold">Personal Info</div>
          </button>

          {/* Step 2 */}
          <button
            onClick={() => setActiveTab('kyc')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'kyc'
                ? 'bg-blue-600 text-white border-blue-400 shadow-md font-black ring-2 ring-blue-500/30'
                : 'bg-[#141A2D] border-white/5 text-slate-300 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold opacity-80">Step 2</span>
              {isKycDone ? <Check size={13} className="text-emerald-400" /> : <div className="w-2 h-2 rounded-full bg-amber-400" />}
            </div>
            <div className="text-xs font-bold">Ghana Card KYC</div>
          </button>

          {/* Step 3 */}
          <button
            onClick={() => setActiveTab('wallets')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'wallets'
                ? 'bg-blue-600 text-white border-blue-400 shadow-md font-black ring-2 ring-blue-500/30'
                : 'bg-[#141A2D] border-white/5 text-slate-300 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold opacity-80">Step 3</span>
              {isWalletDone ? <Check size={13} className="text-emerald-400" /> : <div className="w-2 h-2 rounded-full bg-slate-500" />}
            </div>
            <div className="text-xs font-bold">Payout Wallets</div>
          </button>

          {/* Step 4 */}
          <button
            onClick={() => setActiveTab('security')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'bg-blue-600 text-white border-blue-400 shadow-md font-black ring-2 ring-blue-500/30'
                : 'bg-[#141A2D] border-white/5 text-slate-300 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold opacity-80">Step 4</span>
              {isPinDone ? <Check size={13} className="text-emerald-400" /> : <div className="w-2 h-2 rounded-full bg-slate-500" />}
            </div>
            <div className="text-xs font-bold">4-Digit PIN</div>
          </button>

        </div>
      </div>

      {/* Success / Error Alerts */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB NAVIGATION BUTTONS */}
      <div className="flex border-b border-white/10 overflow-x-auto pb-1 gap-1">
        {[
          { id: 'overview', label: 'Overview & Badges' },
          { id: 'personal', label: '1. Personal Info' },
          { id: 'kyc', label: '2. Ghana Card KYC' },
          { id: 'wallets', label: '3. Payout Wallets' },
          { id: 'security', label: '4. Security & PIN' },
          { id: 'support', label: 'Support & Legal' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setActiveTab(t.id);
              setErrorMsg(null);
            }}
            className={`px-4 py-2.5 text-xs font-bold rounded-2xl whitespace-nowrap transition-all cursor-pointer ${
              activeTab === t.id
                ? 'bg-blue-600 text-white font-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & GAMIFICATION */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* KYC Status Card */}
            <div className="dark-card rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${user.kyc_status === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                  {user.kyc_status || 'UNVERIFIED'}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Identity Verification</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {user.kyc_status === 'VERIFIED' ? `Ghana Card: ${user.ghana_card_number}` : 'Complete KYC to unlock Silver Tier & +100 Points'}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('kyc')}
                className="w-full py-2 bg-[#141A2D] hover:bg-[#1C233A] text-blue-400 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                {user.kyc_status === 'VERIFIED' ? 'View KYC Details' : 'Verify Ghana Card →'}
              </button>
            </div>

            {/* Primary MoMo Wallet Card */}
            <div className="dark-card rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Smartphone size={20} />
                </div>
                <span className="text-[10px] font-black bg-yellow-400/20 text-yellow-300 px-2.5 py-0.5 rounded-full">
                  {user.primary_wallet_provider || user.momo_provider} MoMo
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Payout Destination</h3>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  {user.primary_wallet_number || user.phone_number || 'Not configured'}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('wallets')}
                className="w-full py-2 bg-[#141A2D] hover:bg-[#1C233A] text-blue-400 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Manage Wallets →
              </button>
            </div>

            {/* 4-Digit Security PIN Card */}
            <div className="dark-card rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-violet-500/20 text-violet-400 flex items-center justify-center">
                  <KeyRound size={20} />
                </div>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${user.has_security_pin ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                  {user.has_security_pin ? 'PIN Active' : 'No PIN Set'}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Pot Security PIN</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {user.has_security_pin ? 'Authorized for group pot payouts' : 'Required before claiming rotational payout pots'}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('security')}
                className="w-full py-2 bg-[#141A2D] hover:bg-[#1C233A] text-blue-400 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Configure PIN →
              </button>
            </div>

          </div>

          {/* Refer & Earn Callout */}
          <div className="dark-card rounded-3xl p-6 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                <Gift size={24} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Refer Peers & Earn Bonus Points</h3>
                <p className="text-xs text-slate-400">
                  Earn +10 points for every friend who joins and saves in a Susu group.
                </p>
              </div>
            </div>
            <button
              onClick={onOpenReferralModal}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-2xl shadow transition-all cursor-pointer whitespace-nowrap"
            >
              Open Referral Hub
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: PERSONAL INFORMATION (STEP 1) */}
      {activeTab === 'personal' && (
        <div className="dark-card rounded-3xl p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                Step 1 of 4
              </span>
              <h2 className="text-base font-black text-white">Personal Information</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Provide your real name and contact details. Saving will advance you to Step 2 (KYC).
            </p>
          </div>

          <form onSubmit={handleUpdatePersonal} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="Your Full Legal Name"
                  value={personalForm.full_name}
                  onChange={(e) => setPersonalForm({ ...personalForm, full_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0E1322] border border-white/10 text-sm font-medium text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number (Ghana MoMo)</label>
                <input
                  type="tel"
                  required
                  placeholder="024 123 4567"
                  value={personalForm.phone_number}
                  onChange={(e) => setPersonalForm({ ...personalForm, phone_number: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0E1322] border border-white/10 text-sm font-mono font-bold text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Mobile Money Network</label>
                <select
                  value={personalForm.momo_provider}
                  onChange={(e) => setPersonalForm({ ...personalForm, momo_provider: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0E1322] border border-white/10 text-sm font-medium text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="MTN">MTN Mobile Money (*170#)</option>
                  <option value="TELECEL">Telecel Cash (*110#)</option>
                  <option value="AT">AT Money (*110#)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Username</label>
                <input
                  type="text"
                  placeholder="username"
                  value={personalForm.username}
                  onChange={(e) => setPersonalForm({ ...personalForm, username: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0E1322] border border-white/10 text-sm font-medium text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="your.email@gmail.com"
                  value={personalForm.email}
                  onChange={(e) => setPersonalForm({ ...personalForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0E1322] border border-white/10 text-sm font-medium text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={personalForm.date_of_birth}
                  onChange={(e) => setPersonalForm({ ...personalForm, date_of_birth: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0E1322] border border-white/10 text-sm font-medium text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Employment Status</label>
                <select
                  value={personalForm.employment_status}
                  onChange={(e) => setPersonalForm({ ...personalForm, employment_status: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0E1322] border border-white/10 text-sm font-medium text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Employed">Employed (Salaried)</option>
                  <option value="Self-Employed / Trader">Self-Employed / Market Trader</option>
                  <option value="Business Owner">Business Owner</option>
                  <option value="Student">Student</option>
                  <option value="Freelancer">Freelancer / Remote Worker</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Primary Savings Goal</label>
                <input
                  type="text"
                  placeholder="e.g. Business Expansion, School Fees"
                  value={personalForm.savings_goal}
                  onChange={(e) => setPersonalForm({ ...personalForm, savings_goal: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0E1322] border border-white/10 text-sm font-medium text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <span>Save & Continue to Step 2 (KYC) →</span>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: GHANA CARD KYC (STEP 2) */}
      {activeTab === 'kyc' && (
        <div className="dark-card rounded-3xl p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                Step 2 of 4
              </span>
              <h2 className="text-base font-black text-white">Ghana Card KYC & Next of Kin Verification</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Required by Bank of Ghana FinTech guidelines for group pot disbursements.
            </p>
          </div>

          <form onSubmit={handleSubmitKYC} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Ghana Card PIN (Format: GHA-XXXXXXXXX-X)
                </label>
                <input
                  type="text"
                  required
                  placeholder="GHA-712345678-9"
                  value={kycForm.ghana_card_number}
                  onChange={(e) => setKycForm({ ...kycForm, ghana_card_number: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0E1322] border border-white/10 text-sm font-mono font-bold text-amber-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Next of Kin Full Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="Next of Kin Full Name"
                  value={kycForm.next_of_kin_name}
                  onChange={(e) => setKycForm({ ...kycForm, next_of_kin_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0E1322] border border-white/10 text-sm font-medium text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Next of Kin Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="024 123 4567"
                  value={kycForm.next_of_kin_phone}
                  onChange={(e) => setKycForm({ ...kycForm, next_of_kin_phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0E1322] border border-white/10 text-sm font-mono font-bold text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Relationship to Next of Kin</label>
                <select
                  value={kycForm.next_of_kin_relation}
                  onChange={(e) => setKycForm({ ...kycForm, next_of_kin_relation: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0E1322] border border-white/10 text-sm font-medium text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Spouse">Spouse / Partner</option>
                  <option value="Sibling">Brother / Sister</option>
                  <option value="Parent">Parent (Mother / Father)</option>
                  <option value="Child">Child (Son / Daughter)</option>
                  <option value="Guardian">Guardian / Relative</option>
                </select>
              </div>

            </div>

            {/* Digital Signature Canvas */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Digital Payout Signature Pad (Draw with finger or mouse)
              </label>
              <SignatureCanvas
                initialSignature={kycForm.signature_data}
                onSave={(sigData) => setKycForm({ ...kycForm, signature_data: sigData })}
              />
            </div>

            <div className="pt-3 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setActiveTab('personal')}
                className="px-4 py-2.5 bg-[#141A2D] text-slate-300 text-xs font-bold rounded-2xl hover:bg-white/5 cursor-pointer"
              >
                ← Back to Personal Info
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <span>Verify KYC & Continue to Step 3 (Wallets) →</span>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: PAYOUT WALLETS (STEP 3) */}
      {activeTab === 'wallets' && (
        <div className="dark-card rounded-3xl p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                Step 3 of 4
              </span>
              <h2 className="text-base font-black text-white">Multi-Rail Payout Destination</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Select where you want your rotation lump-sum payout sent when your turn arrives.
            </p>
          </div>

          <form onSubmit={handleWalletSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Primary Payout Provider</label>
                <select
                  value={walletForm.primary_wallet_provider}
                  onChange={(e) => setWalletForm({ ...walletForm, primary_wallet_provider: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0E1322] border border-white/10 text-sm font-medium text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="MTN">MTN Mobile Money (*170#)</option>
                  <option value="TELECEL">Telecel Cash (*110#)</option>
                  <option value="AT">AT Money (*110#)</option>
                  <option value="BANK">Commercial Bank Account</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Primary Wallet / Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="024 123 4567"
                  value={walletForm.primary_wallet_number}
                  onChange={(e) => setWalletForm({ ...walletForm, primary_wallet_number: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0E1322] border border-white/10 text-sm font-mono font-bold text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {walletForm.primary_wallet_provider === 'BANK' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. GCB Bank, Ecobank, Absa"
                      value={walletForm.bank_name}
                      onChange={(e) => setWalletForm({ ...walletForm, bank_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl bg-[#0E1322] border border-white/10 text-sm font-medium text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Bank Account Number</label>
                    <input
                      type="text"
                      placeholder="Account Number"
                      value={walletForm.bank_account_number}
                      onChange={(e) => setWalletForm({ ...walletForm, bank_account_number: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl bg-[#0E1322] border border-white/10 text-sm font-mono text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </>
              )}

            </div>

            <div className="pt-3 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setActiveTab('kyc')}
                className="px-4 py-2.5 bg-[#141A2D] text-slate-300 text-xs font-bold rounded-2xl hover:bg-white/5 cursor-pointer"
              >
                ← Back to KYC
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <span>Save Wallets & Continue to Step 4 (PIN) →</span>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: SECURITY & 4-DIGIT PIN (STEP 4) */}
      {activeTab === 'security' && (
        <div className="dark-card rounded-3xl p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                Step 4 of 4
              </span>
              <h2 className="text-base font-black text-white">4-Digit Pot Security PIN</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Your 4-digit PIN authorizes pot disbursements to your Mobile Money wallet.
            </p>
          </div>

          <form onSubmit={handleSetPIN} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Create 4-Digit Security PIN</label>
              <input
                type="password"
                maxLength={4}
                required
                placeholder="••••"
                value={pinForm.pin}
                onChange={(e) => setPinForm({ ...pinForm, pin: e.target.value.replace(/[^\d]/g, '') })}
                className="w-full py-3 text-center tracking-[0.6em] text-2xl font-black font-mono rounded-2xl bg-[#0E1322] border border-white/10 text-amber-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Confirm 4-Digit PIN</label>
              <input
                type="password"
                maxLength={4}
                required
                placeholder="••••"
                value={pinForm.confirm_pin}
                onChange={(e) => setPinForm({ ...pinForm, confirm_pin: e.target.value.replace(/[^\d]/g, '') })}
                className="w-full py-3 text-center tracking-[0.6em] text-2xl font-black font-mono rounded-2xl bg-[#0E1322] border border-white/10 text-amber-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="pt-3 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setActiveTab('wallets')}
                className="px-4 py-2.5 bg-[#141A2D] text-slate-300 text-xs font-bold rounded-2xl hover:bg-white/5 cursor-pointer"
              >
                ← Back to Wallets
              </button>

              <button
                type="submit"
                disabled={loading || pinForm.pin.length !== 4}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <span>Complete Setup & Finish 🎉</span>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 6: SUPPORT, LEGAL & APP MANAGEMENT */}
      {activeTab === 'support' && (
        <div className="space-y-4">
          <div className="dark-card rounded-3xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">Help & Legal Framework</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setIsFAQOpen(true)}
                className="p-4 rounded-2xl bg-[#0E1322] hover:bg-[#141A2D] border border-white/5 text-left transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400">
                    <HelpCircle size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Frequently Asked Questions</h4>
                    <p className="text-[11px] text-slate-400">Search guides & answers</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-500" />
              </button>

              <button
                onClick={() => setIsRegulatoryOpen(true)}
                className="p-4 rounded-2xl bg-[#0E1322] hover:bg-[#141A2D] border border-white/5 text-left transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Compliance & Governance</h4>
                    <p className="text-[11px] text-slate-400">Bank of Ghana & Coratech Global</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-500" />
              </button>
            </div>
          </div>

          <div className="dark-card rounded-3xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white">Account Management</h3>
            
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div>
                <h4 className="text-xs font-bold text-slate-200">Deactivate Account</h4>
                <p className="text-[11px] text-slate-400">Temporarily pause activity</p>
              </div>
              <button
                onClick={handleDeactivate}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-bold border border-amber-500/20 transition-all cursor-pointer"
              >
                Deactivate
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div>
                <h4 className="text-xs font-bold text-red-400">Delete Account</h4>
                <p className="text-[11px] text-slate-400">Permanently delete your profile</p>
              </div>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold border border-red-500/20 transition-all cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Modal */}
      <FAQModal isOpen={isFAQOpen} onClose={() => setIsFAQOpen(false)} />

      {/* Regulatory Modal */}
      <RegulatoryModal isOpen={isRegulatoryOpen} onClose={() => setIsRegulatoryOpen(false)} />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="dark-card rounded-3xl p-6 max-w-sm w-full space-y-4 border border-red-500/30">
            <h3 className="text-base font-black text-red-400">Delete Account</h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to permanently delete your SusuRow account? This action cannot be undone.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#141A2D] text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
