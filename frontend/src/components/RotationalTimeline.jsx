import React from 'react';
import { 
  CheckCircle2, 
  Sparkles, 
  RotateCw
} from 'lucide-react';

export const RotationalTimeline = ({ group, onProfileClick }) => {
  if (!group || !group.members) return null;

  const currentRound = group.current_round || 1;
  const isCompleted = group.status === 'COMPLETED';

  // Sort members by payout_position
  const members = [...group.members].sort((a, b) => (a.payout_position || 999) - (b.payout_position || 999));
  
  // Paid count for current round
  const paidCount = group.members.filter(m => m.has_paid_current_round).length;
  const totalMembers = group.members.length;

  const getInitials = (name) => {
    if (!name) return 'S';
    return name
      .split(' ')
      .filter(Boolean)
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200 space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">Rotation Cycle</h3>
            <span className="bg-sky-50 text-sky-800 border border-sky-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {isCompleted ? 'Completed' : `Round ${currentRound} of ${group.members_count}`}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Turn-by-turn payout schedule. Payouts are sent directly to each member's Mobile Money wallet on their turn.
          </p>
        </div>

        {/* Current Round Live Pot status */}
        {!isCompleted && (
          <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl shrink-0">
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Collected This Round</div>
              <div className="text-sm font-bold text-slate-900 font-mono">GH₵{(paidCount * (group.contribution_amount || 0)).toFixed(2)}</div>
            </div>
            <div className="h-7 w-px bg-slate-200"></div>
            <div className="text-left">
              <div className="text-[10px] font-bold text-slate-400">Paid</div>
              <div className="text-xs font-bold text-slate-800">{paidCount} of {group.members_count}</div>
            </div>
          </div>
        )}
      </div>

      {/* Visual Stepper Steps */}
      <div className="space-y-2.5">
        {(() => {
          // The active recipient is the first member in order who has NOT received their payout yet
          const activeRecipient = !isCompleted ? members.find(m => !m.has_received_payout) : null;

          return members.map((member, index) => {
            const position = member.payout_position || (index + 1);
            const isReceived = isCompleted || member.has_received_payout;
            const isCurrent = !isCompleted && !isReceived && activeRecipient && member.id === activeRecipient.id;
            const payoutRecord = group.payouts?.find(p => p.round_number === position);

            return (
              <div
                key={member.id}
                className={`relative rounded-2xl transition-all p-3.5 sm:p-4 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isCurrent
                    ? 'bg-emerald-50/30 border-emerald-200'
                    : isReceived
                    ? 'bg-emerald-50/20 border-emerald-100 text-slate-800'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Left: Position # and Saver Avatar + Name */}
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${
                    isReceived
                      ? 'bg-emerald-100 text-emerald-800'
                      : isCurrent 
                      ? 'bg-emerald-500 text-white font-black ring-2 ring-emerald-300 ring-offset-1 shadow-2xs' 
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {position}
                  </span>

                  <button
                    type="button"
                    onClick={() => onProfileClick && onProfileClick(member)}
                    className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 border border-sky-200 flex items-center justify-center font-black text-[11px] hover:ring-2 hover:ring-sky-400 hover:scale-105 transition-all cursor-pointer shrink-0 shadow-2xs"
                    title="View saver reliability and profile details"
                  >
                    {getInitials(member.full_name)}
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900">{member.full_name}</span>
                  </div>
                </div>

                {/* Right: Payout Status & Amount */}
                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end space-x-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  {isReceived ? (
                    <div className="flex items-center gap-2.5 text-right">
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        <span>Received</span>
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
                        GH₵{payoutRecord?.amount || group.total_pool}
                      </span>
                    </div>
                  ) : isCurrent ? (
                    <div className="flex items-center gap-2.5 text-right">
                      <span className="inline-flex items-center gap-2 text-emerald-800 font-bold text-xs bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span>Receiving</span>
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-sky-600 font-mono">
                        GH₵{group.total_pool?.toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 text-right text-xs text-slate-600">
                      <span className="text-slate-500 font-medium">Turn #{position}</span>
                      <span className="text-xs font-mono font-medium text-slate-700">
                        GH₵{group.total_pool?.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          });
        })()}
      </div>

    </div>
  );
};
