import React from 'react';
import { 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  Coins, 
  ArrowRight, 
  ShieldCheck,
  Smartphone,
  Info
} from 'lucide-react';

export const RotationalTimeline = ({ group }) => {
  if (!group || !group.members) return null;

  const currentRound = group.current_round || 1;
  const isCompleted = group.status === 'COMPLETED';

  // Sort members by payout_position
  const members = [...group.members].sort((a, b) => (a.payout_position || 999) - (b.payout_position || 999));
  
  // Paid count for current round
  const paidCount = group.members.filter(m => m.has_paid_current_round).length;
  const totalMembers = group.members.length;

  const getProviderBadge = (provider) => {
    switch (provider) {
      case 'MTN':
        return <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full">MTN</span>;
      case 'TELECEL':
        return <span className="bg-red-100 text-red-900 border border-red-300 text-[10px] font-black px-2 py-0.5 rounded-full">Telecel</span>;
      case 'AT':
        return <span className="bg-sky-100 text-sky-900 border border-sky-300 text-[10px] font-black px-2 py-0.5 rounded-full">AT</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 border border-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">{provider}</span>;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base sm:text-lg font-black text-slate-900 font-display">Rotational Cycle Timeline</h3>
            <span className="bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {isCompleted ? 'Completed' : `Round ${currentRound} of ${group.members_count}`}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Turn-by-turn payout schedule. Payouts are sent directly to each member's Mobile Money wallet on their turn.
          </p>
        </div>

        {/* Current Round Live Pot status */}
        {!isCompleted && (
          <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl">
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Collected This Round</div>
              <div className="text-sm font-black text-slate-900 font-mono">GH₵{(paidCount * (group.contribution_amount || 0)).toFixed(2)}</div>
            </div>
            <div className="h-7 w-px bg-slate-200"></div>
            <div className="text-left">
              <div className="text-[10px] font-bold text-slate-500">Paid</div>
              <div className="text-xs font-black text-slate-900">{paidCount} of {group.members_count}</div>
            </div>
          </div>
        )}
      </div>

      {/* Visual Stepper Steps */}
      <div className="space-y-3">
        {(() => {
          // The active recipient is the first member in order who has NOT received their payout yet
          const activeRecipient = !isCompleted ? members.find(m => !m.has_received_payout) : null;

          return members.map((member, index) => {
            const position = member.payout_position || (index + 1);
            const isReceived = isCompleted || member.has_received_payout;
            const isCurrent = !isCompleted && !isReceived && activeRecipient && member.id === activeRecipient.id;
            const isUpcoming = !isCompleted && !isReceived && !isCurrent;

            const payoutRecord = group.payouts?.find(p => p.round_number === position);

            return (
              <div
                key={member.id}
                className={`relative rounded-2xl transition-all p-3.5 sm:p-4 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isCurrent
                    ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-300 shadow-xs'
                    : isReceived
                    ? 'bg-emerald-50/40 border-emerald-200 text-slate-800'
                    : 'bg-slate-50/70 border-slate-200 opacity-80 hover:opacity-100'
                }`}
              >
                {/* Left: Step Icon & Member Info */}
                <div className="flex items-center space-x-3.5">
                  {/* Step Position Icon */}
                  <div className="relative shrink-0">
                    {isReceived ? (
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-300">
                        <CheckCircle2 size={18} />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center font-black text-xs shadow-xs">
                        <Sparkles size={15} />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-300">
                        <span>#{position}</span>
                      </div>
                    )}
                  </div>

                  {/* Member Details */}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-900">{member.full_name}</span>
                      {getProviderBadge(member.momo_provider)}
                      {isCurrent && (
                        <span className="bg-amber-400 text-slate-900 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                          Receiving This Round
                        </span>
                      )}
                      {isReceived && (
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full">
                          Received
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3 text-xs text-slate-600 font-mono mt-0.5">
                      <span>{member.phone_number}</span>
                      {member.bid_amount > 0 && (
                        <span className="text-amber-700 font-bold">
                          • Bid: GH₵{member.bid_amount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Status / Amount */}
                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end space-x-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                  {isReceived ? (
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-700 flex items-center gap-1 justify-end">
                        <span>Received:</span>
                        <strong className="text-xs sm:text-sm font-black text-slate-900 font-mono">GH₵{payoutRecord?.amount || group.total_pool}</strong>
                      </div>
                      {payoutRecord && (
                        <div className="text-[10px] font-mono text-slate-500">
                          Ref: {payoutRecord.transaction_reference}
                        </div>
                      )}
                    </div>
                  ) : isCurrent ? (
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900">
                        Payout: <span className="text-xs sm:text-sm font-black text-sky-600 font-mono">GH₵{group.total_pool?.toLocaleString()}</span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                        <span>{paidCount} of {totalMembers} contributed</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-right text-xs text-slate-600">
                      <div className="font-semibold text-slate-800">Turn #{position}</div>
                      <div className="text-[11px] font-mono text-slate-500">Payout: GH₵{group.total_pool?.toLocaleString()}</div>
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
