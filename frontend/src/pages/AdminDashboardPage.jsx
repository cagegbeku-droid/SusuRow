import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Users,
  CreditCard,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  ArrowLeft,
  DollarSign,
  KeyRound,
  Trash2,
  Wallet,
  AlertCircle,
  ArrowDownRight,
  Send,
  Lock,
  UserCheck,
  Pause,
  Play,
  Award
} from 'lucide-react';
import {
  getAdminMetrics,
  getAdminUsers,
  updateUserKycStatus,
  toggleUserFreeze,
  getAdminCircles,
  getAdminTransactions,
  adminDeleteCircle,
  getAdminTreasury,
  adminWithdrawRevenue,
  reconcileTransaction,
  adminMarkTransactionStatus
} from '../api/client';
import { ChangeAdminCredentialsModal } from '../components/ChangeAdminCredentialsModal';
import { AdminUserSupportModal } from '../components/AdminUserSupportModal';
import { AdminCircleManageModal } from '../components/AdminCircleManageModal';

export default function AdminDashboardPage({ onBack, onLockSession }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'circles' | 'users' | 'transactions'
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState(null);

  // Credentials Modal State
  const [credsModalOpen, setCredsModalOpen] = useState(false);
  const [currentAdminPhone, setCurrentAdminPhone] = useState('0599360626');

  // Metrics & Treasury State
  const [metrics, setMetrics] = useState({
    financials: {
      active_float_ghs: 0,
      total_volume_ghs: 0,
      total_payouts_disbursed_ghs: 0,
      net_revenue_ghs: 0
    },
    circles: { active_count: 0, total_count: 0 },
    savers: { total_savers: 0, verified_savers: 0 }
  });
  const [treasury, setTreasury] = useState({ available_balance_ghs: 0, total_collected_ghs: 0 });

  // Withdrawal form modal state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPhone, setWithdrawPhone] = useState('0599360626');
  const [withdrawName, setWithdrawName] = useState('Coratech Executive');
  const [withdrawProvider, setWithdrawProvider] = useState('MTN');
  const [withdrawing, setWithdrawing] = useState(false);

  // Data lists
  const [circles, setCircles] = useState([]);
  const [circleSearch, setCircleSearch] = useState('');
  const [circlesLoading, setCirclesLoading] = useState(false);
  const [selectedCircleForManage, setSelectedCircleForManage] = useState(null);
  const [circleManageModalOpen, setCircleManageModalOpen] = useState(false);

  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);
  const [supportUser, setSupportUser] = useState(null);
  const [supportModalOpen, setSupportModalOpen] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [txSearch, setTxSearch] = useState('');
  const [txStatusFilter, setTxStatusFilter] = useState('ALL');
  const [txLoading, setTxLoading] = useState(false);

  const notify = (msg, type = 'success') => {
    setActionNotice({ msg, type });
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Auto-lock executive portal after 15 minutes of inactivity
  useEffect(() => {
    let timeoutId;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (onLockSession) {
          onLockSession();
        }
      }, 15 * 60 * 1000); // 15 minutes
    };

    resetTimer();
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    window.addEventListener('click', resetTimer);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [onLockSession]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [m, t] = await Promise.allSettled([
        getAdminMetrics(),
        getAdminTreasury()
      ]);
      if (m.status === 'fulfilled' && m.value) setMetrics(m.value);
      if (t.status === 'fulfilled' && t.value) setTreasury(t.value);
    } catch (err) {
      console.warn('Failed to load metrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCircles = useCallback(async () => {
    setCirclesLoading(true);
    try {
      const data = await getAdminCircles({ query: circleSearch || undefined });
      setCircles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load circles:', err);
      notify(err?.response?.data?.detail || 'Failed to load savings circles', 'error');
    } finally {
      setCirclesLoading(false);
    }
  }, [circleSearch]);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const data = await getAdminUsers({ query: userSearch || undefined, limit: 100 });
      setUsers(data?.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
      notify(err?.response?.data?.detail || 'Failed to load members', 'error');
    } finally {
      setUsersLoading(false);
    }
  }, [userSearch]);

  const loadTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const data = await getAdminTransactions({ 
        query: txSearch || undefined, 
        status_filter: txStatusFilter !== 'ALL' ? txStatusFilter : undefined,
        limit: 100 
      });
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      notify(err?.response?.data?.detail || 'Failed to load payments', 'error');
    } finally {
      setTxLoading(false);
    }
  }, [txSearch, txStatusFilter]);

  const handleReconcileTx = async (tx) => {
    if (!window.confirm(`Confirm payment reference "${tx.reference}" as SUCCESS?`)) return;
    try {
      const res = await reconcileTransaction(tx.id);
      notify(res?.message || 'Payment confirmed and reconciled as SUCCESS.');
      loadTransactions();
      loadData();
    } catch (err) {
      notify(err?.response?.data?.detail || 'Failed to reconcile payment.', 'error');
    }
  };

  useEffect(() => {
    loadData();
    try {
      const saved = localStorage.getItem('susurow_custom_admin_creds');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.username) {
          setCurrentAdminPhone(parsed.username);
          setWithdrawPhone(parsed.username);
        }
      }
    } catch (e) {}
  }, [loadData]);

  useEffect(() => {
    if (activeTab === 'circles') loadCircles();
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'transactions') loadTransactions();
  }, [activeTab, loadCircles, loadUsers, loadTransactions]);

  const handleDeleteCircle = async (circle) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${circle.name}"?`)) return;
    try {
      const res = await adminDeleteCircle(circle.id);
      notify(res?.message || 'Circle deleted successfully.');
      loadCircles();
      loadData();
    } catch (err) {
      notify(err?.response?.data?.detail || 'Failed to delete circle.', 'error');
    }
  };

  const handleVerifyKyc = async (user) => {
    try {
      await updateUserKycStatus(user.id, 'VERIFIED', 'Verified by executive admin');
      notify(`KYC for ${user.full_name || user.phone_number} approved!`);
      loadUsers();
    } catch (err) {
      notify(err?.response?.data?.detail || 'Failed to update KYC status.', 'error');
    }
  };

  const handleToggleFreeze = async (user) => {
    try {
      const res = await toggleUserFreeze(user.id);
      notify(res?.message || 'Member status updated.');
      loadUsers();
    } catch (err) {
      notify(err?.response?.data?.detail || 'Failed to toggle user status.', 'error');
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    const num = Number(withdrawAmount);
    if (!num || num <= 0) {
      alert('Please enter a valid withdrawal amount.');
      return;
    }
    setWithdrawing(true);
    try {
      const res = await adminWithdrawRevenue({
        amount: num,
        method: 'MOMO',
        destination: withdrawProvider,
        account_number: withdrawPhone.trim(),
        account_name: withdrawName.trim()
      });
      notify(res?.message || `Successfully transferred GH₵${num.toFixed(2)} to ${withdrawPhone}!`);
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      loadData();
    } catch (err) {
      notify(err?.response?.data?.detail || 'Withdrawal failed. Please check balance.', 'error');
    } finally {
      setWithdrawing(false);
    }
  };

  const activeFloat = metrics?.financials?.active_float_ghs || 0;
  const totalVolume = metrics?.financials?.total_volume_ghs || 0;
  const totalPayouts = metrics?.financials?.total_payouts_disbursed_ghs || 0;
  const revenueBalance = treasury?.available_balance_ghs || metrics?.financials?.net_revenue_ghs || 0;
  const activeCirclesCount = metrics?.circles?.active_count || circles.length || 0;
  const totalSaversCount = metrics?.savers?.total_savers || users.length || 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      
      {/* Toast Notification */}
      {actionNotice && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-3 duration-150">
          <div className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold ${
            actionNotice.type === 'error'
              ? 'bg-red-600 text-white border-red-700'
              : 'bg-slate-900 text-white border-slate-800'
          }`}>
            {actionNotice.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} className="text-emerald-400" />}
            <span>{actionNotice.msg}</span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Return to Public App"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center font-black">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                SusuRow Executive Management
              </h1>
              <p className="text-[11px] font-mono text-slate-500 font-bold">
                Admin: {currentAdminPhone} • Verified
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCredsModalOpen(true)}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <KeyRound size={14} className="text-amber-600" />
              <span>Change Password</span>
            </button>

            <button
              onClick={loadData}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin text-sky-600' : ''} />
            </button>

            <button
              onClick={onLockSession}
              className="px-3 py-1.5 text-xs font-bold text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Lock size={14} />
              <span>Lock Portal</span>
            </button>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1 border-t border-slate-100 overflow-x-auto py-1.5">
          {[
            { id: 'overview', label: 'Overview & Balance' },
            { id: 'circles', label: 'Savings Circles' },
            { id: 'users', label: 'Members & KYC' },
            { id: 'transactions', label: 'Recent Payments' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            
            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Active Escrow Float */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                  <span>Current Escrow Float</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <DollarSign size={16} />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  GH₵ {Number(activeFloat).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Held safely in escrow until circle rounds complete
                </p>
              </div>

              {/* Total Contributions */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                  <span>Total Contributions</span>
                  <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                    <CreditCard size={16} />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  GH₵ {Number(totalVolume).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Total Mobile Money collected from savers
                </p>
              </div>

              {/* Total Payouts */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                  <span>Total Payouts Disbursed</span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <ArrowDownRight size={16} />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  GH₵ {Number(totalPayouts).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Lump sums disbursed to round winners
                </p>
              </div>

              {/* Treasury Revenue & Withdraw Button */}
              <div className="bg-white rounded-2xl p-5 border border-amber-300 shadow-xs space-y-2 bg-gradient-to-br from-amber-50/50 to-white">
                <div className="flex items-center justify-between text-amber-900 text-xs font-bold">
                  <span>Treasury Revenue</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Wallet size={16} />
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-900">
                  GH₵ {Number(revenueBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="w-full mt-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send size={13} />
                  <span>Withdraw Revenue</span>
                </button>
              </div>

            </div>

            {/* Platform Quick Counts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Savings Groups Active</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Circles currently running rotations</p>
                </div>
                <div className="text-3xl font-black text-sky-700 font-mono">
                  {activeCirclesCount}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Registered Savers</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Users registered on Mobile Money</p>
                </div>
                <div className="text-3xl font-black text-emerald-700 font-mono">
                  {totalSaversCount}
                </div>
              </div>
            </div>

            {/* Simple Management Advice */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-2">
              <h3 className="text-sm font-bold text-slate-900">Executive Quick Guide</h3>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li><strong>Savings Circles tab</strong>: View all running groups or delete any test/inappropriate groups.</li>
                <li><strong>Members tab</strong>: Review savers, approve Ghana Card KYC, or deactivate accounts if needed.</li>
                <li><strong>Recent Payments tab</strong>: Monitor incoming Mobile Money transactions in real time.</li>
                <li><strong>Change Password</strong>: Update your executive login credentials directly into the database.</li>
              </ul>
            </div>

          </div>
        )}

        {/* TAB 2: CIRCLES */}
        {activeTab === 'circles' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search circles by name or invite code..."
                  value={circleSearch}
                  onChange={(e) => setCircleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
              <button
                onClick={loadCircles}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={14} className={circlesLoading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>

            {circlesLoading ? (
              <div className="bg-white rounded-2xl p-12 text-center text-slate-400 text-xs font-bold">
                Loading circles...
              </div>
            ) : circles.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center text-slate-400 text-xs font-bold">
                No savings circles found matching your search.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {circles.map(c => (
                  <div key={c.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{c.name}</h4>
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                          Code: {c.invite_code || c.id.substring(0, 6)}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        c.status === 'ACTIVE' 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {c.status || 'ACTIVE'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-2.5 rounded-xl text-xs font-bold text-slate-700">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-normal">Amount</span>
                        GH₵ {c.contribution_amount}
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-normal">Frequency</span>
                        {c.frequency}
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-normal">Members</span>
                        {c.enrolled_count || 0} / {c.members_count}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-500">
                        Rotation: <strong>{c.rotation_type || 'Sequential'}</strong>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedCircleForManage(c);
                            setCircleManageModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 shadow-xs transition-colors"
                          title="Manage Circle & Members"
                        >
                          <Users size={12} />
                          <span>Manage Circle</span>
                        </button>
                        <button
                          onClick={() => handleDeleteCircle(c)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Permanently Delete Circle"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: USERS */}
        {activeTab === 'users' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search members by phone number or name..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
              <button
                onClick={loadUsers}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={14} className={usersLoading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>

            {usersLoading ? (
              <div className="bg-white rounded-2xl p-12 text-center text-slate-400 text-xs font-bold">
                Loading members...
              </div>
            ) : users.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center text-slate-400 text-xs font-bold">
                No members found.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <tr>
                        <th className="p-3.5">Name</th>
                        <th className="p-3.5">Phone Number</th>
                        <th className="p-3.5">Provider</th>
                        <th className="p-3.5">KYC Status</th>
                        <th className="p-3.5">Account Health</th>
                        <th className="p-3.5">Trust</th>
                        <th className="p-3.5 text-right">Executive Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50/60">
                          <td className="p-3.5 font-bold text-slate-900">
                            {u.full_name || 'Member'}
                          </td>
                          <td className="p-3.5 font-mono">
                            {u.phone_number || u.email || '—'}
                          </td>
                          <td className="p-3.5">
                            <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md border border-slate-200 text-[10px]">
                              {u.momo_provider || 'MTN'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              u.kyc_status === 'VERIFIED'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                              {u.kyc_status || 'UNVERIFIED'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              u.is_active === false
                                ? 'bg-red-50 text-red-800 border-red-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}>
                              {u.is_active === false ? 'Restricted / Frozen' : 'Active'}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono font-bold text-sky-700">
                            {u.trust_score ?? 100}
                          </td>
                          <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSupportUser(u);
                                setSupportModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 shadow-xs transition-colors"
                              title="Assist with difficulties, update details, or unrestrict"
                            >
                              <UserCheck size={12} />
                              <span>Assist Saver</span>
                            </button>

                            {u.kyc_status !== 'VERIFIED' && (
                              <button
                                onClick={() => handleVerifyKyc(u)}
                                className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                              >
                                Verify KYC
                              </button>
                            )}

                            <button
                              onClick={() => handleToggleFreeze(u)}
                              className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                                u.is_active === false
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  : 'bg-red-50 text-red-700 hover:bg-red-100'
                              }`}
                            >
                              {u.is_active === false ? 'Unfreeze' : 'Freeze'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: TRANSACTIONS */}
        {activeTab === 'transactions' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search payments by phone, circle name, or reference..."
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
              <button
                onClick={loadTransactions}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={14} className={txLoading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'ALL', label: 'All Payments' },
                { id: 'SUCCESS', label: 'Confirmed / Successful' },
                { id: 'PENDING', label: 'Pending Approval' },
                { id: 'FAILED', label: 'Failed / Disputed' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setTxStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    txStatusFilter === tab.id
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {txLoading ? (
              <div className="bg-white rounded-2xl p-12 text-center text-slate-400 text-xs font-bold">
                Loading payments...
              </div>
            ) : transactions.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center text-slate-400 text-xs font-bold">
                No transactions recorded yet.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <tr>
                        <th className="p-3.5">Type</th>
                        <th className="p-3.5">Saver Phone</th>
                        <th className="p-3.5">Circle</th>
                        <th className="p-3.5">Amount</th>
                        <th className="p-3.5">Reference</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {transactions.map(t => (
                        <tr key={t.id || t.reference} className="hover:bg-slate-50/60">
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              t.type === 'CONTRIBUTION'
                                ? 'bg-sky-50 text-sky-800 border-sky-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}>
                              {t.type || 'PAYMENT'}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono font-bold text-slate-900">
                            {t.sender_phone || t.recipient_phone || t.phone_number || 'Saver'}
                          </td>
                          <td className="p-3.5">
                            {t.group_name || 'Circle'}
                          </td>
                          <td className="p-3.5 font-bold text-slate-900 font-mono">
                            GH₵ {Number(t.amount || 0).toFixed(2)}
                          </td>
                          <td className="p-3.5 font-mono text-[11px] text-slate-500">
                            {t.reference || t.id}
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              t.status === 'SUCCESS'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : t.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-red-50 text-red-800 border-red-200'
                            }`}>
                              {t.status || 'SUCCESS'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                            {t.status !== 'SUCCESS' && (
                              <button
                                onClick={() => handleReconcileTx(t)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors shadow-xs"
                                title="Manually verify and confirm this transaction as SUCCESS"
                              >
                                Confirm Payment
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* MODAL: Withdraw Revenue */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-slate-900">Withdraw Platform Revenue</h3>
            <p className="text-xs text-slate-500">
              Available revenue to disburse: <strong>GH₵ {Number(revenueBalance).toFixed(2)}</strong>
            </p>

            <form onSubmit={handleWithdrawSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amount (GH₵)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 100.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">MoMo Provider</label>
                <select
                  value={withdrawProvider}
                  onChange={(e) => setWithdrawProvider(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                >
                  <option value="MTN">MTN MoMo</option>
                  <option value="TELECEL">Telecel Cash</option>
                  <option value="AT">AT Money</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Recipient MoMo Phone</label>
                <input
                  type="text"
                  required
                  value={withdrawPhone}
                  onChange={(e) => setWithdrawPhone(e.target.value)}
                  placeholder="e.g. 0599360626"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={withdrawing}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  {withdrawing ? 'Transferring...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Credentials Modal */}
      <ChangeAdminCredentialsModal
        isOpen={credsModalOpen}
        onClose={() => setCredsModalOpen(false)}
        onUpdated={(phone) => {
          setCurrentAdminPhone(phone);
          setWithdrawPhone(phone);
        }}
      />

      {/* Member Executive Support Modal */}
      <AdminUserSupportModal
        isOpen={supportModalOpen}
        user={supportUser}
        onClose={() => {
          setSupportModalOpen(false);
          setSupportUser(null);
        }}
        onUserUpdated={(updatedUser) => {
          setUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
          notify('Saver account updated and synced successfully.');
        }}
      />

      {/* Circle Management Modal */}
      <AdminCircleManageModal
        isOpen={circleManageModalOpen}
        circle={selectedCircleForManage}
        onClose={() => {
          setCircleManageModalOpen(false);
          setSelectedCircleForManage(null);
        }}
        onCircleUpdated={(updatedCircle) => {
          setCircles(prev => prev.map(c => c.id === updatedCircle.id ? { ...c, ...updatedCircle } : c));
          loadData();
        }}
        onCircleDeleted={(deletedId) => {
          setCircles(prev => prev.filter(c => c.id !== deletedId));
          loadData();
        }}
      />

    </div>
  );
}
