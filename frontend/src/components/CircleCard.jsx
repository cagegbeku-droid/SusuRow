import React from 'react';
import { 
  Users, 
  ChevronRight,
  RotateCw, 
  Shuffle, 
  Gavel, 
  Wallet
} from 'lucide-react';

export const CircleCard = ({ circle, onSelect }) => {
  const isCompleted = circle.status === 'COMPLETED';
  const isActive = circle.status === 'ACTIVE';
  const isFull = (circle.enrolled_count || 0) >= (circle.members_count || 1);
  const isRecruiting = circle.status === 'RECRUITING';

  return (
    <div
      onClick={() => onSelect(circle)}
      className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
    >
      {/* Top Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Category Icon Badge */}
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-sm shrink-0 border border-sky-100">
              <Wallet size={17} className="stroke-[2.2]" />
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors truncate">
                {circle.name}
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                {circle.cycle_number > 1 && (
                  <>
                    <span className="font-bold text-emerald-700">Cycle {circle.cycle_number}</span>
                    <span>•</span>
                  </>
                )}
                <span>{circle.frequency}</span>
                <span>•</span>
                <span className="capitalize">{circle.rotation_type.toLowerCase()}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
              isCompleted
                ? 'bg-slate-100 text-slate-600'
                : isActive
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : isFull
                ? 'bg-sky-50 text-sky-800 border border-sky-200 font-bold'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {isCompleted ? 'Completed' : isActive ? `Round ${circle.current_round}` : isFull ? 'Full' : 'Open'}
            </span>

            {/* User Specific Next Payout Indicator */}
            {circle.user_payout_position && !isCompleted && (
              circle.user_payout_position === circle.current_round ? (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 shadow-2xs">
                  Your Turn
                </span>
              ) : circle.user_has_received_payout ? (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                  ✓ Received
                </span>
              ) : (
                <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800">
                  Turn #{circle.user_payout_position}
                </span>
              )
            )}
          </div>

        </div>
      </div>

      {/* Metrics Row */}
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 grid grid-cols-2 gap-2 items-center">
        <div>
          <div className="text-[9px] uppercase font-bold text-slate-400">Total Payout</div>
          <div className="text-base font-bold text-slate-900 font-mono">
            GH₵{circle.total_pool?.toLocaleString()}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[9px] uppercase font-bold text-slate-400">Contribution</div>
          <div className="text-xs font-bold text-slate-800 font-mono">
            GH₵{circle.contribution_amount}
          </div>
        </div>
      </div>

      {/* Card Action Row with 1/5 Member Counter (No Horizontal Bar) */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1.5 text-slate-600 font-bold text-[11px]">
          <Users size={13} className="text-slate-400" />
          <span>{circle.enrolled_count}/{circle.members_count} members</span>
        </div>

        <div className="inline-flex items-center gap-1 font-bold text-sky-600 group-hover:translate-x-0.5 transition-transform text-xs">
          <span>View</span>
          <ChevronRight size={13} />
        </div>
      </div>

    </div>
  );
};
