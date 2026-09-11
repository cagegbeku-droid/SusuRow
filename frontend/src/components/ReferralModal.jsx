import React, { useState } from 'react';
import { 
  X, 
  Gift, 
  Copy, 
  Check, 
  Share2, 
  MessageCircle, 
  Users, 
  Coins, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useModalBackdropClose } from '../hooks/useModalBackdropClose';
import { getReferralInviteUrl } from '../utils/shareUtils';

export const ReferralModal = ({ isOpen, onClose }) => {
  const { handleBackdropClick } = useModalBackdropClose(isOpen, onClose);
  const { referralCode, user } = useUser();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = getReferralInviteUrl(referralCode);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello! Join me on SusuRow to save and rotate money together with zero loan interest.\n\nUse my invite code: ${referralCode}\nOr join directly here: ${shareUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 relative bg-slate-50/50">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider mb-1 text-amber-700">
            <Gift size={14} />
            <span>Community Rewards</span>
          </div>

          <h2 className="text-xl font-black text-slate-900">
            Refer Friends & Earn
          </h2>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            Invite family, colleagues, and savers to create or join Susu circles.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Code Box */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-500">Your Exclusive Invite Code</span>
            <div className="flex items-center justify-between gap-2">
              <span className="text-2xl font-black font-mono text-slate-900 tracking-wider">
                {referralCode}
              </span>
              <button
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Social Channels */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleWhatsApp}
              className="py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <MessageCircle size={16} />
              <span>Share on WhatsApp</span>
            </button>

            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'Join me on SusuRow',
                    text: 'Save and rotate money together with 0% interest.',
                    url: shareUrl
                  }).catch(() => {});
                } else {
                  handleCopy();
                }
              }}
              className="py-3 px-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Share2 size={16} />
              <span>More Options</span>
            </button>
          </div>

          {/* Benefits Info */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs text-slate-700">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-600" />
              <span>How It Works</span>
            </div>
            <p className="text-[11px] text-slate-600">
              When peers register with your code, they gain immediate verified saver access, and your trust reputation score increases!
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
