import React, { useState } from 'react';
import { 
  X, 
  PlusCircle, 
  RotateCw, 
  Shuffle, 
  Gavel, 
  ShieldCheck, 
  Check, 
  CheckCircle2,
  Coins, 
  Lock, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Loader2 
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { createGroup } from '../api/client';
import { useModalBackdropClose } from '../hooks/useModalBackdropClose';

export const CreateCircleModal = ({ isOpen, onClose, onGroupCreated }) => {
  const { user } = useUser();
  const { handleBackdropClick } = useModalBackdropClose(isOpen, onClose);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isCreated, setIsCreated] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contributionAmount, setContributionAmount] = useState('10');
  const [frequency, setFrequency] = useState('WEEKLY');
  const [membersCount, setMembersCount] = useState(5);
  const [rotationType, setRotationType] = useState('SEQUENTIAL');
  const [commitmentDeposit, setCommitmentDeposit] = useState(0);
  const [isPrivate, setIsPrivate] = useState(false);

  if (!isOpen) return null;

  const totalPool = (Number(contributionAmount) || 0) * (Number(membersCount) || 0);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    if (!user?.phone_number) {
      alert("Please add your Ghanaian Mobile Money phone number in your Profile before creating a group.");
      return;
    }
    const numAmount = Number(contributionAmount);
    if (!numAmount || numAmount < 1) {
      alert("Please enter a valid contribution amount of at least GH₵1.00.");
      return;
    }
    const numMembers = Number(membersCount);
    if (!numMembers || numMembers < 2) {
      alert("Please enter at least 2 members for the group.");
      return;
    }

    setLoading(true);
    try {
      const res = await createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        is_private: isPrivate,
        contribution_amount: Number(numAmount.toFixed(2)),
        frequency: frequency,
        members_count: numMembers,
        commitment_deposit: Number(commitmentDeposit) || 0,
        rotation_type: rotationType,
        creator_phone: user.phone_number,
        creator_name: user.full_name || 'Group Leader',
        creator_momo_provider: user.momo_provider || 'MTN'
      });

      setIsCreated(true);
      setTimeout(() => {
        onClose();
        if (onGroupCreated) onGroupCreated(res);
      }, 700);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create Susu group.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs"
    >
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-blue-700 text-white p-5 sm:p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-200 uppercase tracking-wider mb-1">
            <Sparkles size={13} />
            <span>Step {step} of 3</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {step === 1 && 'Group Basics & Schedule'}
            {step === 2 && 'Contributions & Pot'}
            {step === 3 && 'Turn Order & Security'}
          </h2>
          <p className="text-xs text-sky-100 mt-0.5">
            {step === 1 && 'Name your Susu group and select how often members contribute.'}
            {step === 2 && 'Set contribution amount and member capacity.'}
            {step === 3 && 'Choose how turns are assigned and optional security deposit.'}
          </p>
        </div>

        {/* Scrollable Form Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 bg-white">
          
          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Susu Group Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Family Savings, Friends Club"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-bold text-slate-900 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Group Description / Objective
                </label>
                <textarea
                  rows={2}
                  placeholder="Savings goal (e.g. Personal savings, emergency fund)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs font-medium text-slate-900 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Cycle Contribution Schedule
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'DAILY', label: 'Daily', desc: 'Every 24h' },
                    { id: 'WEEKLY', label: 'Weekly', desc: 'Every 7 days' },
                    { id: 'MONTHLY', label: 'Monthly', desc: 'Every 30 days' }
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setFrequency(item.id)}
                      className={`p-3 text-left rounded-2xl border transition-all cursor-pointer ${
                        frequency === item.id
                          ? 'border-sky-500 bg-sky-50 text-sky-900 ring-2 ring-sky-500/20 shadow-xs'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900">{item.label}</div>
                      <div className="text-[10px] text-slate-600 mt-0.5 font-medium">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Financials & Capacity */}
          {step === 2 && (
            <div className="space-y-4">
              
              {/* Pot Preview Box */}
              <div className="bg-sky-50 rounded-3xl p-4 border border-sky-200 text-center space-y-1">
                <div className="text-[10px] uppercase font-bold text-sky-800">Total Pot per Turn</div>
                <div className="text-3xl font-black text-sky-900 font-mono">
                  GH₵{totalPool.toFixed(2)}
                </div>
                <div className="text-xs text-sky-700 font-bold">
                  {membersCount || 0} Savers × GH₵{Number(contributionAmount || 0).toFixed(2)} / {frequency.toLowerCase()}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Contribution per Saver (GH₵) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sm font-bold text-slate-400">
                    GH₵
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={50000}
                    step={1}
                    placeholder="0"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    className="w-full pl-12 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-mono font-bold text-slate-900"
                  />
                </div>
                <p className="text-[11px] text-slate-600 mt-1 font-medium">
                  Contribution amount — saved as GH₵{Number(contributionAmount || 0).toFixed(2)}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[1, 2, 5, 10, 20, 50, 100, 200].map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setContributionAmount(String(amt))}
                      className={`px-3 py-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        Number(contributionAmount) === amt
                          ? 'bg-sky-600 text-white border-sky-500 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      GH₵{amt}.00
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-900">
                    Number of People to Join Group (Capacity) *
                  </label>
                  <span className="text-xs font-black text-sky-700 font-mono">
                    {membersCount || 0} {Number(membersCount) === 1 ? 'Saver' : 'Savers'}
                  </span>
                </div>

                {/* Direct manual numeric input */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min={2}
                      max={100}
                      step={1}
                      placeholder="0"
                      value={membersCount}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setMembersCount('');
                        } else {
                          const parsed = parseInt(val, 10);
                          setMembersCount(isNaN(parsed) ? '' : Math.max(1, Math.min(100, parsed)));
                        }
                      }}
                      onBlur={() => {
                        if (!membersCount || Number(membersCount) < 2) {
                          setMembersCount(2);
                        }
                      }}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setMembersCount((prev) => Math.max(2, (Number(prev) || 2) - 1))}
                      className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-base flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                      title="Decrease member count"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => setMembersCount((prev) => Math.min(100, (Number(prev) || 2) + 1))}
                      className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-base flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                      title="Increase member count"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Quick Slider */}
                <div className="mt-3">
                  <input
                    type="range"
                    min={2}
                    max={50}
                    value={Number(membersCount) || 2}
                    onChange={(e) => setMembersCount(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-sky-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-600 mt-1 font-bold">
                    <span>2 Savers</span>
                    <span>25 Savers</span>
                    <span>50+ Savers</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* STEP 3: Rotation Scheme & Security */}
          {step === 3 && (
            <div className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Turn Assignment Scheme
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'SEQUENTIAL', icon: RotateCw, title: 'Sequential', desc: 'Turn by turn order' },
                    { id: 'BALLOT', icon: Shuffle, title: 'Ballot Draw', desc: 'Fair random shuffle' },
                    { id: 'BIDDING', icon: Gavel, title: 'Bidding', desc: 'Auction early turns' }
                  ].map((scheme) => {
                    const Icon = scheme.icon;
                    return (
                      <button
                        type="button"
                        key={scheme.id}
                        onClick={() => setRotationType(scheme.id)}
                        className={`p-3 text-left rounded-2xl border transition-all cursor-pointer ${
                          rotationType === scheme.id
                            ? 'border-sky-500 bg-sky-50 text-sky-900 ring-2 ring-sky-500/20 shadow-xs'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Icon size={16} className={rotationType === scheme.id ? 'text-sky-600' : 'text-slate-600'} />
                        <div className="text-xs font-bold mt-1.5 text-slate-900">{scheme.title}</div>
                        <div className="text-[10px] text-slate-600 mt-0.5 font-medium">{scheme.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Upfront Escrow Security Deposit (Optional GH₵)
                </label>
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={commitmentDeposit}
                  onChange={(e) => setCommitmentDeposit(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-mono font-bold text-slate-900"
                />
                <p className="text-[10px] text-slate-600 mt-1 font-medium">
                  Held in escrow until all rounds complete to deter payment defaults.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-900">Private Group</span>
                  <p className="text-[10px] text-slate-600">Only accessible via invite code</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPrivate(!isPrivate)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                    isPrivate ? 'bg-sky-600' : 'bg-slate-300'
                  }`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    isPrivate ? 'translate-x-4' : 'translate-x-1'
                  }`} />
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Footer Navigation Controls */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200 shadow-xs"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer border border-slate-200 shadow-xs"
            >
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              disabled={step === 1 && !name.trim()}
              onClick={() => setStep(step + 1)}
              className="px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <span>Continue</span>
              <ArrowRight size={14} />
            </button>
          ) : isCreated ? (
            <div className="px-6 py-2.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs">
              <CheckCircle2 size={16} className="text-white" />
              <span>✓ Susu Group Created!</span>
            </div>
          ) : (
            <button
              type="button"
              disabled={loading || !name.trim()}
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  <PlusCircle size={15} />
                  <span>Launch Susu Group</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
