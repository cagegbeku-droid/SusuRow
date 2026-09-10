import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Loader2, 
  Coins, 
  Users, 
  Phone,
  Wallet
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { getUserGroups } from '../api/client';
import { CircleCard } from '../components/CircleCard';

export const MyCirclesPage = ({ onSelectCircle, openCreateModal, refreshKey }) => {
  const { user } = useUser();
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUserCircles = async () => {
    if (!user?.phone_number) return;
    setLoading(true);
    try {
      const data = await getUserGroups(user.phone_number);
      setCircles(data || []);
    } catch (err) {
      console.error('Failed to fetch groups', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserCircles();
  }, [user?.phone_number, refreshKey]);

  const totalPotsValue = circles.reduce((acc, c) => acc + (c.total_pool || 0), 0);

  // Compute user's next payout across all active circles
  const activeCirclesWithPayout = circles.filter(
    c => c.status === 'ACTIVE' && c.user_payout_position && !c.user_has_received_payout
  );

  // Check if user is current round winner anywhere
  const currentWinnerCircle = activeCirclesWithPayout.find(
    c => c.user_payout_position === c.current_round
  );

  // Nearest upcoming payout
  const upcomingPayoutCircles = activeCirclesWithPayout
    .filter(c => c.user_payout_position > c.current_round)
    .sort((a, b) => (a.user_payout_position - a.current_round) - (b.user_payout_position - b.current_round));
  const nextPayoutCircle = upcomingPayoutCircles[0];

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      
      {/* 💼 Saver Portfolio Header Card (Clean Crisp Light Theme) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
              Saver Portfolio
            </span>
            <span className="text-xs text-slate-600 font-semibold">
              {user?.momo_provider || 'Mobile Money'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {user?.full_name || 'My Groups'}
          </h1>
          
          <p className="text-xs text-slate-500 font-semibold font-mono flex items-center gap-1.5">
            <Phone size={13} className="text-slate-400" />
            <span>{user?.phone_number || 'No Phone Linked'}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          
          <div className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200 text-center min-w-[90px]">
            <div className="text-[10px] text-slate-500 uppercase font-bold">My Groups</div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">{circles.length}</div>
          </div>

          {/* Next Payout Highlight Card */}
          <div className={`px-4 py-3 rounded-2xl border text-center min-w-[130px] ${
            currentWinnerCircle
              ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="text-[10px] uppercase font-bold text-slate-500">
              {currentWinnerCircle ? '🎉 Next Payout (Your Turn!)' : 'Next Payout'}
            </div>
            <div className={`text-xl font-bold font-mono mt-0.5 ${
              currentWinnerCircle ? 'text-amber-600 font-black' : 'text-emerald-600'
            }`}>
              {currentWinnerCircle ? (
                `GH₵${(currentWinnerCircle.total_pool || 0).toLocaleString()}`
              ) : nextPayoutCircle ? (
                `GH₵${(nextPayoutCircle.total_pool || 0).toLocaleString()}`
              ) : (
                'GH₵0.00'
              )}
            </div>
            <div className="text-[10px] text-slate-500 font-medium truncate max-w-[130px] mt-0.5">
              {currentWinnerCircle ? (
                `Round ${currentWinnerCircle.current_round} Winner`
              ) : nextPayoutCircle ? (
                `Round ${nextPayoutCircle.user_payout_position} (${nextPayoutCircle.user_payout_position - nextPayoutCircle.current_round} round${nextPayoutCircle.user_payout_position - nextPayoutCircle.current_round > 1 ? 's' : ''} away)`
              ) : (
                'None Pending'
              )}
            </div>
          </div>

          <div className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200 text-center min-w-[120px]">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Total Pot Value</div>
            <div className="text-xl font-bold text-sky-600 font-mono mt-0.5">
              GH₵{totalPotsValue.toLocaleString()}
            </div>
          </div>

        </div>

      </div>

      {/* 📦 Active Susu Groups Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              My Active Susu Groups
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {circles.length}
            </span>
          </div>

          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <PlusCircle size={15} />
            <span>New Group</span>
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-sky-600 mx-auto" />
            <p className="text-xs text-slate-500">Loading your groups...</p>
          </div>
        ) : circles.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center space-y-4 shadow-xs border border-slate-200 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto border border-sky-100 shadow-xs">
              <Coins className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">No active groups yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You have not joined any Susu groups yet. Browse the marketplace or start your own.
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-full shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <PlusCircle size={15} />
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
