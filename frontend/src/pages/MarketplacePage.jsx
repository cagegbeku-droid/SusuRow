import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  RotateCw, 
  Coins, 
  Loader2, 
  PlusCircle, 
  Users,
  Shuffle,
  Gavel,
  ShieldCheck,
  Sparkles,
  Plus
} from 'lucide-react';
import { getGroups } from '../api/client';
import { CircleCard } from '../components/CircleCard';
import { HeroBanner } from '../components/HeroBanner';
import { useUser } from '../context/UserContext';

export const MarketplacePage = ({
  stats,
  onSelectCircle,
  openCreateModal,
  openJoinCodeModal,
  openCalculatorModal
}) => {
  const { user, isAuthenticated, openAuthModal } = useUser();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState('ALL');
  const [rotationFilter, setRotationFilter] = useState('ALL');

  const fetchCircles = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (frequencyFilter !== 'ALL') filters.frequency = frequencyFilter;
      if (rotationFilter !== 'ALL') filters.rotation_type = rotationFilter;
      if (search.trim()) filters.search = search.trim();

      const data = await getGroups(filters);
      setGroups(data);
    } catch (err) {
      console.error('Failed to load groups', err);
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

  // Mock avatar portraits for "Recent Savers / Active Turns" row (Image 1 style)
  const activeSavers = [
    { name: "Kofi", initial: "K", round: "Turn 1", color: "from-blue-600 to-indigo-600" },
    { name: "Ama", initial: "A", round: "Turn 2", color: "from-amber-500 to-amber-600" },
    { name: "Kwame", initial: "K", round: "Turn 3", color: "from-emerald-500 to-teal-600" },
    { name: "Akosua", initial: "A", round: "Turn 4", color: "from-rose-500 to-pink-600" },
    { name: "Yaw", initial: "Y", round: "Turn 5", color: "from-violet-600 to-purple-600" },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      
      {/* Hero Total Balance Card */}
      <HeroBanner
        stats={stats}
        openCreateModal={openCreateModal}
        openJoinCodeModal={openJoinCodeModal}
        openCalculatorModal={openCalculatorModal}
      />

      {/* 👥 Recent Savers in Rotation Row (Inspired by Image 1) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-amber-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
              Active Savers & Turn Recipients
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-500">Live Community</span>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {/* Add / Invite Button Circle */}
          <button
            onClick={() => {
              if (!isAuthenticated) openAuthModal();
              else openCreateModal();
            }}
            className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
          >
            <div className="w-13 h-13 rounded-full bg-[#141A2D] hover:bg-[#1C233A] border-2 border-dashed border-white/20 hover:border-blue-400 text-slate-400 hover:text-white flex items-center justify-center transition-all group-active:scale-95 shadow-md">
              <Plus size={20} />
            </div>
            <span className="text-[11px] font-bold text-slate-400">Join</span>
          </button>

          {/* Saver Avatar Circles */}
          {activeSavers.map((saver, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center gap-1.5 shrink-0"
            >
              <div className={`w-13 h-13 rounded-full bg-gradient-to-tr ${saver.color} text-white font-black text-base flex items-center justify-center shadow-lg ring-2 ring-[#080B11]`}>
                {saver.initial}
              </div>
              <div className="text-center">
                <div className="text-[11px] font-bold text-white leading-none">{saver.name}</div>
                <div className="text-[9px] font-semibold text-slate-400 mt-0.5">{saver.round}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🔍 Search & Filters Bar */}
      <div className="space-y-3">
        
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Susu groups (e.g. Accra Traders, Tech Savers)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-24 py-3 rounded-2xl sm:rounded-3xl bg-[#141A2D] border border-white/10 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition-all cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          
          {/* Frequency Filters */}
          <div className="flex items-center gap-1 bg-[#141A2D] p-1 rounded-2xl border border-white/5 shrink-0">
            {['ALL', 'DAILY', 'WEEKLY', 'MONTHLY'].map((freq) => (
              <button
                key={freq}
                onClick={() => setFrequencyFilter(freq)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  frequencyFilter === freq
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {freq === 'ALL' ? 'All Schedules' : freq.charAt(0) + freq.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Scheme Filters */}
          <div className="flex items-center gap-1 bg-[#141A2D] p-1 rounded-2xl border border-white/5 shrink-0">
            {['ALL', 'SEQUENTIAL', 'BALLOT', 'BIDDING'].map((scheme) => (
              <button
                key={scheme}
                onClick={() => setRotationFilter(scheme)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  rotationFilter === scheme
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {scheme === 'ALL' ? 'All Schemes' : scheme.charAt(0) + scheme.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* 📦 Susu Groups Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-white">
              Available Susu Groups
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#141A2D] text-slate-400 border border-white/5">
              {groups.length}
            </span>
          </div>

          <button
            onClick={() => {
              if (!isAuthenticated) openAuthModal();
              else openCreateModal();
            }}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 cursor-pointer"
          >
            <PlusCircle size={14} />
            <span>Create New</span>
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
            <p className="text-xs text-slate-400">Loading live Susu groups...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="dark-card rounded-3xl p-10 text-center space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto">
              <Coins className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">No Susu groups found</h3>
              <p className="text-xs text-slate-400 mt-1">
                Be the first to start a rotational savings group in this category.
              </p>
            </div>
            <button
              onClick={() => {
                if (!isAuthenticated) openAuthModal();
                else openCreateModal();
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle size={15} />
              <span>Create First Group</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {groups.map((group) => (
              <CircleCard
                key={group.id}
                circle={group}
                onSelect={onSelectCircle}
              />
            ))}
          </div>
        )}

      </div>

    </div>
  );
};
