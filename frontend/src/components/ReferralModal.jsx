import React, { useState } from 'react';
import { X, Gift, Share2, Copy, Check, MessageCircle, Users, Award, ShieldCheck, Sparkles } from 'lucide-react';
import { useUser } from '../context/UserContext';

export const ReferralModal = ({ isOpen, onClose }) => {
  const { user, referralCode } = useUser();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}?ref=${referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Hello! Join me on SusuRow to save and rotate money together with zero loan interest.\n\nUse my invite code: ${referralCode}\nOr join directly here: ${shareUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-teal-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-gold-400 mb-1">
            <Gift className="w-4 h-4" />
            <span>Community Rewards Program</span>
          </div>

          <h2 className="text-2xl font-black font-display tracking-tight">
            Refer & Earn with Friends
          </h2>
          <p className="text-xs text-primary-200 mt-1">
            Invite family, peers, and church/market members to form trusted Susu circles.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {/* Invite Code & Link Card */}
          <div className="bg-gradient-to-br from-amber-50 to-gold-50/50 border-2 border-gold-300 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Your Unique Referral Code
                </span>
                <div className="font-mono text-xl font-black text-slate-900 tracking-wider">
                  {referralCode}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-2 bg-white hover:bg-slate-50 border border-gold-400 text-slate-900 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check size={14} className="text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
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

            {/* Direct WhatsApp Share Button */}
            <button
              onClick={handleWhatsAppShare}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle size={16} />
              <span>Share Directly to WhatsApp Contacts & Groups</span>
            </button>
          </div>

          {/* How It Works Tiers */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              How You Benefit
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-800 flex items-center justify-center mx-auto mb-1.5 font-black text-sm">
                  1
                </div>
                <div className="text-xs font-bold text-slate-900">Share Link</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Send your code via WhatsApp</div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="w-8 h-8 rounded-lg bg-gold-100 text-gold-800 flex items-center justify-center mx-auto mb-1.5 font-black text-sm">
                  2
                </div>
                <div className="text-xs font-bold text-slate-900">Friend Joins</div>
                <div className="text-[11px] text-slate-500 mt-0.5">They enter circle and save</div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-1.5 font-black text-sm">
                  3
                </div>
                <div className="text-xs font-bold text-slate-900">Earn Rewards</div>
                <div className="text-[11px] text-slate-500 mt-0.5">50 Susu Points per active peer</div>
              </div>
            </div>
          </div>

          {/* Trust Guarantee */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-2.5 text-xs text-slate-600">
            <ShieldCheck size={18} className="text-primary-700 shrink-0" />
            <span>
              All transactions are secured with Ghana Mobile Money auto-settlement and commitment escrow vaults.
            </span>
          </div>

          {/* Close button */}
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
