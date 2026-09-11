import React from 'react';
import { 
  MessageCircle, 
  Phone, 
  MessageSquare, 
  HelpCircle, 
  X, 
  ChevronRight, 
  ExternalLink,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { useModalBackdropClose } from '../hooks/useModalBackdropClose';

export const SupportChatModal = ({
  isOpen,
  onClose,
  onOpenMyCircles,
  onOpenFAQ
}) => {
  const { handleBackdropClick } = useModalBackdropClose(isOpen, onClose);

  if (!isOpen) return null;

  const whatsappNumber = '233599360626';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Hello%20SusuRow%2C%20I%20have%20an%20inquiry%20regarding%20my%20savings%20group%20or%20Mobile%20Money%20transaction.`;

  return (
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col space-y-4 p-5 sm:p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200 shadow-xs">
              <MessageCircle size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Chat & Support</h3>
              <p className="text-xs text-slate-500 font-medium">SusuRow Official Channels</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Options List */}
        <div className="space-y-3">
          
          {/* WhatsApp Direct Support */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 flex items-center justify-between gap-3 transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <MessageSquare size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-950 group-hover:text-emerald-800">
                  Live WhatsApp Chat
                </h4>
                <p className="text-[11px] text-emerald-700 font-medium">
                  Direct support • +233 59 936 0626
                </p>
              </div>
            </div>
            <ExternalLink size={15} className="text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
          </a>

          {/* Direct Phone Line */}
          <a
            href="tel:0599360626"
            className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between gap-3 transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
                <Phone size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-sky-600">
                  Call Customer Care
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  Ghana Helpline • 0599360626
                </p>
              </div>
            </div>
            <ChevronRight size={15} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </a>

          {/* Group Chats */}
          <button
            onClick={() => {
              onClose();
              if (onOpenMyCircles) onOpenMyCircles();
            }}
            className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between gap-3 transition-all cursor-pointer group shadow-2xs text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <MessageCircle size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                  Circle Group Chats
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  Chat with members in your active savings groups
                </p>
              </div>
            </div>
            <ChevronRight size={15} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* FAQs */}
          <button
            onClick={() => {
              onClose();
              if (onOpenFAQ) onOpenFAQ();
            }}
            className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between gap-3 transition-all cursor-pointer group shadow-2xs text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <HelpCircle size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-700">
                  Help Center & FAQs
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  Instant answers on payouts, fees & deposits
                </p>
              </div>
            </div>
            <ChevronRight size={15} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

        </div>

        {/* Footer Note */}
        <div className="pt-2 text-center border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck size={12} className="text-emerald-600" />
          <span>SusuRow Official 24/7 Verified Support</span>
        </div>

      </div>
    </div>
  );
};
