import React, { useState, useEffect, useRef } from 'react';
import { UserProvider, useUser } from './context/UserContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import MobileBottomNav from './components/MobileBottomNav';
import AppSidebar from './components/AppSidebar';
import { ReferralModal } from './components/ReferralModal';
import { CreateCircleModal } from './components/CreateCircleModal';
import { JoinCodeModal } from './components/JoinCodeModal';
import { SusuCalculator } from './components/SusuCalculator';
import { TermsModal } from './components/TermsModal';
import { FAQModal } from './components/FAQModal';
import { MarketplacePage } from './pages/MarketplacePage';
import { CircleDetailPage } from './pages/CircleDetailPage';
import { MyCirclesPage } from './pages/MyCirclesPage';
import { ProfilePage } from './pages/ProfilePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import { InstallPwaBanner } from './components/InstallPwaBanner';
import { OfflineNotice } from './components/OfflineNotice';
import { getPlatformStats, getGroupByCode } from './api/client';
import { App as CapApp } from '@capacitor/app';
import { ShieldCheck, Loader2, Globe, Building2, AlertTriangle, ArrowRight } from 'lucide-react';

function AppContent() {
  const { user, isAuthenticated, loading, isAuthModalOpen, openAuthModal, closeAuthModal, refreshProfile } = useUser();
  const [currentTab, setCurrentTab] = useState('marketplace'); // 'marketplace' | 'my-circles' | 'profile' | 'detail'
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [profileSubpage, setProfileSubpage] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState({
    total_pooled_ghs: 0.0,
    total_payouts_disbursed_ghs: 0.0,
    active_circles_count: 0,
    completed_circles_count: 0,
    total_savers_count: 0,
    default_rate: 0.0
  });

  // Global Modals & Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinCodeModalOpen, setIsJoinCodeModalOpen] = useState(false);
  const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isFAQModalOpen, setIsFAQModalOpen] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await getPlatformStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to load stats', e);
    }
  };

  const handleRefreshAll = async () => {
    try {
      await Promise.allSettled([
        fetchStats(),
        refreshProfile ? refreshProfile() : Promise.resolve(),
      ]);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Refresh error', err);
    }
  };

  // Centralized Navigation with browser/device history synchronization
  const navigateTo = (tab, options = {}) => {
    const nextGroupId = options.groupId !== undefined ? options.groupId : null;
    const nextSubpage = options.subpage !== undefined ? options.subpage : null;

    const currentState = window.history.state;
    if (
      !currentState ||
      currentState.tab !== tab ||
      currentState.groupId !== nextGroupId ||
      currentState.subpage !== nextSubpage
    ) {
      window.history.pushState({
        tab,
        groupId: nextGroupId,
        subpage: nextSubpage
      }, '');
    }

    setCurrentTab(tab);
    setSelectedGroupId(nextGroupId);
    setProfileSubpage(nextSubpage);

    if (options.scrollTop !== false) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigateTo('marketplace');
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Ensure initial entry has structured state
    if (!window.history.state || !window.history.state.tab) {
      window.history.replaceState({
        tab: 'marketplace',
        groupId: null,
        subpage: null
      }, '');
    }

    // Unified back/forward button handler across mobile phone gestures and browser back
    const handlePopState = (event) => {
      const state = event.state;
      if (state && state.tab) {
        setCurrentTab(state.tab);
        setSelectedGroupId(state.groupId || null);
        setProfileSubpage(state.subpage || null);
      } else {
        setCurrentTab('marketplace');
        setSelectedGroupId(null);
        setProfileSubpage(null);
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Check URL parameters for direct invite code, referral code, or admin management portal
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const ref = params.get('ref');
    const tab = params.get('tab');

    if (tab === 'admin' || window.location.pathname === '/admin') {
      navigateTo('admin');
    }

    if (code) {
      getGroupByCode(code).then(group => {
        navigateTo('detail', { groupId: group.id });
      }).catch(console.error);
    }

    if (ref) {
      localStorage.setItem('susurow_referred_by', ref);
    }

    // Native mobile deep link listener (susurow://join?code=... or https://susurow.onrender.com/join?code=...)
    let appUrlListener = null;
    try {
      CapApp.addListener('appUrlOpen', (event) => {
        try {
          const url = new URL(event.url);
          const deepCode = url.searchParams.get('code') || url.pathname.split('/').pop();
          if (deepCode && deepCode.startsWith('SUSU-')) {
            getGroupByCode(deepCode).then(group => {
              navigateTo('detail', { groupId: group.id });
            }).catch(console.error);
          }
          const deepRef = url.searchParams.get('ref');
          if (deepRef) {
            localStorage.setItem('susurow_referred_by', deepRef);
          }
        } catch (e) {
          console.warn('Could not parse deep link URL:', event.url, e);
        }
      }).then(handle => {
        appUrlListener = handle;
      });
    } catch (e) {
      // Browser environment fallback
    }

    // Global shortcut Ctrl+Shift+A (or Cmd+Shift+A) to open Executive Admin Console
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setCurrentTab((prev) => {
          const next = prev === 'admin' ? 'marketplace' : 'admin';
          navigateTo(next);
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
      if (appUrlListener && typeof appUrlListener.remove === 'function') {
        appUrlListener.remove();
      }
    };
  }, []);

  const handleSelectCircle = (circle) => {
    navigateTo('detail', { groupId: circle.id });
  };

  const handleGroupCreated = (newGroup) => {
    navigateTo('detail', { groupId: newGroup.id });
    fetchStats();
  };

  // Action Gating Guards
  const handleOpenCreateModal = () => {
    if (!isAuthenticated) {
      openAuthModal();
    } else {
      setIsCreateModalOpen(true);
    }
  };

  const handleOpenReferralModal = () => {
    if (!isAuthenticated) {
      openAuthModal();
    } else {
      setIsReferralModalOpen(true);
    }
  };

  // KYC Completion Status for Top Banner:
  // User is verified or has both Ghana Card and next of kin phone filled in
  const isKycComplete = Boolean(
    user && (
      user.kyc_status === 'VERIFIED' || 
      (user.ghana_card_number && user.next_of_kin_phone)
    )
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 pb-20 md:pb-0">
      
      {/* App Sidebar (Drawer) */}
      <AppSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeView={currentTab}
        setActiveView={(tab) => {
          if ((tab === 'my-circles' || tab === 'profile') && !isAuthenticated) {
            openAuthModal();
          } else {
            navigateTo(tab);
          }
        }}
        onOpenCreateModal={handleOpenCreateModal}
        onOpenJoinCodeModal={() => setIsJoinCodeModalOpen(true)}
        onOpenCalculator={() => setIsCalculatorModalOpen(true)}
        onOpenReferralModal={handleOpenReferralModal}
        onOpenTermsModal={() => setIsTermsModalOpen(true)}
      />

      {/* Top Navbar */}
      <Navbar
        activeView={currentTab}
        setActiveView={(tab) => {
          if ((tab === 'my-circles' || tab === 'profile') && !isAuthenticated) {
            openAuthModal();
          } else {
            navigateTo(tab);
          }
        }}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        onOpenCreateModal={handleOpenCreateModal}
        onOpenJoinCodeModal={() => setIsJoinCodeModalOpen(true)}
        onOpenCalculator={() => setIsCalculatorModalOpen(true)}
        onOpenReferralModal={handleOpenReferralModal}
        onOpenFAQModal={() => setIsFAQModalOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Action Required: Unverified KYC Top Banner */}
          {isAuthenticated && user && !isKycComplete && (
            <div className="mb-4 bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/10 border border-amber-300 dark:border-amber-600/40 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-md">
                      Action Required
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">
                    Please complete your verification with your Ghana Card to unlock full features and circle payouts.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigateTo('profile', { subpage: 'kyc' })}
                className="shrink-0 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <span>Verify</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {currentTab === 'marketplace' && (
            <MarketplacePage
              stats={stats}
              refreshKey={refreshKey}
              onSelectCircle={handleSelectCircle}
              openCreateModal={handleOpenCreateModal}
              openJoinCodeModal={() => setIsJoinCodeModalOpen(true)}
              openCalculatorModal={() => setIsCalculatorModalOpen(true)}
            />
          )}

          {currentTab === 'detail' && selectedGroupId && (
            <CircleDetailPage
              groupId={selectedGroupId}
              onBack={handleBack}
            />
          )}

          {currentTab === 'my-circles' && (
            <MyCirclesPage
              refreshKey={refreshKey}
              onSelectCircle={handleSelectCircle}
              openCreateModal={handleOpenCreateModal}
            />
          )}

          {currentTab === 'profile' && (
            <ProfilePage
              activeSubpage={profileSubpage}
              setActiveSubpage={(subpage) => navigateTo('profile', { subpage })}
              onBack={handleBack}
              onOpenReferralModal={handleOpenReferralModal}
              onOpenTermsModal={() => setIsTermsModalOpen(true)}
            />
          )}

          {currentTab === 'admin' && (
            <AdminDashboardPage onBack={handleBack} />
          )}
        </main>

      {/* Footer with Coratech Global Corporate Branding */}
      <footer className="bg-white text-slate-600 border-t border-slate-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Brand & Coratech Global Info */}
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-sky-600 flex items-center justify-center text-white font-black text-base shadow-xs">
                  ₵
                </div>
                <span className="text-xl font-bold text-slate-900">Susu<span className="text-sky-600">Row</span></span>
                <span className="text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full">
                  GHANA DIGITAL ROSCA
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-md">
                Communal Susu rotational savings with automated Ghana Mobile Money payouts. Engineered by <strong className="text-slate-800">Coratech Global</strong>.
              </p>

              <div className="pt-1 flex items-center gap-4 text-xs font-semibold text-slate-500">
                <a 
                  href="https://coratechglobal.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sky-600 hover:underline flex items-center gap-1"
                >
                  <Globe size={13} />
                  <span>coratechglobal.com</span>
                </a>
                <span>•</span>
                <span className="text-slate-500">@coratechglobal</span>
              </div>
            </div>

            {/* Networks */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">Supported Networks</h4>
              <ul className="space-y-1.5 text-xs text-slate-600 font-medium">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>MTN Mobile Money (MoMo)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span>Telecel Cash Ghana</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>AT Money (AirtelTigo)</span>
                </li>
              </ul>
            </div>

            {/* Quick Links & Terms */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">Platform & Legal</h4>
              <ul className="space-y-1.5 text-xs text-slate-600 font-medium">
                <li><button onClick={() => setIsTermsModalOpen(true)} className="hover:text-sky-600 transition-colors cursor-pointer">• Terms of Service & Privacy</button></li>
                <li><button onClick={handleOpenReferralModal} className="hover:text-sky-600 transition-colors cursor-pointer">• Refer & Earn Hub</button></li>
                <li><button onClick={() => setIsCalculatorModalOpen(true)} className="hover:text-sky-600 transition-colors cursor-pointer">• Pot Calculator</button></li>
                <li><button onClick={() => setIsJoinCodeModalOpen(true)} className="hover:text-sky-600 transition-colors cursor-pointer">• Enter Group Code</button></li>
              </ul>
            </div>

          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div>
              © 2026 SusuRow Ghana. Built by <strong className="text-slate-700">Coratech Global</strong>.
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsTermsModalOpen(true)}
                className="flex items-center gap-1 text-emerald-600 font-semibold hover:underline cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Bank of Ghana Security Standards</span>
              </button>
            </div>
          </div>

        </div>
      </footer>

      {/* Mobile Floating Bottom Dock */}
      <MobileBottomNav
        activeView={currentTab}
        setActiveView={(tab) => {
          if ((tab === 'my-circles' || tab === 'profile') && !isAuthenticated) {
            openAuthModal();
          } else {
            navigateTo(tab);
          }
        }}
        onOpenCreateModal={handleOpenCreateModal}
        onOpenReferralModal={handleOpenReferralModal}
      />

      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
      />
      <ReferralModal
        isOpen={isReferralModalOpen}
        onClose={() => setIsReferralModalOpen(false)}
      />
      <CreateCircleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onGroupCreated={handleGroupCreated}
      />
      <JoinCodeModal
        isOpen={isJoinCodeModalOpen}
        onClose={() => setIsJoinCodeModalOpen(false)}
        onCircleFound={handleSelectCircle}
      />
      <SusuCalculator
        isOpen={isCalculatorModalOpen}
        onClose={() => setIsCalculatorModalOpen(false)}
        onLaunchCircle={(cfg) => {
          handleOpenCreateModal();
        }}
      />
      <TermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
      />
      <FAQModal
        isOpen={isFAQModalOpen}
        onClose={() => setIsFAQModalOpen(false)}
      />

      {/* Offline Status Badge */}
      <OfflineNotice />

      {/* PWA Mobile App Install Banner */}
      <InstallPwaBanner />

    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
