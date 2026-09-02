import React, { useEffect, useState } from 'react';
import {
  X,
  Compass,
  Users,
  PlusCircle,
  Calculator,
  KeyRound,
  Gift,
  Share2,
  Copy,
  Check,
  Phone,
  ShieldCheck,
  Eye,
  LogOut,
  LogIn,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  Building2,
  FileText,
  User
} from 'lucide-react';
import { useUser } from '../context/UserContext';

export default function AppSidebar({
  isOpen,
  onClose,
  activeView,
  setActiveView,
  onOpenCreateModal,
  onOpenJoinCodeModal,
  onOpenCalculator,
  onOpenReferralModal,
  onOpenTermsModal
}) {
  const {
    user,
    isAuthenticated,
    logout,
    openAuthModal,
    isSeniorMode,
    toggleSeniorMode,
    referralCode
  } = useUser();

  const [copied, setCopied] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleCopyCode = () => {
    const shareUrl = `${window.location.origin}?ref=${referralCode}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const shareUrl = `${window.location.origin}?ref=${referralCode}`;
    const text = encodeURIComponent(
      `Hello! Join me on SusuRow to save together with zero loan interest.\n\nInvite Code: ${referralCode}\nJoin here: ${shareUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const getProviderBadge = (provider) => {
    switch (provider) {
      case 'MTN':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            MTN MoMo
          </span>
        );
      case 'TELECEL':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            Telecel Cash
          </span>
        );
      case 'AT':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            AT Money
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            Mobile Money
          </span>
        );
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-[85vw] max-w-sm bg-white border-r border-slate-200 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Application Menu"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-600 flex items-center justify-center text-white font-black text-xl shadow-xs">
              ₵
            </div>
            <div>
              <div className="font-bold text-lg tracking-tight text-slate-900 flex items-center gap-1">
                <span>Susu</span>
                <span className="text-sky-600">Row</span>
              </div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                By Coratech Global
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 shadow-xs"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* User Profile Card */}
          {isAuthenticated ? (
            <div 
              onClick={() => {
                setActiveView('profile');
                onClose();
              }}
              className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-3xl p-4 space-y-3 shadow-xs cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white font-bold text-lg flex items-center justify-center shadow-xs overflow-hidden">
                    {user?.avatar_url && !avatarError ? (
                      <img 
                        src={user.avatar_url} 
                        alt="" 
                        onError={() => setAvatarError(true)} 
                        className="w-full h-full object-cover rounded-2xl" 
                      />
                    ) : (
                      <span>
                        {user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '₵'}
                      </span>
                    )}
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white"></span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {user?.full_name || 'Ghana Saver'}
                  </h3>
                  <p className="text-xs font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                    <Phone size={11} className="text-slate-400" />
                    <span>{user?.phone_number}</span>
                  </p>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                {getProviderBadge(user?.momo_provider)}
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck size={12} />
                  <span>{user?.kyc_status === 'VERIFIED' ? 'Verified KYC' : 'Action Required'}</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-sky-50 border border-sky-100 text-slate-900 rounded-3xl p-5 text-center space-y-3 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900">Welcome to SusuRow</h3>
              <p className="text-xs text-slate-600">
                Join or start rotational savings groups with automated Ghana Mobile Money payouts.
              </p>
              <button
                onClick={() => {
                  onClose();
                  openAuthModal();
                }}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn size={15} />
                <span>Sign In / Register</span>
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1">
              Menu Navigation
            </div>

            <button
              onClick={() => {
                setActiveView('marketplace');
                onClose();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeView === 'marketplace'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-xl ${activeView === 'marketplace' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Compass size={16} />
                </div>
                <span>Explore Susu Groups</span>
              </div>
              <ChevronRight size={14} className="opacity-60" />
            </button>

            <button
              onClick={() => {
                if (!isAuthenticated) {
                  onClose();
                  openAuthModal();
                } else {
                  setActiveView('my-circles');
                  onClose();
                }
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeView === 'my-circles'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-xl ${activeView === 'my-circles' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Users size={16} />
                </div>
                <span>My Active Groups</span>
              </div>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                Active
              </span>
            </button>

            <button
              onClick={() => {
                if (!isAuthenticated) {
                  onClose();
                  openAuthModal();
                } else {
                  setActiveView('profile');
                  onClose();
                }
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeView === 'profile'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-xl ${activeView === 'profile' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <User size={16} />
                </div>
                <span>Profile, KYC & Wallets</span>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenCreateModal();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-xl bg-amber-100 text-amber-700">
                  <PlusCircle size={16} />
                </div>
                <span>Create New Group</span>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenCalculator();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-xl bg-slate-100 text-slate-600">
                  <Calculator size={16} />
                </div>
                <span>Cycle Pot Calculator</span>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenJoinCodeModal();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-xl bg-slate-100 text-slate-600">
                  <KeyRound size={16} />
                </div>
                <span>Enter Group Code</span>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </button>

            <button
              onClick={() => {
                onClose();
                if (onOpenTermsModal) onOpenTermsModal();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-xl bg-slate-100 text-slate-600">
                  <FileText size={16} />
                </div>
                <span>Terms & Compliance</span>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </button>
          </div>

          {/* 🎁 Floating Refer & Earn Card */}
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                  <Gift size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Refer & Earn</h4>
                  <p className="text-[10px] text-slate-600">Invite peers to save</p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                BONUS
              </span>
            </div>

            <div className="bg-white rounded-2xl p-2.5 border border-amber-100 flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400">Your Code</span>
                <div className="font-mono text-sm font-bold text-amber-700 tracking-wider">
                  {referralCode}
                </div>
              </div>

              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-slate-200"
              >
                {copied ? (
                  <>
                    <Check size={12} className="text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleWhatsAppShare}
                className="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-2xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <MessageCircle size={13} />
                <span>WhatsApp</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  if (onOpenReferralModal) onOpenReferralModal();
                }}
                className="py-2.5 px-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-2xl transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer"
              >
                <Share2 size={13} />
                <span>Details</span>
              </button>
            </div>
          </div>

          {/* Coratech Global Developer Info Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-3.5 space-y-1.5">
            <div className="flex items-center gap-2">
              <Building2 size={15} className="text-sky-600" />
              <span className="text-xs font-bold text-slate-900">Coratech Global</span>
            </div>
            <p className="text-[10px] text-slate-500">
              IT Support, Web Design, Custom Software & Digital FinTech Solutions.
            </p>
            <a
              href="https://coratechglobal.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-sky-600 hover:underline flex items-center justify-between pt-1"
            >
              <span>coratechglobal.com</span>
              <ExternalLink size={11} />
            </a>
          </div>

          {/* Senior / High-Legibility Mode Switch */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye size={15} className="text-sky-600" />
                <span className="text-xs font-bold text-slate-900">Large Text Mode</span>
              </div>
              <button
                onClick={toggleSeniorMode}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                  isSeniorMode ? 'bg-sky-600' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={isSeniorMode}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    isSeniorMode ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              Enlarges buttons and text for comfortable viewing.
            </p>
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-2">
          {isAuthenticated && (
            <button
              onClick={() => {
                onClose();
                logout();
              }}
              className="w-full py-2.5 px-3 rounded-2xl text-xs font-bold text-red-600 hover:bg-red-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          )}

          <div className="text-center text-[10px] text-slate-400 font-semibold">
            SusuRow • Developed by Coratech Global
          </div>
        </div>

      </aside>
    </>
  );
}
