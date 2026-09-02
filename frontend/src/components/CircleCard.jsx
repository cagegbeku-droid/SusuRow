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
  const isRecruiting = circle.status === 'RECRUITING';

  const memberProgress = Math.min(
    Math.round((circle.enrolled_count / circle.members_count) * 100),
    100
  );

  return (
    <div
      onClick={() => onSelect(circle)}
      className="bg-white rounded-3xl p-5 border border-slate-150 shadow-xs hover:border-slate-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
    >
      {/* Top Header */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          
          <div className="flex items-center gap-3">
            {/* Category Icon Badge */}
            <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-sm shrink-0 border border-sky-100">
              <Wallet size={20} className="stroke-[2.2]" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1">
                {circle.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span>{circle.frequency}</span>
                <span>•</span>
                <span className="capitalize">{circle.rotation_type.toLowerCase()}</span>
              </div>
            </div>
          </div>

          <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
            isCompleted
              ? 'bg-slate-100 text-slate-600'
              : isActive
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {isCompleted ? 'Completed' : isActive ? `Round ${circle.current_round}` : 'Recruiting'}
          </span>

        </div>

        {circle.description && (
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
            {circle.description}
          </p>
        )}
      </div>

      {/* Metrics Row */}
      <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 grid grid-cols-2 gap-3 items-center">
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Pot per Turn</div>
          <div className="text-lg font-bold text-slate-900 font-mono">
            GH₵{circle.total_pool?.toLocaleString()}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] uppercase font-bold text-slate-400">Contribution</div>
          <div className="text-sm font-bold text-slate-800 font-mono">
            GH₵{circle.contribution_amount}
          </div>
        </div>
      </div>

      {/* Progress Track */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
          <span className="text-[11px] text-slate-500">
            {circle.enrolled_count} of {circle.members_count} Savers
          </span>
          <span className="text-[11px] font-mono font-bold text-sky-600">
            {memberProgress}%
          </span>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-sky-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${memberProgress}%` }}
          />
        </div>
      </div>

      {/* Card Action Row */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        <span className="text-[11px] font-semibold text-slate-500">
          {circle.commitment_deposit > 0 ? `GH₵${circle.commitment_deposit} Deposit` : '0% Loan Interest'}
        </span>

        <div className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 group-hover:translate-x-0.5 transition-transform">
          <span>View Group</span>
          <ChevronRight size={14} />
        </div>
      </div>

    </div>
  );
};
