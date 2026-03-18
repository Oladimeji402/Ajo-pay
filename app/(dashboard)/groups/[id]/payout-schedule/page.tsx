'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Calendar, CheckCircle2, Loader2 } from 'lucide-react';
import { formatScheduleDate, getCycleDueDate } from '@/lib/ajo-schedule';
import { useToast } from '@/components/ui/Toast';
import { notifyError } from '@/lib/toast';

type Member = {
    id: string;
    user_id: string;
    position: number;
    profiles?: {
        name?: string | null;
        email?: string | null;
    } | null;
};

type GroupDetail = {
    id: string;
    name: string;
    frequency: string;
    start_date: string | null;
    current_cycle: number;
    members: Member[];
};

export default function PayoutSchedulePage() {
    const params = useParams<{ id: string }>();
    const groupId = params.id;
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [group, setGroup] = useState<GroupDetail | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const run = async () => {
            setLoading(true);
            setError('');
            try {
                const [{ createSupabaseBrowserClient }, groupRes] = await Promise.all([
                    import('@/lib/supabase/client'),
                    fetch(`/api/groups/${groupId}`, { cache: 'no-store' }),
                ]);
                const supabase = createSupabaseBrowserClient();
                const {
                    data: { user },
                } = await supabase.auth.getUser();
                setCurrentUserId(user?.id ?? null);

                const payload = await groupRes.json();
                if (!groupRes.ok) {
                    throw new Error(payload.error || 'Unable to load payout schedule.');
                }

                setGroup(payload.data as GroupDetail);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Unable to load payout schedule.';
                setError(message);
                notifyError(showToast, err, message);
            } finally {
                setLoading(false);
            }
        };

        void run();
    }, [groupId, showToast]);

    const scheduleRows = useMemo(() => {
        if (!group) return [];
        return [...(group.members ?? [])]
            .sort((a, b) => a.position - b.position)
            .map((member, index) => ({
                member,
                cycleNumber: index + 1,
                payoutDate: getCycleDueDate(group.start_date, group.frequency, index + 1),
            }));
    }, [group]);

    if (loading) {
        return (
            <div className="min-h-80 grid place-items-center text-brand-gray">
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <Loader2 className="animate-spin" size={16} />
                    Loading payout schedule...
                </div>
            </div>
        );
    }

    if (!group) {
        return <div className="text-sm text-red-600">{error || 'Payout schedule not found.'}</div>;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <Link href={`/groups/${group.id}`} className="inline-flex items-center gap-2 text-xs font-semibold text-brand-gray hover:text-brand-navy">
                <ArrowLeft size={14} /> Back to group
            </Link>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.2em] text-brand-gray font-semibold">Rotation plan</p>
                <h1 className="mt-2 text-2xl font-semibold text-brand-navy">{group.name} payout schedule</h1>
                <p className="mt-2 text-sm text-slate-500">Each member receives the payout on the cycle matching their position in the group.</p>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6">
                <div className="space-y-3">
                    {scheduleRows.map(({ member, cycleNumber, payoutDate }) => {
                        const isCurrentUser = member.user_id === currentUserId;
                        return (
                            <div key={member.id} className={`rounded-2xl border p-4 ${isCurrentUser ? 'border-emerald-200 bg-emerald-50/80' : 'border-slate-200 bg-slate-50/70'}`}>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-gray">Cycle {cycleNumber}</p>
                                        <h2 className="mt-1 text-base font-semibold text-brand-navy">
                                            {member.profiles?.name || member.profiles?.email || 'Member'}
                                            {isCurrentUser ? ' (You)' : ''}
                                        </h2>
                                    </div>
                                    <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-brand-navy">
                                        <Calendar size={14} />
                                        {formatScheduleDate(payoutDate)}
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                                    <CheckCircle2 size={13} className={isCurrentUser ? 'text-emerald-600' : 'text-slate-400'} />
                                    Position #{member.position} in the payout rotation.
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}