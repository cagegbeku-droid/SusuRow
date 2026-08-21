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

export const RotationalTimeline = ({ group, onSelectRecipient }) => {
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
        return <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-1.5 py-0.2 rounded">MTN</span>;
      case 'TELECEL':
        return <span className="bg-red-100 text-red-800 border border-red-300 text-[10px] font-bold px-1.5 py-0.2 rounded">Telecel</span>;
      case 'AT':
        return <span className="bg-blue-100 text-blue-800 border border-blue-300 text-[10px] font-bold px-1.5 py-0.2 rounded">AT</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-1.5 py-0.2 rounded">{provider}</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-black text-slate-900 font-display">Rotational Hand Timeline</h3>
            <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-2 py-0.5 rounded-full">
              {isCompleted ? 'All Rounds Finished' : `Round ${currentRound} of ${group.members_count}`}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Peer-to-peer payout order and real-time lump-sum pot distribution state.
          </p>
        </div>

        {/* Current Round Live Pot status */}
        {!isCompleted && (
          <div className="flex items-center space-x-3 bg-amber-50/90 border border-amber-200/80 px-3.5 py-2 rounded-xl">
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase text-amber-800 tracking-wider">Current Round Pot</div>
              <div className="text-sm font-black text-amber-900 font-display">GH₵{group.total_pool?.toLocaleString()}</div>
            </div>
            <div className="h-8 w-px bg-amber-200"></div>
            <div className="text-left">
              <div className="text-[10px] font-bold text-amber-800">Contributions</div>
              <div className="text-xs font-bold text-amber-950">{paidCount} of {totalMembers} Paid</div>
            </div>
          </div>
        )}
      </div>

      {/* Visual Stepper Steps */}
      <div className="space-y-4">
        {members.map((member, index) => {
          const position = member.payout_position || (index + 1);
          const isPast = isCompleted || position < currentRound;
          const isCurrent = !isCompleted && position === currentRound;
          const isUpcoming = !isCompleted && position > currentRound;

          // Find disbursement record if paid out
          const payoutRecord = group.payouts?.find(p => p.round_number === position);

          return (
            <div
              key={member.id}
              className={`relative rounded-xl transition-all p-4 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                isCurrent
                  ? 'bg-gradient-to-r from-amber-50/90 via-amber-50/50 to-white border-amber-300 shadow-md ring-2 ring-amber-400/40 animate-pulse-gold'
                  : isPast
                  ? 'bg-emerald-50/40 border-emerald-200/80 hover:bg-emerald-50/70'
                  : 'bg-slate-50/60 border-slate-200/80 opacity-80 hover:opacity-100'
              }`}
            >
              {/* Left Side: Step Icon & Member Info */}
              <div className="flex items-center space-x-4">
                {/* Step Position Badge / Icon */}
                <div className="relative shrink-0">
                  {isPast ? (
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-emerald-950 flex items-center justify-center font-black text-sm shadow-md shadow-amber-500/40 border-2 border-white">
                      <Sparkles className="w-5 h-5 animate-spin-slow" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm border border-slate-300">
                      <span>#{position}</span>
                    </div>
                  )}

                  {/* Position number pill if current */}
                  {isCurrent && (
                    <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-emerald-950 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-white shadow-xs">
                      {position}
                    </span>
                  )}
                </div>

                {/* Member Details */}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-base font-bold text-slate-900">{member.full_name}</span>
                    {getProviderBadge(member.momo_provider)}
                    {isCurrent && (
                      <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                        Current Hand Recipient
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3 text-xs text-slate-500 font-mono mt-0.5">
                    <span>{member.phone_number}</span>
                    {member.bid_amount > 0 && (
                      <span className="text-amber-800 font-bold">
                        • Bid: GH₵{member.bid_amount}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Side: Status / Amount / MoMo Reference */}
              <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end space-x-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                {isPast ? (
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-800 flex items-center gap-1 justify-end">
                      <span>Received Pot:</span>
                      <strong className="text-sm font-black text-emerald-900 font-display">GH₵{payoutRecord?.amount || group.total_pool}</strong>
                    </div>
                    {payoutRecord && (
                      <div className="text-[10px] font-mono text-slate-500">
                        Ref: {payoutRecord.transaction_reference}
                      </div>
                    )}
                  </div>
                ) : isCurrent ? (
                  <div className="text-right">
                    <div className="text-xs font-bold text-amber-800">
                      Receiving Lump-Sum: <span className="text-sm font-black text-amber-950 font-display">GH₵{group.total_pool?.toLocaleString()}</span>
                    </div>
                    <div className="text-[11px] font-semibold text-slate-600 mt-0.5">
                      {paidCount === totalMembers ? (
                        <span className="text-emerald-700 font-bold">✓ All members paid. Ready for disbursement!</span>
                      ) : (
                        <span>{paidCount} of {totalMembers} contributed for Round {currentRound}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-right text-xs text-slate-500">
                    <div className="font-semibold text-slate-700">Turn #{position}</div>
                    <div className="text-[11px]">Scheduled Pot: GH₵{group.total_pool?.toLocaleString()}</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
