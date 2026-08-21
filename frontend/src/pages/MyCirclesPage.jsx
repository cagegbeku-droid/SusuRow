import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Loader2, 
  Coins, 
  Users 
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
    <div className="space-y-6">
      
      {/* Saver Account Banner */}
      <div className="bg-primary-900 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] text-primary-200 uppercase font-bold tracking-wider">Saver Profile</div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">
            {user?.full_name || 'My Account'}
          </h1>
          <div className="text-xs text-primary-200 font-mono mt-0.5">
            {user?.phone_number} • {user?.momo_provider}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-primary-800/80 px-4 py-2.5 rounded-2xl border border-primary-700 text-center">
            <div className="text-[10px] text-primary-200 uppercase font-semibold">My Groups</div>
            <div className="text-lg font-black text-white font-mono">{circles.length}</div>
          </div>

          <div className="bg-primary-800/80 px-4 py-2.5 rounded-2xl border border-primary-700 text-center">
            <div className="text-[10px] text-primary-200 uppercase font-semibold">Total Pot Value</div>
            <div className="text-lg font-black text-gold-400 font-mono">GH₵{totalPotsValue.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Group List Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-900">My Susu Groups & Cycles</h2>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
            {circles.length}
          </span>
        </div>

        <button
          onClick={openCreateModal}
          className="px-3.5 py-2 bg-primary-800 hover:bg-primary-900 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5 text-gold-300" />
          <span>Create Group</span>
        </button>
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="py-16 text-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary-700 mx-auto" />
          <p className="text-xs text-slate-500">Loading your groups...</p>
        </div>
      ) : circles.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No active groups yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
              You have not joined any Susu groups yet. Browse the marketplace or start your own.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-primary-800 hover:bg-primary-900 text-white font-bold text-xs rounded-xl shadow transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-gold-300" />
            <span>Create First Group</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
  );
};
