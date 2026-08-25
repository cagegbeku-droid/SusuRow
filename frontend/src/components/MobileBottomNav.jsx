import React from 'react';
import { 
  Compass, 
  Users, 
  PlusCircle, 
  Gift, 
  User 
} from 'lucide-react';
import { useUser } from '../context/UserContext';

export default function MobileBottomNav({
  activeView,
  setActiveView,
  onOpenCreateModal,
  onOpenReferralModal
}) {
  const { isAuthenticated, openAuthModal, user } = useUser();

  const handleMyCircles = () => {
    if (!isAuthenticated) {
      openAuthModal();
    } else {
      setActiveView('my-circles');
    }
  };

  const handleProfile = () => {
    if (!isAuthenticated) {
      openAuthModal();
    } else {
      setActiveView('profile');
    }
  };

  return (
    <div className="fixed bottom-3 inset-x-0 z-40 md:hidden px-3 pointer-events-none w-full max-w-full flex justify-center">
      <div className="w-full max-w-sm pointer-events-auto">
        <nav className="bg-[#131A2E]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] px-2 py-1.5 flex items-center justify-around">
          
          {/* Explore Groups */}
          <button
            onClick={() => setActiveView('marketplace')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer ${
              activeView === 'marketplace'
                ? 'text-[#00D09C] font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${
              activeView === 'marketplace' ? 'bg-[#00D09C]/15 text-[#00D09C]' : ''
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
                ? 'text-[#00D09C] font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${
              activeView === 'my-circles' ? 'bg-[#00D09C]/15 text-[#00D09C]' : ''
            }`}>
              <Users size={18} />
            </div>
            <span className="text-[9px] font-bold mt-0.5">My Groups</span>
          </button>

          {/* Floating Center Create Button (Ezpay Mint Style) */}
          <button
            onClick={onOpenCreateModal}
            className="flex flex-col items-center justify-center -mt-5 cursor-pointer group shrink-0"
            aria-label="Create Susu Group"
          >
            <div className="w-12 h-12 rounded-full bg-[#00D09C] text-slate-950 flex items-center justify-center shadow-[0_0_20px_rgba(0,208,156,0.5)] border-2 border-[#080C16] group-active:scale-95 transition-all">
              <PlusCircle size={22} className="stroke-[2.5]" />
            </div>
            <span className="text-[8px] font-bold text-[#00D09C] mt-0.5 uppercase tracking-wider">New</span>
          </button>

          {/* Refer & Earn */}
          <button
            onClick={onOpenReferralModal}
            className="flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
          >
            <div className="p-1 rounded-xl text-slate-300">
              <Gift size={18} />
            </div>
            <span className="text-[9px] font-bold mt-0.5 text-slate-400">Refer</span>
          </button>

          {/* Profile & KYC */}
          <button
            onClick={handleProfile}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer ${
              activeView === 'profile'
                ? 'text-[#00D09C] font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${
              activeView === 'profile' ? 'bg-[#00D09C]/15 text-[#00D09C]' : ''
            }`}>
              <User size={18} />
            </div>
            <span className="text-[9px] font-bold mt-0.5">Profile</span>
          </button>

        </nav>
      </div>
    </div>
  );
}
