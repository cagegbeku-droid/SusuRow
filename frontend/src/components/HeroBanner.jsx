import React from 'react';
import { 
  SlidersHorizontal, 
  Plus
} from 'lucide-react';
import { useUser } from '../context/UserContext';

export const HeroBanner = ({ openCreateModal, openCalculatorModal }) => {
  const { isAuthenticated, openAuthModal } = useUser();

  const handleAction = (callback) => {
    if (!isAuthenticated) openAuthModal();
    else callback();
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          Explore Susu Groups
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Join a verified rotational savings circle or start your own
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => handleAction(openCreateModal)}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
        >
          <Plus size={14} />
          <span>Create Group</span>
        </button>

      </div>
    </div>
  );
};
