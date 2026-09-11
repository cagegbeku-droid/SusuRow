import React, { useState, useEffect, useRef } from 'react';
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
  ChevronRight,
  MessageSquare,
  Bell,
  Star,
  MoreHorizontal
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { 
  getGroupDetail, 
  joinGroup, 
  advanceRound, 
  deleteGroup,
  reopenGroup,
  triggerDueReminders 
} from '../api/client';
import { RotationalTimeline } from '../components/RotationalTimeline';
import { MoMoPaymentModal } from '../components/MoMoPaymentModal';
import { BallotDrawModal } from '../components/BallotDrawModal';
import { BiddingModal } from '../components/BiddingModal';
import { ShareModal } from '../components/ShareModal';
import { GroupChatModal } from '../components/GroupChatModal';
import { TransactionLedger } from '../components/TransactionLedger';

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
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [selectedPaymentMember, setSelectedPaymentMember] = useState(null);
  const [isEscrowPayment, setIsEscrowPayment] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [reminderStatus, setReminderStatus] = useState(null);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef(null);

  useEffect(() => {
    if (!isMoreMenuOpen) return;
    const handleClickOutside = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMoreMenuOpen]);

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
      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8 text-center space-y-3 max-w-md mx-auto">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900">{error || 'Group not found'}</h3>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs active:scale-95"
        >
          Back
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
  const allPaidForRound = isFull && group.members?.length > 0 && group.members.every(m => m.has_paid_current_round);

  const hasActiveContributions = group.payments?.length > 0 || group.status === 'ACTIVE';
  const otherMembersCount = group.members?.filter(m => m.phone_number?.replace('+233', '0').replace(/\s+/g, '') !== cleanCreatorPhone).length || 0;
  const canDelete = isCreator && (!hasActiveContributions || isCompleted || otherMembersCount === 0);

  // Active recipient: first member in sequence who has NOT received payout yet
  const activeReceivingMember = group.members?.find(m => !m.has_received_payout && (m.payout_position || 1) >= (group.current_round || 1))
    || group.members?.find(m => !m.has_received_payout);

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
    if (!user.phone_number) {
      alert("Please add your Ghanaian Mobile Money phone number in your Profile before joining a group.");
      return;
    }
    if (isEnrolled || isCreator) {
      alert("You are already an enrolled member of this Susu group.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await joinGroup({
        group_id: group.id,
        phone_number: user.phone_number,
        full_name: user.full_name || 'Ghana Saver',
        momo_provider: user.momo_provider || 'MTN'
      });
      setGroup(res);
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not join group.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendReminders = async () => {
    setActionLoading(true);
    try {
      const res = await triggerDueReminders(group.id);
      setReminderStatus(`SMS Reminders sent to ${res.total_reminded} members!`);
      setTimeout(() => setReminderStatus(null), 4000);
    } catch (err) {
      alert('Failed to send SMS reminders.');
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

  const handleReopenGroup = async () => {
    if (!user) return;
    if (!window.confirm(`Reopen circle '${group.name}' so new members can enroll and participate in rotation?`)) return;
    setActionLoading(true);
    try {
      await reopenGroup(group.id, user.phone_number);
      await fetchDetail();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to reopen group.');
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
      
      {/* 🧭 Modern Top Navigation & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 transition-all cursor-pointer shadow-xs active:scale-95"
          title="Back"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          {/* Share */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 transition-all cursor-pointer shadow-xs active:scale-95"
            title="Share Circle"
            aria-label="Share"
          >
            <Share2 className="w-4 h-4 text-sky-600" />
          </button>

          {/* More Options (Three Horizontal Dots) */}
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 transition-all cursor-pointer shadow-xs active:scale-95"
              title="More options"
              aria-label="More"
            >
              <MoreHorizontal className="w-5 h-5 text-slate-700" />
            </button>

            {isMoreMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    setIsChatModalOpen(true);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-sky-600" />
                  <span>Group Chat</span>
                </button>

                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    fetchDetail();
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-slate-600" />
                  <span>Refresh Details</span>
                </button>

                {isCreator && group.status === 'ACTIVE' && (
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      handleSendReminders();
                    }}
                    disabled={actionLoading}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-amber-800 hover:bg-amber-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Bell className="w-4 h-4 text-amber-600" />
                    <span>Send SMS Reminders</span>
                  </button>
                )}

                {group.rotation_type === 'BIDDING' && isEnrolled && !isCompleted && (
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      setIsBiddingModalOpen(true);
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Gavel className="w-4 h-4 text-sky-600" />
                    <span>Place Bid</span>
                  </button>
                )}

                {group.rotation_type === 'BALLOT' && !isCompleted && (
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      setIsBallotModalOpen(true);
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Shuffle className="w-4 h-4 text-amber-600" />
                    <span>Ballot Draw</span>
                  </button>
                )}

                {isCreator && isCompleted && (
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      handleReopenGroup();
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-sky-800 hover:bg-sky-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <RotateCw className="w-4 h-4 text-sky-600" />
                    <span>Reopen Circle</span>
                  </button>
                )}

                {isCreator && (
                  <>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        setIsDeleteConfirmOpen(true);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                      <span>Delete Circle</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {reminderStatus && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center animate-in fade-in">
          {reminderStatus}
        </div>
      )}

      {/* 💳 Hero Payout & Cycle Info (Compact) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                isCompleted
                  ? 'bg-slate-100 text-slate-700 border border-slate-200'
                  : group.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold'
                  : 'bg-sky-50 text-sky-800 border border-sky-200 font-bold'
              }`}>
                {isCompleted ? 'Completed' : group.status === 'ACTIVE' ? `Round ${group.current_round} of ${group.members_count}` : 'Recruiting'}
              </span>

              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {group.frequency}
              </span>

              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                {group.rotation_type.toLowerCase()}
              </span>

              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-all cursor-pointer"
                title="Copy invite code"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                <span>{group.invite_code}</span>
              </button>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {group.name}
            </h1>
          </div>

          {/* Quick Metrics */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 flex items-center gap-6 shrink-0">
            <div>
              <div className="text-[9px] uppercase font-bold text-slate-400">Total Payout</div>
              <div className="text-xl sm:text-2xl font-bold text-sky-600 font-mono">
                GH₵{Number(group.total_pool || 0).toLocaleString()}
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200" />

            <div>
              <div className="text-[9px] uppercase font-bold text-slate-400">Contribution</div>
              <div className="text-xs font-bold text-slate-800 font-mono">
                GH₵{Number(group.contribution_amount || 0).toLocaleString()}
              </div>
              <div className="text-[10px] font-bold text-slate-500 mt-0.5">
                {group.enrolled_count}/{group.members_count} members
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ℹ️ Group Description & How It Works */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3">
        {group.description && (
          <div>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">About This Group</h3>
            <p className="text-xs sm:text-sm text-slate-700 mt-1 leading-relaxed">
              {group.description}
            </p>
          </div>
        )}

        <div className={group.description ? "pt-3 border-t border-slate-100" : ""}>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">How This Susu Works</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-900 block">1. Equal Contribution</span>
              <span className="text-slate-600 text-[11px] mt-0.5 block">
                Each member contributes GH₵{group.contribution_amount} {group.frequency.toLowerCase()}.
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-900 block">2. Lump Sum Payout</span>
              <span className="text-slate-600 text-[11px] mt-0.5 block">
                Each round, 1 member receives the total payout of GH₵{group.total_pool}.
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-900 block">3. Guaranteed Rotation</span>
              <span className="text-slate-600 text-[11px] mt-0.5 block">
                Turns cycle until all {group.members_count} members receive their payout.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ⏳ Recruiting Notice */}
      {!isFull && !isCompleted && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-amber-900">
            <Users size={16} className="text-amber-700 shrink-0" />
            <span>
              Recruiting: <strong>{group.enrolled_count}/{group.members_count}</strong> members enrolled. Rotation begins once full.
            </span>
          </div>
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Invite</span>
          </button>
        </div>
      )}

      {/* ⚡ Action Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-xs text-slate-600 font-medium">
          {isCompleted ? (
            <span className="font-bold text-slate-800">All cycle rounds are completed.</span>
          ) : !isEnrolled ? (
            <span>{isFull ? 'This group is full.' : 'Join this group to participate in the cycle.'}</span>
          ) : enrolledMember?.has_paid_current_round ? (
            <span className="text-emerald-700 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Round {group.current_round} contribution paid (GH₵{group.contribution_amount})
            </span>
          ) : (
            <span className="text-amber-700 font-bold">
              Round {group.current_round} payment due: GH₵{group.contribution_amount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isEnrolled && !isCreator && !isFull && !isCompleted && (
            <button
              onClick={handleJoinCircle}
              disabled={actionLoading}
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-2xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-white" />
              <span>Join Group</span>
            </button>
          )}

          {isEnrolled && !enrolledMember?.has_paid_current_round && !isCompleted && (
            <button
              onClick={() => openMoMoModalForUser(enrolledMember, false)}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Smartphone className="w-4 h-4" />
              <span>Pay GH₵{group.contribution_amount}</span>
            </button>
          )}
        </div>
      </div>

      {/* 🔄 Cycle Rotational Timeline */}
      <RotationalTimeline group={group} />

      {/* 👥 Group Members Table with Saver Trust Scores */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-xs border border-slate-200">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900">Group Members in Rotation</h3>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            {group.enrolled_count} of {group.members_count} Enrolled
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Turn</th>
                <th className="py-3 px-4">Saver & Reliability</th>
                <th className="py-3 px-4">Network</th>
                <th className="py-3 px-4">Round {group.current_round}</th>
                <th className="py-3 px-4">Payout</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(() => {
                const activeRecipient = !isCompleted 
                  ? [...(group.members || [])]
                      .sort((a, b) => (a.payout_position || 999) - (b.payout_position || 999))
                      .find(m => !m.has_received_payout)
                  : null;

                return group.members?.map((member) => {
                  const isReceived = isCompleted || member.has_received_payout;
                  const isCurrentRecipient = !isCompleted && !isReceived && activeRecipient && member.id === activeRecipient.id;
                  const isCurrentUserRow = member.phone_number?.replace('+233', '0').replace(/\s+/g, '') === cleanUserPhone;

                  return (
                    <tr 
                      key={member.id} 
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isCurrentRecipient 
                          ? 'bg-amber-50/60' 
                          : isCurrentUserRow 
                          ? 'bg-sky-50/40' 
                          : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-semibold">
                        {member.payout_position ? (
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            isReceived
                              ? 'bg-emerald-100 text-emerald-800'
                              : isCurrentRecipient 
                              ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-300 ring-offset-1 shadow-2xs' 
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {member.payout_position}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                          <span>{member.full_name}</span>
                          {isCurrentUserRow && (
                            <span className="bg-sky-100 text-sky-800 border border-sky-200 font-bold text-[9px] px-1.5 py-0.2 rounded">
                              YOU
                            </span>
                          )}
                          {isCurrentRecipient && (
                            <span className="bg-amber-300 text-slate-950 border border-amber-400 font-black text-[9px] px-2 py-0.5 rounded-full shadow-2xs">
                              {isCurrentUserRow ? 'YOUR TURN TO RECEIVE' : 'RECEIVING THIS ROUND'}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-bold px-1.5 py-0.2 rounded">
                            <Star size={9} className="fill-amber-500 text-amber-500" />
                            <span>{member.trust_score || 100}% Trust</span>
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">{member.phone_number}</div>
                      </td>

                      <td className="py-3 px-4">
                        {getProviderBadge(member.momo_provider)}
                      </td>

                      <td className="py-3 px-4">
                        {member.has_paid_current_round ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px] inline-flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600" /> Paid
                          </span>
                        ) : (
                          <span className="text-amber-800 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[11px]">
                            Due
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {isReceived ? (
                          <span className="text-emerald-700 font-bold text-[11px] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Received
                          </span>
                        ) : isCurrentRecipient ? (
                          <span className="text-slate-950 font-black text-[11px] bg-amber-300 border border-amber-400 px-2 py-0.5 rounded-full shadow-2xs inline-flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-slate-950" /> {isCurrentUserRow ? 'Your Turn' : 'Receiving'}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Turn #{member.payout_position || '—'}</span>
                        )}
                      </td>

                    <td className="py-3 px-4 text-right">
                      {!member.has_paid_current_round && !isCompleted ? (
                        <button
                          onClick={() => openMoMoModalForUser(member, false)}
                          className="px-3.5 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-[11px] transition-all cursor-pointer shadow-xs active:scale-95"
                        >
                          Pay
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Settled</span>
                      )}
                    </td>
                  </tr>
                );
              });
            })()}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
                {canDelete ? <Trash2 size={20} /> : <Lock size={20} />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {canDelete ? "Delete Susu Group" : "Group Deletion Locked"}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
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
                <div className="p-3 bg-red-50 rounded-2xl border border-red-200 text-red-700 text-xs space-y-1">
                  <p className="font-bold">Cannot delete active group.</p>
                  <p className="text-[11px] text-slate-600">
                    This group has active cycle rounds in progress. It cannot be deleted until all rounds and payouts finish to protect members' funds.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-colors cursor-pointer border border-slate-200"
              >
                {canDelete ? "Cancel" : "Close"}
              </button>

              {canDelete && (
                <button
                  onClick={handleDeleteGroup}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-2xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 size={14} />}
                  <span>Confirm Delete</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* In-Group Chat Activity Modal */}
      <GroupChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        group={group}
      />

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
