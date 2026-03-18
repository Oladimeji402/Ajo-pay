'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Wallet, Calendar, Loader2, LogOut } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { openPaystackInline } from '@/lib/paystack-inline';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess, notifyWarning } from '@/lib/toast';

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

type PaymentPhase = 'idle' | 'initializing' | 'verifying';

export default function GroupDetailsPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const groupId = params.id;
    const paymentPhaseRef = useRef<PaymentPhase>('idle');

    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [error, setError] = useState('');
    const [paymentPhase, setPaymentPhase] = useState<PaymentPhase>('idle');

    const [group, setGroup] = useState<GroupDetail | null>(null);
    const [contributions, setContributions] = useState<ContributionRow[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [currentUserEmail, setCurrentUserEmail] = useState<string>('customer@ajopay.local');
    const { showToast } = useToast();

    useEffect(() => {
        paymentPhaseRef.current = paymentPhase;
    }, [paymentPhase]);

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
            setCurrentUserEmail(user?.email ?? 'customer@ajopay.local');

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
        } finally {
            setLoading(false);
        }
    }, [groupId]);

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

    const handleContribution = async () => {
        if (!group || !groupId) return;

        setError('');
        setPaying(true);
        setPaymentPhase('initializing');

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
                    setPaymentPhase('verifying');
                    void (async () => {
                        try {
                            const verifyRes = await fetch(`/api/payments/verify?reference=${encodeURIComponent(response.reference)}`, {
                                cache: 'no-store',
                            });

                            const verifyJson = await verifyRes.json();
                            if (!verifyRes.ok) {
                                throw new Error(verifyJson.error || 'Payment verification failed.');
                            }

                            notifySuccess(showToast, 'Contribution verified successfully.');
                            router.push(`/payments/status?reference=${encodeURIComponent(response.reference)}`);
                            router.refresh();
                        } catch (err) {
                            setPaymentPhase('idle');
                            notifyError(showToast, err, 'Could not verify payment.');
                        }
                    })();
                },
                onClose: () => {
                    if (paymentPhaseRef.current !== 'verifying') {
                        notifyWarning(showToast, 'Payment window closed before completion.');
                    }
                },
            });
        } catch (err) {
            setPaymentPhase('idle');
            notifyError(showToast, err, 'Unable to process contribution.');
        } finally {
            setPaying(false);
        }
    };

    const handleLeaveGroup = async () => {
        if (!groupId) return;

        setLeaving(true);
        setError('');

        try {
            const response = await fetch(`/api/groups/${groupId}/leave`, {
                method: 'POST',
            });

            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || 'Failed to leave group.');
            }

            notifySuccess(showToast, 'You left the group successfully.');
            router.push('/groups');
            router.refresh();
        } catch (err) {
            notifyError(showToast, err, 'Unable to leave this group.');
        } finally {
            setLeaving(false);
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
        <div className="max-w-4xl mx-auto space-y-5">
            {paymentPhase !== 'idle' && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <p className="font-bold">
                        {paymentPhase === 'initializing' ? 'Preparing payment...' : 'Verifying payment...'}
                    </p>
                    <p className="mt-1 text-xs text-amber-800">
                        {paymentPhase === 'initializing'
                            ? 'Please wait while Ajopay opens the secure Paystack checkout.'
                            : 'Please keep this page open while we confirm your contribution. You will be redirected automatically.'}
                    </p>
                </div>
            )}

            <Link href="/groups" className="inline-flex items-center gap-2 text-xs font-bold text-brand-gray hover:text-brand-navy">
                <ArrowLeft size={14} /> Back to Groups
            </Link>

            <div className="bg-white border border-slate-100 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-brand-navy">{group.name}</h1>
                        <p className="text-xs text-brand-gray capitalize">{group.status} · {group.frequency}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[11px] text-brand-gray">Invite code</p>
                        <p className="font-mono font-bold text-brand-navy text-sm">{group.invite_code}</p>
                    </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 mt-4">
                    <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[11px] text-brand-gray flex items-center gap-1"><Wallet size={12} /> Per cycle</p>
                        <p className="font-bold text-brand-navy">NGN {Number(group.contribution_amount).toLocaleString('en-NG')}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[11px] text-brand-gray flex items-center gap-1"><Users size={12} /> Members</p>
                        <p className="font-bold text-brand-navy">{group.members.length} / {group.max_members}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[11px] text-brand-gray flex items-center gap-1"><Calendar size={12} /> Cycle</p>
                        <p className="font-bold text-brand-navy">{group.current_cycle} / {group.total_cycles}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-brand-navy">Your Contribution</h2>
                        <p className="text-xs text-brand-gray">Real-time payment via Paystack inline checkout</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={handleLeaveGroup}
                            disabled={leaving}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm font-bold hover:bg-rose-100 disabled:opacity-60"
                        >
                            <LogOut size={14} />
                            {leaving ? 'Leaving...' : 'Leave Group'}
                        </button>
                        <button
                            onClick={handleContribution}
                            disabled={paying || paymentPhase !== 'idle'}
                            className="px-4 py-2 rounded-xl bg-brand-emerald text-white text-sm font-bold disabled:opacity-60"
                        >
                            {paymentPhase === 'initializing' ? 'Opening Checkout...' : paymentPhase === 'verifying' ? 'Verifying Payment...' : paying ? 'Processing...' : 'Make Contribution'}
                        </button>
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-brand-gray">My Position</p>
                        <p className="font-bold text-brand-navy">{userMember?.position ? `#${userMember.position}` : 'Not assigned'}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-brand-gray">Total Contributed (This Group)</p>
                        <p className="font-bold text-brand-navy">NGN {totalContributed.toLocaleString('en-NG')}</p>
                    </div>
                </div>

                {error && <div className="rounded-xl border border-red-100 bg-red-50 text-red-600 text-xs font-semibold p-3">{error}</div>}
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5">
                <h3 className="font-bold text-brand-navy mb-3">Members</h3>
                <div className="space-y-2">
                    {group.members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 text-sm">
                            <p className="font-semibold text-brand-navy">
                                {member.profiles?.name || member.profiles?.email || member.user_id}
                                {member.user_id === currentUserId ? ' (You)' : ''}
                            </p>
                            <p className="text-xs text-brand-gray">Position #{member.position}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
