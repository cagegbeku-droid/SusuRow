import React, { useState } from 'react';
import {
  Menu,
  HelpCircle,
  Bell,
  MessageCircle,
  LogIn,
  LogOut,
  User,
  Users,
  Gift,
  PlusCircle,
  ChevronDown
} from 'lucide-react';
import { useUser } from '../context/UserContext';

export default function Navbar({
  activeView,
  setActiveView,
  onToggleSidebar,
  onOpenCreateModal,
  onOpenReferralModal,
  onOpenFAQModal
}) {
  const { user, isAuthenticated, logout, openAuthModal } = useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const getFirstName = () => {
    if (!user?.full_name) return 'Saver';
    return user.full_name.trim().split(' ')[0];
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 shadow-xs">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        
        {/* Left: User Greeting (Clean & Simple) */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Open App Menu"
          >
            <Menu size={20} />
          </button>

          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {isAuthenticated ? `Hi, ${getFirstName()}` : 'Welcome to SusuRow'}
            </h1>
            <div className="text-xs text-slate-500 font-medium">
              {isAuthenticated ? (user?.phone_number || 'Rotational Savings Member') : 'Rotational Savings Platform'}
            </div>
          </div>
        </div>

        {/* Right: Actions (Help ?, Bell 🔔, Chat 💬, Profile) */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Help Button (?) */}
          <button
            onClick={onOpenFAQModal}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer border border-slate-200"
            title="Help & FAQs"
            aria-label="Help"
          >
            <HelpCircle size={18} />
          </button>

          {/* Notifications Button (🔔 - Clean without fake red badge) */}
          <button
            onClick={() => {
              if (!isAuthenticated) openAuthModal();
              else setActiveView('my-circles');
            }}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer border border-slate-200"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell size={18} />
          </button>

          {/* Chat Button (💬) */}
          <button
            onClick={() => {
              if (!isAuthenticated) openAuthModal();
              else setActiveView('my-circles');
            }}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer border border-slate-200"
            title="Chat & Support"
            aria-label="Chat"
          >
            <MessageCircle size={18} />
          </button>

          {/* User Profile Thumbnail or Sign In */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-9 h-9 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center text-xs shadow-xs overflow-hidden cursor-pointer ring-2 ring-slate-100 hover:ring-sky-200 transition-all"
              >
                {user?.avatar_url && !avatarError ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    onError={() => setAvatarError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{user.full_name ? user.full_name.charAt(0).toUpperCase() : 'C'}</span>
                )}
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-white text-slate-800 shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setDropdownOpen(false)}
                >
                  <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                    <p className="text-xs font-bold text-slate-900 truncate">{user?.full_name}</p>
                    <p className="text-[11px] font-mono text-slate-500 mt-0.5">{user?.phone_number || user?.email}</p>
                  </div>

                  <button
                    onClick={() => setActiveView('profile')}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <User size={15} className="text-sky-600" />
                    <span>My Profile & Wallets</span>
                  </button>

                  <button
                    onClick={() => setActiveView('my-circles')}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Users size={15} className="text-emerald-600" />
                    <span>My Susu Groups</span>
                  </button>

                  <button
                    onClick={onOpenReferralModal}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Gift size={15} className="text-amber-500" />
                    <span>Refer Friends</span>
                  </button>

                  <button
                    onClick={logout}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100 cursor-pointer transition-colors"
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
              className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <LogIn size={14} />
              <span>Sign In</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
