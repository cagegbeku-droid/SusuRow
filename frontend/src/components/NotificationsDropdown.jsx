import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ChevronDown,
  ArrowRight
} from 'lucide-react';

export const NotificationsDropdown = ({ 
  isOpen, 
  onClose, 
  user,
  notifications = [],
  readNotifIds = [],
  onMarkRead,
  onMarkAllRead,
  onDismiss,
  unreadCount = 0,
  onNavigate 
}) => {
  const dropdownRef = useRef(null);
  const [expandedId, setExpandedId] = useState(null);

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

  if (!isOpen) return null;

  const handleTopicClick = (notifId) => {
    setExpandedId(prev => (prev === notifId ? null : notifId));
    if (onMarkRead && !readNotifIds.includes(notifId)) {
      onMarkRead(notifId);
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'VERIFIED':
        return (
          <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 shadow-2xs">
            <ShieldCheck size={14} />
          </div>
        );
      case 'KYC_PENDING':
        return (
          <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0 shadow-2xs">
            <AlertCircle size={14} />
          </div>
        );
      case 'PAYOUT':
        return (
          <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles size={14} />
          </div>
        );
      case 'PAYMENT':
        return (
          <div className="w-7 h-7 rounded-full bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center shrink-0 shadow-2xs">
            <CheckCircle2 size={14} />
          </div>
        );
      default:
        return (
          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
            <Bell size={14} />
          </div>
        );
    }
  };

  return (
    <div 
      ref={dropdownRef}
      className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-12 sm:w-96 max-w-sm sm:max-w-none mx-auto sm:mx-0 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header (Clean: Notifications + Mark Read + Close) */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <Bell size={16} />
          </div>
          <h3 className="text-sm font-bold text-slate-900 leading-tight">Notifications</h3>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && onMarkAllRead && (
            <button
              onClick={onMarkAllRead}
              className="text-[11px] font-bold text-sky-600 hover:text-sky-700 px-2 py-1 rounded-lg hover:bg-sky-50 transition-colors cursor-pointer"
            >
              Mark read
            </button>
          )}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Notifications Accordion List (Topic only shown by default) */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 bg-white">
        {notifications.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Bell size={24} className="text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-800">No notifications</p>
            <p className="text-[11px] text-slate-500">You are all caught up with your Susu groups.</p>
          </div>
        ) : (
          notifications.map((notif) => {
            const isRead = readNotifIds.includes(notif.id);
            const isExpanded = expandedId === notif.id;

            return (
              <div 
                key={notif.id}
                className={`transition-colors ${
                  !isRead ? 'bg-sky-50/20 hover:bg-sky-50/40' : 'hover:bg-slate-50'
                }`}
              >
                {/* Topic Header Row (Tappable to expand & mark read) */}
                <div 
                  onClick={() => handleTopicClick(notif.id)}
                  className="p-3.5 flex items-center justify-between gap-2.5 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {getNotifIcon(notif.type)}
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {notif.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Blue dot if unread, dims to light slate when read */}
                    <span 
                      className={`w-2 h-2 rounded-full transition-colors ${
                        isRead ? 'bg-slate-200' : 'bg-sky-600'
                      }`}
                      title={isRead ? 'Read' : 'Unread'}
                    />
                    <ChevronDown 
                      size={14} 
                      className={`text-slate-400 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180 text-slate-700' : ''
                      }`} 
                    />
                  </div>
                </div>

                {/* Expanded Full Details */}
                {isExpanded && (
                  <div className="px-4 pb-3.5 pt-0 text-left space-y-2.5 border-t border-slate-50 bg-slate-50/40">
                    <p className="text-[11px] text-slate-700 leading-relaxed font-medium pt-2">
                      {notif.message}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold pt-1 border-t border-slate-100">
                      <span>{notif.sender} • {notif.time}</span>
                      
                      {onDismiss && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDismiss(notif.id);
                          }}
                          className="text-slate-400 hover:text-slate-700 text-[10px] font-bold cursor-pointer"
                        >
                          Dismiss
                        </button>
                      )}
                    </div>

                    {/* Quick navigation action if applicable */}
                    {notif.type === 'VERIFIED' && onNavigate && (
                      <button
                        onClick={() => onNavigate('profile')}
                        className="w-full py-1.5 px-3 rounded-xl bg-white border border-slate-200 text-sky-600 font-bold text-[11px] flex items-center justify-center gap-1 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <span>View Profile & KYC</span>
                        <ArrowRight size={12} />
                      </button>
                    )}

                    {notif.type === 'PAYOUT' && onNavigate && (
                      <button
                        onClick={() => onNavigate('my-circles')}
                        className="w-full py-1.5 px-3 rounded-xl bg-white border border-slate-200 text-sky-600 font-bold text-[11px] flex items-center justify-center gap-1 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <span>View My Groups Rotation</span>
                        <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Clean Footer */}
      <div className="p-2.5 border-t border-slate-100 bg-slate-50 text-center">
        <span className="text-[10px] font-bold text-slate-400">
          SusuRow Automated Ghana Mobile Money
        </span>
      </div>
    </div>
  );
};
