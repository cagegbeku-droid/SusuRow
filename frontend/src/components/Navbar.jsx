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
  Gift
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
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-300 font-bold border border-yellow-400/40">MTN</span>;
      case 'TELECEL':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-400/20 text-red-200 font-bold border border-red-400/40">Telecel</span>;
      case 'AT':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-400/20 text-blue-200 font-bold border border-blue-400/40">AT</span>;
      default:
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 text-white font-bold">MoMo</span>;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-primary-900 text-white shadow border-b border-primary-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Sidebar Toggle + Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={onToggleSidebar}
              className="p-2 -ml-1 rounded-xl text-primary-100 hover:text-white hover:bg-primary-800 transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Open App Menu"
            >
              <Menu size={22} />
            </button>

            {/* Logo */}
            <div
              onClick={() => setActiveView('marketplace')}
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gold-500 flex items-center justify-center text-primary-950 font-black text-lg shadow">
                ₵
              </div>
              <div className="font-black text-lg sm:text-xl tracking-tight text-white">
                Susu<span className="text-gold-400">Row</span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1 text-xs font-bold ml-4">
              <button
                onClick={() => setActiveView('marketplace')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeView === 'marketplace'
                    ? 'bg-primary-800 text-gold-300 font-bold'
                    : 'text-primary-200 hover:text-white hover:bg-primary-800/50'
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
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeView === 'my-circles'
                    ? 'bg-primary-800 text-gold-300 font-bold'
                    : 'text-primary-200 hover:text-white hover:bg-primary-800/50'
                }`}
              >
                My Groups
              </button>

              <button
                onClick={onOpenCalculator}
                className="px-3 py-1.5 rounded-lg text-primary-200 hover:text-white hover:bg-primary-800/50 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Calculator size={13} className="text-gold-400" />
                <span>Cycle Calculator</span>
              </button>
            </nav>
          </div>

          {/* Right: Actions & User Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Refer Button */}
            <button
              onClick={onOpenReferralModal}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500/20 to-gold-500/30 text-gold-300 border border-gold-400/40 hover:bg-gold-500/30 transition-all cursor-pointer"
            >
              <Gift size={14} className="text-gold-400" />
              <span className="hidden sm:inline">Refer & Earn</span>
              <span className="sm:hidden font-black">Refer</span>
            </button>

            {/* Enter Code */}
            <button
              onClick={onOpenJoinCodeModal}
              className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary-800 hover:bg-primary-700 text-primary-100 border border-primary-700 transition-colors cursor-pointer"
            >
              <KeyRound size={13} className="text-gold-400" />
              <span>Group Code</span>
            </button>

            {/* Create Group */}
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-1 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-black bg-gold-500 hover:bg-gold-400 text-slate-950 shadow transition-all cursor-pointer"
            >
              <PlusCircle size={14} />
              <span className="hidden sm:inline">New Group</span>
              <span className="sm:hidden">New</span>
            </button>

            {/* User Profile */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-primary-800 hover:bg-primary-700 border border-primary-700 text-left transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-gold-400 text-primary-950 font-bold flex items-center justify-center text-xs">
                    {user?.full_name ? user.full_name.charAt(0).toUpperCase() : '₵'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold text-white truncate max-w-[100px]">
                      {user?.full_name || 'Saver'}
                    </div>
                  </div>
                  <ChevronDown size={13} className="text-primary-300 hidden sm:block" />
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-white text-slate-800 shadow-2xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
                      <p className="text-xs font-bold text-slate-900">{user?.full_name}</p>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">{user?.phone_number}</p>
                      <div className="mt-1">{getProviderBadge(user?.momo_provider)}</div>
                    </div>

                    <button
                      onClick={() => setActiveView('my-circles')}
                      className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Users size={14} className="text-primary-700" />
                      <span>My Groups</span>
                    </button>

                    <button
                      onClick={onOpenReferralModal}
                      className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Gift size={14} className="text-gold-600" />
                      <span>Referral Hub</span>
                    </button>

                    <button
                      onClick={logout}
                      className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100 cursor-pointer"
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
              >
                <LogIn size={13} className="text-gold-400" />
                <span>Sign In</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
