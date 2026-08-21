import React from 'react';
import { Coins, ArrowRight, Sparkles, Users, RefreshCw } from 'lucide-react';

export const HeroBanner = ({ stats, onExploreClick, onCalculatorClick }) => {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-primary-950 via-primary-900 to-teal-950 text-white p-5 sm:p-7 shadow-xl border border-primary-800/60 mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-primary-800/80 border border-primary-600/50 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-gold-300">
            <Sparkles className="w-3 h-3" />
            <span>Digital Susu • Ghana</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
            Save Together in <span className="text-gold-400">Groups</span>.<br />
            Rotate Lump-Sum <span className="text-emerald-400">Cycles</span>.
          </h1>

          <p className="text-primary-100 text-xs sm:text-sm max-w-md">
            Join a Group. Pay fixed amounts via MoMo each turn. Receive the total pot when it’s your turn. <strong>0% interest.</strong>
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={onExploreClick}
              className="px-4 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-slate-950 font-bold text-xs shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Explore Groups</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onCalculatorClick}
              className="px-3.5 py-2.5 rounded-xl bg-primary-800 hover:bg-primary-700 text-white font-semibold text-xs border border-primary-600 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Coins className="w-3.5 h-3.5 text-gold-300" />
              <span>Cycle Calculator</span>
            </button>
          </div>
        </div>

        {/* Right Column: Platform Overview */}
        <div className="lg:col-span-5">
          <div className="bg-primary-950/70 border border-primary-700/60 rounded-2xl p-4 space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-primary-200">
              Live Network Summary
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-primary-900/60 p-2.5 rounded-xl border border-primary-800/60">
                <div className="text-[10px] text-primary-200">Total Saved</div>
                <div className="text-base sm:text-lg font-black text-gold-300 font-mono">
                  GH₵{stats?.total_pooled_ghs?.toLocaleString() || '0'}
                </div>
              </div>

              <div className="bg-primary-900/60 p-2.5 rounded-xl border border-primary-800/60">
                <div className="text-[10px] text-primary-200">Pots Paid Out</div>
                <div className="text-base sm:text-lg font-black text-white font-mono">
                  GH₵{stats?.total_payouts_disbursed_ghs?.toLocaleString() || '0'}
                </div>
              </div>

              <div className="bg-primary-900/60 p-2.5 rounded-xl border border-primary-800/60">
                <div className="text-[10px] text-primary-200">Active Groups</div>
                <div className="text-base sm:text-lg font-black text-white font-mono">
                  {stats?.active_circles_count || 0}
                </div>
              </div>

              <div className="bg-primary-900/60 p-2.5 rounded-xl border border-primary-800/60">
                <div className="text-[10px] text-primary-200">Active Savers</div>
                <div className="text-base sm:text-lg font-black text-white font-mono">
                  {stats?.total_savers_count || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
