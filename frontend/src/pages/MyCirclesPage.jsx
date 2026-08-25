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
  Phone
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

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      
      {/* 💼 Saver Portfolio Card (Ezpay Mint Style) */}
      <div className="relative overflow-hidden rounded-3xl sm:rounded-[2rem] bg-gradient-to-br from-[#00D09C] to-[#008F6B] p-6 sm:p-7 text-slate-950 shadow-[0_15px_35px_-5px_rgba(0,208,156,0.3)]">
        
        {/* Glow Element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-950 bg-slate-950/15 px-2.5 py-0.5 rounded-full border border-black/10">
                Saver Portfolio
              </span>
              <span className="text-xs text-slate-900 font-bold">
                {user?.momo_provider || 'MTN'} MoMo
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-950">
              {user?.full_name || 'My Groups'}
            </h1>
            
            <p className="text-xs text-slate-900 font-bold font-mono flex items-center gap-1.5">
              <Phone size={12} className="text-slate-950" />
              <span>{user?.phone_number || 'No Phone Linked'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            
            <div className="bg-slate-950/85 px-4 py-3 rounded-2xl border border-white/10 text-center min-w-[100px] text-white">
              <div className="text-[10px] text-slate-400 uppercase font-bold">My Groups</div>
              <div className="text-xl font-black text-white font-mono mt-0.5">{circles.length}</div>
            </div>

            <div className="bg-slate-950/85 px-5 py-3 rounded-2xl border border-white/10 text-center min-w-[140px] text-white">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Total Pot Value</div>
              <div className="text-xl font-black text-[#00D09C] font-mono mt-0.5">
                GH₵{totalPotsValue.toLocaleString()}
              </div>
            </div>

          </div>

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
