import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  Eye, 
  EyeOff, 
  CreditCard, 
  Lock, 
  Users, 
  Award,
  ChevronRight,
  Plus
} from 'lucide-react';
import { useUser } from '../context/UserContext';

export const HeroBanner = ({ stats, openCreateModal, openJoinCodeModal, openCalculatorModal }) => {
  const { user, isAuthenticated, openAuthModal } = useUser();
  const [hideBalances, setHideBalances] = useState(false);

  const pooledAmount = stats?.total_pooled_ghs ? Number(stats.total_pooled_ghs) : 0;
  const activeCircles = stats?.active_circles_count || 0;
  const userPoints = user?.points || 60;

  // Calculate target for next tier
  const tierTarget = 10000;
  const neededForSilver = Math.max(0, tierTarget - pooledAmount);
  const tierProgress = Math.min(100, Math.round((pooledAmount / tierTarget) * 100)) || 15;

  const handleAction = (callback) => {
    if (!isAuthenticated) openAuthModal();
    else callback();
  };

  return (
    <div className="space-y-6">
      
      {/* 🥉 Tier Progress Card (Exact Screenshot Style) */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-150 shadow-xs flex items-center gap-4">
        {/* Bronze/Gold Medal Thumbnail */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-amber-700 via-amber-600 to-amber-800 text-amber-100 flex items-center justify-center font-bold shadow-xs shrink-0 ring-4 ring-amber-100/60">
          <Award size={24} className="text-amber-200" />
        </div>

        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-800">
            <span>
              GHS {neededForSilver > 0 ? neededForSilver.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} to become a <strong className="text-slate-950 font-bold">Silver Achiever</strong>
            </span>
          </div>

          {/* Minimalist Progress Track */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${tierProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 📊 Portfolio Summary Section */}
      <div className="space-y-3.5">
        
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Portfolio Summary
          </h2>

          <div className="flex items-center gap-2 text-slate-500">
            <button
              onClick={() => setHideBalances(!hideBalances)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title={hideBalances ? "Show balances" : "Hide balances"}
              aria-label="Toggle Balance Visibility"
            >
              {hideBalances ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <button
              onClick={openCalculatorModal}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="Pot Return Calculator"
              aria-label="Calculator"
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>
        </div>

        {/* 3 Summary Cards Grid (Exact Screenshot Style: Blue, Green, Amber tiles) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          
          {/* Card 1: Flexible Investments (Blue Tile) */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-150 shadow-xs space-y-3 hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
              <CreditCard size={20} className="stroke-[2.2]" />
            </div>

            <div>
              <div className="text-xs font-medium text-slate-500">
                Flexible Investments
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-0.5 font-mono">
                {hideBalances ? '••••••' : `GHS ${pooledAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </div>
            </div>
          </div>

          {/* Card 2: Fixed Investments (Green Tile) */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-150 shadow-xs space-y-3 hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
              <Lock size={20} className="stroke-[2.2]" />
            </div>

            <div>
              <div className="text-xs font-medium text-slate-500">
                Fixed Investments
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-0.5 font-mono">
                {hideBalances ? '••••••' : 'GHS 0.00'}
              </div>
            </div>
          </div>

          {/* Card 3: Groups (Amber Tile) */}
          <div 
            onClick={() => handleAction(openCreateModal)}
            className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-150 shadow-xs space-y-3 hover:border-slate-300 transition-all flex flex-col justify-between col-span-2 sm:col-span-1 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Users size={20} className="stroke-[2.2]" />
              </div>
              <div className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-amber-100 text-slate-500 group-hover:text-amber-700 flex items-center justify-center transition-colors">
                <Plus size={14} />
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-slate-500">
                Groups
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-0.5">
                {activeCircles} active
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
