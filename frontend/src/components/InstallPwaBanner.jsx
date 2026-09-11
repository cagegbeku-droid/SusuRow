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
      window.deferredPrompt = e;
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    const handleTriggerInstall = () => {
      setShowBanner(true);
      if (window.deferredPrompt) {
        window.deferredPrompt.prompt();
      } else if (isIosDevice) {
        setShowIosGuide(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('trigger-pwa-install', handleTriggerInstall);

    // If on iOS and not standalone, show prompt after brief delay
    if (isIosDevice) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3500);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('trigger-pwa-install', handleTriggerInstall);
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
      <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl p-4 shadow-2xl flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center flex-shrink-0 text-sky-600 shadow-xs">
            <Smartphone className="w-5 h-5" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">Install SusuRow Mobile App</h4>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded">NEW</span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 font-medium leading-relaxed">
              Add SusuRow to your phone home screen for instant 1-tap Mobile Money savings.
            </p>
          </div>

          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-slate-700 p-1 -mr-1 -mt-1 cursor-pointer transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {showIosGuide ? (
          <div className="bg-slate-50 rounded-2xl p-3 text-xs text-slate-700 space-y-1.5 border border-slate-200">
            <p className="font-bold text-sky-700">To install on iPhone / iPad:</p>
            <div className="flex items-center gap-2">
              <span>1. Tap Safari's <strong>Share</strong> icon</span>
              <Share2 className="w-3.5 h-3.5 text-sky-600" />
            </div>
            <div className="flex items-center gap-2">
              <span>2. Scroll down & tap <strong>Add to Home Screen</strong></span>
              <PlusSquare className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2.5 px-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isIos ? 'How to Install on iPhone' : 'Install App to Phone'}</span>
            </button>
            <button
              onClick={handleDismiss}
              className="py-2.5 px-3 text-xs text-slate-500 hover:text-slate-800 font-bold cursor-pointer transition-colors"
            >
              Not now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
