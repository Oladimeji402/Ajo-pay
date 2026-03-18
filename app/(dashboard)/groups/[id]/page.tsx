'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Wallet, Calendar, Loader2, Sparkles, ShieldCheck, ArrowUpRight, CheckCircle2, LogOut, TriangleAlert } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { openPaystackInline } from '@/lib/paystack-inline';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess, notifyWarning } from '@/lib/toast';
import { formatScheduleDate, getCurrentCycleDueDate, getDueWindow } from '@/lib/ajo-schedule';

type GroupMember = {
    id: string;
    user_id: string;
    position: number;
    contribution_status: string;
    payout_status: string;
    profiles?: {
        id: string;
        name: string;
        email: string;
        phone?: string | null;
    };
};

type GroupDetail = {
    id: string;
    name: string;
    contribution_amount: number;
    frequency: string;
    max_members: number;
    current_cycle: number;
    total_cycles: number;
    status: string;
    start_date: string | null;
    invite_code: string;
    members: GroupMember[];
};

type ContributionRow = {
    id: string;
    amount: number;
    status: string;
    cycle_number: number;
    created_at: string;
};

type PaymentReceipt = {
    reference: string;
    amount: number;
    paidAt: string;
    groupName: string;
};

export default function GroupDetailsPage() {
    const params = useParams<{ id: string }>();
    const groupId = params.id;

    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [error, setError] = useState('');

    const [group, setGroup] = useState<GroupDetail | null>(null);
    const [contributions, setContributions] = useState<ContributionRow[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
    const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [leavingGroup, setLeavingGroup] = useState(false);
    const { showToast } = useToast();

    const loadData = useCallback(async () => {
        if (!groupId) return;

        setLoading(true);
        setError('');

        try {
            const supabase = createSupabaseBrowserClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();
            setCurrentUserId(user?.id ?? null);
            // Do not fall back to a dummy email — if the email is missing we must
            // abort the payment rather than send a real transaction under a fake address.
            setCurrentUserEmail(user?.email ?? '');

            const [groupRes, contributionsRes] = await Promise.all([
                fetch(`/api/groups/${groupId}`, { cache: 'no-store' }),
                fetch(`/api/contributions?groupId=${groupId}`, { cache: 'no-store' }),
            ]);

            const groupJson = await groupRes.json();
            const contributionsJson = await contributionsRes.json();

            if (!groupRes.ok) {
                throw new Error(groupJson.error || 'Failed to load group details.');
            }

            if (!contributionsRes.ok) {
                throw new Error(contributionsJson.error || 'Failed to load contributions.');
            }

            setGroup(groupJson.data as GroupDetail);
            setContributions(Array.isArray(contributionsJson.data) ? contributionsJson.data : []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to load group details.');
            notifyError(showToast, err, 'Failed to load group details. Please refresh.');
        } finally {
            setLoading(false);
        }
    }, [groupId, showToast]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const userMember = useMemo(
        () => group?.members?.find((member) => member.user_id === currentUserId) ?? null,
        [group?.members, currentUserId],
    );

    const totalContributed = useMemo(
        () => contributions.filter((item) => item.status === 'success').reduce((sum, item) => sum + Number(item.amount), 0),
        [contributions],
    );

    const currentCyclePaymentState = useMemo(() => {
        if (!group) {
            return { state: 'due' as const, dueDate: null as string | null, dueWindow: getDueWindow(null) };
        }

        const currentCycleContributions = contributions
            .filter((item) => item.cycle_number === group.current_cycle)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        const dueDate = getCurrentCycleDueDate(group);
        const dueWindow = getDueWindow(dueDate);

        if (currentCycleContributions.some((item) => item.status === 'success')) {
            return { state: 'success' as const, dueDate, dueWindow };
        }

        if (currentCycleContributions.some((item) => item.status === 'pending')) {
            return { state: 'pending' as const, dueDate, dueWindow };
        }

        if (currentCycleContributions.some((item) => item.status === 'failed')) {
            return { state: 'failed' as const, dueDate, dueWindow };
        }

        return {
            state: dueWindow.phase === 'overdue' ? 'overdue' as const : dueWindow.phase === 'scheduled' ? 'scheduled' as const : 'due' as const,
            dueDate,
            dueWindow,
        };
    }, [contributions, group]);

    const handleContribution = async () => {
        if (!group || !groupId) return;

        // Guard: a verified email address is required to process payments.
        if (!currentUserEmail) {
            notifyError(showToast, new Error('Email missing'), 'Your account email is missing. Please update your profile settings before making a payment.');
            return;
        }

        setError('');
        setPaying(true);

        try {
            const initRes = await fetch('/api/payments/initialize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    groupId,
                    cycleNumber: group.current_cycle,
                    amount: group.contribution_amount,
                }),
            });

            const initJson = await initRes.json();
            if (!initRes.ok) {
                throw new Error(initJson.error || 'Failed to initialize payment.');
            }

            const data = initJson.data as {
                reference: string;
                accessCode: string;
                authorizationUrl: string;
            };

            const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
            if (!publicKey) {
                window.location.href = data.authorizationUrl;
                return;
            }

            await openPaystackInline({
                key: publicKey,
                email: currentUserEmail,
                amount: Number(group.contribution_amount) * 100,
                ref: data.reference,
                access_code: data.accessCode,
                callback: (response) => {
                    void (async () => {
                        try {
                            const verifyRes = await fetch(`/api/payments/verify?reference=${encodeURIComponent(response.reference)}`, {
                                cache: 'no-store',
                            });

                            const verifyJson = await verifyRes.json();
                            if (!verifyRes.ok) {
                                throw new Error(verifyJson.error || 'Payment verification failed.');
                            }

                            setReceipt({
                                reference: response.reference,
                                amount: Number(group.contribution_amount),
                                paidAt: new Date().toISOString(),
                                groupName: group.name,
                            });
                            notifySuccess(showToast, 'Contribution verified successfully.');
                            await loadData();
                        } catch (err) {
                            notifyError(showToast, err, 'Could not verify payment.');
                        }
                    })();
                },
                onClose: () => {
                    notifyWarning(showToast, 'Payment window closed before completion.');
                },
            });
        } catch (err) {
            notifyError(showToast, err, 'Unable to process contribution.');
        } finally {
            setPaying(false);
        }
    };

    const handleLeaveGroup = async () => {
        if (!group || !groupId || !userMember) return;

        setLeavingGroup(true);

        try {
            const response = await fetch(`/api/groups/${groupId}/leave`, {
                method: 'POST',
                cache: 'no-store',
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || 'Unable to leave this group.');
            }

            setShowLeaveModal(false);
            notifySuccess(showToast, `You have left ${group.name}.`);
            window.location.href = '/groups';
        } catch (err) {
            notifyError(showToast, err, 'Unable to leave this group right now.');
        } finally {
            setLeavingGroup(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-80 grid place-items-center text-brand-gray">
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <Loader2 className="animate-spin" size={16} />
                    Loading group details...
                </div>
            </div>
        );
    }

    if (!group) {
        return <div className="text-sm text-red-600">Group not found.</div>;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <Link href="/groups" className="inline-flex items-center gap-2 text-xs font-semibold text-brand-gray hover:text-brand-navy">
                <ArrowLeft size={14} /> Back to Groups
            </Link>

            <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-br from-brand-navy via-[#173069] to-brand-emerald text-white p-6">
                <div className="absolute -right-10 -top-14 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -left-10 -bottom-14 h-40 w-40 rounded-full bg-emerald-300/20 blur-3xl" />

                <div className="relative flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/70 font-semibold">Group Command Deck</p>
                        <h1 className="text-2xl font-semibold mt-1">{group.name}</h1>
                        <p className="text-sm text-white/80 capitalize mt-1">{group.status} · {group.frequency}</p>
                    </div>
                    <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-right">
                        <p className="text-[11px] text-white/70">Invite code</p>
                        <p className="font-mono font-semibold text-white text-sm">{group.invite_code}</p>
                    </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 mt-5">
                    <div className="rounded-xl border border-white/20 bg-white/10 p-3">
                        <p className="text-[11px] text-white/80 inline-flex items-center gap-1"><Wallet size={12} /> Per cycle</p>
                        <p className="font-semibold text-white">NGN {Number(group.contribution_amount).toLocaleString('en-NG')}</p>
                    </div>
                    <div className="rounded-xl border border-white/20 bg-white/10 p-3">
                        <p className="text-[11px] text-white/80 inline-flex items-center gap-1"><Users size={12} /> Members</p>
                        <p className="font-semibold text-white">{group.members.length} / {group.max_members}</p>
                    </div>
                    <div className="rounded-xl border border-white/20 bg-white/10 p-3">
                        <p className="text-[11px] text-white/80 inline-flex items-center gap-1"><Calendar size={12} /> Cycle</p>
                        <p className="font-semibold text-white">{group.current_cycle} / {group.total_cycles}</p>
                    </div>
                </div>

                <div className="mt-4 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/90">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/60">Collection timing</p>
                    <p className="mt-1 font-semibold">Current cycle date: {formatScheduleDate(currentCyclePaymentState.dueDate)}</p>
                    <p className="mt-1 text-xs text-white/75">
                        {currentCyclePaymentState.state === 'overdue'
                            ? `This contribution is ${currentCyclePaymentState.dueWindow.daysOverdue} day${currentCyclePaymentState.dueWindow.daysOverdue === 1 ? '' : 's'} overdue.`
                            : currentCyclePaymentState.state === 'scheduled'
                                ? `Collection day is in ${currentCyclePaymentState.dueWindow.daysUntilDue} day${currentCyclePaymentState.dueWindow.daysUntilDue === 1 ? '' : 's'}. You can still pay early.`
                                : currentCyclePaymentState.state === 'success'
                                    ? 'You have already covered this cycle.'
                                    : currentCyclePaymentState.state === 'pending'
                                        ? 'Your payment is pending verification.'
                                        : currentCyclePaymentState.state === 'failed'
                                            ? 'Your last payment attempt failed and needs another try.'
                                            : 'This cycle is due now.'}
                    </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/groups/${group.id}/payout-schedule`} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15 transition-colors">
                        <Calendar size={14} /> View payout schedule
                    </Link>
                    {userMember && group.status !== 'completed' && (
                        <button onClick={() => setShowLeaveModal(true)} className="inline-flex items-center gap-2 rounded-xl border border-red-200/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-50 hover:bg-red-500/20 transition-colors">
                            <LogOut size={14} /> Leave group
                        </button>
                    )}
                </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-semibold text-brand-navy inline-flex items-center gap-2"><Sparkles size={15} /> Cycle Contribution</h2>
                        <p className="text-xs text-brand-gray">Real-time payment via Paystack inline checkout.</p>
                    </div>
                    <button
                        onClick={handleContribution}
                        disabled={paying}
                        className="px-4 py-2 rounded-xl bg-brand-emerald text-white text-sm font-semibold disabled:opacity-60 inline-flex items-center gap-1.5"
                    >
                        <ArrowUpRight size={14} />
                        {paying ? 'Processing...' : 'Make Contribution'}
                    </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs text-brand-gray">My Position</p>
                        <p className="font-semibold text-brand-navy">{userMember?.position ? `#${userMember.position}` : 'Not assigned'}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs text-brand-gray">Total Contributed (This Group)</p>
                        <p className="font-semibold text-brand-navy">NGN {totalContributed.toLocaleString('en-NG')}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
                        <p className="text-xs text-brand-gray">Current cycle status</p>
                        <p className="font-semibold text-brand-navy capitalize">{currentCyclePaymentState.state}</p>
                    </div>
                </div>

                <div className="rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-800 px-3 py-2 text-xs inline-flex items-center gap-1.5">
                    <ShieldCheck size={13} /> Payments are verified server-side before contribution status is marked successful.
                </div>

                {error && <div className="rounded-xl border border-red-100 bg-red-50 text-red-600 text-xs font-semibold p-3">{error}</div>}
            </section>

            <section className="bg-white border border-slate-200 rounded-3xl p-5">
                <h3 className="font-semibold text-brand-navy mb-3">Members</h3>
                <div className="space-y-2">
                    {group.members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 bg-linear-to-r from-slate-50 to-white text-sm">
                            <p className="font-medium text-brand-navy">
                                {member.profiles?.name || member.profiles?.email || member.user_id}
                                {member.user_id === currentUserId ? ' (You)' : ''}
                            </p>
                            <p className="text-xs text-brand-gray">Position #{member.position}</p>
                        </div>
                    ))}
                </div>
            </section>

            {receipt && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-4">
                    <div className="w-full max-w-md rounded-3xl border border-emerald-200 bg-white p-6 shadow-2xl shadow-slate-900/20">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600">Payment confirmed</p>
                                <h2 className="mt-2 text-2xl font-semibold text-brand-navy">Receipt ready</h2>
                            </div>
                            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                                <CheckCircle2 size={22} />
                            </div>
                        </div>

                        <div className="mt-5 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-500">Group</span>
                                <span className="font-semibold text-brand-navy">{receipt.groupName}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-500">Amount</span>
                                <span className="font-semibold text-brand-navy">NGN {receipt.amount.toLocaleString('en-NG')}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-500">Reference</span>
                                <span className="font-mono text-xs font-semibold text-brand-navy">{receipt.reference}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-slate-500">Paid at</span>
                                <span className="font-semibold text-brand-navy">{new Date(receipt.paidAt).toLocaleString('en-NG')}</span>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-navy hover:bg-slate-50"
                            >
                                Download / print receipt
                            </button>
                            <button
                                type="button"
                                onClick={() => setReceipt(null)}
                                className="flex-1 rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showLeaveModal && group && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-4">
                    <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-6 shadow-2xl shadow-slate-900/20">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600">Leave group</p>
                                <h2 className="mt-2 text-2xl font-semibold text-brand-navy">Leave {group.name}?</h2>
                            </div>
                            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-red-50 text-red-600">
                                <TriangleAlert size={22} />
                            </div>
                        </div>

                        <p className="mt-4 text-sm leading-relaxed text-slate-600">
                            You will lose your active membership in this circle. You can only join again later if there is still space available.
                        </p>

                        <div className="mt-5 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setShowLeaveModal(false)}
                                disabled={leavingGroup}
                                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-navy hover:bg-slate-50 disabled:opacity-60"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleLeaveGroup}
                                disabled={leavingGroup}
                                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                            >
                                {leavingGroup ? 'Leaving...' : 'Confirm leave'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
