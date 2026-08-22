import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  MessageCircle, 
  Send, 
  Twitter, 
  Facebook, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ShareModal = ({
  isOpen,
  onClose,
  title = "Share Susu Group",
  description = "Invite your peers and family to save together with zero loan interest.",
  inviteCode,
  groupName,
  contributionAmount,
  frequency
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const origin = window.location.origin;
  const shareUrl = inviteCode 
    ? `${origin}?code=${inviteCode}`
    : origin;

  const shareText = `🇬🇭 Join my Susu Group "${groupName || 'SusuRow'}" on SusuRow!\n💰 Contribution: GH₵${contributionAmount || '200'} (${frequency || 'Weekly'})\n🔒 Group Code: ${inviteCode}\n\n👉 Join directly here: ${shareUrl}`;

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

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${groupName} on SusuRow`,
          text: shareText,
          url: shareUrl
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#04060A]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="dark-card rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden border border-white/10 flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-300 uppercase tracking-wider mb-1">
            <Share2 size={13} />
            <span>Invite Savers</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white">{title}</h2>
          <p className="text-xs text-blue-100 mt-0.5">{description}</p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Invite Code Card */}
          {inviteCode && (
            <div className="bg-[#0E1322] border border-white/10 rounded-3xl p-4 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Invite Code</span>
                <div className="font-mono text-xl font-black text-amber-400 tracking-wider">
                  {inviteCode}
                </div>
              </div>

              <button
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow cursor-pointer active:scale-95"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
          )}

          {/* Social Channels */}
          <div className="grid grid-cols-3 gap-2.5">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#0E1322] hover:bg-[#161D32] border border-white/5 text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer shadow-xs"
            >
              <MessageCircle size={22} className="text-emerald-400 mb-1" />
              <span className="text-[11px] font-bold text-slate-300">WhatsApp</span>
            </a>

            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#0E1322] hover:bg-[#161D32] border border-white/5 text-sky-400 hover:text-sky-300 transition-all cursor-pointer shadow-xs"
            >
              <Send size={22} className="text-sky-400 mb-1" />
              <span className="text-[11px] font-bold text-slate-300">Telegram</span>
            </a>

            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#0E1322] hover:bg-[#161D32] border border-white/5 text-slate-300 hover:text-white transition-all cursor-pointer shadow-xs"
            >
              <Twitter size={22} className="text-slate-300 mb-1" />
              <span className="text-[11px] font-bold text-slate-300">X (Twitter)</span>
            </a>
          </div>

          {/* Native Device Share Sheet */}
          <button
            onClick={handleNativeShare}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Share2 size={16} />
            <span>Open Native Device Share Sheet</span>
          </button>

        </div>

      </div>
    </div>
  );
};
