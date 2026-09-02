import React from 'react';
import { 
  Home, 
  Compass, 
  LayoutGrid, 
  User 
} from 'lucide-react';
import { useUser } from '../context/UserContext';

export const BottomNav = ({ activeView, setActiveView, onOpenCreateModal }) => {
  const { isAuthenticated, openAuthModal } = useUser();

  const handleNav = (targetView) => {
    if ((targetView === 'my-circles' || targetView === 'profile') && !isAuthenticated) {
      openAuthModal();
      return;
    }
    setActiveView(targetView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems = [
    {
      id: 'marketplace',
      label: 'Home',
      icon: Home
    },
    {
      id: 'explore',
      label: 'Explore',
      icon: Compass,
      target: 'marketplace'
    },
    {
      id: 'my-circles',
      label: 'My Groups',
      icon: LayoutGrid,
      target: 'my-circles'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      target: 'profile'
    }
  ];

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-4 py-2 shadow-lg"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = (item.id === 'marketplace' && activeView === 'marketplace') ||
                           (item.id === 'my-circles' && activeView === 'my-circles') ||
                           (item.id === 'profile' && activeView === 'profile');

          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.target || item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
                isActive 
                  ? 'text-sky-600 font-bold' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={`p-1.5 rounded-2xl transition-all ${
                isActive ? 'bg-sky-50 text-sky-600 border border-sky-200 shadow-xs' : 'text-slate-500'
              }`}>
                <Icon size={19} className={isActive ? 'stroke-[2.3]' : 'stroke-[1.8]'} />
              </div>
              <span className={`text-[10px] font-semibold mt-0.5 ${isActive ? 'text-sky-600 font-bold' : 'text-slate-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
