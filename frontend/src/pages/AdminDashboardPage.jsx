import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Users,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Send,
  ArrowLeft,
  DollarSign,
  Lock,
  Unlock,
  Eye,
  Check,
  X,
  Phone,
  Clock,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Award
} from 'lucide-react';
import {
  getAdminMetrics,
  getAdminUsers,
  updateUserKycStatus,
  toggleUserFreeze,
  toggleUserAdmin,
  getAdminCircles,
  getAdminCircleMembers,
  overrideCirclePayout,
  getAdminTransactions,
  reconcileTransaction,
  broadcastAdminSMS
} from '../api/client';

export default function AdminDashboardPage({ onBack }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'circles' | 'transactions' | 'broadcast'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);

  // Metrics State
  const [metrics, setMetrics] = useState(null);

  // Users Tab State
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userSearch, setUserSearch] = useState('');
  const [kycFilter, setKycFilter] = useState('ALL');
  const [selectedUserForModal, setSelectedUserForModal] = useState(null);
  const [usersLoading, setUsersLoading] = useState(false);

  // Circles Tab State
  const [circles, setCircles] = useState([]);
  const [circleFilter, setCircleFilter] = useState('ALL');
  const [circleSearch, setCircleSearch] = useState('');
  const [selectedCircleForAudit, setSelectedCircleForAudit] = useState(null);
  const [circleAuditData, setCircleAuditData] = useState(null);
  const [circlesLoading, setCirclesLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);

  // Transactions Tab State
  const [transactions, setTransactions] = useState([]);
  const [txFilter, setTxFilter] = useState('ALL');
  const [txSearch, setTxSearch] = useState('');
  const [txLoading, setTxLoading] = useState(false);

  // Broadcast Tab State
  const [broadcastTarget, setBroadcastTarget] = useState('ALL_USERS');
  const [broadcastGroupId, setBroadcastGroupId] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);

  // Show action feedback notice
  const notify = (msg, type = 'success') => {
    setActionNotice({ msg, type });
    setTimeout(() => setActionNotice(null), 4500);
  };

  // Fetch High-Level Metrics
  const loadMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
      setError(err?.response?.data?.detail || 'Failed to load executive platform metrics. Ensure you have administrator privileges.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Users
  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const data = await getAdminUsers({
        query: userSearch || undefined,
        kyc_status: kycFilter !== 'ALL' ? kycFilter : undefined,
        limit: 50
      });
      setUsers(data.users || []);
      setTotalUsers(data.total || 0);
    } catch (err) {
      console.error('Failed to load admin users:', err);
      notify(err?.response?.data?.detail || 'Failed to fetch savers list', 'error');
    } finally {
      setUsersLoading(false);
    }
  }, [userSearch, kycFilter]);

  // Fetch Circles
  const loadCircles = useCallback(async () => {
    try {
      setCirclesLoading(true);
      const data = await getAdminCircles({
        status_filter: circleFilter !== 'ALL' ? circleFilter : undefined,
        query: circleSearch || undefined
      });
      setCircles(data || []);
    } catch (err) {
      console.error('Failed to load admin circles:', err);
      notify(err?.response?.data?.detail || 'Failed to fetch circles list', 'error');
    } finally {
      setCirclesLoading(false);
    }
  }, [circleFilter, circleSearch]);

  // Fetch Transactions
  const loadTransactions = useCallback(async () => {
    try {
      setTxLoading(true);
      const data = await getAdminTransactions({
        tx_type: txFilter,
        query: txSearch || undefined,
        limit: 50
      });
      setTransactions(data || []);
    } catch (err) {
      console.error('Failed to load admin transactions:', err);
      notify(err?.response?.data?.detail || 'Failed to fetch transactions ledger', 'error');
    } finally {
      setTxLoading(false);
    }
  }, [txFilter, txSearch]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    else if (activeTab === 'circles') loadCircles();
    else if (activeTab === 'transactions') loadTransactions();
  }, [activeTab, loadUsers, loadCircles, loadTransactions]);

  // User Actions
  const handleUpdateKYC = async (userId, newStatus) => {
    try {
      await updateUserKycStatus(userId, newStatus, 'Updated via executive console');
      notify(`Saver KYC updated to ${newStatus}`);
      loadUsers();
      loadMetrics();
      if (selectedUserForModal?.id === userId) {
        setSelectedUserForModal(prev => prev ? { ...prev, kyc_status: newStatus } : null);
      }
    } catch (err) {
      notify(err?.response?.data?.detail || 'Failed to update KYC status', 'error');
    }
  };

  const handleToggleFreeze = async (userId) => {
    try {
      const res = await toggleUserFreeze(userId);
      notify(res.message);
      loadUsers();
    } catch (err) {
      notify(err?.response?.data?.detail || 'Failed to update freeze status', 'error');
    }
  };

  const handleToggleAdmin = async (userId) => {
    if (!window.confirm('Are you sure you want to toggle administrator privileges for this user?')) return;
    try {
      const res = await toggleUserAdmin(userId);
      notify(res.message);
      loadUsers();
    } catch (err) {
      notify(err?.response?.data?.detail || 'Failed to update admin status', 'error');
    }
  };

  // Circle Actions
  const handleOpenCircleAudit = async (circle) => {
    setSelectedCircleForAudit(circle);
    try {
      setAuditLoading(true);
      const audit = await getAdminCircleMembers(circle.id);
      setCircleAuditData(audit);
    } catch (err) {
      notify(err?.response?.data?.detail || 'Failed to load circle members audit', 'error');
    } finally {
      setAuditLoading(false);
    }
  };

  const handleOverridePayout = async (groupId) => {
    if (!window.confirm('CONFIRM EMERGENCY PAYOUT: This will immediately disburse the pot to the scheduled recipient and advance the round. Proceed?')) return;
    try {
      const res = await overrideCirclePayout(groupId);
      notify(res.message);
      loadCircles();
      loadMetrics();
      if (selectedCircleForAudit?.id === groupId) {
        const audit = await getAdminCircleMembers(groupId);
        setCircleAuditData(audit);
      }
    } catch (err) {
      notify(err?.response?.data?.detail || 'Failed to execute payout override', 'error');
    }
  };

  // Transaction Actions
  const handleReconcile = async (txId) => {
    try {
      const res = await reconcileTransaction(txId, 'Manually reconciled via admin console');
      notify(res.message);
      loadTransactions();
      loadMetrics();
    } catch (err) {
      notify(err?.response?.data?.detail || 'Failed to reconcile transaction', 'error');
    }
  };

  // SMS Broadcast Action
  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) {
      notify('Please enter a message to broadcast', 'error');
      return;
    }
    if (!window.confirm(`Are you sure you want to broadcast this SMS via Arkesel to ${broadcastTarget}?`)) return;

    try {
      setBroadcastSending(true);
      setBroadcastResult(null);
      const res = await broadcastAdminSMS({
        message: broadcastMessage.trim(),
        target: broadcastTarget,
        group_id: broadcastTarget === 'CIRCLE_MEMBERS' ? broadcastGroupId : undefined
      });
      setBroadcastResult(res);
      notify(`SMS broadcast dispatched to ${res.dispatched_count} recipients via Arkesel!`);
      setBroadcastMessage('');
    } catch (err) {
      notify(err?.response?.data?.detail || 'Failed to dispatch broadcast SMS', 'error');
    } finally {
      setBroadcastSending(false);
    }
  };

  const refreshCurrentView = () => {
    loadMetrics();
    if (activeTab === 'users') loadUsers();
    else if (activeTab === 'circles') loadCircles();
    else if (activeTab === 'transactions') loadTransactions();
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-3xl p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-xs">
            <Lock size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Executive Access Restricted</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            {error}
          </p>
          <div className="pt-2">
            <button
              onClick={onBack}
              className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs shadow-xs hover:bg-slate-800 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              <span>Return to Application</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      
      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-bold ${
            actionNotice.type === 'error'
              ? 'bg-red-600 text-white border-red-700'
              : 'bg-slate-900 text-white border-slate-700'
          }`}>
            {actionNotice.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} className="text-emerald-400" />}
            <span>{actionNotice.msg}</span>
            <button onClick={() => setActionNotice(null)} className="ml-2 hover:opacity-75 cursor-pointer">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-slate-950 text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <button
                onClick={onBack}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Return to Main App"
              >
                <ArrowLeft size={16} />
              </button>
              <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <ShieldCheck size={12} />
                <span>EXECUTIVE CONTROL CENTER</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                v1.6.0 Live
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              SusuRow Platform Administration
            </h1>
            <p className="text-xs text-slate-400 max-w-xl">
              Internal bank-grade command center for real-time financial reconciliation, KYC identity moderation, circle default prevention, and Arkesel SMS alerting.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={refreshCurrentView}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-2 border border-slate-700 shadow-xs transition-all cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw size={14} className={loading || usersLoading || circlesLoading || txLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Gateway Online</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-800/80 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Financial Health & KPIs', icon: TrendingUp },
            { id: 'users', label: 'Savers & KYC Moderation', icon: Users, count: metrics?.savers?.pending_kyc },
            { id: 'circles', label: 'Circles & Default Monitor', icon: Award, alert: metrics?.circles?.overdue_count > 0 },
            { id: 'transactions', label: 'Financial Ledger & Disputes', icon: CreditCard },
            { id: 'broadcast', label: 'Arkesel SMS Broadcast', icon: Send }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-amber-600' : ''} />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-black">
                    {tab.count}
                  </span>
                )}
                {tab.alert && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: FINANCIAL HEALTH & REVENUE KPIS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Volume */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Total Contributions</span>
                <DollarSign size={16} className="text-sky-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                GH₵{metrics?.financials?.total_volume_ghs?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
              </div>
              <p className="text-[11px] text-slate-500">Gross savings volume processed</p>
            </div>

            {/* Total Payouts */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Winner Pots Disbursed</span>
                <Award size={16} className="text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                GH₵{metrics?.financials?.total_payouts_disbursed_ghs?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
              </div>
              <p className="text-[11px] text-slate-500">Settled via MoMo to winners</p>
            </div>

            {/* Active Float */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Active Escrow Float</span>
                <ShieldCheck size={16} className="text-amber-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                GH₵{metrics?.financials?.active_float_ghs?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
              </div>
              <p className="text-[11px] text-slate-500">Current liquidity held for ongoing rounds</p>
            </div>

            {/* Net Revenue */}
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl p-4 sm:p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-amber-100 text-xs font-bold uppercase tracking-wider">
                <span>Net Platform Revenue</span>
                <Sparkles size={16} className="text-white" />
              </div>
              <div className="text-2xl font-black text-white">
                GH₵{metrics?.financials?.net_revenue_ghs?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
              </div>
              <p className="text-[11px] text-amber-100">Cumulative revenue across transparent fees</p>
            </div>
          </div>

          {/* Transparent Fee Breakdown & Model Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Transparent Revenue & Fee Structure Breakdown
                </h3>
                <p className="text-xs text-slate-500">
                  Exact itemized revenue model according to official SusuRow specifications.
                </p>
              </div>
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-3 py-1 rounded-full">
                Combined Fee: 4.15%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Gateway Processing</span>
                  <span className="text-xs font-black text-sky-600">1.95%</span>
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  GH₵{metrics?.financials?.gateway_fees_ghs?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                </div>
                <p className="text-[11px] text-slate-500">Ghana MoMo settlement & API routing costs</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Circle Commission</span>
                  <span className="text-xs font-black text-emerald-600">1.00%</span>
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  GH₵{metrics?.financials?.commission_fees_ghs?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                </div>
                <p className="text-[11px] text-slate-500">Turn rotation maintenance & escrow underwriting</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Platform Infrastructure</span>
                  <span className="text-xs font-black text-amber-600">1.20%</span>
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  GH₵{metrics?.financials?.platform_fees_ghs?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                </div>
                <p className="text-[11px] text-slate-500">Arkesel SMS alerting & cloud high-availability</p>
              </div>
            </div>
          </div>

          {/* Operational Health & Funnels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Savers & KYC Funnel */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users size={16} className="text-sky-600" />
                  <span>Savers & KYC Verification Funnel</span>
                </h3>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {metrics?.savers?.total_savers || 0} Savers Total
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-emerald-600 flex items-center gap-1.5">
                      <CheckCircle2 size={13} />
                      <span>Verified Savers (Ghana Card Approved)</span>
                    </span>
                    <span className="text-slate-900 dark:text-white">
                      {metrics?.savers?.verified_savers || 0} ({metrics?.savers?.kyc_completion_rate || 0}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min(100, metrics?.savers?.kyc_completion_rate || 0)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl p-3">
                    <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300">Pending Review</div>
                    <div className="text-lg font-black text-amber-900 dark:text-amber-200">
                      {metrics?.savers?.pending_kyc || 0}
                    </div>
                    <button
                      onClick={() => {
                        setKycFilter('PENDING');
                        setActiveTab('users');
                      }}
                      className="text-[10px] font-bold text-amber-700 hover:underline mt-1 cursor-pointer"
                    >
                      Moderate Queue &rarr;
                    </button>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                    <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Unverified / New</div>
                    <div className="text-lg font-black text-slate-800 dark:text-slate-200">
                      {metrics?.savers?.unverified_savers || 0}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Pending Ghana Card</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Circles Operations & Default Risks */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award size={16} className="text-amber-500" />
                  <span>Circle Operations & Default Risk Monitor</span>
                </h3>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {metrics?.circles?.active_count || 0} Active Groups
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-xl p-3.5 space-y-1">
                  <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Active Rotations</div>
                  <div className="text-2xl font-black text-emerald-900 dark:text-emerald-200">
                    {metrics?.circles?.active_count || 0}
                  </div>
                  <p className="text-[10px] text-emerald-700">Currently executing rounds</p>
                </div>

                <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/40 rounded-xl p-3.5 space-y-1">
                  <div className="text-xs font-bold text-sky-800 dark:text-sky-300">Recruiting Circles</div>
                  <div className="text-2xl font-black text-sky-900 dark:text-sky-200">
                    {metrics?.circles?.recruiting_count || 0}
                  </div>
                  <p className="text-[10px] text-sky-700">Awaiting member slots</p>
                </div>

                <div className={`rounded-xl p-3.5 space-y-1 border ${
                  (metrics?.circles?.overdue_count || 0) > 0
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Overdue Default Risks</span>
                    {(metrics?.circles?.overdue_count || 0) > 0 && <AlertTriangle size={14} className="text-rose-600" />}
                  </div>
                  <div className="text-2xl font-black">
                    {metrics?.circles?.overdue_count || 0}
                  </div>
                  <button
                    onClick={() => {
                      setCircleFilter('OVERDUE');
                      setActiveTab('circles');
                    }}
                    className="text-[10px] font-bold underline cursor-pointer"
                  >
                    Inspect Delinquent Circles &rarr;
                  </button>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 space-y-1">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Completed Rotations</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {metrics?.circles?.completed_count || 0}
                  </div>
                  <p className="text-[10px] text-slate-500">100% disbursed cycles</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: SAVERS & KYC MODERATION QUEUE */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          
          {/* Filters & Search */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search size={15} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search name, phone, or Ghana Card..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {['ALL', 'PENDING', 'VERIFIED', 'UNVERIFIED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setKycFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    kycFilter === status
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/60 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Saver</th>
                    <th className="py-3 px-4">Ghana Card</th>
                    <th className="py-3 px-4">KYC Status</th>
                    <th className="py-3 px-4">Trust Score</th>
                    <th className="py-3 px-4">MoMo Provider</th>
                    <th className="py-3 px-4">Active Groups</th>
                    <th className="py-3 px-4 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {usersLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-sky-600" />
                        <span>Loading savers directory...</span>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                        No savers matched your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        
                        {/* Saver Info */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{u.full_name}</span>
                            {u.is_admin && (
                              <span className="text-[9px] font-black uppercase bg-amber-500 text-white px-1.5 py-0.2 rounded-md">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[11px] text-slate-500">
                            {u.phone_number}
                          </div>
                        </td>

                        {/* Ghana Card */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                          {u.ghana_card_number || <span className="text-slate-400 italic">Not Provided</span>}
                        </td>

                        {/* KYC Badge */}
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1 ${
                            u.kyc_status === 'VERIFIED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : u.kyc_status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {u.kyc_status === 'VERIFIED' ? <Check size={10} /> : <Clock size={10} />}
                            <span>{u.kyc_status}</span>
                          </span>
                        </td>

                        {/* Trust Score */}
                        <td className="py-3.5 px-4">
                          <div className="font-black text-slate-800 dark:text-slate-200">
                            {u.trust_score}/100
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">
                            {u.tier} Tier
                          </div>
                        </td>

                        {/* MoMo Provider */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {u.momo_provider || 'MTN'}
                          </span>
                          {u.momo_account_name && (
                            <div className="text-[10px] text-emerald-600 truncate max-w-[120px]">
                              {u.momo_account_name}
                            </div>
                          )}
                        </td>

                        {/* Active Groups */}
                        <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">
                          {u.active_circles_count || 0} circles
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            
                            {/* View Full KYC Details */}
                            <button
                              onClick={() => setSelectedUserForModal(u)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                              title="Inspect Saver Profile"
                            >
                              <Eye size={14} />
                            </button>

                            {/* One-click Approve */}
                            {u.kyc_status !== 'VERIFIED' && (
                              <button
                                onClick={() => handleUpdateKYC(u.id, 'VERIFIED')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-xs transition-all cursor-pointer flex items-center gap-1"
                                title="Approve Identity"
                              >
                                <Check size={12} />
                                <span>Approve</span>
                              </button>
                            )}

                            {/* Freeze/Unfreeze Risk Intervention */}
                            <button
                              onClick={() => handleToggleFreeze(u.id)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                u.is_active
                                  ? 'bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-600'
                                  : 'bg-rose-600 text-white hover:bg-rose-500'
                              }`}
                              title={u.is_active ? 'Freeze Account (Default Risk)' : 'Unfreeze Account'}
                            >
                              {u.is_active ? <Lock size={14} /> : <Unlock size={14} />}
                            </button>

                            {/* Toggle Admin */}
                            <button
                              onClick={() => handleToggleAdmin(u.id)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer border ${
                                u.is_admin
                                  ? 'bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200'
                                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                              }`}
                              title="Promote or Revoke Admin"
                            >
                              {u.is_admin ? 'Demote' : 'Make Admin'}
                            </button>

                          </div>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 px-4 py-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Showing up to 50 records</span>
              <span>Total Savers: {totalUsers}</span>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: CIRCLES & DEFAULT MONITOR */}
      {activeTab === 'circles' && (
        <div className="space-y-4">
          
          {/* Filters & Search */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search size={15} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={circleSearch}
                onChange={(e) => setCircleSearch(e.target.value)}
                placeholder="Search circle name or invite code..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {['ALL', 'ACTIVE', 'RECRUITING', 'COMPLETED', 'OVERDUE'].map((status) => (
                <button
                  key={status}
                  onClick={() => setCircleFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    circleFilter === status
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Circles Grid / List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {circlesLoading ? (
              <div className="col-span-full py-12 text-center text-slate-400">
                <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-sky-600" />
                <span>Loading rotational circles...</span>
              </div>
            ) : circles.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 font-medium">
                No circles match your current filter.
              </div>
            ) : (
              circles.map((c) => (
                <div
                  key={c.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    
                    {/* Circle Header & Health Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400">CODE: {c.join_code}</span>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                          {c.name}
                        </h4>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase tracking-wider shrink-0 ${
                        c.health === 'OVERDUE'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                          : c.health === 'PAYMENTS_DUE'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}>
                        {c.health}
                      </span>
                    </div>

                    {/* Pot & Contribution Info */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 font-medium text-[11px]">Winner Pot</span>
                        <div className="font-black text-slate-900 dark:text-white text-base">
                          GH₵{c.total_pot?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium text-[11px]">Per Member Share</span>
                        <div className="font-bold text-slate-700 dark:text-slate-300">
                          GH₵{c.contribution_amount?.toFixed(2)} ({c.frequency})
                        </div>
                      </div>
                    </div>

                    {/* Current Round & Recipient */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-medium">
                        <span className="text-slate-500">Active Turn:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          Round {c.current_round} of {c.total_rounds}
                        </span>
                      </div>

                      <div className="flex items-center justify-between font-medium">
                        <span className="text-slate-500">Paid this Round:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {c.paid_members_count} / {c.current_members_count} members
                        </span>
                      </div>

                      <div className="flex items-center justify-between font-medium">
                        <span className="text-slate-500">Current Recipient:</span>
                        <span className="font-bold text-emerald-600 truncate max-w-[140px]">
                          {c.recipient_name}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <button
                      onClick={() => handleOpenCircleAudit(c)}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Eye size={14} />
                      <span>Audit Turn</span>
                    </button>

                    {c.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleOverridePayout(c.id)}
                        className="py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                        title="Emergency Pot Disburse"
                      >
                        <DollarSign size={14} />
                        <span>Disburse Pot</span>
                      </button>
                    )}
                  </div>

                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* TAB 4: FINANCIAL LEDGER & RECONCILIATION */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          
          {/* Filter & Search */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search size={15} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                placeholder="Search transaction reference or group..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {['ALL', 'CONTRIBUTION', 'PAYOUT'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTxFilter(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    txFilter === t
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/60 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Group</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Provider</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {txLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-sky-600" />
                        <span>Loading transactions ledger...</span>
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                        No transactions recorded.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        
                        {/* Type */}
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            tx.type === 'CONTRIBUTION'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {tx.type}
                          </span>
                        </td>

                        {/* Reference */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                          {tx.reference}
                        </td>

                        {/* Group */}
                        <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                          {tx.group_name}
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                          GH₵{tx.amount?.toFixed(2)}
                        </td>

                        {/* Provider */}
                        <td className="py-3.5 px-4 font-bold text-slate-600 dark:text-slate-300">
                          {tx.provider || 'MTN'}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            tx.status === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : tx.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {tx.status}
                          </span>
                        </td>

                        {/* Timestamp */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                          {tx.created_at ? new Date(tx.created_at).toLocaleString() : 'N/A'}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          {tx.status !== 'SUCCESS' && (
                            <button
                              onClick={() => handleReconcile(tx.id)}
                              className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              Reconcile
                            </button>
                          )}
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 5: ARKESEL SMS BROADCAST */}
      {activeTab === 'broadcast' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center shadow-xs">
                <Send size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Targeted SMS Alert Broadcast (Arkesel Ghana)
                </h3>
                <p className="text-xs text-slate-500">
                  Deliver instant SMS notifications directly to registered savers across MTN, Telecel, and AT networks.
                </p>
              </div>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              {/* Target Audience */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Audience
                </label>
                <select
                  value={broadcastTarget}
                  onChange={(e) => setBroadcastTarget(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                >
                  <option value="ALL_USERS">All Registered Savers ({metrics?.savers?.total_savers || 0} users)</option>
                  <option value="OVERDUE_MEMBERS">Delinquent Savers (Unpaid members in active circles)</option>
                  <option value="CIRCLE_MEMBERS">Specific Susu Group Participants</option>
                </select>
              </div>

              {/* Group ID if circle members */}
              {broadcastTarget === 'CIRCLE_MEMBERS' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Select Susu Group
                  </label>
                  <select
                    value={broadcastGroupId}
                    onChange={(e) => setBroadcastGroupId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">-- Choose Circle --</option>
                    {circles.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.join_code}) - {c.current_members_count} members
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Message Content */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    SMS Message Text
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    {broadcastMessage.length} / 160 characters (1 SMS segment)
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Example: SusuRow Reminder: Round 2 contribution of GH₵100 is due today. Please authorize the prompt or tap Pay in your dashboard."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              {/* Quick Template Buttons */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Quick Templates:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setBroadcastMessage("SusuRow Alert: Payment is due for your active savings circle. Please ensure your MoMo wallet has sufficient funds to avoid trust score penalties.")}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                  >
                    Payment Reminder
                  </button>
                  <button
                    type="button"
                    onClick={() => setBroadcastMessage("SusuRow Update: Please complete your Ghana Card verification on app to unlock seamless automatic payouts. Thank you for saving with us.")}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                  >
                    KYC Nudge
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={broadcastSending}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Send size={15} className={broadcastSending ? 'animate-pulse' : ''} />
                <span>{broadcastSending ? 'Dispatching SMS via Arkesel...' : 'Dispatch Broadcast SMS'}</span>
              </button>
            </form>

            {broadcastResult && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-bold space-y-1">
                <div>SMS Broadcast Dispatched Successfully!</div>
                <div className="font-normal text-[11px]">
                  Delivered to {broadcastResult.dispatched_count} recipients via Arkesel Gateway.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SAVER FULL KYC MODAL */}
      {selectedUserForModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center font-black">
                  {selectedUserForModal.full_name?.charAt(0) || 'S'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedUserForModal.full_name}
                  </h3>
                  <p className="text-xs font-mono text-slate-500">{selectedUserForModal.phone_number}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForModal(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/60 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ghana Card Number:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {selectedUserForModal.ghana_card_number || 'Not Provided'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">KYC Status:</span>
                  <span className="font-bold text-emerald-600">{selectedUserForModal.kyc_status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Registered MoMo Name:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedUserForModal.momo_account_name || 'Not Resolved'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Next of Kin:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedUserForModal.next_of_kin_name || 'None'} ({selectedUserForModal.next_of_kin_phone || 'N/A'})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Trust Score:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedUserForModal.trust_score}/100 ({selectedUserForModal.tier})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {selectedUserForModal.kyc_status !== 'VERIFIED' ? (
                <button
                  onClick={() => handleUpdateKYC(selectedUserForModal.id, 'VERIFIED')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Verify Ghana Card</span>
                </button>
              ) : (
                <button
                  onClick={() => handleUpdateKYC(selectedUserForModal.id, 'UNVERIFIED')}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <X size={14} />
                  <span>Revoke Verification</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CIRCLE MEMBERS AUDIT DRAWER / MODAL */}
      {selectedCircleForAudit && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400">CIRCLE AUDIT: {selectedCircleForAudit.join_code}</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedCircleForAudit.name}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedCircleForAudit(null);
                  setCircleAuditData(null);
                }}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl flex items-center justify-between text-xs font-bold">
              <span>Active Round: {selectedCircleForAudit.current_round} of {selectedCircleForAudit.total_rounds}</span>
              <span className="text-emerald-600">Total Pot: GH₵{selectedCircleForAudit.total_pot?.toFixed(2)}</span>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {auditLoading ? (
                <div className="py-8 text-center text-slate-400">
                  <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-sky-600" />
                  <span>Auditing member payments...</span>
                </div>
              ) : circleAuditData?.members?.length === 0 ? (
                <div className="py-8 text-center text-slate-400 font-medium">
                  No members joined yet.
                </div>
              ) : (
                circleAuditData?.members?.map((m) => (
                  <div
                    key={m.member_id}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center text-[11px]">
                        #{m.turn_order}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{m.name}</span>
                          {m.is_current_recipient && (
                            <span className="text-[9px] font-black uppercase bg-emerald-500 text-white px-1.5 py-0.2 rounded-md">
                              WINNER (ROUND {selectedCircleForAudit.current_round})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {m.phone_number} ({m.momo_provider})
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        m.paid_current_round
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {m.paid_current_round ? 'PAID' : 'PENDING'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => handleOverridePayout(selectedCircleForAudit.id)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <DollarSign size={14} />
                <span>Emergency Pot Disbursement</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
