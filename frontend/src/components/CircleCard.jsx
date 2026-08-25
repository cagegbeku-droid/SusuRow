import React from 'react';
import { 
  Users, 
  ArrowRight, 
  ShieldCheck, 
  RotateCw, 
  Shuffle, 
  Gavel, 
  ChevronRight,
  TrendingUp,
  Wallet
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
        return <Shuffle className="w-3.5 h-3.5 text-[#00D09C]" />;
      case 'BIDDING':
        return <Gavel className="w-3.5 h-3.5 text-blue-400" />;
      default:
        return <RotateCw className="w-3.5 h-3.5 text-[#00D09C]" />;
    }
  };

  return (
    <div
      onClick={() => onSelect(circle)}
      className="dark-card dark-card-hover rounded-3xl p-5 text-white cursor-pointer relative overflow-hidden flex flex-col justify-between space-y-4 group border border-white/[0.08]"
    >
      {/* Top Header & Status Badges */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          
          <div className="flex items-center gap-2">
            {/* Category Icon Badge (Ezpay style) */}
            <div className="w-10 h-10 rounded-2xl bg-[#00D09C]/15 border border-[#00D09C]/30 text-[#00D09C] flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <Wallet size={20} />
            </div>

            <div>
              <h3 className="text-base font-bold text-white group-hover:text-[#00D09C] transition-colors line-clamp-1">
                {circle.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{circle.frequency}</span>
                <span>•</span>
                <span className="capitalize">{circle.rotation_type.toLowerCase()}</span>
              </div>
            </div>
          </div>

          <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
            isCompleted
              ? 'bg-slate-800 text-slate-400 border border-white/10'
              : isActive
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              : 'bg-[#00D09C]/15 text-[#00D09C] border border-[#00D09C]/30'
          }`}>
            {isCompleted ? 'Completed' : isActive ? `Round ${circle.current_round}` : 'Recruiting'}
          </span>

        </div>

        {circle.description && (
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {circle.description}
          </p>
        )}
      </div>

      {/* Center Pot & Contribution Card (Ezpay style) */}
      <div className="bg-[#0E1424] rounded-2xl p-3.5 border border-white/5 grid grid-cols-2 gap-3 items-center">
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Pot per Turn</div>
          <div className="text-xl font-black text-[#00D09C] font-mono">
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

      {/* Member Progress Slider (Ezpay style) */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="text-[11px] text-slate-400">
            {circle.enrolled_count} of {circle.members_count} Savers
          </span>
          <span className="text-[11px] font-mono font-bold text-[#00D09C]">
            {memberProgress}%
          </span>
        </div>

        <div className="w-full bg-[#0E1424] rounded-full h-2 overflow-hidden border border-white/5">
          <div
            className="bg-[#00D09C] h-full rounded-full transition-all duration-500"
            style={{ width: `${memberProgress}%` }}
          />
        </div>
      </div>

      {/* Card Action Row */}
      <div className="flex items-center justify-between pt-1 border-t border-white/5">
        <span className="text-[11px] font-bold text-slate-400">
          {circle.commitment_deposit > 0 ? `GH₵${circle.commitment_deposit} Deposit` : 'Zero Loan Interest'}
        </span>

        <div className="inline-flex items-center gap-1 text-xs font-bold text-[#00D09C] group-hover:underline">
          <span>View Circle</span>
          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

    </div>
  );
};
