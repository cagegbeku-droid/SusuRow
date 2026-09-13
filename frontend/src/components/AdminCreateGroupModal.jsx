import React, { useState } from 'react';
import {
  X,
  PlusCircle,
  Users,
  DollarSign,
  Calendar,
  Shuffle,
  RotateCw,
  Gavel,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react';
import { adminCreateEmptyGroup } from '../api/client';

export function AdminCreateGroupModal({ isOpen, onClose, onGroupCreated }) {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [contributionAmount, setContributionAmount] = useState('10');
  const [frequency, setFrequency] = useState('WEEKLY');
  const [membersCount, setMembersCount] = useState(5);
  const [rotationType, setRotationType] = useState('SEQUENTIAL');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const totalPot = (Number(contributionAmount) || 0) * (Number(membersCount) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a group name.');
      return;
    }
    const amt = Number(contributionAmount);
    if (!amt || amt < 1) {
      setError('Contribution amount must be at least GH₵1.00.');
      return;
    }
    const count = Number(membersCount);
    if (!count || count < 2) {
      setError('Group capacity must be at least 2 members.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        contribution_amount: amt,
        frequency,
        members_count: count,
        rotation_type: rotationType,
        description: description.trim() || undefined
      };
      const res = await adminCreateEmptyGroup(payload);
      if (onGroupCreated) {
        onGroupCreated(res.group || res);
      }
      onClose();
    } catch (err) {
      console.error('Failed to create empty group:', err);
      setError(err.response?.data?.detail || 'Failed to create empty group.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl w-full max-w-lg border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center border border-sky-200 shadow-xs">
              <PlusCircle size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Create Empty Susu Group</h2>
              <p className="text-[11px] text-slate-500">0 enrolled members — all spots open for real savers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Group Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Group Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Accra Central Market Traders Susu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          {/* Pot Preview Banner */}
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3.5 text-center space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-sky-700">Total Pot Pool per Round</span>
            <div className="text-2xl font-black text-sky-950 font-mono">
              GH₵ {totalPot.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-sky-700 font-medium">
              {membersCount} Savers × GH₵{Number(contributionAmount || 0).toFixed(2)} ({frequency.toLowerCase()})
            </p>
          </div>

          {/* Contribution Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Contribution per Saver (GH₵) *</label>
            <input
              type="number"
              min="1"
              step="1"
              required
              value={contributionAmount}
              onChange={(e) => setContributionAmount(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden"
            />
            {/* Quick amount presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[5, 10, 20, 50, 100, 200].map(amt => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setContributionAmount(String(amt))}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                    Number(contributionAmount) === amt
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  GH₵{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Member Capacity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Savers (Capacity) *</label>
              <input
                type="number"
                min="2"
                max="100"
                required
                value={membersCount}
                onChange={(e) => setMembersCount(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Frequency Schedule</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>
          </div>

          {/* Rotation Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Rotation Scheme</label>
            <select
              value={rotationType}
              onChange={(e) => setRotationType(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            >
              <option value="SEQUENTIAL">Sequential (Turn by order of joining)</option>
              <option value="BALLOT">Ballot / Random Draw</option>
              <option value="BIDDING">Bidding / Auction</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. For registered traders in central market. Contributions every Friday..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <PlusCircle size={14} />
              )}
              <span>Create Empty Group</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
