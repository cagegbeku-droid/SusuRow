import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Check, 
  Clock, 
  Info,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export const NotificationsDropdown = ({ 
  isOpen, 
  onClose, 
  user,
  onNavigate 
}) => {
  const dropdownRef = useRef(null);

  const initialNotifications = [
    {
      id: 'notif-1',
      type: user?.is_verified ? 'VERIFIED' : 'KYC_PENDING',
      title: user?.is_verified ? 'Account Officially Verified' : 'Ghana Card Verification Needed',
      message: user?.is_verified 
        ? 'Your Ghana Card Tier-1 verification is active. You have full access to Susu circles and automated Mobile Money payouts.'
        : 'Please upload your Ghana Card details in your Profile to unlock high-capacity circles and priority disbursements.',
      category: 'Compliance',
      time: 'Just now',
      read: false,
      sender: 'SusuRow Compliance'
    },
    {
      id: 'notif-2',
      type: 'PAYOUT',
      title: 'Automated Payout Turn Scheduled',
      message: 'When it is your turn to receive the cycle pot, payouts disburse directly to your registered Mobile Money wallet.',
      category: 'Rotation',
      time: '1 hour ago',
      read: false,
      sender: 'SusuRow Rotation Engine'
    },
    {
      id: 'notif-3',
      type: 'PAYMENT',
      title: 'Round Contribution Protection',
      message: 'All circle deposits are 100% safeguarded under automated Bank of Ghana tiered escrow underwriting.',
      category: 'Escrow',
      time: 'Today',
      read: false,
      sender: 'SusuRow Escrow'
    },
    {
      id: 'notif-4',
      type: 'UPDATE',
      title: 'Platform Update: Instant Settlements',
      message: 'SusuRow upgraded to full-width segmented navigation (Group Rotation, Rotation Cycle, Payments) with instant MoMo prompt settlements.',
      category: 'Update',
      time: 'Yesterday',
      read: true,
      sender: 'SusuRow Organization'
    }
  ];

  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'UNREAD'

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markItemAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? ({ ...n, read: true }) : n));
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = filter === 'UNREAD' 
    ? notifications.filter(n => !n.read) 
    : notifications;

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <Bell size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">Notifications</h3>
            <p className="text-[10px] text-slate-500 font-medium">SusuRow Official Alerts</p>
          </div>
          {unreadCount > 0 && (
            <span className="ml-1 text-[10px] font-black bg-sky-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
              {unreadCount} New
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[11px] font-bold text-sky-600 hover:text-sky-700 px-2 py-1 rounded-lg hover:bg-sky-50 transition-colors cursor-pointer"
            >
              Mark read
            </button>
          )}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="px-4 py-2 border-b border-slate-100 bg-white flex items-center gap-2 text-xs">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
            filter === 'ALL'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
            filter === 'UNREAD'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 bg-white">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Bell size={24} className="text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-800">No new notifications</p>
            <p className="text-[11px] text-slate-500">You are all caught up with your Susu groups and account updates.</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div 
              key={notif.id}
              onClick={() => markItemAsRead(notif.id)}
              className={`p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3 relative cursor-pointer ${
                !notif.read ? 'bg-sky-50/30' : ''
              }`}
            >
              {/* Icon */}
              <div className="mt-0.5 shrink-0">
                {notif.type === 'VERIFIED' && (
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-2xs">
                    <ShieldCheck size={16} />
                  </div>
                )}
                {notif.type === 'KYC_PENDING' && (
                  <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shadow-2xs">
                    <AlertCircle size={16} />
                  </div>
                )}
                {notif.type === 'PAYOUT' && (
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-2xs">
                    <Sparkles size={16} />
                  </div>
                )}
                {notif.type === 'PAYMENT' && (
                  <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center shadow-2xs">
                    <CheckCircle2 size={16} />
                  </div>
                )}
                {notif.type === 'UPDATE' && (
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shadow-2xs">
                    <Bell size={16} />
                  </div>
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 truncate">{notif.title}</span>
                  {!notif.read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed font-medium">
                  {notif.message}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-medium">
                  <span>{notif.sender}</span>
                  <span>•</span>
                  <span>{notif.time}</span>
                </div>
              </div>

              {/* Dismiss X button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeNotification(notif.id);
                }}
                className="text-slate-300 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                title="Dismiss notification"
              >
                <X size={12} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
        <span className="text-[10px] font-bold text-slate-500">
          SusuRow Automated Ghana Mobile Money ROSCA
        </span>
      </div>
    </div>
  );
};
