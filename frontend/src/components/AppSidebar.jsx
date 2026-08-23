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
  Sparkles,
  Building2,
  FileText
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
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
            MTN MoMo
          </span>
        );
      case 'TELECEL':
        return (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
            Telecel Cash
          </span>
        );
      case 'AT':
        return (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            AT Money
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
            MoMo Wallet
          </span>
        );
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-[#04060A]/80 backdrop-blur-md transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-[85vw] max-w-sm bg-[#0E1322] border-r border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col transition-transform duration-300 ease-in-out transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Application Menu"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-[#141A2D]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              ₵
            </div>
            <div>
              <div className="font-black text-lg tracking-tight text-white flex items-center gap-1">
                <span>Susu</span>
                <span className="text-amber-400">Row</span>
              </div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                By Coratech Global
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-[#141A2D] hover:bg-[#1C233A] text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/5"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* User Profile Card */}
          {isAuthenticated ? (
            <div className="bg-[#141A2D] border border-white/10 rounded-3xl p-4 space-y-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 font-black text-xl flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                    {user?.full_name ? user.full_name.charAt(0).toUpperCase() : '₵'}
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#141A2D]"></span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">
                    {user?.full_name || 'Ghana Saver'}
                  </h3>
                  <p className="text-xs font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                    <Phone size={11} className="text-slate-500" />
                    <span>{user?.phone_number}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                {getProviderBadge(user?.momo_provider)}
                <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <ShieldCheck size={12} />
                  <span>Verified Saver</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-blue-900/40 via-indigo-900/30 to-[#141A2D] border border-blue-500/30 text-white rounded-3xl p-5 text-center space-y-3 shadow-lg">
              <h3 className="text-sm font-black">Welcome to SusuRow</h3>
              <p className="text-xs text-slate-300">
                Join or start rotational savings groups with automated Ghana Mobile Money payouts.
              </p>
              <button
                onClick={() => {
                  onClose();
                  openAuthModal();
                }}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn size={15} />
                <span>Sign In / Register</span>
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-3 mb-1">
              Menu Navigation
            </div>

            <button
              onClick={() => {
                setActiveView('marketplace');
                onClose();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeView === 'marketplace'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 font-black'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-xl ${activeView === 'marketplace' ? 'bg-white/20 text-white' : 'bg-[#141A2D] text-slate-400'}`}>
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
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeView === 'my-circles'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 font-black'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-xl ${activeView === 'my-circles' ? 'bg-white/20 text-white' : 'bg-[#141A2D] text-slate-400'}`}>
                  <Users size={16} />
                </div>
                <span>My Active Groups</span>
              </div>
              <span className="text-[10px] font-black bg-white/20 text-white px-2 py-0.5 rounded-full">
                Active
              </span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenCreateModal();
              }}
              className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400">
                  <PlusCircle size={16} />
                </div>
                <span>Create New Group</span>
              </div>
              <ChevronRight size={14} className="text-slate-500" />
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenCalculator();
              }}
              className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-xl bg-[#141A2D] text-slate-400">
                  <Calculator size={16} />
                </div>
                <span>Cycle Pot Calculator</span>
              </div>
              <ChevronRight size={14} className="text-slate-500" />
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenJoinCodeModal();
              }}
              className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-xl bg-[#141A2D] text-slate-400">
                  <KeyRound size={16} />
                </div>
                <span>Enter Group Code</span>
              </div>
              <ChevronRight size={14} className="text-slate-500" />
            </button>

            <button
              onClick={() => {
                onClose();
                if (onOpenTermsModal) onOpenTermsModal();
              }}
              className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-xl bg-[#141A2D] text-slate-400">
                  <FileText size={16} />
                </div>
                <span>Terms & Compliance</span>
              </div>
              <ChevronRight size={14} className="text-slate-500" />
            </button>
          </div>

          {/* 🎁 Floating Refer & Earn Card */}
          <div className="bg-gradient-to-br from-blue-600/20 via-indigo-600/30 to-[#141A2D] border border-blue-500/30 rounded-3xl p-4 space-y-3 relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                  <Gift size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Refer & Earn</h4>
                  <p className="text-[10px] text-slate-300">Invite peers to save</p>
                </div>
              </div>
              <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full shadow">
                BONUS
              </span>
            </div>

            <div className="bg-[#0E1322] rounded-2xl p-2.5 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400">Your Code</span>
                <div className="font-mono text-sm font-black text-amber-400 tracking-wider">
                  {referralCode}
                </div>
              </div>

              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-xl bg-[#141A2D] hover:bg-[#1C233A] text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-white/10"
              >
                {copied ? (
                  <>
                    <Check size={12} className="text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
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
                className="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-2xl transition-all flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-pointer"
              >
                <MessageCircle size={13} />
                <span>WhatsApp</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  if (onOpenReferralModal) onOpenReferralModal();
                }}
                className="py-2.5 px-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] rounded-2xl transition-all flex items-center justify-center gap-1 shadow-[0_0_12px_rgba(59,130,246,0.3)] cursor-pointer"
              >
                <Share2 size={13} />
                <span>Details</span>
              </button>
            </div>
          </div>

          {/* Coratech Global Developer Info Card */}
          <div className="bg-[#141A2D] border border-blue-500/20 rounded-3xl p-3.5 space-y-2">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-blue-400" />
              <span className="text-xs font-bold text-white">Coratech Global</span>
            </div>
            <p className="text-[10px] text-slate-400">
              IT Support, Web Design, Custom Software & Digital FinTech Solutions.
            </p>
            <a
              href="https://coratechglobal.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-blue-400 hover:underline flex items-center justify-between pt-1"
            >
              <span>coratechglobal.com</span>
              <ExternalLink size={11} />
            </a>
          </div>

          {/* Senior / High-Legibility Mode Switch */}
          <div className="bg-[#141A2D] border border-white/5 rounded-3xl p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-blue-400" />
                <span className="text-xs font-bold text-white">Large Text Mode</span>
              </div>
              <button
                onClick={toggleSeniorMode}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                  isSeniorMode ? 'bg-blue-600' : 'bg-slate-700'
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
            <p className="text-[10px] text-slate-400">
              Enlarges buttons and text for comfortable viewing.
            </p>
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-white/5 bg-[#0A0E1A] space-y-2">
          {isAuthenticated && (
            <button
              onClick={() => {
                onClose();
                logout();
              }}
              className="w-full py-2.5 px-3 rounded-2xl text-xs font-bold text-red-400 hover:bg-red-500/10 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          )}

          <div className="text-center text-[10px] text-slate-500 font-semibold">
            SusuRow • Developed by Coratech Global
          </div>
        </div>

      </aside>
    </>
  );
}
