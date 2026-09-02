import React, { useState, useEffect } from 'react';
import { 
  Search, 
  PlusCircle, 
  Users, 
  Coins, 
  KeyRound, 
  ChevronRight
} from 'lucide-react';
import { HeroBanner } from '../components/HeroBanner';
import { CircleCard } from '../components/CircleCard';
import { getGroups } from '../api/client';
import { useUser } from '../context/UserContext';

export const MarketplacePage = ({
  stats,
  onSelectCircle,
  openCreateModal,
  openJoinCodeModal,
  openCalculatorModal
}) => {
  const { isAuthenticated, openAuthModal } = useUser();
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState('ALL');
  const [rotationFilter, setRotationFilter] = useState('ALL');

  const fetchCircles = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (frequencyFilter !== 'ALL') params.frequency = frequencyFilter;
      if (rotationFilter !== 'ALL') params.rotation_type = rotationFilter;

      const data = await getGroups(params);
      setCircles(data || []);
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCircles();
  }, [frequencyFilter, rotationFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCircles();
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      
      {/* Susu Savings Overview */}
      <HeroBanner
        stats={stats}
        openCreateModal={openCreateModal}
        openJoinCodeModal={openJoinCodeModal}
        openCalculatorModal={openCalculatorModal}
      />

      {/* 🔍 Search & Filters Bar */}
      <div className="space-y-3">
        
        {/* Search Input with Bright, Clear Search Button */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Susu groups by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-28 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1"
          >
            <span>Search</span>
          </button>
        </form>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          
          {/* Frequency Filters */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 shrink-0">
            {['ALL', 'DAILY', 'WEEKLY', 'MONTHLY'].map((freq) => (
              <button
                key={freq}
                onClick={() => setFrequencyFilter(freq)}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  frequencyFilter === freq
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {freq === 'ALL' ? 'All Cycles' : freq.charAt(0) + freq.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Scheme Filters */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 shrink-0">
            {['ALL', 'SEQUENTIAL', 'BALLOT', 'BIDDING'].map((scheme) => (
              <button
                key={scheme}
                onClick={() => setRotationFilter(scheme)}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  rotationFilter === scheme
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {scheme === 'ALL' ? 'All Types' : scheme.charAt(0) + scheme.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* 📦 Susu Groups Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Available Susu Groups
          </h2>
          
          <button
            onClick={openJoinCodeModal}
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
          >
            <span>Have an invite code?</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-48 rounded-3xl bg-slate-100 animate-pulse border border-slate-200/60"
              />
            ))}
          </div>
        ) : circles.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto shadow-xs border border-sky-100">
              <Users size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">No Groups Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Be the first to launch a rotational savings circle for your peers or business network.
              </p>
            </div>
            <button
              onClick={() => {
                if (!isAuthenticated) openAuthModal();
                else openCreateModal();
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <PlusCircle size={16} />
              <span>Create New Group</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
