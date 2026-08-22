import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Loader2, 
  Coins, 
  Users, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight,
  Wallet,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { getUserGroups } from '../api/client';
import { CircleCard } from '../components/CircleCard';

export const MyCirclesPage = ({ onSelectCircle, openCreateModal }) => {
  const { user } = useUser();
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUserCircles = async () => {
    if (!user?.phone_number) return;
    setLoading(true);
    try {
      const data = await getUserGroups(user.phone_number);
      setCircles(data);
    } catch (err) {
      console.error('Failed to fetch groups', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserCircles();
  }, [user?.phone_number]);

  const totalPotsValue = circles.reduce((acc, c) => acc + (c.total_pool || 0), 0);

  // Categorized savings metrics (Image 1 style)
  const savingsCategories = [
    { title: "Business Expansion", target: "GH₵10,000", progress: 65, color: "from-blue-500 to-indigo-600" },
    { title: "School Fees / Tuition", target: "GH₵3,500", progress: 80, color: "from-emerald-500 to-teal-500" },
    { title: "Emergency Cushion", target: "GH₵5,000", progress: 45, color: "from-amber-500 to-amber-600" },
    { title: "Rent & Housing", target: "GH₵12,000", progress: 30, color: "from-rose-500 to-pink-600" },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      
      {/* 💼 Saver Wallet Banner (Matching Image 1) */}
      <div className="relative overflow-hidden rounded-3xl sm:rounded-[2rem] bg-gradient-to-br from-blue-900/60 via-[#141A2D] to-[#0E1322] border border-blue-500/25 p-6 sm:p-7 text-white shadow-xl">
        
        {/* Glow Element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                Saver Portfolio
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {user?.momo_provider} MoMo
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {user?.full_name || 'My Account'}
            </h1>
            
            <p className="text-xs text-slate-400 font-mono">
              Phone: {user?.phone_number}
            </p>
          </div>

          <div className="flex items-center gap-3">
            
            <div className="bg-[#0E1322] px-4 py-3 rounded-2xl border border-white/10 text-center min-w-[100px]">
              <div className="text-[10px] text-slate-400 uppercase font-bold">My Groups</div>
              <div className="text-xl font-black text-white font-mono mt-0.5">{circles.length}</div>
            </div>

            <div className="bg-[#0E1322] px-5 py-3 rounded-2xl border border-white/10 text-center min-w-[140px]">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Total Pot Value</div>
              <div className="text-xl font-black text-amber-400 font-mono mt-0.5">
                GH₵{totalPotsValue.toLocaleString()}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* 🎯 Savings Categories & Target Progress Meters (Inspired by Image 1) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-400" />
            <span>Savings Target Breakdown</span>
          </h3>
          <span className="text-[10px] font-bold text-slate-500">ROSCA Rotation Goals</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {savingsCategories.map((cat, idx) => (
            <div
              key={idx}
              className="dark-card rounded-2xl p-3.5 space-y-2 border border-white/5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 line-clamp-1">{cat.title}</span>
                <ChevronRight size={13} className="text-slate-500 shrink-0" />
              </div>
              <div className="text-sm font-black text-white font-mono">{cat.target}</div>
              
              {/* Progress bar */}
              <div className="w-full bg-[#0E1322] rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`bg-gradient-to-r ${cat.color} h-full rounded-full`}
                  style={{ width: `${cat.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 📦 Active Susu Groups Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-white">
              My Active Susu Groups
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#141A2D] text-slate-400 border border-white/5">
              {circles.length}
            </span>
          </div>

          <button
            onClick={openCreateModal}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle size={14} />
            <span>New Group</span>
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
            <p className="text-xs text-slate-400">Loading your groups...</p>
          </div>
        ) : circles.length === 0 ? (
          <div className="dark-card rounded-3xl p-10 text-center space-y-3 shadow-md max-w-md mx-auto">
            <div className="w-13 h-13 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">No active groups yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-0.5">
                You have not joined any Susu groups yet. Browse the marketplace or start your own.
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle size={14} />
              <span>Create First Group</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {circles.map((circle) => (
              <CircleCard
                key={circle.id}
                circle={circle}
                onSelect={onSelectCircle}
              />
            ))}
          </div>
        )}

      </div>

    </div>
  );
};
