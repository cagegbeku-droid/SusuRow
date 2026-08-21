import React, { useState, useEffect } from 'react';
import { UserProvider, useUser } from './context/UserContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import MobileBottomNav from './components/MobileBottomNav';
import AppSidebar from './components/AppSidebar';
import { ReferralModal } from './components/ReferralModal';
import { CreateCircleModal } from './components/CreateCircleModal';
import { JoinCodeModal } from './components/JoinCodeModal';
import { SusuCalculator } from './components/SusuCalculator';
import { MarketplacePage } from './pages/MarketplacePage';
import { CircleDetailPage } from './pages/CircleDetailPage';
import { MyCirclesPage } from './pages/MyCirclesPage';
import { getPlatformStats, getGroupByCode } from './api/client';
import { ShieldCheck, Loader2 } from 'lucide-react';

function AppContent() {
  const { user, isAuthenticated, loading, isAuthModalOpen, openAuthModal, closeAuthModal } = useUser();
  const [currentTab, setCurrentTab] = useState('marketplace'); // 'marketplace' | 'my-circles' | 'detail'
  const [selectedGroupId, setSelectedGroupId] = useState(null);
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

  const fetchStats = async () => {
    try {
      const data = await getPlatformStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to load stats', e);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Check URL parameters for direct invite code or referral code
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const ref = params.get('ref');

    if (code) {
      getGroupByCode(code).then(group => {
        setSelectedGroupId(group.id);
        setCurrentTab('detail');
      }).catch(console.error);
    }

    if (ref) {
      localStorage.setItem('susurow_referred_by', ref);
    }
  }, []);

  const handleSelectCircle = (circle) => {
    setSelectedGroupId(circle.id);
    setCurrentTab('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToMarketplace = () => {
    setCurrentTab('marketplace');
    setSelectedGroupId(null);
    fetchStats();
  };

  const handleGroupCreated = (newGroup) => {
    setSelectedGroupId(newGroup.id);
    setCurrentTab('detail');
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

  const handleOpenMyGroups = () => {
    if (!isAuthenticated) {
      openAuthModal();
    } else {
      setCurrentTab('my-circles');
      setSelectedGroupId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-16 md:pb-0">
      
      {/* App Sidebar (Drawer) */}
      <AppSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeView={currentTab}
        setActiveView={(tab) => {
          if (tab === 'my-circles' && !isAuthenticated) {
            openAuthModal();
          } else {
            setCurrentTab(tab);
            if (tab !== 'detail') setSelectedGroupId(null);
          }
        }}
        onOpenCreateModal={handleOpenCreateModal}
        onOpenJoinCodeModal={() => setIsJoinCodeModalOpen(true)}
        onOpenCalculator={() => setIsCalculatorModalOpen(true)}
        onOpenReferralModal={handleOpenReferralModal}
      />

      {/* Top Navbar */}
      <Navbar
        activeView={currentTab}
        setActiveView={(tab) => {
          if (tab === 'my-circles' && !isAuthenticated) {
            openAuthModal();
          } else {
            setCurrentTab(tab);
            if (tab !== 'detail') setSelectedGroupId(null);
          }
        }}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        onOpenCreateModal={handleOpenCreateModal}
        onOpenJoinCodeModal={() => setIsJoinCodeModalOpen(true)}
        onOpenCalculator={() => setIsCalculatorModalOpen(true)}
        onOpenReferralModal={handleOpenReferralModal}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
        {currentTab === 'marketplace' && (
          <MarketplacePage
            stats={stats}
            onSelectCircle={handleSelectCircle}
            openCreateModal={handleOpenCreateModal}
            openJoinCodeModal={() => setIsJoinCodeModalOpen(true)}
            openCalculatorModal={() => setIsCalculatorModalOpen(true)}
          />
        )}

        {currentTab === 'detail' && selectedGroupId && (
          <CircleDetailPage
            groupId={selectedGroupId}
            onBack={handleBackToMarketplace}
          />
        )}

        {currentTab === 'my-circles' && (
          <MyCirclesPage
            onSelectCircle={handleSelectCircle}
            openCreateModal={handleOpenCreateModal}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-gold-500 flex items-center justify-center text-primary-950 font-black text-base">
                  ₵
                </div>
                <span className="text-xl font-black text-white">Susu<span className="text-gold-400">Row</span></span>
                <span className="text-[10px] font-bold bg-primary-900 text-gold-300 border border-gold-500/30 px-2 py-0.5 rounded">GHANA</span>
              </div>
              <p className="text-xs text-slate-400 max-w-md">
                Communal Susu rotational savings with automated Mobile Money payouts.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Supported Networks</h4>
              <ul className="space-y-1.5 text-xs text-slate-300 font-medium">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                  <span>MTN Mobile Money</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span>Telecel Cash</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>AT Money</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Quick Tools</h4>
              <ul className="space-y-1.5 text-xs text-slate-400 font-medium">
                <li><button onClick={handleOpenReferralModal} className="hover:text-gold-300 transition-colors cursor-pointer">• Refer & Earn</button></li>
                <li><button onClick={() => setIsCalculatorModalOpen(true)} className="hover:text-gold-300 transition-colors cursor-pointer">• Pot Calculator</button></li>
                <li><button onClick={() => setIsJoinCodeModalOpen(true)} className="hover:text-gold-300 transition-colors cursor-pointer">• Group Invite Code</button></li>
                <li><button onClick={handleOpenCreateModal} className="hover:text-gold-300 transition-colors cursor-pointer">• Create Group</button></li>
              </ul>
            </div>

          </div>

          <div className="pt-4 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div>
              © 2026 SusuRow Ghana.
            </div>
            <div className="flex items-center space-x-4">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Bank of Ghana Partner Standards</span>
              </span>
            </div>
          </div>

        </div>
      </footer>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav
        activeView={currentTab}
        setActiveView={(tab) => {
          if (tab === 'my-circles' && !isAuthenticated) {
            openAuthModal();
          } else {
            setCurrentTab(tab);
            if (tab !== 'detail') setSelectedGroupId(null);
          }
        }}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        onOpenCreateModal={handleOpenCreateModal}
        onOpenReferralModal={handleOpenReferralModal}
      />

      {/* Modals */}
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

    </div>
  );
}

export function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App;
