import React, { useState, useEffect } from 'react';
import { 
  Search, 
  PlusCircle, 
  KeyRound, 
  RefreshCw, 
  Loader2, 
  Users 
} from 'lucide-react';
import { getGroups } from '../api/client';
import { CircleCard } from '../components/CircleCard';
import { HeroBanner } from '../components/HeroBanner';

export const MarketplacePage = ({ 
  stats, 
  onSelectCircle, 
  openCreateModal, 
  openJoinCodeModal, 
  openCalculatorModal 
}) => {
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFrequency, setSelectedFrequency] = useState('ALL');
  const [selectedRotation, setSelectedRotation] = useState('ALL');

  const fetchCircles = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (selectedFrequency !== 'ALL') filters.frequency = selectedFrequency;
      if (selectedRotation !== 'ALL') filters.rotation_type = selectedRotation;
      if (search.trim()) filters.search = search.trim();
      filters.is_private = false;

      const data = await getGroups(filters);
      setCircles(data);
    } catch (err) {
      console.error('Failed to load groups', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCircles();
  }, [selectedFrequency, selectedRotation]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCircles();
  };

  return (
    <div className="space-y-6">
      
      {/* Hero Banner */}
      <HeroBanner 
        stats={stats} 
        onExploreClick={() => {
          document.getElementById('marketplace-grid')?.scrollIntoView({ behavior: 'smooth' });
        }}
        onCalculatorClick={openCalculatorModal}
      />

      {/* Search & Action Controls */}
      <div id="marketplace-grid" className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search groups by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-700 text-xs sm:text-sm font-medium text-slate-900"
            />
          </form>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={openJoinCodeModal}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-600" />
              <span>Enter Group Code</span>
            </button>

            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 rounded-xl bg-primary-800 hover:bg-primary-900 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-gold-300" />
              <span>Create Group</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-bold mr-1">Cycle Schedule:</span>
            {['ALL', 'DAILY', 'WEEKLY', 'MONTHLY'].map((freq) => (
              <button
                key={freq}
                onClick={() => setSelectedFrequency(freq)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedFrequency === freq
                    ? 'bg-primary-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {freq === 'ALL' ? 'All' : freq.charAt(0) + freq.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-bold mr-1">Turn Order:</span>
            {[
              { id: 'ALL', label: 'All' },
              { id: 'SEQUENTIAL', label: 'Turn by Turn' },
              { id: 'BALLOT', label: 'Ballot Draw' },
              { id: 'BIDDING', label: 'Bidding' }
            ].map((rot) => (
              <button
                key={rot.id}
                onClick={() => setSelectedRotation(rot.id)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedRotation === rot.id
                    ? 'bg-gold-500 text-slate-950 shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {rot.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Available Groups Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Available Susu Groups</h2>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              {circles.length}
            </span>
          </div>

          <button
            onClick={fetchCircles}
            className="text-xs font-bold text-primary-800 hover:text-primary-900 flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary-700 mx-auto" />
            <p className="text-xs text-slate-500">Loading available groups...</p>
          </div>
        ) : circles.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">No active groups found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
                Create a new Susu group and invite your peers to start saving.
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

    </div>
  );
};
