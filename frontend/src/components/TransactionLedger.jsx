import React, { useState } from 'react';
import { 
  Receipt, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export const TransactionLedger = ({ payments = [], payouts = [], members = [] }) => {
  const [copiedRef, setCopiedRef] = useState(null);

  // Combine and sort events by timestamp descending
  const events = [
    ...payments.map(p => {
      const member = members.find(m => m.id === p.member_id);
      return {
        id: p.id,
        type: 'CONTRIBUTION',
        round_number: p.round_number,
        amount: p.amount,
        phone_number: member?.phone_number || 'MoMo Wallet',
        full_name: member?.full_name || 'Saver',
        momo_provider: p.momo_provider,
        transaction_reference: p.transaction_reference,
        status: p.status,
        timestamp: new Date(p.paid_at)
      };
    }),
    ...payouts.map(po => {
      const member = members.find(m => m.id === po.member_id);
      return {
        id: po.id,
        type: 'POT_PAYOUT',
        round_number: po.round_number,
        amount: po.amount,
        phone_number: po.recipient_phone,
        full_name: po.member_name || member?.full_name || 'Pot Recipient',
        momo_provider: po.momo_provider,
        transaction_reference: po.transaction_reference,
        status: po.status,
        timestamp: new Date(po.disbursed_at)
      };
    })
  ].sort((a, b) => b.timestamp - a.timestamp);

  const handleCopyRef = (ref) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const getProviderBadge = (provider) => {
    switch (provider) {
      case 'MTN':
        return <span className="bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 font-black px-2 py-0.5 rounded-full text-[10px]">MTN</span>;
      case 'TELECEL':
        return <span className="bg-red-500/20 text-red-300 border border-red-500/30 font-black px-2 py-0.5 rounded-full text-[10px]">Telecel</span>;
      case 'AT':
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 font-black px-2 py-0.5 rounded-full text-[10px]">AT</span>;
      default:
        return <span className="bg-white/10 text-slate-300 font-bold px-2 py-0.5 rounded-full text-[10px]">{provider}</span>;
    }
  };

  if (events.length === 0) {
    return (
      <div className="dark-card rounded-3xl p-8 text-center text-slate-400 border border-white/5">
        <Receipt className="w-10 h-10 text-slate-600 mx-auto mb-2" />
        <p className="text-sm font-bold text-white">No transactions recorded yet</p>
        <p className="text-xs text-slate-400 mt-1">
          Contributions and pot payouts will appear here with live references.
        </p>
      </div>
    );
  }

  return (
    <div className="dark-card rounded-3xl overflow-hidden shadow-lg border border-white/5">
      <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Receipt className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm sm:text-base font-black text-white font-display">Ghana MoMo Settlement Ledger</h3>
        </div>
        <span className="text-xs text-slate-400 font-bold">
          {events.length} Settled Record{events.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0E1322] text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-white/5">
            <tr>
              <th className="py-3 px-4">Event Type</th>
              <th className="py-3 px-4">Round</th>
              <th className="py-3 px-4">Saver</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Reference</th>
              <th className="py-3 px-4 text-right">Settled At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {events.map((evt) => {
              const isPayout = evt.type === 'POT_PAYOUT';
              return (
                <tr key={evt.id} className="hover:bg-white/[0.02] transition-colors">
                  
                  {/* Event Type */}
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-1.5">
                      {isPayout ? (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30 text-[10px]">
                          <ArrowUpRight className="w-3 h-3 text-amber-400" />
                          <span>Lump-Sum Disbursed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 text-[10px]">
                          <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                          <span>Contribution Paid</span>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Round */}
                  <td className="py-3 px-4 font-bold text-slate-300">
                    Round #{evt.round_number}
                  </td>

                  {/* Saver */}
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-white">{evt.full_name}</span>
                      {getProviderBadge(evt.momo_provider)}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">{evt.phone_number}</div>
                  </td>

                  {/* Amount */}
                  <td className="py-3 px-4">
                    <span className={`font-black font-mono text-sm ${isPayout ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {isPayout ? '+' : '-'}GH₵{evt.amount?.toLocaleString()}
                    </span>
                  </td>

                  {/* Transaction Ref */}
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleCopyRef(evt.transaction_reference)}
                      className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-300 hover:text-white bg-[#0E1322] px-2 py-1 rounded-xl transition-all border border-white/5 cursor-pointer"
                      title="Click to copy transaction reference"
                    >
                      <span>{evt.transaction_reference}</span>
                      {copiedRef === evt.transaction_reference ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-500" />
                      )}
                    </button>
                  </td>

                  {/* Timestamp */}
                  <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px]">
                    {evt.timestamp.toLocaleDateString()} {evt.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
