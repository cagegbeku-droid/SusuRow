import React, { useState, useEffect } from 'react';
import { 
  X, 
  PlusCircle, 
  Users, 
  ListOrdered, 
  Shuffle, 
  Gavel, 
  Lock, 
  Globe, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { createGroup } from '../api/client';
import confetti from 'canvas-confetti';

export const CreateCircleModal = ({ isOpen, onClose, onGroupCreated }) => {
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [contributionAmount, setContributionAmount] = useState(200);
  const [frequency, setFrequency] = useState('WEEKLY');
  const [membersCount, setMembersCount] = useState(5);
  const [commitmentDeposit, setCommitmentDeposit] = useState(0);
  const [rotationType, setRotationType] = useState('SEQUENTIAL');
  
  // Creator Info
  const [creatorName, setCreatorName] = useState('');
  const [creatorPhone, setCreatorPhone] = useState('');
  const [creatorProvider, setCreatorProvider] = useState('MTN');

  useEffect(() => {
    if (user) {
      setCreatorName(user.full_name || '');
      setCreatorPhone(user.phone_number || '');
      setCreatorProvider(user.momo_provider || 'MTN');
    }
  }, [user, isOpen]);

  // Auto-detect Ghana Mobile Network from prefix
  useEffect(() => {
    const clean = creatorPhone.replace(/[^\d]/g, '');
    if (clean.length >= 3) {
      const prefix = clean.substring(0, 3);
      if (['024', '054', '055', '059', '025', '053'].includes(prefix)) {
        setCreatorProvider('MTN');
      } else if (['020', '050'].includes(prefix)) {
        setCreatorProvider('TELECEL');
      } else if (['027', '057', '026', '056'].includes(prefix)) {
        setCreatorProvider('AT');
      }
    }
  }, [creatorPhone]);

  if (!isOpen) return null;

  const totalPool = contributionAmount * membersCount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!creatorPhone.trim()) {
      setError('Please enter your mobile money number');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        is_private: isPrivate,
        contribution_amount: Number(contributionAmount),
        frequency,
        members_count: Number(membersCount),
        commitment_deposit: Number(commitmentDeposit) || 0.0,
        rotation_type: rotationType,
        creator_phone: creatorPhone.trim(),
        creator_name: creatorName.trim() || 'Group Leader',
        creator_momo_provider: creatorProvider
      });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      if (onGroupCreated) {
        onGroupCreated(res);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not create group. Please check the fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-primary-900 text-white p-5 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-lg font-bold text-white">Create a Susu Group</h2>
          <p className="text-xs text-primary-200 mt-0.5">
            Step {step} of 3 — {step === 1 ? 'Group Info' : step === 2 ? 'Cycle & Contribution' : 'Review & Start'}
          </p>

          {/* Stepper */}
          <div className="flex gap-1.5 mt-3">
            <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-gold-400' : 'bg-primary-800'}`} />
            <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-gold-400' : 'bg-primary-800'}`} />
            <div className={`flex-1 h-1 rounded-full ${step >= 3 ? 'bg-gold-400' : 'bg-primary-800'}`} />
          </div>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Accra Traders Club"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-700 text-sm font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief note about the group"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-700 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Group Privacy
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <div
                    onClick={() => setIsPrivate(false)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      !isPrivate
                        ? 'border-primary-700 bg-primary-50 text-primary-950 ring-2 ring-primary-700'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                      <Globe className="w-3.5 h-3.5 text-primary-700" />
                      <span>Public Group</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">Visible on marketplace</p>
                  </div>

                  <div
                    onClick={() => setIsPrivate(true)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isPrivate
                        ? 'border-primary-700 bg-primary-50 text-primary-950 ring-2 ring-primary-700'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                      <Lock className="w-3.5 h-3.5 text-primary-700" />
                      <span>Private Group</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">Join by invite code only</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {/* Total Cycle Pot Summary */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Pot per Turn</div>
                  <div className="text-xl font-black text-gold-400 font-mono">
                    GH₵{totalPool.toLocaleString()}
                  </div>
                </div>
                <div className="text-right text-xs text-slate-300 font-semibold">
                  {membersCount} members × GH₵{contributionAmount}
                </div>
              </div>

              {/* Amount & Frequency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contribution (GH₵) *
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-700 text-sm font-bold text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cycle Schedule *
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-700 text-xs font-bold text-slate-900 bg-white"
                  >
                    <option value="DAILY">Daily Rotation</option>
                    <option value="WEEKLY">Weekly Rotation</option>
                    <option value="MONTHLY">Monthly Rotation</option>
                  </select>
                </div>
              </div>

              {/* Members Count & Deposit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Total Members / Turns *
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="50"
                    value={membersCount}
                    onChange={(e) => setMembersCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-700 text-sm font-bold text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Security Deposit (GH₵)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={commitmentDeposit}
                    onChange={(e) => setCommitmentDeposit(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-700 text-sm font-bold text-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Cycle Payout Order */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Cycle Payout Order
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'SEQUENTIAL', label: 'Turn by Turn', desc: 'Join order' },
                    { id: 'BALLOT', label: 'Ballot Draw', desc: 'Random shuffle' },
                    { id: 'BIDDING', label: 'Bidding', desc: 'Highest bid' }
                  ].map((r) => (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => setRotationType(r.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        rotationType === r.id
                          ? 'border-primary-700 bg-primary-50 text-primary-950 ring-2 ring-primary-700'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs font-bold">{r.label}</div>
                      <div className="text-[10px] text-slate-500">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Group Name:</span>
                  <span className="font-bold text-slate-900">{name || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Contribution:</span>
                  <span className="font-bold text-slate-900 font-mono">GH₵{contributionAmount} / {frequency.toLowerCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Pot per Turn:</span>
                  <span className="font-black text-primary-800 font-mono">GH₵{totalPool.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cycle Duration:</span>
                  <span className="font-bold text-slate-900">{membersCount} Rounds ({frequency.toLowerCase()})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payout Order:</span>
                  <span className="font-bold text-slate-900">{rotationType}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kwame Mensah"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-700 text-sm font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Money Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="024 123 4567"
                  value={creatorPhone}
                  onChange={(e) => setCreatorPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-700 font-mono text-sm font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mobile Network
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['MTN', 'TELECEL', 'AT'].map((prov) => (
                    <button
                      type="button"
                      key={prov}
                      onClick={() => setCreatorProvider(prov)}
                      className={`py-2 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        creatorProvider === prov
                          ? 'border-primary-700 bg-primary-50 text-primary-900 ring-2 ring-primary-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {prov === 'MTN' ? 'MTN MoMo' : prov === 'TELECEL' ? 'Telecel' : 'AT Money'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-3.5 py-2 rounded-xl text-slate-700 font-bold text-xs hover:bg-slate-200 transition-all flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !name.trim()) {
                  setError('Please enter a group name');
                  return;
                }
                setError(null);
                setStep(step + 1);
              }}
              className="px-5 py-2.5 rounded-xl bg-primary-800 hover:bg-primary-900 text-white font-bold text-xs transition-all flex items-center gap-1 cursor-pointer shadow"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-1 shadow disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Group...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Create Group</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
