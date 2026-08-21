import React, { useEffect, useState } from 'react';
import {
  X,
  Home,
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
  MessageCircle
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
  onOpenReferralModal
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
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-400 text-slate-950 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-950"></span>
            MTN MoMo
          </span>
        );
      case 'TELECEL':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-600 text-white flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            Telecel Cash
          </span>
        );
      case 'AT':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-600 text-white flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            AT Money
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
            MoMo Wallet
          </span>
        );
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-[85vw] max-w-sm bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Application Menu"
      >
        {/* Drawer Header */}
        <div className="bg-primary-900 text-white p-5 border-b border-primary-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gold-500 flex items-center justify-center text-primary-950 font-black text-lg shadow">
              ₵
            </div>
            <div>
              <div className="font-black text-lg tracking-tight text-white flex items-center gap-1.5">
                <span>Susu</span>
                <span className="text-gold-400">Row</span>
              </div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-primary-200">
                Digital Susu • Ghana
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-primary-800 hover:bg-primary-700 text-primary-100 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* User Profile Card */}
          {isAuthenticated ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary-800 text-gold-300 font-black text-lg flex items-center justify-center shadow-inner">
                  {user?.full_name ? user.full_name.charAt(0).toUpperCase() : '₵'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {user?.full_name || 'Ghana Saver'}
                  </h3>
                  <p className="text-xs font-mono text-slate-500 flex items-center gap-1">
                    <Phone size={11} className="text-slate-400" />
                    <span>{user?.phone_number}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                {getProviderBadge(user?.momo_provider)}
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <ShieldCheck size={12} />
                  <span>Verified</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-primary-900 to-primary-950 text-white rounded-2xl p-4 text-center space-y-2.5">
              <h3 className="text-sm font-bold">Welcome to SusuRow</h3>
              <p className="text-xs text-primary-200">
                Sign in to create or join savings groups.
              </p>
              <button
                onClick={() => {
                  onClose();
                  openAuthModal();
                }}
                className="w-full py-2.5 px-4 bg-gold-500 hover:bg-gold-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn size={14} />
                <span>Sign In with Phone</span>
              </button>
            </div>
          )}

          {/* Core Navigation */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1">
              Menu
            </div>

            <button
              onClick={() => {
                setActiveView('marketplace');
                onClose();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-colors cursor-pointer ${
                activeView === 'marketplace'
                  ? 'bg-primary-50 text-primary-900 border border-primary-200'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-xl ${activeView === 'marketplace' ? 'bg-primary-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Home size={15} />
                </div>
                <span>All Susu Groups</span>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
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
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-colors cursor-pointer ${
                activeView === 'my-circles'
                  ? 'bg-primary-50 text-primary-900 border border-primary-200'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-xl ${activeView === 'my-circles' ? 'bg-primary-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Users size={15} />
                </div>
                <span>My Groups & Cycles</span>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenCreateModal();
              }}
              className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-xl bg-gold-100 text-gold-900">
                  <PlusCircle size={15} />
                </div>
                <span>Create Susu Group</span>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenCalculator();
              }}
              className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-xl bg-slate-100 text-slate-600">
                  <Calculator size={15} />
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
              className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-xl bg-slate-100 text-slate-600">
                  <KeyRound size={15} />
                </div>
                <span>Enter Group Code</span>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </button>
          </div>

          {/* 🎁 Referral Hub */}
          <div className="bg-gradient-to-br from-amber-500/10 via-gold-500/15 to-primary-900/10 border-2 border-gold-400/50 rounded-2xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gold-500 text-slate-950 flex items-center justify-center shadow">
                  <Gift size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Refer & Earn</h4>
                  <p className="text-[10px] text-slate-600">Invite peers to save</p>
                </div>
              </div>
              <span className="text-[10px] font-black bg-gold-400 text-slate-950 px-2 py-0.5 rounded-full">
                BONUS
              </span>
            </div>

            <div className="bg-white rounded-xl p-2.5 border border-gold-300 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500">Your Code</span>
                <div className="font-mono text-sm font-black text-slate-900 tracking-wider">
                  {referralCode}
                </div>
              </div>

              <button
                onClick={handleCopyCode}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check size={12} className="text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
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
                className="py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-xl transition-all flex items-center justify-center gap-1.5 shadow cursor-pointer"
              >
                <MessageCircle size={13} />
                <span>WhatsApp</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  if (onOpenReferralModal) onOpenReferralModal();
                }}
                className="py-2 px-2.5 bg-primary-800 hover:bg-primary-900 text-white font-bold text-[11px] rounded-xl transition-all flex items-center justify-center gap-1 shadow cursor-pointer"
              >
                <Share2 size={13} />
                <span>Details</span>
              </button>
            </div>
          </div>

          {/* Large Text / Accessibility */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye size={15} className="text-primary-800" />
                <span className="text-xs font-bold text-slate-800">Clear / Large Text</span>
              </div>
              <button
                onClick={toggleSeniorMode}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                  isSeniorMode ? 'bg-emerald-700' : 'bg-slate-300'
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
              Enlarges text and buttons for easy reading.
            </p>
          </div>

          {/* WhatsApp Direct Support */}
          <div>
            <a
              href="https://wa.me/233248355112?text=Hello%20SusuRow%20Support,%20I%20need%20assistance"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-3.5 rounded-2xl border border-slate-200 bg-white text-slate-700 text-xs font-bold flex items-center justify-between transition-colors shadow-xs"
            >
              <div className="flex items-center gap-2">
                <MessageCircle size={15} className="text-emerald-600" />
                <span>WhatsApp Customer Help</span>
              </div>
              <ExternalLink size={12} className="text-slate-400" />
            </a>
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2">
          {isAuthenticated && (
            <button
              onClick={() => {
                onClose();
                logout();
              }}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          )}

          <div className="text-center text-[10px] text-slate-400 font-semibold">
            SusuRow • Bank of Ghana Security Standards
          </div>
        </div>

      </aside>
    </>
  );
}
