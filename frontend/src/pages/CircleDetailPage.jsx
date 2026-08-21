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
  RotateCw
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
      <div className="py-20 text-center space-y-2">
        <Loader2 className="w-6 h-6 animate-spin text-primary-700 mx-auto" />
        <p className="text-xs text-slate-500">Loading group details...</p>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900">{error || 'Group not found'}</h3>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-primary-800 text-white font-bold text-xs rounded-xl cursor-pointer"
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
        return <span className="bg-yellow-100 text-yellow-900 border border-yellow-300 font-bold px-1.5 py-0.5 rounded text-[10px]">MTN</span>;
      case 'TELECEL':
        return <span className="bg-red-100 text-red-900 border border-red-300 font-bold px-1.5 py-0.5 rounded text-[10px]">Telecel</span>;
      case 'AT':
        return <span className="bg-blue-100 text-blue-900 border border-blue-300 font-bold px-1.5 py-0.5 rounded text-[10px]">AT</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded text-[10px]">{provider}</span>;
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Groups</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Share */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-800 font-bold text-xs hover:border-primary-700 transition-all cursor-pointer shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5 text-primary-700" />
            <span>Share</span>
          </button>

          {/* Delete (Creator Only) */}
          {isCreator && (
            <button
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs transition-all cursor-pointer shadow-xs"
              title="Delete Group"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}

          <button
            onClick={fetchDetail}
            className="p-2 rounded-xl bg-white border border-slate-300 text-slate-600 hover:text-primary-800 transition-all cursor-pointer shadow-xs"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Group & Cycle Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          
          <div className="lg:col-span-8 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-md ${
                isCompleted
                  ? 'bg-slate-100 text-slate-700'
                  : group.status === 'ACTIVE'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-primary-50 text-primary-900 border border-primary-200'
              }`}>
                {isCompleted ? 'Cycle Completed' : group.status === 'ACTIVE' ? `Active Cycle • Round ${group.current_round} of ${group.members_count}` : 'Recruiting Group'}
              </span>

              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {group.frequency} Cycle
              </span>

              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {group.rotation_type}
              </span>

              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-300 hover:border-primary-700 transition-all cursor-pointer"
                title="Copy group code"
              >
                {copiedCode ? <Check className="w-3 h-3 text-primary-700" /> : <Copy className="w-3 h-3 text-slate-400" />}
                <span>Code: {group.invite_code}</span>
              </button>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              {group.name}
            </h1>

            {group.description && (
              <p className="text-xs sm:text-sm text-slate-600">
                {group.description}
              </p>
            )}

            {group.commitment_deposit > 0 && (
              <div className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
                <ShieldCheck className="w-3.5 h-3.5 text-primary-700 shrink-0" />
                <span>Security Deposit: <strong>GH₵{group.commitment_deposit}</strong> per saver</span>
              </div>
            )}
          </div>

          <div className="lg:col-span-4">
            <div className="bg-primary-900 text-white p-4 rounded-2xl shadow space-y-2">
              <div className="text-[10px] uppercase font-bold text-primary-200">
                Total Payout Pot per Turn
              </div>
              <div className="text-2xl sm:text-3xl font-black text-gold-400 font-mono">
                GH₵{group.total_pool?.toLocaleString()}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-primary-800 text-xs">
                <div>
                  <div className="text-[10px] text-primary-200">Contribution</div>
                  <div className="font-bold text-white font-mono">GH₵{group.contribution_amount}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-primary-200">Members</div>
                  <div className="font-bold text-white">{group.enrolled_count} of {group.members_count}</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="text-xs text-slate-700">
          {isCompleted ? (
            <span className="font-bold text-slate-900">All cycle rounds are completed.</span>
          ) : !isEnrolled ? (
            <span>{isFull ? 'This group is full.' : 'Join this group to participate in the cycle.'}</span>
          ) : enrolledMember?.has_paid_current_round ? (
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Round {group.current_round} contribution paid (GH₵{group.contribution_amount})
            </span>
          ) : (
            <span className="text-amber-900 font-bold">
              Round {group.current_round} payment due: GH₵{group.contribution_amount}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isEnrolled && !isFull && !isCompleted && (
            <button
              onClick={handleJoinCircle}
              disabled={actionLoading}
              className="px-4 py-2 bg-primary-800 hover:bg-primary-900 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <PlusCircle className="w-3.5 h-3.5 text-gold-300" />
              <span>Join Group</span>
            </button>
          )}

          {isEnrolled && !enrolledMember?.has_paid_current_round && !isCompleted && (
            <button
              onClick={() => openMoMoModalForUser(enrolledMember, false)}
              className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Pay GH₵{group.contribution_amount}</span>
            </button>
          )}

          {group.rotation_type === 'BIDDING' && isEnrolled && !isCompleted && (
            <button
              onClick={() => setIsBiddingModalOpen(true)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Gavel className="w-3.5 h-3.5 text-slate-600" />
              <span>Place Bid</span>
            </button>
          )}

          {group.rotation_type === 'BALLOT' && !isCompleted && (
            <button
              onClick={() => setIsBallotModalOpen(true)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5 text-slate-600" />
              <span>Ballot Draw</span>
            </button>
          )}

          {allPaidForRound && !isCompleted && (
            <button
              onClick={handleDisbursePot}
              disabled={actionLoading}
              className="px-4 py-2 bg-primary-800 hover:bg-primary-900 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-gold-300" />
              <span>Disburse Pot & Advance Cycle</span>
            </button>
          )}
        </div>
      </div>

      {/* Cycle Rotational Timeline */}
      <RotationalTimeline group={group} />

      {/* Group Members Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-primary-700" />
            <h3 className="text-sm font-bold text-slate-900">Group Members</h3>
          </div>
          <span className="text-xs text-slate-500 font-bold">
            {group.enrolled_count} of {group.members_count} Enrolled
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Turn</th>
                <th className="py-2.5 px-3">Member</th>
                <th className="py-2.5 px-3">Network</th>
                <th className="py-2.5 px-3">Round {group.current_round}</th>
                <th className="py-2.5 px-3">Payout</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {group.members?.map((member) => {
                const isCurrentRecipient = member.payout_position === group.current_round;
                const isCurrentUserRow = member.phone_number?.replace('+233', '0').replace(/\s+/g, '') === cleanUserPhone;

                return (
                  <tr 
                    key={member.id} 
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isCurrentUserRow ? 'bg-primary-50/40' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-semibold">
                      {member.payout_position ? (
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-black ${
                          isCurrentRecipient ? 'bg-gold-400 text-slate-950' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {member.payout_position}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">
                        {member.full_name}
                        {isCurrentUserRow && (
                          <span className="ml-1.5 bg-primary-100 text-primary-800 font-black text-[9px] px-1 py-0.2 rounded">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">{member.phone_number}</div>
                    </td>

                    <td className="py-3 px-3">
                      {getProviderBadge(member.momo_provider)}
                    </td>

                    <td className="py-3 px-3">
                      {member.has_paid_current_round ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1">
                          <Check className="w-3 h-3" /> Paid
                        </span>
                      ) : (
                        <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                          Due
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {member.has_received_payout ? (
                        <span className="text-emerald-700 font-bold text-[11px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Received
                        </span>
                      ) : isCurrentRecipient ? (
                        <span className="text-primary-900 font-bold text-[11px] bg-gold-300 px-1.5 py-0.5 rounded">
                          Current Turn
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Upcoming</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      {!member.has_paid_current_round && !isCompleted ? (
                        <button
                          onClick={() => openMoMoModalForUser(member, false)}
                          className="px-2.5 py-1 bg-primary-800 hover:bg-primary-900 text-white font-bold rounded-lg text-[10px] transition-all cursor-pointer"
                        >
                          Pay
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Settled</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Ledger */}
      <TransactionLedger 
        payments={group.payments} 
        payouts={group.payouts} 
        members={group.members} 
      />

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden p-6 space-y-4">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                {canDelete ? <Trash2 size={20} /> : <Lock size={20} />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {canDelete ? "Delete Susu Group" : "Group Deletion Locked"}
                </h3>
                <p className="text-xs text-slate-500">
                  {group.name}
                </p>
              </div>
            </div>

            {canDelete ? (
              <div className="space-y-2 text-xs text-slate-600">
                <p>
                  Are you sure you want to delete this Susu group? This will permanently remove the group.
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-xs text-slate-600">
                <div className="p-3 bg-red-50 rounded-2xl border border-red-200 text-red-900 text-xs space-y-1">
                  <p className="font-bold">Cannot delete active group.</p>
                  <p className="text-[11px]">
                    This group has active cycle rounds in progress. It cannot be deleted until all rounds and payouts finish to protect members' funds.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                {canDelete ? "Cancel" : "Close"}
              </button>

              {canDelete && (
                <button
                  onClick={handleDeleteGroup}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
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

      {/* MoMo Payment Modal */}
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
