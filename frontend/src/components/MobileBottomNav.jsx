import React from 'react';
import { Compass, Users, PlusCircle, Gift, Menu } from 'lucide-react';
import { useUser } from '../context/UserContext';

export default function MobileBottomNav({
  activeView,
  setActiveView,
  onToggleSidebar,
  onOpenCreateModal,
  onOpenReferralModal
}) {
  const { isAuthenticated, openAuthModal } = useUser();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-around">
        {/* Marketplace */}
        <button
          onClick={() => setActiveView('marketplace')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors cursor-pointer ${
            activeView === 'marketplace' ? 'text-primary-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Compass size={20} className={activeView === 'marketplace' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[10px] mt-0.5">Explore</span>
        </button>

        {/* My Circles */}
        <button
          onClick={() => {
            if (!isAuthenticated) {
              openAuthModal();
            } else {
              setActiveView('my-circles');
            }
          }}
          className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors cursor-pointer relative ${
            activeView === 'my-circles' ? 'text-primary-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users size={20} className={activeView === 'my-circles' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[10px] mt-0.5">My Circles</span>
        </button>

        {/* Center Action: Start Circle */}
        <button
          onClick={onOpenCreateModal}
          className="flex flex-col items-center -mt-5 group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary-800 to-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-800/30 group-active:scale-95 transition-transform border-2 border-white">
            <PlusCircle size={26} className="text-gold-300" />
          </div>
          <span className="text-[10px] font-bold text-primary-950 mt-0.5">Start Susu</span>
        </button>

        {/* Refer & Earn */}
        <button
          onClick={onOpenReferralModal}
          className="flex flex-col items-center py-1 px-2 rounded-lg text-gold-700 hover:text-gold-800 transition-colors cursor-pointer"
        >
          <Gift size={20} className="stroke-2 text-gold-600" />
          <span className="text-[10px] mt-0.5 font-bold">Refer</span>
        </button>

        {/* Menu / Sidebar Drawer Toggle */}
        <button
          onClick={onToggleSidebar}
          className="flex flex-col items-center py-1 px-2 rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <Menu size={20} className="stroke-2" />
          <span className="text-[10px] mt-0.5 font-medium">Menu</span>
        </button>
      </div>
    </nav>
  );
}
