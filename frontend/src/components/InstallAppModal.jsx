import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Smartphone, 
  Share2, 
  PlusSquare, 
  CheckCircle2, 
  ShieldCheck, 
  Laptop,
  MoreVertical,
  HelpCircle
} from 'lucide-react';

export const InstallAppModal = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [deviceType, setDeviceType] = useState('android'); // 'android' | 'ios' | 'desktop'
  const [isInstalled, setIsInstalled] = useState(false);
  const [activeTab, setActiveTab] = useState('apk'); // 'apk' | 'pwa'

  useEffect(() => {
    // Check if already running in standalone PWA or Capacitor native app
    const isCapacitor = !!window.Capacitor || window.location.hostname === 'localhost' || window.location.protocol === 'capacitor:' || window.location.protocol === 'ionic:';
    const isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
    if (isCapacitor || isStandalone) {
      setIsInstalled(true);
    }

    // Detect Device Type
    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setDeviceType('ios');
      setActiveTab('pwa');
    } else if (/android/.test(ua)) {
      setDeviceType('android');
      setActiveTab('apk');
    } else {
      setDeviceType('desktop');
      setActiveTab('apk');
    }

    // Capture beforeinstallprompt if available
    const handlePrompt = (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    if (window.deferredPrompt) {
      setDeferredPrompt(window.deferredPrompt);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePwaPrompt = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        onClose();
      }
    } else if (deviceType === 'ios') {
      setActiveTab('pwa');
    }
  };

  const apkUrl = '/SusuRow.apk';

  return (
    <div className="fixed inset-0 bg-white/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-black">
              <Smartphone size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Install SusuRow App</h3>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                  v1.0.4
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Official Mobile & Desktop Edition</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {isInstalled ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
            <CheckCircle2 size={28} className="text-emerald-600 mx-auto" />
            <h4 className="text-sm font-bold text-emerald-900">SusuRow is Already Installed!</h4>
            <p className="text-xs text-emerald-700">
              You are currently viewing SusuRow inside your installed application. All automated MoMo payouts and offline savings features are active.
            </p>
            <button
              onClick={onClose}
              className="mt-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-xs"
            >
              Continue to Application
            </button>
          </div>
        ) : (
          <>
            {/* Tab Selection */}
            <div className="flex items-center p-1 bg-slate-100 rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('apk')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'apk'
                    ? 'bg-white text-sky-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Download size={14} />
                <span>Android APK</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pwa')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'pwa'
                    ? 'bg-white text-sky-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone size={14} />
                <span>{deviceType === 'ios' ? 'iPhone / iOS' : 'Add to Home'}</span>
              </button>
            </div>

            {/* Tab 1: Direct Android APK */}
            {activeTab === 'apk' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-900">Direct Android APK (Recommended)</span>
                    <span className="text-[10px] font-mono font-bold bg-white text-sky-800 px-2 py-0.5 rounded-md border border-sky-200">
                      5.5 MB
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Download the official native SusuRow Android app directly to your phone. Compatible with all Android smartphones (Samsung, Tecno, Infinix, Xiaomi, etc.).
                  </p>
                  <a
                    href={apkUrl}
                    download="SusuRow.apk"
                    className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer text-center block"
                  >
                    <Download size={16} />
                    <span>Download SusuRow APK Now</span>
                  </a>
                </div>

                {/* 3 Step Installation Guidance */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <HelpCircle size={14} className="text-sky-600" />
                    <span>How to Install the APK:</span>
                  </h4>
                  <ol className="text-xs text-slate-600 space-y-2 pl-4 list-decimal leading-relaxed">
                    <li>Tap <strong>Download SusuRow APK Now</strong> above.</li>
                    <li>When the download finishes, tap the notification or open your phone's <strong>Downloads</strong> folder.</li>
                    <li>Tap <strong>SusuRow.apk</strong> and press <strong>Install</strong>. (If your phone asks, allow "Install from this source").</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Tab 2: PWA / Web App / iOS */}
            {activeTab === 'pwa' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {deviceType === 'ios' ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sky-800 font-bold text-xs">
                      <Smartphone size={16} />
                      <span>Install on iPhone & iPad (Safari)</span>
                    </div>
                    <ol className="text-xs text-slate-600 space-y-2.5 pl-4 list-decimal leading-relaxed">
                      <li>
                        Tap the <strong>Share</strong> icon in Safari's bottom toolbar:
                        <div className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-sky-600 font-semibold text-[11px]">
                          <Share2 size={12} /> Share
                        </div>
                      </li>
                      <li>
                        Scroll down and tap <strong>Add to Home Screen</strong>:
                        <div className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-emerald-600 font-semibold text-[11px]">
                          <PlusSquare size={12} /> Add to Home Screen
                        </div>
                      </li>
                      <li>
                        Tap <strong>Add</strong> at the top-right corner. SusuRow will appear on your home screen like any App Store app!
                      </li>
                    </ol>
                  </div>
                ) : deferredPrompt ? (
                  <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 space-y-3">
                    <h4 className="text-xs font-bold text-sky-900">Instant 1-Tap Home Screen Installation</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Your browser supports 1-tap installation. Add SusuRow to your home screen or desktop without downloading a full APK file.
                    </p>
                    <button
                      type="button"
                      onClick={handlePwaPrompt}
                      className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
                    >
                      <PlusSquare size={16} />
                      <span>Add to Home Screen / Install Now</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                      {deviceType === 'desktop' ? <Laptop size={16} className="text-sky-600" /> : <Smartphone size={16} className="text-sky-600" />}
                      <span>Add to {deviceType === 'desktop' ? 'Desktop' : 'Home Screen'} via Browser Menu</span>
                    </div>
                    <ol className="text-xs text-slate-600 space-y-2 pl-4 list-decimal leading-relaxed">
                      <li>
                        Tap the <strong>Browser Menu</strong> ({deviceType === 'desktop' ? 'top right icon or address bar' : 'three dots ⋮ at top right'}):
                        <div className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-700 font-semibold text-[11px]">
                          <MoreVertical size={12} /> Menu
                        </div>
                      </li>
                      <li>
                        Select <strong>Install SusuRow</strong> or <strong>Add to Home screen</strong>.
                      </li>
                      <li>
                        Follow the on-screen prompt to confirm.
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            )}

            {/* Security Guarantee */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500 justify-center pt-2">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>100% Virus-Free • Verified by Coratech Global Enterprise</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default InstallAppModal;
