import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  Eye, 
  EyeOff, 
  Wallet, 
  Coins, 
  Users, 
  Plus,
  ArrowUpRight
} from 'lucide-react';
import { useUser } from '../context/UserContext';

export const HeroBanner = ({ stats, openCreateModal, openJoinCodeModal, openCalculatorModal }) => {
  const { user, isAuthenticated, openAuthModal } = useUser();
  const [hideBalances, setHideBalances] = useState(false);

  const pooledAmount = stats?.total_pooled_ghs ? Number(stats.total_pooled_ghs) : 0;
  const disbursedAmount = stats?.total_payouts_disbursed_ghs ? Number(stats.total_payouts_disbursed_ghs) : 0;
  const activeCircles = stats?.active_circles_count || 0;

  const handleAction = (callback) => {
    if (!isAuthenticated) openAuthModal();
    else callback();
  };

  return (
    <div className="space-y-4">
      
      {/* 📊 Susu Savings Overview Section */}
      <div className="space-y-3">
        
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Susu Savings Overview
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Real-time communal rotational savings metrics
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600">
            <button
              onClick={() => setHideBalances(!hideBalances)}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors cursor-pointer shadow-xs"
              title={hideBalances ? "Show amounts" : "Hide amounts"}
              aria-label="Toggle Amount Visibility"
            >
              {hideBalances ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button
              onClick={openCalculatorModal}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors cursor-pointer shadow-xs"
              title="Pot Calculator"
              aria-label="Calculator"
            >
              <SlidersHorizontal size={16} />
            </button>
          </div>
        </div>

        {/* 3 Susu Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          
          {/* Card 1: Total Savings Pooled (Blue Tile) */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
              <Wallet size={20} className="stroke-[2.2]" />
            </div>

            <div className="mt-3">
              <div className="text-xs font-semibold text-slate-500">
                Total Savings Pooled
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-0.5 font-mono">
                {hideBalances ? '••••••' : `GH₵ ${pooledAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </div>
            </div>
          </div>

          {/* Card 2: Total Payouts Disbursed (Green Tile) */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
              <Coins size={20} className="stroke-[2.2]" />
            </div>

            <div className="mt-3">
              <div className="text-xs font-semibold text-slate-500">
                Total Payouts Disbursed
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-0.5 font-mono">
                {hideBalances ? '••••••' : `GH₵ ${disbursedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </div>
            </div>
          </div>

          {/* Card 3: Active Susu Circles (Amber Tile) */}
          <div 
            onClick={() => handleAction(openCreateModal)}
            className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between col-span-2 sm:col-span-1 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Users size={20} className="stroke-[2.2]" />
              </div>
              <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-amber-100 text-slate-600 group-hover:text-amber-700 flex items-center justify-center transition-colors">
                <Plus size={15} />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-xs font-semibold text-slate-500">
                Active Susu Circles
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-0.5">
                {activeCircles} Active
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
