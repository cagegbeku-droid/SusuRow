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
import confetti from 'canvas-confetti';

export const ReferralModal = ({ isOpen, onClose }) => {
  const { referralCode, user } = useUser();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello! Join me on SusuRow to save and rotate money together with zero loan interest.\n\nUse my invite code: ${referralCode}\nOr join directly here: ${shareUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#04060A]/85 backdrop-blur-md">
      <div className="dark-card w-full max-w-md rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-amber-500 via-gold-600 to-amber-700 text-slate-950 p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-950/70 hover:text-slate-950 hover:bg-black/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider mb-1">
            <Gift size={14} />
            <span>Community Rewards</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-950">
            Refer Friends & Earn
          </h2>
          <p className="text-xs text-slate-900/80 mt-0.5 font-medium">
            Invite family, colleagues, and savers to create or join Susu circles.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Code Box */}
          <div className="bg-[#0E1322] rounded-3xl p-4 border border-white/10 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400">Your Exclusive Invite Code</span>
            <div className="flex items-center justify-between gap-2">
              <span className="text-2xl font-black font-mono text-amber-400 tracking-wider">
                {referralCode}
              </span>
              <button
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow cursor-pointer active:scale-95"
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
              className="py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
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
              className="py-3 px-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(59,130,246,0.3)] transition-all cursor-pointer"
            >
              <Share2 size={16} />
              <span>More Options</span>
            </button>
          </div>

          {/* Benefits Info */}
          <div className="p-3.5 bg-[#0E1322] rounded-2xl border border-white/5 space-y-1 text-xs text-slate-300">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-400" />
              <span>How It Works</span>
            </div>
            <p className="text-[11px] text-slate-400">
              When peers register with your code, they gain immediate verified saver access, and your trust reputation score increases!
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
