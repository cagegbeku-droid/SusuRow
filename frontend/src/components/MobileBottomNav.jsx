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
    <div className="fixed bottom-3 inset-x-3 z-40 md:hidden pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <nav className="bg-[#11162A]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.6)] px-3 py-2 flex items-center justify-around">
          
          {/* Explore Groups */}
          <button
            onClick={() => setActiveView('marketplace')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              activeView === 'marketplace'
                ? 'text-blue-400 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${
              activeView === 'marketplace' ? 'bg-blue-600/25 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.5)]' : ''
            }`}>
              <Compass size={20} />
            </div>
            <span className="text-[10px] font-bold mt-0.5">Explore</span>
          </button>

          {/* My Groups */}
          <button
            onClick={handleMyCircles}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              activeView === 'my-circles'
                ? 'text-blue-400 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${
              activeView === 'my-circles' ? 'bg-blue-600/25 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.5)]' : ''
            }`}>
              <Users size={20} />
            </div>
            <span className="text-[10px] font-bold mt-0.5">My Groups</span>
          </button>

          {/* Floating Center Create Button */}
          <button
            onClick={onOpenCreateModal}
            className="flex flex-col items-center justify-center -mt-6 cursor-pointer group"
            aria-label="Create Susu Group"
          >
            <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-[0_0_25px_rgba(59,130,246,0.6)] border-3 border-[#080B11] group-active:scale-95 transition-all">
              <PlusCircle size={26} className="text-white" />
            </div>
            <span className="text-[9px] font-black text-amber-400 mt-1 uppercase tracking-wider">New</span>
          </button>

          {/* Refer & Earn */}
          <button
            onClick={onOpenReferralModal}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-2xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
          >
            <div className="p-1.5 rounded-xl text-amber-400">
              <Gift size={20} />
            </div>
            <span className="text-[10px] font-bold mt-0.5 text-amber-300">Refer</span>
          </button>

          {/* Menu Drawer Toggle */}
          <button
            onClick={onToggleSidebar}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-2xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
          >
            <div className="p-1.5 rounded-xl">
              <Menu size={20} />
            </div>
            <span className="text-[10px] font-bold mt-0.5">Menu</span>
          </button>

        </nav>
      </div>
    </div>
  );
}
