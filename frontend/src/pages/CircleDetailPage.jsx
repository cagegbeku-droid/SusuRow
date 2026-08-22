import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Share2, 
  Users, 
  ShieldCheck, 
  Shuffle, 
  Gavel, 
  CheckCircle2, 
  AlertCircle, 
  Smartphone, 
  Loader2, 
  RefreshCw,
  PlusCircle,
  Sparkles,
  Trash2,
  Lock,
  RotateCw,
  Coins,
  ChevronRight
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { 
  getGroupDetail, 
  joinGroup, 
  advanceRound, 
  deleteGroup 
} from '../api/client';
import { RotationalTimeline } from '../components/RotationalTimeline';
import { MoMoPaymentModal } from '../components/MoMoPaymentModal';
import { BallotDrawModal } from '../components/BallotDrawModal';
import { BiddingModal } from '../components/BiddingModal';
import { ShareModal } from '../components/ShareModal';
import { TransactionLedger } from '../components/TransactionLedger';
import confetti from 'canvas-confetti';

export const CircleDetailPage = ({ groupId, onBack }) => {
  const { user, openAuthModal } = useUser();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Modals
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isBallotModalOpen, setIsBallotModalOpen] = useState(false);
  const [isBiddingModalOpen, setIsBiddingModalOpen] = useState(false);
  const [selectedPaymentMember, setSelectedPaymentMember] = useState(null);
  const [isEscrowPayment, setIsEscrowPayment] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getGroupDetail(groupId);
      setGroup(data);
    } catch (err) {
      console.error(err);
      setError('Could not load group details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchDetail();
    }
  }, [groupId]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
        <p className="text-xs text-slate-400">Loading Susu group details...</p>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="dark-card rounded-3xl p-8 text-center space-y-3 max-w-md mx-auto">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <h3 className="text-base font-bold text-white">{error || 'Group not found'}</h3>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl cursor-pointer"
        >
          Back to Groups
        </button>
      </div>
    );
  }

  const cleanUserPhone = user?.phone_number?.replace('+233', '0').replace(/\s+/g, '');
  const cleanCreatorPhone = group.creator_id?.replace('+233', '0').replace(/\s+/g, '');
  const isCreator = cleanUserPhone === cleanCreatorPhone || user?.phone_number === group.creator_id;

  const enrolledMember = group.members?.find(
    m => m.phone_number?.replace('+233', '0').replace(/\s+/g, '') === cleanUserPhone || m.phone_number === user?.phone_number
  );
  const isEnrolled = Boolean(enrolledMember);
  const isFull = group.enrolled_count >= group.members_count;
  const isCompleted = group.status === 'COMPLETED';
  const allPaidForRound = group.members?.length > 0 && group.members.every(m => m.has_paid_current_round);

  const hasActiveContributions = group.payments?.length > 0 || group.status === 'ACTIVE';
  const otherMembersCount = group.members?.filter(m => m.phone_number?.replace('+233', '0').replace(/\s+/g, '') !== cleanCreatorPhone).length || 0;
  const canDelete = isCreator && (!hasActiveContributions || isCompleted || otherMembersCount === 0);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(group.invite_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleJoinCircle = async () => {
    if (!user) {
      openAuthModal();
      return;
    }
    setActionLoading(true);
    try {
      const res = await joinGroup({
        group_id: group.id,
        phone_number: user.phone_number,
        full_name: user.full_name,
        momo_provider: user.momo_provider
      });
      setGroup(res);
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not join group.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisbursePot = async () => {
    setActionLoading(true);
    try {
      const res = await advanceRound(group.id);
      if (res.success) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 }
        });
        await fetchDetail();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to disburse pot.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      await deleteGroup(group.id, user.phone_number);
      setIsDeleteConfirmOpen(false);
      onBack();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete group.');
    } finally {
      setActionLoading(false);
    }
  };

  const openMoMoModalForUser = (member, isEscrow = false) => {
    if (!user) {
      openAuthModal();
      return;
    }
    setSelectedPaymentMember(member);
    setIsEscrowPayment(isEscrow);
    setIsPaymentModalOpen(true);
  };

  const getProviderBadge = (provider) => {
    switch (provider) {
      case 'MTN':
        return <span className="bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 font-black px-2 py-0.5 rounded-full text-[10px]">MTN</span>;
      case 'TELECEL':
        return <span className="bg-red-500/20 text-red-300 border border-red-500/30 font-black px-2 py-0.5 rounded-full text-[10px]">Telecel</span>;
      case 'AT':
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 font-black px-2 py-0.5 rounded-full text-[10px]">AT</span>;
      default:
        return <span className="bg-white/10 text-slate-300 font-bold px-2 py-0.5 rounded-full text-[10px]">{provider}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* 🧭 Top Navigation & Share Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#141A2D] hover:bg-[#1C233A] border border-white/10 text-slate-300 font-bold text-xs transition-all cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Groups</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Share */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#141A2D] hover:bg-[#1C233A] border border-white/10 text-white font-bold text-xs transition-all cursor-pointer shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Share</span>
          </button>

          {/* Delete (Creator Only) */}
          {isCreator && (
            <button
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 font-bold text-xs transition-all cursor-pointer shadow-sm"
              title="Delete Group"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}

          <button
            onClick={fetchDetail}
            className="p-2 rounded-2xl bg-[#141A2D] hover:bg-[#1C233A] border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer shadow-sm"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 💳 Hero Pot & Cycle Banner (Inspired by Image 1) */}
      <div className="relative overflow-hidden rounded-3xl sm:rounded-[2rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-6 sm:p-8 text-white shadow-[0_15px_35px_-5px_rgba(59,130,246,0.5)]">
        
        {/* Glow Element */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          <div className="lg:col-span-8 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                isCompleted
                  ? 'bg-black/30 text-slate-300 border border-white/15'
                  : group.status === 'ACTIVE'
                  ? 'bg-amber-400 text-slate-950 font-black shadow'
                  : 'bg-white/20 text-white border border-white/20'
              }`}>
                {isCompleted ? 'Cycle Completed' : group.status === 'ACTIVE' ? `Active Cycle • Round ${group.current_round} of ${group.members_count}` : 'Recruiting Group'}
              </span>

              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-black/25 text-white border border-white/15">
                {group.frequency} Cycle
              </span>

              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-black/25 text-white border border-white/15">
                {group.rotation_type}
              </span>

              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1 text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-black/30 text-white border border-white/20 hover:bg-black/40 transition-all cursor-pointer"
                title="Copy group code"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-300" />}
                <span>Code: {group.invite_code}</span>
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {group.name}
            </h1>

            {group.description && (
              <p className="text-xs sm:text-sm text-blue-100 max-w-xl leading-relaxed">
                {group.description}
              </p>
            )}

            {group.commitment_deposit > 0 && (
              <div className="inline-flex items-center gap-1.5 text-xs text-blue-100 bg-black/20 border border-white/15 px-3 py-1 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Security Deposit: <strong>GH₵{group.commitment_deposit}</strong> per saver</span>
              </div>
            )}
          </div>

          <div className="lg:col-span-4">
            <div className="bg-[#080B11]/70 backdrop-blur-xl p-5 rounded-3xl border border-white/15 shadow-lg space-y-3">
              <div className="text-[10px] uppercase font-bold text-blue-200">
                Total Payout Pot per Turn
              </div>
              <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">
                GH₵{group.total_pool?.toLocaleString()}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
                <div>
                  <div className="text-[10px] text-blue-200">Contribution</div>
                  <div className="font-bold text-white font-mono">GH₵{group.contribution_amount}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-blue-200">Savers</div>
                  <div className="font-bold text-white">{group.enrolled_count} of {group.members_count}</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ⚡ Action Bar */}
      <div className="dark-card rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-xs text-slate-300">
          {isCompleted ? (
            <span className="font-bold text-slate-200">All cycle rounds are completed.</span>
          ) : !isEnrolled ? (
            <span>{isFull ? 'This group is full.' : 'Join this group to participate in the cycle.'}</span>
          ) : enrolledMember?.has_paid_current_round ? (
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Round {group.current_round} contribution paid (GH₵{group.contribution_amount})
            </span>
          ) : (
            <span className="text-amber-400 font-bold">
              Round {group.current_round} payment due: GH₵{group.contribution_amount}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isEnrolled && !isFull && !isCompleted && (
            <button
              onClick={handleJoinCircle}
              disabled={actionLoading}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-amber-300" />
              <span>Join Group</span>
            </button>
          )}

          {isEnrolled && !enrolledMember?.has_paid_current_round && !isCompleted && (
            <button
              onClick={() => openMoMoModalForUser(enrolledMember, false)}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-2xl shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Smartphone className="w-4 h-4" />
              <span>Pay GH₵{group.contribution_amount}</span>
            </button>
          )}

          {group.rotation_type === 'BIDDING' && isEnrolled && !isCompleted && (
            <button
              onClick={() => setIsBiddingModalOpen(true)}
              className="px-3.5 py-2.5 bg-[#1C233A] hover:bg-[#252E4B] text-slate-200 font-bold text-xs rounded-2xl border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Gavel className="w-4 h-4 text-indigo-400" />
              <span>Place Bid</span>
            </button>
          )}

          {group.rotation_type === 'BALLOT' && !isCompleted && (
            <button
              onClick={() => setIsBallotModalOpen(true)}
              className="px-3.5 py-2.5 bg-[#1C233A] hover:bg-[#252E4B] text-slate-200 font-bold text-xs rounded-2xl border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Shuffle className="w-4 h-4 text-amber-400" />
              <span>Ballot Draw</span>
            </button>
          )}

          {allPaidForRound && !isCompleted && (
            <button
              onClick={handleDisbursePot}
              disabled={actionLoading}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Disburse Pot & Advance Cycle</span>
            </button>
          )}
        </div>
      </div>

      {/* 🔄 Cycle Rotational Timeline */}
      <RotationalTimeline group={group} />

      {/* 👥 Group Members Table */}
      <div className="dark-card rounded-3xl overflow-hidden shadow-lg border border-white/5">
        <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-black text-white">Group Members in Rotation</h3>
          </div>
          <span className="text-xs text-slate-400 font-bold">
            {group.enrolled_count} of {group.members_count} Enrolled
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0E1322] text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-white/5">
              <tr>
                <th className="py-3 px-4">Turn</th>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Network</th>
                <th className="py-3 px-4">Round {group.current_round}</th>
                <th className="py-3 px-4">Payout</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {group.members?.map((member) => {
                const isCurrentRecipient = member.payout_position === group.current_round;
                const isCurrentUserRow = member.phone_number?.replace('+233', '0').replace(/\s+/g, '') === cleanUserPhone;

                return (
                  <tr 
                    key={member.id} 
                    className={`hover:bg-white/[0.02] transition-colors ${
                      isCurrentUserRow ? 'bg-blue-600/10' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-semibold">
                      {member.payout_position ? (
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${
                          isCurrentRecipient ? 'bg-amber-400 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-[#1C233A] text-slate-300'
                        }`}>
                          {member.payout_position}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{member.full_name}</span>
                        {isCurrentUserRow && (
                          <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 font-black text-[9px] px-1.5 py-0.2 rounded-md">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">{member.phone_number}</div>
                    </td>

                    <td className="py-3 px-4">
                      {getProviderBadge(member.momo_provider)}
                    </td>

                    <td className="py-3 px-4">
                      {member.has_paid_current_round ? (
                        <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[11px] inline-flex items-center gap-1">
                          <Check className="w-3 h-3" /> Paid
                        </span>
                      ) : (
                        <span className="text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full text-[11px]">
                          Due
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {member.has_received_payout ? (
                        <span className="text-emerald-400 font-bold text-[11px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Received
                        </span>
                      ) : isCurrentRecipient ? (
                        <span className="text-slate-950 font-black text-[11px] bg-amber-400 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                          Current Turn
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Upcoming</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {!member.has_paid_current_round && !isCompleted ? (
                        <button
                          onClick={() => openMoMoModalForUser(member, false)}
                          className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-[11px] transition-all cursor-pointer shadow-xs"
                        >
                          Pay
                        </button>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Settled</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📜 Transaction Ledger */}
      <TransactionLedger 
        payments={group.payments} 
        payouts={group.payouts} 
        members={group.members} 
      />

      {/* 🗑️ Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#04060A]/85 backdrop-blur-md">
          <div className="dark-card w-full max-w-md rounded-3xl shadow-2xl border border-white/10 overflow-hidden p-6 space-y-4">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 border border-red-500/30">
                {canDelete ? <Trash2 size={20} /> : <Lock size={20} />}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {canDelete ? "Delete Susu Group" : "Group Deletion Locked"}
                </h3>
                <p className="text-xs text-slate-400">
                  {group.name}
                </p>
              </div>
            </div>

            {canDelete ? (
              <div className="space-y-2 text-xs text-slate-300">
                <p>
                  Are you sure you want to delete this Susu group? This will permanently remove the group.
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-xs text-slate-300">
                <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/30 text-red-300 text-xs space-y-1">
                  <p className="font-bold">Cannot delete active group.</p>
                  <p className="text-[11px] text-slate-300">
                    This group has active cycle rounds in progress. It cannot be deleted until all rounds and payouts finish to protect members' funds.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 py-2.5 px-4 bg-[#1C233A] hover:bg-[#252E4B] text-slate-300 text-xs font-bold rounded-2xl transition-colors cursor-pointer border border-white/5"
              >
                {canDelete ? "Cancel" : "Close"}
              </button>

              {canDelete && (
                <button
                  onClick={handleDeleteGroup}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-2xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 size={14} />}
                  <span>Confirm Delete</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Multi-Platform Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="Share Susu Group"
        description={`Invite savers to join "${group.name}".`}
        inviteCode={group.invite_code}
        groupName={group.name}
        contributionAmount={group.contribution_amount}
        frequency={group.frequency}
      />

      {/* MoMo Payment Keypad Modal */}
      <MoMoPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        group={group}
        member={selectedPaymentMember}
        isEscrow={isEscrowPayment}
        onPaymentSuccess={fetchDetail}
      />

      <BallotDrawModal
        isOpen={isBallotModalOpen}
        onClose={() => setIsBallotModalOpen(false)}
        group={group}
        onDrawComplete={fetchDetail}
      />

      <BiddingModal
        isOpen={isBiddingModalOpen}
        onClose={() => setIsBiddingModalOpen(false)}
        group={group}
        member={enrolledMember}
        onBidSuccess={fetchDetail}
      />

    </div>
  );
};
