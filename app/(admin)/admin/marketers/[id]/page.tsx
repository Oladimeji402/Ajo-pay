'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Copy, Link2, Loader2, Users } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';
import { DataTable, DataTableColumn } from '@/components/admin/DataTable';
import { buildReferralSignupUrl } from '@/lib/referrals/referral-code';

type MarketerDetail = {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    referral_code: string;
    status: 'pending' | 'active' | 'rejected' | 'inactive';
    notes?: string | null;
    passport_path?: string | null;
    rejection_reason?: string | null;
    user_id?: string | null;
    referral_count: number;
    created_at: string;
};

type ReferralRow = {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    status: string;
    referral_code_used?: string | null;
    passbook_activated?: boolean;
    created_at: string;
    attribution_status: 'attributed' | 'pending';
};

type TaskRow = {
    id: string;
    title: string;
    description: string;
    status: string;
    due_at?: string | null;
    created_at: string;
};

type ReferralCounts = {
    attributed: number;
    pending: number;
    total: number;
};

function getReferralLink(code: string) {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    return buildReferralSignupUrl(base, code);
}

export default function AdminMarketerDetailPage() {
    const params = useParams<{ id: string }>();
    const id = params.id;
    const [loading, setLoading] = useState(true);
    const [marketer, setMarketer] = useState<MarketerDetail | null>(null);
    const [referrals, setReferrals] = useState<ReferralRow[]>([]);
    const [tasks, setTasks] = useState<TaskRow[]>([]);
    const [counts, setCounts] = useState<ReferralCounts>({ attributed: 0, pending: 0, total: 0 });
    const [statusFilter, setStatusFilter] = useState<'all' | 'attributed' | 'pending'>('all');
    const [passportUrl, setPassportUrl] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [acting, setActing] = useState(false);
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [savingTask, setSavingTask] = useState(false);
    const { showToast } = useToast();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [marketerRes, referralsRes, tasksRes] = await Promise.all([
                fetch(`/api/admin/marketers/${id}`, { cache: 'no-store' }),
                fetch(`/api/admin/marketers/${id}/referrals?page=1&pageSize=500&status=${statusFilter}`, { cache: 'no-store' }),
                fetch(`/api/admin/marketers/${id}/tasks`, { cache: 'no-store' }),
            ]);

            const [marketerJson, referralsJson, tasksJson] = await Promise.all([
                marketerRes.json(),
                referralsRes.json(),
                tasksRes.json(),
            ]);
            if (!marketerRes.ok) throw new Error(marketerJson.error || 'Failed to load marketer.');
            if (!referralsRes.ok) throw new Error(referralsJson.error || 'Failed to load referrals.');
            if (!tasksRes.ok) throw new Error(tasksJson.error || 'Failed to load tasks.');

            const m = marketerJson.data as MarketerDetail;
            setMarketer(m);
            setReferrals(Array.isArray(referralsJson.data) ? referralsJson.data : []);
            setTasks(Array.isArray(tasksJson.data) ? tasksJson.data : []);
            setCounts({
                attributed: Number(referralsJson.counts?.attributed ?? 0),
                pending: Number(referralsJson.counts?.pending ?? 0),
                total: Number(referralsJson.counts?.total ?? 0),
            });

            if (m.passport_path) {
                const passRes = await fetch(`/api/admin/marketers/${id}/passport-url`, { cache: 'no-store' });
                const passJson = await passRes.json();
                if (passRes.ok) setPassportUrl(passJson.data?.url ?? null);
            } else {
                setPassportUrl(null);
            }
        } catch (err) {
            notifyError(showToast, err, 'Failed to load marketer details.');
        } finally {
            setLoading(false);
        }
    }, [id, showToast, statusFilter]);

    useEffect(() => {
        void load();
    }, [load]);

    const copyReferralLink = async () => {
        if (!marketer) return;
        try {
            await navigator.clipboard.writeText(getReferralLink(marketer.referral_code));
            notifySuccess(showToast, 'Referral link copied.');
        } catch {
            notifyError(showToast, null, 'Could not copy link.');
        }
    };

    const copyReferralCode = async () => {
        if (!marketer) return;
        try {
            await navigator.clipboard.writeText(marketer.referral_code);
            notifySuccess(showToast, 'Referral code copied.');
        } catch {
            notifyError(showToast, null, 'Could not copy code.');
        }
    };

    const review = async (action: 'approve' | 'reject') => {
        setActing(true);
        try {
            const res = await fetch(`/api/admin/marketers/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    rejectionReason: action === 'reject' ? rejectReason : null,
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            notifySuccess(showToast, action === 'approve' ? 'Marketer approved.' : 'Application rejected.');
            await load();
        } catch (err) {
            notifyError(showToast, err, 'Could not update application.');
        } finally {
            setActing(false);
        }
    };

    const createTask = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingTask(true);
        try {
            const res = await fetch(`/api/admin/marketers/${id}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: taskTitle, description: taskDescription }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            notifySuccess(showToast, 'Task assigned.');
            setTaskTitle('');
            setTaskDescription('');
            await load();
        } catch (err) {
            notifyError(showToast, err, 'Could not assign task.');
        } finally {
            setSavingTask(false);
        }
    };

    const columns: DataTableColumn<ReferralRow>[] = [
        {
            key: 'name',
            header: 'User',
            render: (row) => (
                <Link href={`/admin/users/${row.id}`} className="font-semibold text-brand-navy hover:underline">
                    {row.name || row.email}
                </Link>
            ),
        },
        {
            key: 'email',
            header: 'Email',
            render: (row) => <span className="text-brand-gray">{row.email}</span>,
        },
        {
            key: 'attribution_status',
            header: 'Attribution',
            render: (row) => (
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    row.attribution_status === 'attributed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                    {row.attribution_status === 'attributed' ? 'Attributed' : 'Pending'}
                </span>
            ),
        },
        {
            key: 'created_at',
            header: 'Signed up',
            render: (row) => new Date(row.created_at).toLocaleDateString('en-NG'),
        },
    ];

    if (loading && !marketer) {
        return (
            <div className="rounded-xl border border-slate-100 bg-white p-8 text-center text-sm text-brand-gray">
                <Loader2 size={20} className="animate-spin mx-auto mb-2" />
                Loading marketer...
            </div>
        );
    }

    if (!marketer) {
        return <div className="text-sm text-red-600">Marketer not found.</div>;
    }

    const referralLink = getReferralLink(marketer.referral_code);

    return (
        <div className="space-y-4">
            <Link href="/admin/marketers" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-gray transition-colors hover:text-brand-navy">
                <ArrowLeft size={14} /> Back to marketers
            </Link>

            <div className="rounded-xl border border-slate-100 bg-white p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-brand-navy flex items-center gap-2">
                            <Link2 size={18} />
                            {marketer.name}
                        </h1>
                        <p className="mt-1 text-sm text-brand-gray">
                            {[marketer.email, marketer.phone].filter(Boolean).join(' · ') || 'No contact info'}
                            {marketer.user_id ? ' · Has portal login' : ' · Admin-created'}
                        </p>
                    </div>
                    <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider border border-slate-200 bg-slate-50 text-slate-600">
                        {marketer.status}
                    </span>
                </div>

                {marketer.status === 'pending' && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-3">
                        <p className="text-sm font-semibold text-amber-800">Application awaiting review</p>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                disabled={acting}
                                onClick={() => void review('approve')}
                                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                            >
                                Approve
                            </button>
                            <div className="flex flex-wrap gap-2 items-center">
                                <input
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Rejection reason (optional)"
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs min-w-[220px]"
                                />
                                <button
                                    type="button"
                                    disabled={acting}
                                    onClick={() => void review('reject')}
                                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 disabled:opacity-60"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs text-brand-gray mb-1">Referral Code</p>
                        <div className="flex items-center gap-2">
                            <p className="font-mono font-bold text-brand-navy">{marketer.referral_code}</p>
                            <button type="button" onClick={() => void copyReferralCode()} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold">
                                <Copy size={12} /> Copy
                            </button>
                        </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs text-brand-gray">Users under this marketer</p>
                        <p className="font-bold text-brand-navy flex items-center gap-1.5">
                            <Users size={16} />
                            {counts.total}
                        </p>
                        <p className="text-xs text-brand-gray mt-1">
                            {counts.attributed} attributed · {counts.pending} pending
                        </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
                        <p className="text-xs text-brand-gray mb-1">Referral Link</p>
                        <div className="flex flex-wrap items-center gap-2">
                            <code className="flex-1 min-w-0 truncate rounded bg-white px-2 py-1 text-xs border border-slate-200">{referralLink}</code>
                            <button type="button" onClick={() => void copyReferralLink()} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold">
                                <Copy size={12} /> Copy
                            </button>
                        </div>
                    </div>
                    {passportUrl && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
                            <p className="text-xs text-brand-gray mb-2">Passport photograph</p>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={passportUrl} alt="Marketer passport" className="max-h-64 rounded-lg border border-slate-200 object-contain bg-white" />
                        </div>
                    )}
                    {marketer.rejection_reason && (
                        <div className="rounded-xl border border-red-100 bg-red-50/60 p-3 sm:col-span-2">
                            <p className="text-xs text-brand-gray">Rejection reason</p>
                            <p className="text-brand-navy">{marketer.rejection_reason}</p>
                        </div>
                    )}
                    {marketer.notes && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
                            <p className="text-xs text-brand-gray">Notes</p>
                            <p className="text-brand-navy">{marketer.notes}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-white p-4 space-y-3">
                <h2 className="font-semibold text-brand-navy">Assign task</h2>
                <form onSubmit={createTask} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                    <input
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        placeholder="Task title"
                        required
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                    />
                    <input
                        value={taskDescription}
                        onChange={(e) => setTaskDescription(e.target.value)}
                        placeholder="Description (optional)"
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                    />
                    <button disabled={savingTask} className="rounded-xl bg-brand-navy px-4 py-2 text-xs font-bold text-white disabled:opacity-60">
                        {savingTask ? 'Saving...' : 'Assign'}
                    </button>
                </form>
                {tasks.length === 0 ? (
                    <p className="text-sm text-brand-gray">No tasks assigned yet.</p>
                ) : (
                    <div className="space-y-2">
                        {tasks.map((task) => (
                            <div key={task.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
                                <div className="flex justify-between gap-2">
                                    <p className="font-semibold text-brand-navy">{task.title}</p>
                                    <span className="text-[10px] font-bold uppercase text-brand-gray">{task.status.replace('_', ' ')}</span>
                                </div>
                                {task.description && <p className="text-xs text-brand-gray mt-1">{task.description}</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="rounded-xl border border-slate-100 bg-white p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-semibold text-brand-navy">
                        All users ({statusFilter === 'all' ? counts.total : referrals.length})
                    </h2>
                    <div className="flex items-center gap-1.5">
                        {(['all', 'attributed', 'pending'] as const).map((filter) => (
                            <button
                                key={filter}
                                type="button"
                                onClick={() => setStatusFilter(filter)}
                                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
                                    statusFilter === filter
                                        ? 'bg-brand-navy text-white'
                                        : 'border border-slate-200 text-brand-gray hover:bg-slate-50'
                                }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                {referrals.length === 0 ? (
                    <p className="text-sm text-brand-gray">No users for this filter yet.</p>
                ) : (
                    <DataTable columns={columns} rows={referrals} rowKey={(row) => row.id} />
                )}
            </div>
        </div>
    );
}
