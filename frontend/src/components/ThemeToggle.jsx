import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle = ({ className = "" }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
        isDark
          ? 'bg-[#131A2E] text-amber-300 hover:bg-[#18223C] border border-white/10 hover:text-amber-200'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 hover:text-slate-900'
      } ${className}`}
    >
      {isDark ? (
        <Sun size={17} className="stroke-[2.2] transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon size={17} className="stroke-[2.2] text-slate-800 transition-transform duration-300 -rotate-12 hover:rotate-0" />
      )}
    </button>
  );
};
