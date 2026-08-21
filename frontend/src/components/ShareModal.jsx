import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  MessageCircle,
  Send,
  Facebook,
  Smartphone,
  Sparkles,
  KeyRound
} from 'lucide-react';

export const ShareModal = ({
  isOpen,
  onClose,
  title = "Share Susu Circle",
  description = "Invite family, friends, or trusted peers to save together.",
  inviteCode,
  shareUrl,
  groupName,
  contributionAmount,
  frequency
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const url = shareUrl || (inviteCode ? `${window.location.origin}/?code=${inviteCode}` : window.location.origin);
  
  const shareMessage = groupName && contributionAmount
    ? `Join my Susu circle "${groupName}" on SusuRow! We are saving GH₵${contributionAmount} ${frequency?.toLowerCase() || 'weekly'} with 0% loan interest.\n\nInvite Code: ${inviteCode}\nJoin here: ${url}`
    : `Join me on SusuRow to save and rotate money together with zero loan interest.\n\nInvite Code: ${inviteCode || 'SUSU-GH26'}\nJoin here: ${url}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // 1. Native Device Share (Android / iOS)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: groupName ? `SusuRow - ${groupName}` : "SusuRow Ghana",
          text: shareMessage,
          url: url
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  // 2. WhatsApp
  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(shareMessage);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  // 3. Telegram
  const handleTelegram = () => {
    const encodedText = encodeURIComponent(shareMessage);
    const encodedUrl = encodeURIComponent(url);
    window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`, '_blank');
  };

  // 4. Twitter / X
  const handleTwitter = () => {
    const text = encodeURIComponent(
      groupName
        ? `I just formed a Susu Circle "${groupName}" on @SusuRow! Join our rotational savings pool with zero loan interest:`
        : `Save and rotate money together with zero loan interest on @SusuRow:`
    );
    const encodedUrl = encodeURIComponent(url);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`, '_blank');
  };

  // 5. Facebook
  const handleFacebook = () => {
    const encodedUrl = encodeURIComponent(url);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
  };

  // 6. Direct SMS
  const handleSMS = () => {
    const encoded = encodeURIComponent(shareMessage);
    window.open(`sms:?body=${encoded}`, '_self');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-teal-900 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-gold-400 mb-1">
            <Share2 className="w-4 h-4" />
            <span>Invite & Share</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-primary-200 mt-1">
            {description}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          
          {/* Direct Link & Invite Code Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
            {inviteCode && (
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Circle Invite Code</span>
                  <div className="font-mono text-base font-black text-slate-900 tracking-wider">
                    {inviteCode}
                  </div>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                >
                  {copiedCode ? (
                    <>
                      <Check size={13} className="text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Shareable Web Link</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={url}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-mono text-slate-700 select-all focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 rounded-xl bg-primary-800 hover:bg-primary-900 text-white text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow"
                >
                  {copiedLink ? (
                    <>
                      <Check size={14} className="text-gold-300" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Multi-Platform Share Buttons */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Share to Platform
            </h4>

            {/* Native Mobile Share if supported */}
            {typeof navigator !== 'undefined' && navigator.share && (
              <button
                onClick={handleNativeShare}
                className="w-full py-3 px-4 bg-primary-700 hover:bg-primary-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mb-2"
              >
                <Share2 size={16} className="text-gold-300" />
                <span>Open Device Share Menu (All Apps)</span>
              </button>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              
              {/* WhatsApp */}
              <button
                onClick={handleWhatsApp}
                className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold text-xs rounded-xl transition-all flex flex-col items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow">
                  <MessageCircle size={16} />
                </div>
                <span>WhatsApp</span>
              </button>

              {/* Telegram */}
              <button
                onClick={handleTelegram}
                className="p-3 bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-950 font-bold text-xs rounded-xl transition-all flex flex-col items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center shadow">
                  <Send size={15} className="-ml-0.5" />
                </div>
                <span>Telegram</span>
              </button>

              {/* Direct SMS */}
              <button
                onClick={handleSMS}
                className="p-3 bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-950 font-bold text-xs rounded-xl transition-all flex flex-col items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shadow">
                  <Smartphone size={16} />
                </div>
                <span>SMS / Text</span>
              </button>

              {/* X / Twitter */}
              <button
                onClick={handleTwitter}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-900 font-bold text-xs rounded-xl transition-all flex flex-col items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-slate-950 text-white flex items-center justify-center shadow font-black text-sm">
                  𝕏
                </div>
                <span>Twitter / X</span>
              </button>

              {/* Facebook */}
              <button
                onClick={handleFacebook}
                className="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-950 font-bold text-xs rounded-xl transition-all flex flex-col items-center justify-center gap-1.5 shadow-sm cursor-pointer col-span-2 sm:col-span-2"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow">
                  <Facebook size={16} />
                </div>
                <span>Facebook</span>
              </button>

            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition-colors cursor-pointer"
          >
            Done
          </button>

        </div>
      </div>
    </div>
  );
};
