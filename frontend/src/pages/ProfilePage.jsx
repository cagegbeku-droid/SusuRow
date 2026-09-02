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
  HelpCircle 
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { 
  updateProfile, 
  submitKYC, 
  setSecurityPIN, 
  configureWallets, 
  deactivateAccount, 
  deleteAccount 
} from '../api/client';
import { SignatureCanvas } from '../components/SignatureCanvas';
import { FAQModal } from '../components/FAQModal';
import { RegulatoryModal } from '../components/RegulatoryModal';

export const ProfilePage = ({ onBack, onOpenReferralModal, onOpenTermsModal }) => {
  const { user, isAuthenticated, logout, openAuthModal, refreshProfile } = useUser();
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [avatarError, setAvatarError] = useState(false);

  // Modals
  const [isFAQOpen, setIsFAQOpen] = useState(false);
  const [isRegulatoryOpen, setIsRegulatoryOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Clean Essential Form States
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

  const [securityForm, setSecurityForm] = useState({
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

      setSecurityForm({
        primary_wallet_provider: user.primary_wallet_provider || user.momo_provider || 'MTN',
        primary_wallet_number: user.primary_wallet_number || user.phone_number || '',
        bank_name: user.bank_name || '',
        bank_account_number: user.bank_account_number || '',
        pin: '',
        confirm_pin: ''
      });
    }
  }, [user]);

  if (!isAuthenticated || !user) {
    return (
      <div className="py-20 text-center space-y-4 max-w-sm mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto border border-sky-200 shadow-xs">
          <User size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Sign In to View Profile</h2>
        <p className="text-xs text-slate-500">
          Manage your Ghana Card verification, payout wallet, and security PIN.
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
      setErrorMsg('A valid Ghanaian phone number is compulsory (e.g. 024 123 4567).');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await updateProfile(personalForm);
      await refreshProfile();
      triggerSuccess('Personal information saved. Advancing to Step 2 (Ghana Card KYC)...');
      setTimeout(() => {
        setActiveTab('kyc');
        window.scrollTo({ top: 120, behavior: 'smooth' });
      }, 800);
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
      setErrorMsg('Next of Kin name and phone number are required for emergency recovery.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await submitKYC(kycForm);
      await refreshProfile();
      triggerSuccess('Ghana Card KYC submitted successfully. Advancing to Step 3 (Payout & PIN)...');
      setTimeout(() => {
        setActiveTab('security');
        window.scrollTo({ top: 120, behavior: 'smooth' });
      }, 800);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'KYC verification submission failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    if (!securityForm.primary_wallet_number.trim()) {
      setErrorMsg('Please enter your primary payout phone or bank account number.');
      return;
    }

    if (securityForm.pin) {
      if (securityForm.pin !== securityForm.confirm_pin) {
        setErrorMsg('PINs do not match. Please re-enter your 4-digit PIN.');
        return;
      }
      if (!/^\d{4}$/.test(securityForm.pin)) {
        setErrorMsg('PIN must be exactly 4 numeric digits.');
        return;
      }
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await configureWallets({
        primary_wallet_provider: securityForm.primary_wallet_provider,
        primary_wallet_number: securityForm.primary_wallet_number,
        bank_name: securityForm.bank_name,
        bank_account_number: securityForm.bank_account_number
      });

      if (securityForm.pin) {
        await setSecurityPIN(securityForm.pin);
      }

      await refreshProfile();
      triggerSuccess('Payout wallet and security settings updated successfully!');
      setSecurityForm(prev => ({ ...prev, pin: '', confirm_pin: '' }));
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to save payout settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (window.confirm('Are you sure you want to temporarily deactivate your account?')) {
      try {
        await deactivateAccount();
        triggerSuccess('Account deactivated.');
        setTimeout(logout, 1500);
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

  const isPersonalDone = Boolean(user.full_name && user.phone_number);
  const isKycDone = user.kyc_status === 'VERIFIED';
  const isSecurityDone = Boolean(user.primary_wallet_number && user.has_security_pin);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 animate-in fade-in duration-150">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft size={14} />
          <span>Back to Marketplace</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-2xl border border-slate-200">
            {user.points || 50} Points
          </span>
        </div>
      </div>

      {/* 👤 Clean User Header Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-600 text-white font-bold text-xl flex items-center justify-center shadow-xs overflow-hidden shrink-0">
              {user.avatar_url && !avatarError ? (
                <img 
                  src={user.avatar_url} 
                  alt={user.full_name} 
                  onError={() => setAvatarError(true)}
                  className="w-full h-full object-cover rounded-2xl" 
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
                {user.kyc_status === 'VERIFIED' ? (
                  <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck size={12} />
                    <span>Verified KYC</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                    KYC Pending
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                <span>{user.phone_number || 'No Phone Number Added'}</span>
                <span>•</span>
                <span>{user.momo_provider || 'MTN'} MoMo</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenReferralModal}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl border border-slate-200 cursor-pointer transition-colors"
            >
              Refer Friends
            </button>
          </div>

        </div>
      </div>

      {/* 🚀 3-Step Clean Progress Header */}
      <div className="bg-slate-100/70 rounded-2xl p-1.5 border border-slate-200">
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          
          <button
            onClick={() => setActiveTab('personal')}
            className={`py-2.5 px-3 rounded-xl text-left transition-all cursor-pointer ${
              activeTab === 'personal'
                ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-bold opacity-80 mb-0.5">
              <span>Step 1</span>
              {isPersonalDone && <Check size={12} className="text-emerald-600" />}
            </div>
            <div className="text-xs font-bold truncate">Personal Details</div>
          </button>

          <button
            onClick={() => setActiveTab('kyc')}
            className={`py-2.5 px-3 rounded-xl text-left transition-all cursor-pointer ${
              activeTab === 'kyc'
                ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-bold opacity-80 mb-0.5">
              <span>Step 2</span>
              {isKycDone && <Check size={12} className="text-emerald-600" />}
            </div>
            <div className="text-xs font-bold truncate">Ghana Card KYC</div>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`py-2.5 px-3 rounded-xl text-left transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-bold opacity-80 mb-0.5">
              <span>Step 3</span>
              {isSecurityDone && <Check size={12} className="text-emerald-600" />}
            </div>
            <div className="text-xs font-bold truncate">Payout & PIN</div>
          </button>

        </div>
      </div>

      {/* Success / Error Alerts */}
      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: PERSONAL & CONTACT DETAILS */}
      {activeTab === 'personal' && (
        <div className="bg-white rounded-3xl p-6 space-y-5 border border-slate-200 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">Personal & Contact Details</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Please enter your legal name and compulsory Ghanaian phone number.
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
                  Mobile Money Network
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
                {loading ? <Loader2 size={14} className="animate-spin" /> : <span>Save & Continue to KYC →</span>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: GHANA CARD KYC */}
      {activeTab === 'kyc' && (
        <div className="bg-white rounded-3xl p-6 space-y-5 border border-slate-200 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">Ghana Card KYC & Next of Kin</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Required for identity safety and rotational pot security.
            </p>
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
                  Next of Kin Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Next of Kin Legal Name"
                  value={kycForm.next_of_kin_name}
                  onChange={(e) => setKycForm({ ...kycForm, next_of_kin_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Next of Kin Phone Number <span className="text-red-500">*</span>
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
                  Relationship to Next of Kin
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

            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setActiveTab('personal')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl cursor-pointer border border-slate-200"
              >
                ← Back
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-2xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <span>Submit KYC & Continue →</span>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: PAYOUT WALLETS & 4-DIGIT PIN */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-3xl p-6 space-y-5 border border-slate-200 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">Payout Destination & 4-Digit Security PIN</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Set where your rotation lump sum will be sent, and set your 4-digit PIN for withdrawal authorization.
            </p>
          </div>

          <form onSubmit={handleSecuritySubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Payout Provider
                </label>
                <select
                  value={securityForm.primary_wallet_provider}
                  onChange={(e) => setSecurityForm({ ...securityForm, primary_wallet_provider: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="MTN">MTN Mobile Money (*170#)</option>
                  <option value="TELECEL">Telecel Cash (*110#)</option>
                  <option value="AT">AT Money (*110#)</option>
                  <option value="BANK">Bank Account</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payout Phone Number / Account <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="024 123 4567"
                  value={securityForm.primary_wallet_number}
                  onChange={(e) => setSecurityForm({ ...securityForm, primary_wallet_number: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {securityForm.primary_wallet_provider === 'BANK' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. GCB, Ecobank, Absa"
                      value={securityForm.bank_name}
                      onChange={(e) => setSecurityForm({ ...securityForm, bank_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bank Account Number</label>
                    <input
                      type="text"
                      placeholder="Account Number"
                      value={securityForm.bank_account_number}
                      onChange={(e) => setSecurityForm({ ...securityForm, bank_account_number: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-mono text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  4-Digit Security PIN {user.has_security_pin ? '(Change PIN)' : '(Create PIN)'}
                </label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  value={securityForm.pin}
                  onChange={(e) => setSecurityForm({ ...securityForm, pin: e.target.value.replace(/[^\d]/g, '') })}
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
                  value={securityForm.confirm_pin}
                  onChange={(e) => setSecurityForm({ ...securityForm, confirm_pin: e.target.value.replace(/[^\d]/g, '') })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-mono font-bold tracking-widest text-center text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setActiveTab('kyc')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl cursor-pointer border border-slate-200"
              >
                ← Back
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-2xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <span>Save Settings</span>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Account Support & Governance */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-slate-500">
          <button onClick={() => setIsFAQOpen(true)} className="hover:text-slate-900 cursor-pointer font-medium">
            FAQs & Help
          </button>
          <span>•</span>
          <button onClick={() => setIsRegulatoryOpen(true)} className="hover:text-slate-900 cursor-pointer font-medium">
            Legal & Compliance
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleDeactivate} className="text-amber-700 hover:underline cursor-pointer font-semibold">
            Deactivate
          </button>
          <span>•</span>
          <button onClick={() => setIsDeleteModalOpen(true)} className="text-red-600 hover:underline cursor-pointer font-semibold">
            Delete Account
          </button>
        </div>
      </div>

      <FAQModal isOpen={isFAQOpen} onClose={() => setIsFAQOpen(false)} />
      <RegulatoryModal isOpen={isRegulatoryOpen} onClose={() => setIsRegulatoryOpen(false)} />

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 border border-slate-200 shadow-2xl">
            <h3 className="text-sm font-bold text-red-600">Delete Account</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to permanently delete your SusuRow account? This cannot be undone.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer shadow-xs active:scale-95"
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
