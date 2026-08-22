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
  ArrowUpRight
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
      
      {/* 💳 Hero Wallet / Total Balance Card (Inspired by Image 1) */}
      <div className="relative overflow-hidden rounded-3xl sm:rounded-[2rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-5 sm:p-7 text-white shadow-[0_15px_35px_-5px_rgba(59,130,246,0.5)]">
        
        {/* Subtle Wave Sparkline Background (SVG) */}
        <svg 
          className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" 
          viewBox="0 0 500 200" 
          preserveAspectRatio="none"
        >
          <path 
            d="M0,150 C100,180 150,80 250,110 C350,140 400,40 500,70 L500,200 L0,200 Z" 
            fill="currentColor"
          />
          <path 
            d="M0,150 C100,180 150,80 250,110 C350,140 400,40 500,70" 
            fill="none" 
            stroke="#ffffff" 
            strokeWidth="3"
          />
        </svg>

        {/* Glow Orb */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 space-y-4">
          
          {/* Top greeting / Status Pill */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-blue-100 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={12} className="text-amber-300" />
                <span>Ghana Digital ROSCA</span>
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white">
                {isAuthenticated ? `Welcome back, ${user?.full_name?.split(' ')[0]}!` : 'Communal Rotating Savings'}
              </h2>
            </div>

            <div className="flex items-center gap-1.5 bg-black/25 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 text-xs font-bold text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Live MoMo</span>
            </div>
          </div>

          {/* Large Total Balance Metric (Matching Image 1) */}
          <div className="pt-1">
            <div className="text-xs text-blue-100 font-medium">Total Pooled Savings</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white font-mono">
                GH₵{pooledAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Metrics Pill & Fast Action Button */}
          <div className="flex items-center justify-between pt-2 border-t border-white/15">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 bg-white/15 text-white font-black text-xs px-2.5 py-1 rounded-xl">
                <TrendingUp size={13} className="text-amber-300" />
                <span>0% Loan Interest</span>
              </span>
              <span className="text-xs text-blue-100 font-semibold hidden sm:inline">
                {activeCircles} Active Groups • {totalSavers} Savers
              </span>
            </div>

            <button
              onClick={handleCreate}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white text-blue-900 hover:bg-blue-50 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
              title="Create Susu Group"
            >
              <ArrowRight size={20} className="text-blue-700" />
            </button>
          </div>

        </div>
      </div>

      {/* ⚡ Quick Action Cards Row (Image 1 style) */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        
        {/* Create Group Action */}
        <button
          onClick={handleCreate}
          className="dark-card dark-card-hover rounded-2xl sm:rounded-3xl p-3 sm:p-4 text-left space-y-1.5 cursor-pointer group"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <PlusCircle size={18} />
          </div>
          <div>
            <div className="text-xs font-black text-white">Create Group</div>
            <div className="text-[10px] text-slate-400 hidden sm:block">Start a new savings circle</div>
          </div>
        </button>

        {/* Enter Code Action */}
        <button
          onClick={openJoinCodeModal}
          className="dark-card dark-card-hover rounded-2xl sm:rounded-3xl p-3 sm:p-4 text-left space-y-1.5 cursor-pointer group"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <QrCode size={18} />
          </div>
          <div>
            <div className="text-xs font-black text-white">Join with Code</div>
            <div className="text-[10px] text-slate-400 hidden sm:block">Enter private invite code</div>
          </div>
        </button>

        {/* Pot Calculator Action */}
        <button
          onClick={openCalculatorModal}
          className="dark-card dark-card-hover rounded-2xl sm:rounded-3xl p-3 sm:p-4 text-left space-y-1.5 cursor-pointer group"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Coins size={18} />
          </div>
          <div>
            <div className="text-xs font-black text-white">Calculator</div>
            <div className="text-[10px] text-slate-400 hidden sm:block">Estimate payout returns</div>
          </div>
        </button>

      </div>

    </div>
  );
};
