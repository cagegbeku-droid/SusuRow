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
  Check,
  Settings,
  Edit3,
  Save,
  ShieldAlert
} from 'lucide-react';
import {
  getAdminCircleMembers,
  adminToggleCircleStatus,
  adminToggleMemberPaid,
  adminRemoveCircleMember,
  overrideCirclePayout,
  adminUpdateGroup,
  adminDeleteGroup
} from '../api/client';

export function AdminCircleManageModal({ circle, isOpen, onClose, onCircleUpdated, onCircleDeleted }) {
  if (!isOpen || !circle) return null;

  const [activeTab, setActiveTab] = useState('members'); // 'members' | 'edit'
  const [members, setMembers] = useState([]);
  const [currentRound, setCurrentRound] = useState(circle.current_round || 1);
  const [circleStatus, setCircleStatus] = useState(circle.status || 'ACTIVE');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  // Edit Group Form State
  const [editForm, setEditForm] = useState({
    name: circle.name || '',
    contribution_amount: circle.contribution_amount || 10,
    frequency: circle.frequency || 'WEEKLY',
    members_count: circle.members_count || 5,
    rotation_type: circle.rotation_type || 'SEQUENTIAL',
    status: circle.status || 'RECRUITING',
    current_round: circle.current_round || 1,
    description: circle.description || ''
  });

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
      console.error('Failed to load group members:', err);
      showNotice(err.response?.data?.detail || 'Failed to load group members.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (circle?.id) {
      setCircleStatus(circle.status || 'ACTIVE');
      setCurrentRound(circle.current_round || 1);
      setEditForm({
        name: circle.name || '',
        contribution_amount: circle.contribution_amount || 10,
        frequency: circle.frequency || 'WEEKLY',
        members_count: circle.members_count || 5,
        rotation_type: circle.rotation_type || 'SEQUENTIAL',
        status: circle.status || 'RECRUITING',
        current_round: circle.current_round || 1,
        description: circle.description || ''
      });
      loadMembers();
    }
  }, [circle?.id]);

  const handleToggleStatus = async () => {
    setActionLoading(true);
    try {
      const target = circleStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      const res = await adminToggleCircleStatus(circle.id, target);
      setCircleStatus(res.status || target);
      showNotice(res.message || `Group status set to ${res.status}`);
      if (onCircleUpdated) {
        onCircleUpdated({ ...circle, status: res.status || target });
      }
    } catch (err) {
      showNotice(err.response?.data?.detail || 'Failed to update group status.', 'error');
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
    if (!window.confirm(`Are you sure you want to remove ${member.name || member.phone_number} from this group?`)) {
      return;
    }
    try {
      const res = await adminRemoveCircleMember(circle.id, member.member_id);
      setMembers(prev => prev.filter(m => m.member_id !== member.member_id));
      showNotice(res.message || 'Member removed from group.');
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

  const handleSaveGroupEdit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        contribution_amount: Number(editForm.contribution_amount),
        frequency: editForm.frequency,
        members_count: Number(editForm.members_count),
        rotation_type: editForm.rotation_type,
        status: editForm.status,
        current_round: Number(editForm.current_round),
        description: editForm.description.trim()
      };
      const res = await adminUpdateGroup(circle.id, payload);
      showNotice(res.message || 'Group updated successfully.');
      setCircleStatus(editForm.status);
      setCurrentRound(editForm.current_round);
      if (onCircleUpdated) {
        onCircleUpdated({
          ...circle,
          ...payload,
          total_pool: payload.contribution_amount * payload.members_count
        });
      }
    } catch (err) {
      showNotice(err.response?.data?.detail || 'Failed to update group parameters.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm(`PERMANENT ACTION: Are you sure you want to completely delete the group "${circle.name}"? All associated member slots and records will be deleted.`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await adminDeleteGroup(circle.id);
      showNotice(res.message || 'Group deleted successfully.');
      if (onCircleDeleted) {
        onCircleDeleted(circle.id);
      }
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      showNotice(err.response?.data?.detail || 'Failed to delete group.', 'error');
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl w-full max-w-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/70">
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
                    : circleStatus === 'RECRUITING'
                    ? 'bg-sky-50 text-sky-800 border-sky-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {circleStatus}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">Invite Code: {circle.invite_code || circle.id.substring(0, 8)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-5 sm:px-6 pt-3 pb-2 border-b border-slate-100 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'members'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users size={13} />
            <span>Members & Turn Order ({members.length}/{circle.members_count})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'edit'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 size={13} />
            <span>Edit Group Parameters</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
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

          {/* TAB 1: MEMBERS */}
          {activeTab === 'members' && (
            <div className="space-y-4">
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
                    disabled={actionLoading || members.length === 0}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
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
                  Enrolled Members & Turn Sequence ({members.length} of {circle.members_count})
                </h3>

                {loading ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-bold">
                    Loading members...
                  </div>
                ) : members.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                    <p className="text-xs font-bold text-slate-700">Pristine Empty Group (0 Members)</p>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      All {circle.members_count} member seats are open for real Ghanaian savers to join using Invite Code: <strong className="font-mono text-sky-700">{circle.invite_code || circle.id.substring(0, 8)}</strong>
                    </p>
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
                                title="Remove Member from Group"
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
          )}

          {/* TAB 2: EDIT GROUP PARAMETERS */}
          {activeTab === 'edit' && (
            <form onSubmit={handleSaveGroupEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Group Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contribution Amount (GH₵) *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={editForm.contribution_amount}
                    onChange={(e) => setEditForm({ ...editForm, contribution_amount: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contribution Schedule</label>
                  <select
                    value={editForm.frequency}
                    onChange={(e) => setEditForm({ ...editForm, frequency: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Member Capacity (Slots)</label>
                  <input
                    type="number"
                    min="2"
                    max="100"
                    required
                    value={editForm.members_count}
                    onChange={(e) => setEditForm({ ...editForm, members_count: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Turn Assignment Scheme</label>
                  <select
                    value={editForm.rotation_type}
                    onChange={(e) => setEditForm({ ...editForm, rotation_type: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  >
                    <option value="SEQUENTIAL">Sequential (Fixed Turn Order)</option>
                    <option value="BALLOT">Ballot / Random Draw</option>
                    <option value="BIDDING">Bidding / Auction</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lifecycle Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  >
                    <option value="RECRUITING">RECRUITING (Open for Members)</option>
                    <option value="ACTIVE">ACTIVE (Running Rotation)</option>
                    <option value="PAUSED">PAUSED (Temporarily On Hold)</option>
                    <option value="COMPLETED">COMPLETED (All Rounds Finished)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Current Active Round</label>
                  <input
                    type="number"
                    min="1"
                    max={editForm.members_count}
                    value={editForm.current_round}
                    onChange={(e) => setEditForm({ ...editForm, current_round: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Group Description</label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Optional brief description for members..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>Save Group Changes</span>
                </button>

                <button
                  type="button"
                  onClick={handleDeleteGroup}
                  disabled={actionLoading}
                  className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Delete Group</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}
