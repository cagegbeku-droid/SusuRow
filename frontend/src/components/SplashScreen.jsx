import React, { useState, useEffect } from 'react';

export const SplashScreen = ({ minDisplayTime = 1800, onFinished }) => {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Keep splash screen visible for a distinct brand impression before transitioning
    const timer = setTimeout(() => {
      setFading(true);
      const hideTimer = setTimeout(() => {
        setVisible(false);
        if (onFinished) onFinished();
      }, 500); // 500ms fade transition
      return () => clearTimeout(hideTimer);
    }, minDisplayTime);

    return () => clearTimeout(timer);
  }, [minDisplayTime, onFinished]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-950 text-white transition-opacity duration-500 ease-out select-none ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-hidden={fading}
    >
      {/* Ambient background glow */}
      <div className="absolute w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl -top-10 -left-10 pointer-events-none" />
      <div className="absolute w-72 h-72 rounded-full bg-amber-500/10 blur-3xl -bottom-10 -right-10 pointer-events-none" />

      {/* Main Branding Container */}
      <div className="flex flex-col items-center justify-center text-center px-6 relative z-10 animate-in zoom-in-95 duration-500">
        {/* SusuRow App Icon */}
        <div className="relative mb-6">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl p-1 bg-gradient-to-br from-amber-400 via-emerald-500 to-sky-500 shadow-2xl shadow-emerald-500/20">
            <img
              src="/icon-192.svg"
              alt="SusuRow Logo"
              className="w-full h-full object-contain rounded-[22px] drop-shadow-md"
            />
          </div>
          {/* Subtle pulse ring */}
          <div className="absolute -inset-2 rounded-[32px] border border-emerald-400/30 animate-ping opacity-25 pointer-events-none" />
        </div>

        {/* SusuRow boldly written under it */}
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-sm font-['Outfit',sans-serif]">
          Susu<span className="text-amber-400">Row</span>
        </h1>

        {/* Subtitle / Tagline */}
        <p className="mt-2 text-xs sm:text-sm font-semibold tracking-wide text-emerald-200/90 uppercase">
          Automated Mobile Money Savings • Ghana
        </p>

        {/* Loading Spinner & Trust Tag */}
        <div className="mt-8 flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-emerald-400/30 border-t-amber-400 rounded-full animate-spin" />
          <span className="text-[11px] text-slate-400 tracking-wider">
            Securing Float & Rotations...
          </span>
        </div>
      </div>

      {/* Footer / Powered By */}
      <div className="absolute bottom-6 text-center text-[10px] text-slate-400/80 tracking-wider uppercase font-medium">
        Bank of Ghana Sandbox Ready • Coratech Global Enterprise
      </div>
    </div>
  );
};

export default SplashScreen;
