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
    status: 'active' | 'inactive';
    notes?: string | null;
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
    passbook_activated_at?: string | null;
    created_at: string;
    attribution_status: 'attributed' | 'pending';
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
    const [counts, setCounts] = useState<ReferralCounts>({ attributed: 0, pending: 0, total: 0 });
    const [statusFilter, setStatusFilter] = useState<'all' | 'attributed' | 'pending'>('all');
    const { showToast } = useToast();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [marketerRes, referralsRes] = await Promise.all([
                fetch(`/api/admin/marketers/${id}`, { cache: 'no-store' }),
                fetch(`/api/admin/marketers/${id}/referrals?page=1&pageSize=500&status=${statusFilter}`, { cache: 'no-store' }),
            ]);

            const [marketerJson, referralsJson] = await Promise.all([marketerRes.json(), referralsRes.json()]);
            if (!marketerRes.ok) throw new Error(marketerJson.error || 'Failed to load marketer.');
            if (!referralsRes.ok) throw new Error(referralsJson.error || 'Failed to load referrals.');

            setMarketer(marketerJson.data as MarketerDetail);
            setReferrals(Array.isArray(referralsJson.data) ? referralsJson.data : []);
            setCounts({
                attributed: Number(referralsJson.counts?.attributed ?? 0),
                pending: Number(referralsJson.counts?.pending ?? 0),
                total: Number(referralsJson.counts?.total ?? 0),
            });
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

    const columns: DataTableColumn<ReferralRow>[] = [
        {
            key: 'name',
            header: 'User',
            render: (row) => (
                <div>
                    <Link href={`/admin/users/${row.id}`} className="font-semibold text-brand-navy hover:underline">
                        {row.name || row.email}
                    </Link>
                    {row.phone && <p className="text-xs text-brand-gray mt-0.5">{row.phone}</p>}
                </div>
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
            key: 'passbook_activated',
            header: 'Passbook',
            render: (row) => (
                <span className={row.passbook_activated ? 'text-emerald-700 font-semibold' : 'text-brand-gray'}>
                    {row.passbook_activated ? 'Activated' : 'Not activated'}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Account',
            render: (row) => <span className="capitalize">{row.status}</span>,
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
                        </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${marketer.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                        {marketer.status}
                    </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs text-brand-gray mb-1">Referral Code</p>
                        <div className="flex items-center gap-2">
                            <p className="font-mono font-bold text-brand-navy">{marketer.referral_code}</p>
                            <button
                                type="button"
                                onClick={() => void copyReferralCode()}
                                title="Copy referral code"
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-brand-navy hover:bg-slate-50"
                            >
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
                            <button
                                type="button"
                                onClick={() => void copyReferralLink()}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-brand-navy hover:bg-white"
                            >
                                <Copy size={12} /> Copy
                            </button>
                        </div>
                    </div>
                    {marketer.notes && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
                            <p className="text-xs text-brand-gray">Notes</p>
                            <p className="text-brand-navy">{marketer.notes}</p>
                        </div>
                    )}
                </div>
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
                                {filter === 'all' && ` (${counts.total})`}
                                {filter === 'attributed' && ` (${counts.attributed})`}
                                {filter === 'pending' && ` (${counts.pending})`}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="py-8 text-center text-sm text-brand-gray">
                        <Loader2 size={18} className="animate-spin mx-auto mb-2" />
                        Loading users...
                    </div>
                ) : referrals.length === 0 ? (
                    <p className="text-sm text-brand-gray">
                        {statusFilter === 'all'
                            ? 'No users have signed up with this marketer code yet.'
                            : statusFilter === 'attributed'
                                ? 'No attributed users yet. Users appear here after they activate their passbook.'
                                : 'No pending users. Pending means they signed up with this code but have not activated passbook yet.'}
                    </p>
                ) : (
                    <DataTable columns={columns} rows={referrals} rowKey={(row) => row.id} />
                )}
            </div>
        </div>
    );
}
