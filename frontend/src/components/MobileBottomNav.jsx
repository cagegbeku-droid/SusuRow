import React from 'react';
import { 
  Compass, 
  Users, 
  PlusCircle, 
  Gift, 
  Menu 
} from 'lucide-react';
import { useUser } from '../context/UserContext';

export default function MobileBottomNav({
  activeView,
  setActiveView,
  onToggleSidebar,
  onOpenCreateModal,
  onOpenReferralModal
}) {
  const { isAuthenticated, openAuthModal } = useUser();

  const handleMyCircles = () => {
    if (!isAuthenticated) {
      openAuthModal();
    } else {
      setActiveView('my-circles');
    }
  };

  return (
    <div className="fixed bottom-3 inset-x-0 z-40 md:hidden px-3 pointer-events-none w-full max-w-full flex justify-center">
      <div className="w-full max-w-sm pointer-events-auto">
        <nav className="bg-[#11162A]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] px-2 py-1.5 flex items-center justify-around">
          
          {/* Explore Groups */}
          <button
            onClick={() => setActiveView('marketplace')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer ${
              activeView === 'marketplace'
                ? 'text-blue-400 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${
              activeView === 'marketplace' ? 'bg-blue-600/25 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.5)]' : ''
            }`}>
              <Compass size={18} />
            </div>
            <span className="text-[9px] font-bold mt-0.5">Explore</span>
          </button>

          {/* My Groups */}
          <button
            onClick={handleMyCircles}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer ${
              activeView === 'my-circles'
                ? 'text-blue-400 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${
              activeView === 'my-circles' ? 'bg-blue-600/25 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.5)]' : ''
            }`}>
              <Users size={18} />
            </div>
            <span className="text-[9px] font-bold mt-0.5">My Groups</span>
          </button>

          {/* Floating Center Create Button */}
          <button
            onClick={onOpenCreateModal}
            className="flex flex-col items-center justify-center -mt-5 cursor-pointer group shrink-0"
            aria-label="Create Susu Group"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.6)] border-2 border-[#080B11] group-active:scale-95 transition-all">
              <PlusCircle size={22} className="text-white" />
            </div>
            <span className="text-[8px] font-black text-amber-400 mt-0.5 uppercase tracking-wider">New</span>
          </button>

          {/* Refer & Earn */}
          <button
            onClick={onOpenReferralModal}
            className="flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
          >
            <div className="p-1 rounded-xl text-amber-400">
              <Gift size={18} />
            </div>
            <span className="text-[9px] font-bold mt-0.5 text-amber-300">Refer</span>
          </button>

          {/* Menu Drawer Toggle */}
          <button
            onClick={onToggleSidebar}
            className="flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
          >
            <div className="p-1 rounded-xl">
              <Menu size={18} />
            </div>
            <span className="text-[9px] font-bold mt-0.5">Menu</span>
          </button>

        </nav>
      </div>
    </div>
  );
}
