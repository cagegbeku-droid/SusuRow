import React, { useState } from 'react';
import { 
  Users, 
  Coins, 
  Shuffle, 
  ListOrdered, 
  Gavel, 
  Copy, 
  Check, 
  Lock, 
  Globe, 
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export const CircleCard = ({ circle, onSelect }) => {
  const [copied, setCopied] = useState(false);

  const isFull = circle.enrolled_count >= circle.members_count;

  const copyInviteCode = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(circle.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRotationBadge = (type) => {
    switch (type) {
      case 'SEQUENTIAL':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200">
            <ListOrdered className="w-2.5 h-2.5" />
            <span>Turn by Turn</span>
          </span>
        );
      case 'BALLOT':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-900 border border-purple-200">
            <Shuffle className="w-2.5 h-2.5" />
            <span>Ballot Draw</span>
          </span>
        );
      case 'BIDDING':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-950 border border-amber-200">
            <Gavel className="w-2.5 h-2.5" />
            <span>Bids</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getFrequencyBadge = (freq) => {
    switch (freq) {
      case 'DAILY':
        return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-900">Daily Cycle</span>;
      case 'WEEKLY':
        return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">Weekly Cycle</span>;
      case 'MONTHLY':
        return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-900">Monthly Cycle</span>;
      default:
        return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-800">{freq}</span>;
    }
  };

  const fillPercentage = Math.min(100, Math.round((circle.enrolled_count / circle.members_count) * 100));

  return (
    <div 
      onClick={() => onSelect(circle)}
      className="bg-white rounded-3xl border border-slate-200 hover:border-primary-600 hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden group cursor-pointer"
    >
      {/* Top Banner */}
      <div className="p-5 pb-3 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {getFrequencyBadge(circle.frequency)}
            {getRotationBadge(circle.rotation_type)}
            {circle.is_private && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                <Lock className="w-2.5 h-2.5" />
                <span>Private</span>
              </span>
            )}
          </div>

          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
            circle.status === 'COMPLETED'
              ? 'bg-slate-100 text-slate-700'
              : circle.status === 'ACTIVE'
              ? 'bg-amber-100 text-amber-900 border border-amber-300'
              : 'bg-primary-50 text-primary-900 border border-primary-200'
          }`}>
            {circle.status === 'COMPLETED' ? 'Completed' : circle.status === 'ACTIVE' ? `Cycle ${circle.current_round}` : 'Recruiting'}
          </span>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-primary-800 transition-colors line-clamp-1">
            {circle.name}
          </h3>
          {circle.description && (
            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
              {circle.description}
            </p>
          )}
        </div>

        {/* Pot & Contribution Metric Box */}
        <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase">Total Pot</div>
            <div className="text-base sm:text-lg font-black text-gold-600 font-mono">
              GH₵{circle.total_pool?.toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-semibold text-slate-500 uppercase">Contribution</div>
            <div className="text-sm font-bold text-slate-900 font-mono">
              GH₵{circle.contribution_amount}
            </div>
          </div>
        </div>

        {/* Members Count */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-primary-700" />
              <span>Group Members</span>
            </span>
            <span className="font-bold text-slate-900">
              {circle.enrolled_count} of {circle.members_count}
            </span>
          </div>

          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                isFull ? 'bg-amber-500' : 'bg-primary-700'
              }`}
              style={{ width: `${fillPercentage}%` }}
            />
          </div>
        </div>

        {/* Escrow Deposit if set */}
        {circle.commitment_deposit > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded-lg">
            <ShieldCheck className="w-3 h-3 text-primary-700 shrink-0" />
            <span>Deposit: <strong>GH₵{circle.commitment_deposit}</strong></span>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          onClick={copyInviteCode}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-white text-slate-700 border border-slate-300 hover:border-primary-600 transition-all shadow-xs cursor-pointer"
          title="Copy invite code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-primary-700" />
              <span className="text-primary-700">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-slate-400" />
              <span>{circle.invite_code}</span>
            </>
          )}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(circle);
          }}
          className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-primary-800 hover:bg-primary-900 transition-all flex items-center gap-1 cursor-pointer shadow"
        >
          <span>View Group</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
