import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share2, PlusSquare } from 'lucide-react';

export const InstallPwaBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Check if already running inside Capacitor native Android/iOS app or standalone PWA
    const isCapacitor = !!window.Capacitor || window.location.hostname === 'localhost' || window.location.protocol === 'capacitor:' || window.location.protocol === 'ionic:';
    const isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
    if (isCapacitor || isStandalone) {
      return; // App is already installed and opened as native app
    }

    // Check if user previously dismissed today
    const dismissedAt = localStorage.getItem('susurow_pwa_dismissed');
    if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < 24 * 60 * 60 * 1000) {
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Listen for Chrome / Android / Edge install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If on iOS and not standalone, show prompt after brief delay
    if (isIosDevice) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3500);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Install prompt outcome: ${outcome}`);
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIosGuide(false);
    localStorage.setItem('susurow_pwa_dismissed', Date.now().toString());
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-[#003630] border border-[#00F2FE]/30 text-white rounded-2xl p-4 shadow-2xl backdrop-blur-lg flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#005B52] border border-[#00F2FE]/40 flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-5 h-5 text-[#00F2FE]" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">Install SusuRow Mobile App</h4>
              <span className="text-[10px] font-semibold bg-[#F59E0B] text-slate-950 px-1.5 py-0.5 rounded">NEW</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Add SusuRow to your phone home screen for instant 1-tap Mobile Money savings.
            </p>
          </div>

          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-1 -mr-1 -mt-1"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {showIosGuide ? (
          <div className="bg-[#002420] rounded-xl p-3 text-xs text-slate-200 space-y-1.5 border border-white/10">
            <p className="font-semibold text-[#00F2FE]">To install on iPhone / iPad:</p>
            <div className="flex items-center gap-2">
              <span>1. Tap Safari's <strong>Share</strong> icon</span>
              <Share2 className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="flex items-center gap-2">
              <span>2. Scroll down & tap <strong>Add to Home Screen</strong></span>
              <PlusSquare className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2 px-3 bg-gradient-to-r from-[#00F2FE] to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              {isIos ? 'How to Install on iPhone' : 'Install App to Phone'}
            </button>
            <button
              onClick={handleDismiss}
              className="py-2 px-3 text-xs text-slate-300 hover:text-white font-medium"
            >
              Not now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
