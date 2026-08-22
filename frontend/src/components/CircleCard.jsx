import React from 'react';
import { 
  Users, 
  ArrowRight, 
  ShieldCheck, 
  RotateCw, 
  Shuffle, 
  Gavel, 
  Lock,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export const CircleCard = ({ circle, onSelect }) => {
  const isCompleted = circle.status === 'COMPLETED';
  const isActive = circle.status === 'ACTIVE';
  const isRecruiting = circle.status === 'RECRUITING';
  const isFull = circle.enrolled_count >= circle.members_count;

  // Percentage of enrolled members
  const memberProgress = Math.min(
    Math.round((circle.enrolled_count / circle.members_count) * 100),
    100
  );

  const getRotationIcon = () => {
    switch (circle.rotation_type) {
      case 'BALLOT':
        return <Shuffle className="w-3.5 h-3.5 text-amber-400" />;
      case 'BIDDING':
        return <Gavel className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return <RotateCw className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  return (
    <div
      onClick={() => onSelect(circle)}
      className="dark-card dark-card-hover rounded-3xl p-5 sm:p-6 text-white cursor-pointer relative overflow-hidden flex flex-col justify-between space-y-4 group"
    >
      {/* Top Header & Status Badges */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
              isCompleted
                ? 'bg-slate-800 text-slate-400 border border-white/5'
                : isActive
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
            }`}>
              {isCompleted ? 'Completed' : isActive ? `Active • Round ${circle.current_round}` : 'Recruiting'}
            </span>

            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/5">
              {circle.frequency}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
            {getRotationIcon()}
            <span className="capitalize">{circle.rotation_type.toLowerCase()}</span>
          </div>

        </div>

        {/* Group Name & Description */}
        <div>
          <h3 className="text-base sm:text-lg font-black text-white group-hover:text-blue-400 transition-colors line-clamp-1">
            {circle.name}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
            {circle.description || 'Save and rotate payouts on schedule with 0% interest.'}
          </p>
        </div>
      </div>

      {/* Center Pot & Contribution Metrics (Image 1 style) */}
      <div className="bg-[#0E1322] rounded-2xl p-3.5 border border-white/5 grid grid-cols-2 gap-3 items-center">
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Pot per Turn</div>
          <div className="text-xl font-black text-amber-400 font-mono">
            GH₵{circle.total_pool?.toLocaleString()}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] uppercase font-bold text-slate-400">Contribution</div>
          <div className="text-sm font-bold text-white font-mono">
            GH₵{circle.contribution_amount}
          </div>
        </div>
      </div>

      {/* Bottom Members Avatar Stack & Progress (Image 1 style) */}
      <div className="space-y-2 pt-1 border-t border-white/5">
        
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <div className="flex items-center gap-2">
            {/* Circular Avatar Stack */}
            <div className="flex -space-x-2 overflow-hidden">
              {[...Array(Math.min(circle.enrolled_count, 4))].map((_, i) => (
                <div
                  key={i}
                  className="inline-block h-6 w-6 rounded-full ring-2 ring-[#141A2D] bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-[9px] font-black text-white"
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <span className="text-[11px] text-slate-400 font-bold">
              {circle.enrolled_count} of {circle.members_count} Savers
            </span>
          </div>

          <span className="text-[11px] font-mono font-bold text-blue-400">
            {memberProgress}%
          </span>
        </div>

        {/* Multi-colored Progress Bar */}
        <div className="w-full bg-[#0E1322] rounded-full h-1.5 overflow-hidden border border-white/5">
          <div
            className="bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${memberProgress}%` }}
          />
        </div>

      </div>

      {/* Card Action Row */}
      <div className="flex items-center justify-between pt-1">
        {circle.commitment_deposit > 0 ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <ShieldCheck size={11} />
            <span>GH₵{circle.commitment_deposit} Deposit</span>
          </span>
        ) : (
          <span className="text-[10px] text-slate-500 font-bold">0% Escrow Fee</span>
        )}

        <div className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
          <span>View Group</span>
          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

    </div>
  );
};
