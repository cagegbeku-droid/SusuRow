import React from 'react';
import { 
  ArrowRight, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles, 
  Users, 
  Coins, 
  PlusCircle, 
  QrCode,
  Wallet
} from 'lucide-react';
import { useUser } from '../context/UserContext';

export const HeroBanner = ({ stats, openCreateModal, openJoinCodeModal, openCalculatorModal }) => {
  const { user, isAuthenticated, openAuthModal } = useUser();

  const handleCreate = () => {
    if (!isAuthenticated) {
      openAuthModal();
    } else {
      openCreateModal();
    }
  };

  const pooledAmount = stats?.total_pooled_ghs ? Number(stats.total_pooled_ghs) : 0;
  const activeCircles = stats?.active_circles_count || 0;
  const totalSavers = stats?.total_savers_count || 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* 💳 Ezpay Style Mint Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#00D09C] to-[#008F6B] p-6 sm:p-7 text-slate-950 shadow-[0_15px_35px_-5px_rgba(0,208,156,0.3)]">
        
        {/* Glow Orb */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/20 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 space-y-4">
          
          {/* Top greeting / Status Pill */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Wallet size={13} className="text-slate-950" />
                <span>Smart Rotational Savings</span>
              </span>
              <h2 className="text-sm sm:text-base font-bold text-slate-950 mt-0.5">
                {isAuthenticated ? `Welcome back, ${user?.full_name?.split(' ')[0]}!` : 'Digital Susu Banking'}
              </h2>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-xs font-bold text-slate-950">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
              <span>Bank of Ghana MoMo</span>
            </div>
          </div>

          {/* Large Total Balance Metric */}
          <div className="pt-1">
            <div className="text-xs text-slate-900 font-semibold">Total Pooled Savings in System</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 font-mono">
                GH₵{pooledAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Metrics Pill & Fast Action Button */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-950/15">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 bg-slate-950/15 text-slate-950 font-bold text-xs px-2.5 py-1 rounded-xl">
                <TrendingUp size={13} />
                <span>0% Loan Interest</span>
              </span>
              <span className="text-xs text-slate-900 font-bold hidden sm:inline">
                {activeCircles} Active Groups • {totalSavers} Savers
              </span>
            </div>

            <button
              onClick={handleCreate}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-950 text-[#00D09C] hover:bg-slate-900 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
              title="Create Susu Group"
            >
              <ArrowRight size={20} />
            </button>
          </div>

        </div>
      </div>

      {/* ⚡ Quick Action Cards Row (Ezpay style) */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        
        {/* Create Group Action */}
        <button
          onClick={handleCreate}
          className="dark-card dark-card-hover rounded-2xl sm:rounded-3xl p-3 sm:p-4 text-left space-y-1.5 cursor-pointer group border border-white/5"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#00D09C]/15 text-[#00D09C] flex items-center justify-center group-hover:scale-110 transition-transform">
            <PlusCircle size={18} />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Create Group</div>
            <div className="text-[10px] text-slate-400 hidden sm:block">Start a new savings circle</div>
          </div>
        </button>

        {/* Enter Code Action */}
        <button
          onClick={openJoinCodeModal}
          className="dark-card dark-card-hover rounded-2xl sm:rounded-3xl p-3 sm:p-4 text-left space-y-1.5 cursor-pointer group border border-white/5"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <QrCode size={18} />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Join with Code</div>
            <div className="text-[10px] text-slate-400 hidden sm:block">Enter private invite code</div>
          </div>
        </button>

        {/* Pot Calculator Action */}
        <button
          onClick={openCalculatorModal}
          className="dark-card dark-card-hover rounded-2xl sm:rounded-3xl p-3 sm:p-4 text-left space-y-1.5 cursor-pointer group border border-white/5"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#00D09C]/15 text-[#00D09C] flex items-center justify-center group-hover:scale-110 transition-transform">
            <Coins size={18} />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Calculator</div>
            <div className="text-[10px] text-slate-400 hidden sm:block">Estimate payout returns</div>
          </div>
        </button>

      </div>

    </div>
  );
};
