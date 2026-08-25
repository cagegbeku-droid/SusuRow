import React, { useState } from 'react';
import { 
  X, 
  PlusCircle, 
  RotateCw, 
  Shuffle, 
  Gavel, 
  ShieldCheck, 
  Check, 
  Coins, 
  Lock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { createGroup } from '../api/client';

export const CreateCircleModal = ({ isOpen, onClose, onGroupCreated }) => {
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contributionAmount, setContributionAmount] = useState(200);
  const [frequency, setFrequency] = useState('WEEKLY');
  const [membersCount, setMembersCount] = useState(5);
  const [rotationType, setRotationType] = useState('SEQUENTIAL');
  const [commitmentDeposit, setCommitmentDeposit] = useState(0);
  const [isPrivate, setIsPrivate] = useState(false);

  if (!isOpen) return null;

  const totalPool = contributionAmount * membersCount;

  const handleSubmit = async () => {
    if (!name.trim()) return;
    if (!user?.phone_number) {
      alert("Please add your Ghanaian Mobile Money phone number in your Profile before creating a group.");
      return;
    }
    setLoading(true);
    try {
      const res = await createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        is_private: isPrivate,
        contribution_amount: Number(contributionAmount),
        frequency: frequency,
        members_count: Number(membersCount),
        commitment_deposit: Number(commitmentDeposit),
        rotation_type: rotationType,
        creator_phone: user.phone_number,
        creator_name: user.full_name || 'Group Leader',
        creator_momo_provider: user.momo_provider || 'MTN'
      });

      onClose();
      if (onGroupCreated) onGroupCreated(res);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create Susu group.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#04060A]/85 backdrop-blur-md">
      <div className="dark-card w-full max-w-lg rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white p-5 sm:p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-300 uppercase tracking-wider mb-1">
            <Sparkles size={13} />
            <span>Step {step} of 3</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white">
            {step === 1 && 'Group Basics & Schedule'}
            {step === 2 && 'Contributions & Pot'}
            {step === 3 && 'Turn Order & Security'}
          </h2>
          <p className="text-xs text-blue-100 mt-0.5">
            {step === 1 && 'Name your Susu group and select how often members contribute.'}
            {step === 2 && 'Set contribution amount and member capacity.'}
            {step === 3 && 'Choose how turns are assigned and optional security deposit.'}
          </p>
        </div>

        {/* Scrollable Form Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Susu Group Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Accra Market Traders, Tech Savers Club"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0E1322] border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Group Description / Objective
                </label>
                <textarea
                  rows={2}
                  placeholder="Briefly state the goal (e.g. Weekly savings for shop restocking)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0E1322] border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
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
                          ? 'border-blue-500 bg-blue-500/10 text-white ring-2 ring-blue-500/40 shadow-sm'
                          : 'border-white/5 bg-[#0E1322] text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      <div className="text-xs font-bold">{item.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
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
              <div className="bg-[#0E1322] rounded-3xl p-4 border border-white/10 text-center space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Total Pot per Turn</div>
                <div className="text-3xl font-black text-amber-400 font-mono">
                  GH₵{totalPool.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400">
                  {membersCount} Savers × GH₵{contributionAmount} / {frequency.toLowerCase()}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Contribution per Saver (GH₵)
                </label>
                <input
                  type="number"
                  min={10}
                  max={50000}
                  step={10}
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0E1322] border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono font-bold text-white"
                />
                <div className="flex gap-2 mt-2">
                  {[50, 100, 200, 500, 1000].map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setContributionAmount(amt)}
                      className={`flex-1 py-1 text-[11px] font-bold rounded-xl border transition-all cursor-pointer ${
                        contributionAmount === amt
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-[#0E1322] text-slate-400 border-white/5 hover:text-white'
                      }`}
                    >
                      GH₵{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300">
                    Member Capacity Limit
                  </label>
                  <span className="text-xs font-black text-blue-400 font-mono">{membersCount} Savers</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={30}
                  value={membersCount}
                  onChange={(e) => setMembersCount(Number(e.target.value))}
                  className="w-full h-2 bg-[#0E1322] rounded-lg cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-bold">
                  <span>2 Savers</span>
                  <span>15 Savers</span>
                  <span>30 Savers</span>
                </div>
              </div>

            </div>
          )}

          {/* STEP 3: Rotation Scheme & Security */}
          {step === 3 && (
            <div className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
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
                            ? 'border-blue-500 bg-blue-500/10 text-white ring-2 ring-blue-500/40 shadow-sm'
                            : 'border-white/5 bg-[#0E1322] text-slate-400 hover:bg-white/5'
                        }`}
                      >
                        <Icon size={16} className={rotationType === scheme.id ? 'text-blue-400' : 'text-slate-500'} />
                        <div className="text-xs font-bold mt-1.5">{scheme.title}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{scheme.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Upfront Escrow Security Deposit (Optional GH₵)
                </label>
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={commitmentDeposit}
                  onChange={(e) => setCommitmentDeposit(Number(e.target.value))}
                  placeholder="0 (No deposit)"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0E1322] border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono font-bold text-white"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Held in escrow until all rounds complete to deter payment defaults.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between p-3.5 bg-[#0E1322] rounded-2xl border border-white/5">
                <div>
                  <span className="text-xs font-bold text-white">Private Group</span>
                  <p className="text-[10px] text-slate-400">Only accessible via invite code</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPrivate(!isPrivate)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                    isPrivate ? 'bg-blue-600' : 'bg-slate-700'
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
        <div className="p-4 sm:p-5 border-t border-white/5 bg-[#0E1322] flex items-center justify-between gap-3 shrink-0">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2.5 rounded-2xl bg-[#141A2D] hover:bg-[#1C233A] text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-white/5"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-[#141A2D] hover:bg-[#1C233A] text-slate-400 text-xs font-bold transition-all cursor-pointer border border-white/5"
            >
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              disabled={step === 1 && !name.trim()}
              onClick={() => setStep(step + 1)}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading || !name.trim()}
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all cursor-pointer active:scale-95"
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
