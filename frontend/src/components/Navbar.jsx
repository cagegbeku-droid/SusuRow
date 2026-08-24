import React, { useState } from 'react';
import {
  Menu,
  PlusCircle,
  Users,
  LogIn,
  LogOut,
  ChevronDown,
  KeyRound,
  Calculator,
  Gift,
  User,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useUser } from '../context/UserContext';

export default function Navbar({
  activeView,
  setActiveView,
  onToggleSidebar,
  onOpenCreateModal,
  onOpenJoinCodeModal,
  onOpenCalculator,
  onOpenReferralModal
}) {
  const { user, isAuthenticated, logout, openAuthModal } = useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getProviderBadge = (provider) => {
    switch (provider) {
      case 'MTN':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 font-black border border-yellow-400/30">MTN</span>;
      case 'TELECEL':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-black border border-red-500/30">Telecel</span>;
      case 'AT':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-black border border-blue-500/30">AT</span>;
      default:
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white font-bold">MoMo</span>;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full max-w-full bg-[#080B11]/90 backdrop-blur-xl border-b border-white/[0.07] text-white">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-18">
          
          {/* Left: Sidebar Toggle + Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <button
              onClick={onToggleSidebar}
              className="p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-[#141A2D] hover:bg-[#1C233A] border border-white/5 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center shadow-sm"
              aria-label="Open App Menu"
            >
              <Menu size={18} />
            </button>

            {/* Logo */}
            <div
              onClick={() => setActiveView('marketplace')}
              className="flex items-center gap-2 cursor-pointer select-none group"
            >
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-base sm:text-lg shadow-[0_0_15px_rgba(59,130,246,0.5)] group-hover:scale-105 transition-transform">
                ₵
              </div>
              <div className="font-black text-base sm:text-xl tracking-tight text-white">
                Susu<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-amber-400">Row</span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1 text-xs font-bold ml-6 bg-[#141A2D]/80 p-1 rounded-2xl border border-white/5">
              <button
                onClick={() => setActiveView('marketplace')}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                  activeView === 'marketplace'
                    ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                All Groups
              </button>

              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    openAuthModal();
                  } else {
                    setActiveView('my-circles');
                  }
                }}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                  activeView === 'my-circles'
                    ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                My Groups
              </button>

              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    openAuthModal();
                  } else {
                    setActiveView('profile');
                  }
                }}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                  activeView === 'profile'
                    ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Profile & KYC
              </button>

              <button
                onClick={onOpenCalculator}
                className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Calculator size={14} className="text-amber-400" />
                <span>Calculator</span>
              </button>
            </nav>
          </div>

          {/* Right: Actions & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Refer & Earn Button */}
            <button
              onClick={onOpenReferralModal}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold bg-gradient-to-r from-amber-500/15 to-gold-500/20 text-amber-300 border border-amber-500/30 hover:border-amber-400/60 transition-all cursor-pointer shadow-xs"
            >
              <Gift size={14} className="text-amber-400" />
              <span>Refer & Earn</span>
            </button>

            {/* Code Join */}
            <button
              onClick={onOpenJoinCodeModal}
              className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold bg-[#141A2D] hover:bg-[#1C233A] text-slate-300 border border-white/5 transition-all cursor-pointer"
            >
              <KeyRound size={13} className="text-blue-400" />
              <span>Group Code</span>
            </button>

            {/* Create Group Button */}
            <button
              onClick={onOpenCreateModal}
              className="hidden sm:flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-2xl text-xs font-black bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all cursor-pointer active:scale-95"
            >
              <PlusCircle size={15} />
              <span>New Group</span>
            </button>

            {/* User Profile / Sign In */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 p-1 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl bg-[#141A2D] hover:bg-[#1C233A] border border-white/10 text-left transition-all cursor-pointer shadow-xs"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shadow">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : user?.full_name ? (
                      user.full_name.charAt(0).toUpperCase()
                    ) : (
                      '₵'
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold text-white truncate max-w-[110px]">
                      {user?.full_name || 'Saver'}
                    </div>
                  </div>
                  <ChevronDown size={13} className="text-slate-400 hidden sm:block" />
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-60 rounded-2xl sm:rounded-3xl bg-[#141A2D] text-slate-200 shadow-2xl border border-white/10 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <div className="px-4 py-3 border-b border-white/5 bg-[#0E1322] rounded-t-2xl sm:rounded-t-3xl">
                      <p className="text-xs font-black text-white truncate">{user?.full_name}</p>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">{user?.phone_number}</p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        {getProviderBadge(user?.momo_provider)}
                        <span className="text-[9px] font-bold bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded-full border border-amber-400/30">
                          {user?.points || 50} pts
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveView('profile')}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <User size={15} className="text-blue-400" />
                      <span>Profile & KYC Status</span>
                    </button>

                    <button
                      onClick={() => setActiveView('my-circles')}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <Users size={15} className="text-indigo-400" />
                      <span>My Susu Groups</span>
                    </button>

                    <button
                      onClick={onOpenReferralModal}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <Gift size={15} className="text-amber-400" />
                      <span>Referral Hub</span>
                    </button>

                    <button
                      onClick={logout}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 border-t border-white/5 cursor-pointer transition-colors"
                    >
                      <LogOut size={15} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all cursor-pointer shrink-0"
              >
                <LogIn size={13} className="text-amber-400" />
                <span>Sign In</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
