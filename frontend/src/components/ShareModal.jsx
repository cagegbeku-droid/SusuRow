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

import { useModalBackdropClose } from '../hooks/useModalBackdropClose';

import { getGroupInviteUrl } from '../utils/shareUtils';

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
  const { handleBackdropClick } = useModalBackdropClose(isOpen, onClose);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const shareUrl = getGroupInviteUrl(inviteCode);

  const shareText = `🇬🇭 Join my Susu Group "${groupName || 'SusuRow'}" on SusuRow!\n💰 Contribution: GH₵${contributionAmount || '200'} (${frequency || 'Weekly'})\n🔒 Group Code: ${inviteCode}\n\n👉 Join directly or download app here:\n${shareUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${groupName || 'SusuRow'} on SusuRow`,
          text: shareText,
          url: shareUrl
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 flex flex-col">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 relative bg-slate-50/50">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center gap-1.5 text-[10px] font-black text-sky-700 uppercase tracking-wider mb-1">
            <Share2 size={13} />
            <span>Invite Savers</span>
          </div>

          <h2 className="text-xl font-black text-slate-900">{title}</h2>
          <p className="text-xs text-slate-600 mt-0.5">{description}</p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Invite Code & Public Web Link Card */}
          {inviteCode && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Group Invite Code</span>
                  <div className="font-mono text-xl font-black text-slate-900 tracking-wider">
                    {inviteCode}
                  </div>
                </div>

                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  {copiedCode ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  <span>{copiedCode ? 'Code Copied' : 'Copy Code'}</span>
                </button>
              </div>

              {/* Public Web Invite Link */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Public Web Link</div>
                  <div className="text-xs font-mono text-sky-700 truncate font-medium">
                    {shareUrl}
                  </div>
                </div>

                <button
                  onClick={handleCopyLink}
                  className="shrink-0 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedLink ? 'Link Copied' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Social Channels */}
          <div className="grid grid-cols-3 gap-2.5">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-emerald-700 transition-all cursor-pointer shadow-xs"
            >
              <MessageCircle size={22} className="text-emerald-600 mb-1" />
              <span className="text-[11px] font-bold text-slate-800">WhatsApp</span>
            </a>

            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-sky-700 transition-all cursor-pointer shadow-xs"
            >
              <Send size={22} className="text-sky-600 mb-1" />
              <span className="text-[11px] font-bold text-slate-800">Telegram</span>
            </a>

            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition-all cursor-pointer shadow-xs"
            >
              <Twitter size={22} className="text-slate-700 mb-1" />
              <span className="text-[11px] font-bold text-slate-800">X (Twitter)</span>
            </a>
          </div>

          {/* Native Device Share Sheet */}
          <button
            onClick={handleNativeShare}
            className="w-full py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Share2 size={16} />
            <span>Open Native Device Share Sheet</span>
          </button>

        </div>

      </div>
    </div>
  );
};
