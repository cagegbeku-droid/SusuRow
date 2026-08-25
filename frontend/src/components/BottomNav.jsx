import React from 'react';
import { 
  Home, 
  Layers, 
  PlusCircle, 
  User, 
  Sparkles 
} from 'lucide-react';
import { useUser } from '../context/UserContext';

export const BottomNav = ({ activeView, setActiveView, onOpenCreateModal }) => {
  const { isAuthenticated, openAuthModal } = useUser();

  const navItems = [
    {
      id: 'marketplace',
      label: 'Explore',
      icon: Home
    },
    {
      id: 'my-circles',
      label: 'My Groups',
      icon: Layers,
      authRequired: true
    },
    {
      id: 'create',
      label: 'Create',
      icon: PlusCircle,
      isAction: true
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      authRequired: true
    }
  ];

  const handleNav = (item) => {
    if (item.isAction) {
      if (!isAuthenticated) {
        openAuthModal();
        return;
      }
      onOpenCreateModal();
      return;
    }

    if (item.authRequired && !isAuthenticated) {
      openAuthModal();
      return;
    }

    setActiveView(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0E1424]/95 backdrop-blur-xl border-t border-white/10 px-4 py-2"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          if (item.isAction) {
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item)}
                className="flex flex-col items-center justify-center -mt-5 cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#00D09C] to-[#00B789] text-slate-950 flex items-center justify-center shadow-[0_4px_20px_rgba(0,208,156,0.4)] group-active:scale-95 transition-transform">
                  <PlusCircle size={24} className="stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 mt-1">New</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
                isActive 
                  ? 'text-[#00D09C]' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-[#00D09C]/10' : ''}`}>
                <Icon size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />
              </div>
              <span className={`text-[10px] font-bold mt-0.5 ${isActive ? 'text-[#00D09C]' : 'text-slate-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
