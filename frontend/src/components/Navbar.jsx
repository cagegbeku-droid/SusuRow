import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Bell,
  LogIn,
  LogOut,
  User,
  Users,
  Gift,
  PlusCircle,
  ChevronDown,
  Settings as SettingsIcon
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { NotificationsDropdown } from './NotificationsDropdown';

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
  const [notifOpen, setNotifOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatar_url, user?.profile_image_url, user?.picture]);

  // Notifications State: Clean production default is empty array (zero mock data)
  const [notifications, setNotifications] = useState([]);
  const [readNotifIds, setReadNotifIds] = useState(() => {
    try {
      // Clean out any legacy mock notification IDs
      const saved = localStorage.getItem('susurow_read_notifs');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.filter(id => !id.startsWith('notif-')) : [];
      }
      return [];
    } catch (e) {
      return [];
    }
  });

  // Sync real user alerts if user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setNotifications([]);
      return;
    }

    // Load persisted real notifications for this user
    let userNotifs = [];
    try {
      const saved = localStorage.getItem(`susurow_user_notifications_${user.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Exclude any legacy mock items
          userNotifs = parsed.filter(n => !n.id?.startsWith('notif-'));
        }
      }
    } catch (e) {}

    // If user is verified, add a real compliance confirmation alert if not already logged
    if (user.kyc_status === 'VERIFIED') {
      const verifiedId = `kyc-verified-${user.id}`;
      if (!userNotifs.some(n => n.id === verifiedId)) {
        userNotifs.unshift({
          id: verifiedId,
          type: 'VERIFIED',
          title: 'Ghana Card Officially Verified',
          message: `Hello ${user.full_name?.trim() || 'Saver'}, your Ghana Card Tier-1 verification is confirmed active. You have full access to Susu groups and automated Mobile Money payouts.`,
          category: 'Compliance',
          time: 'Active',
          sender: 'SusuRow Compliance'
        });
      }
    }

    setNotifications(userNotifs);
  }, [user?.id, user?.kyc_status, user?.full_name, isAuthenticated]);

  // Real-time listener for app events (payment verified, payout scheduled, circle joined)
  useEffect(() => {
    const handleNewNotif = (event) => {
      if (!event.detail) return;
      const notif = event.detail;
      setNotifications(prev => {
        const updated = [notif, ...prev.filter(n => n.id !== notif.id)];
        if (user?.id) {
          try {
            localStorage.setItem(`susurow_user_notifications_${user.id}`, JSON.stringify(updated));
          } catch (e) {}
        }
        return updated;
      });
    };

    window.addEventListener('susurow_new_notification', handleNewNotif);
    return () => window.removeEventListener('susurow_new_notification', handleNewNotif);
  }, [user?.id]);

  const unreadCount = notifications.filter(n => !readNotifIds.includes(n.id)).length;

  const handleMarkRead = (id) => {
    setReadNotifIds(prev => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        localStorage.setItem('susurow_read_notifs', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleMarkAllRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadNotifIds(allIds);
    try {
      localStorage.setItem('susurow_read_notifs', JSON.stringify(allIds));
    } catch (e) {}
  };

  const handleDismissNotif = (id) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      if (user?.id) {
        try {
          localStorage.setItem(`susurow_user_notifications_${user.id}`, JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });
  };

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [dropdownOpen]);

  const getFirstName = () => {
    if (!user?.full_name) return 'Saver';
    return user.full_name.trim().split(' ')[0];
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 shadow-xs">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        
        {/* Left: User Greeting or Brand */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Open App Menu"
            >
              <Menu size={20} />
            </button>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-sky-600 flex items-center justify-center text-white font-black text-xs shadow-xs">
              SR
            </div>
          )}

          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {isAuthenticated ? `Hi, ${getFirstName()}` : 'SusuRow'}
            </h1>
            {isAuthenticated ? (
              <div className="text-xs text-slate-500 font-medium">
                {user?.phone_number || 'Ghana Saver'}
              </div>
            ) : (
              <div className="text-[11px] text-slate-500 font-medium">
                Digital Susu Rotations
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Authenticated Only: Notifications, Settings Gear, and User Profile Menu */}
          {isAuthenticated ? (
            <>
              {/* Notifications Button (🔔 with interactive dropdown) */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(prev => !prev)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 relative"
                  title="Notifications"
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-sky-600 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white leading-none">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                <NotificationsDropdown
                  isOpen={notifOpen}
                  onClose={() => setNotifOpen(false)}
                  user={user}
                  notifications={notifications}
                  readNotifIds={readNotifIds}
                  onMarkRead={handleMarkRead}
                  onMarkAllRead={handleMarkAllRead}
                  onDismiss={handleDismissNotif}
                  unreadCount={unreadCount}
                  onNavigate={(view) => {
                    setNotifOpen(false);
                    setActiveView(view);
                  }}
                />
              </div>

              {/* Settings & Support Gear Button (⚙️) */}
              <button
                onClick={() => setActiveView('settings')}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer border ${
                  activeView === 'settings'
                    ? 'bg-sky-50 border-sky-300 text-sky-600'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
                title="Settings & Support"
                aria-label="Settings and Support"
              >
                <SettingsIcon size={18} />
              </button>

              {/* User Profile Avatar */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(prev => !prev)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
                  aria-label="User Profile Menu"
                >
                  {(user?.avatar_url || user?.profile_image_url || user?.picture) && !avatarError ? (
                    <img
                      src={user.avatar_url || user.profile_image_url || user.picture}
                      alt={user.full_name || 'Profile'}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                      {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'S'}
                    </div>
                  )}
                  <ChevronDown size={14} className="text-slate-400 mr-1 hidden sm:inline" />
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-60 rounded-2xl bg-white text-slate-800 shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2.5">
                      {(user?.avatar_url || user?.profile_image_url || user?.picture) && (
                        <img
                          src={user.avatar_url || user.profile_image_url || user.picture}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{user?.full_name}</p>
                        <p className="text-[11px] font-mono text-slate-500 mt-0.5 truncate">{user?.phone_number || user?.email}</p>
                      </div>
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
                      onClick={() => setActiveView('settings')}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <SettingsIcon size={15} className="text-sky-600" />
                      <span>Settings & Support</span>
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
            </>
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
