import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Pause,
  Play,
  Award,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Phone,
  DollarSign,
  UserX,
  Check
} from 'lucide-react';
import {
  getAdminCircleMembers,
  adminToggleCircleStatus,
  adminToggleMemberPaid,
  adminRemoveCircleMember,
  overrideCirclePayout
} from '../api/client';

export function AdminCircleManageModal({ circle, isOpen, onClose, onCircleUpdated, onCircleDeleted }) {
  if (!isOpen || !circle) return null;

  const [members, setMembers] = useState([]);
  const [currentRound, setCurrentRound] = useState(circle.current_round || 1);
  const [circleStatus, setCircleStatus] = useState(circle.status || 'ACTIVE');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  const showNotice = (msg, type = 'success') => {
    setNotice({ msg, type });
    setTimeout(() => setNotice(null), 3500);
  };

  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await getAdminCircleMembers(circle.id);
      if (data && data.members) {
        setMembers(data.members);
        if (data.current_round) setCurrentRound(data.current_round);
      }
    } catch (err) {
      console.error('Failed to load circle members:', err);
      showNotice(err.response?.data?.detail || 'Failed to load group members.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (circle?.id) {
      setCircleStatus(circle.status || 'ACTIVE');
      loadMembers();
    }
  }, [circle?.id]);

  const handleToggleStatus = async () => {
    setActionLoading(true);
    try {
      const target = circleStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      const res = await adminToggleCircleStatus(circle.id, target);
      setCircleStatus(res.status || target);
      showNotice(res.message || `Circle status set to ${res.status}`);
      if (onCircleUpdated) {
        onCircleUpdated({ ...circle, status: res.status || target });
      }
    } catch (err) {
      showNotice(err.response?.data?.detail || 'Failed to update circle status.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleMemberPaid = async (member) => {
    try {
      const res = await adminToggleMemberPaid(circle.id, member.member_id);
      setMembers(prev => prev.map(m => 
        m.member_id === member.member_id 
          ? { ...m, paid_current_round: res.has_paid_current_round }
          : m
      ));
      showNotice(res.message || 'Payment status updated.');
    } catch (err) {
      showNotice(err.response?.data?.detail || 'Failed to toggle member payment.', 'error');
    }
  };

  const handleRemoveMember = async (member) => {
    if (!window.confirm(`Are you sure you want to remove ${member.name || member.phone_number} from this circle?`)) {
      return;
    }
    try {
      const res = await adminRemoveCircleMember(circle.id, member.member_id);
      setMembers(prev => prev.filter(m => m.member_id !== member.member_id));
      showNotice(res.message || 'Member removed from circle.');
      if (onCircleUpdated) {
        onCircleUpdated({ ...circle, enrolled_count: Math.max(0, (circle.enrolled_count || 1) - 1) });
      }
    } catch (err) {
      showNotice(err.response?.data?.detail || 'Failed to remove member.', 'error');
    }
  };

  const handleOverridePayout = async () => {
    if (!window.confirm(`Override & disburse active round payout for "${circle.name}"?`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await overrideCirclePayout(circle.id);
      showNotice(res.message || 'Payout disbursement triggered successfully.');
      loadMembers();
      if (onCircleUpdated) {
        onCircleUpdated({ ...circle, current_round: currentRound + 1 });
      }
    } catch (err) {
      showNotice(err.response?.data?.detail || 'Payout override failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl w-full max-w-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center border border-sky-200 shadow-xs">
              <Users size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-slate-900">{circle.name}</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  circleStatus === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {circleStatus}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">Code: {circle.invite_code || circle.id.substring(0, 8)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {notice && (
            <div className={`p-3 rounded-2xl flex items-center gap-2.5 text-xs font-bold ${
              notice.type === 'error'
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            }`}>
              {notice.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              <span>{notice.msg}</span>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 font-semibold block">Contribution</span>
              <span className="text-xs font-black text-slate-900 font-mono">GH₵ {circle.contribution_amount}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 font-semibold block">Total Pot Pool</span>
              <span className="text-xs font-black text-emerald-700 font-mono">GH₵ {circle.total_pool || (circle.contribution_amount * circle.members_count)}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 font-semibold block">Frequency</span>
              <span className="text-xs font-bold text-slate-900">{circle.frequency}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 font-semibold block">Current Round</span>
              <span className="text-xs font-black text-sky-700 font-mono">Round {currentRound} / {circle.members_count}</span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={actionLoading}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  circleStatus === 'ACTIVE'
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
                }`}
              >
                {circleStatus === 'ACTIVE' ? <Pause size={13} /> : <Play size={13} />}
                <span>{circleStatus === 'ACTIVE' ? 'Pause Rotation' : 'Resume Rotation'}</span>
              </button>

              <button
                type="button"
                onClick={handleOverridePayout}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="Manually disburse pot to scheduled recipient"
              >
                <Award size={13} />
                <span>Override & Disburse Pot</span>
              </button>
            </div>

            <button
              type="button"
              onClick={loadMembers}
              disabled={loading}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Member Roster Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Enrolled Members & Turn Sequence ({members.length})
            </h3>

            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs font-bold">
                Loading members...
              </div>
            ) : members.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-bold border border-slate-200 rounded-2xl">
                No members joined yet.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="p-3">Turn</th>
                      <th className="p-3">Member</th>
                      <th className="p-3">Phone / Provider</th>
                      <th className="p-3">Current Round</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {members.map(m => (
                      <tr key={m.member_id} className={`hover:bg-slate-50/60 ${m.is_current_recipient ? 'bg-sky-50/40' : ''}`}>
                        <td className="p-3 font-mono font-bold text-slate-900">
                          #{m.turn_order}
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-slate-900">{m.name || 'Member'}</span>
                          {m.is_current_recipient && (
                            <span className="ml-1.5 px-1.5 py-0.5 bg-sky-100 text-sky-800 text-[10px] font-bold rounded-md border border-sky-200">
                              Current Winner
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono">
                          {m.phone_number} <span className="text-slate-400 text-[10px]">({m.momo_provider || 'MTN'})</span>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            m.paid_current_round 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {m.paid_current_round ? <Check size={10} /> : <XCircle size={10} />}
                            {m.paid_current_round ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleMemberPaid(m)}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border ${
                              m.paid_current_round
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {m.paid_current_round ? 'Mark Unpaid' : 'Mark Paid'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(m)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove Member from Circle"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close Management Window
          </button>
        </div>
      </div>
    </div>
  );
}
