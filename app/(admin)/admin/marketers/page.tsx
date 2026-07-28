'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Copy, Link2, Loader2, Plus, ToggleLeft, ToggleRight, Users } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';
import { buildReferralSignupUrl } from '@/lib/referrals/referral-code';

type Marketer = {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    referral_code: string;
    status: 'active' | 'inactive';
    notes?: string | null;
    referral_count: number;
    attributed_count?: number;
    pending_count?: number;
    total_users?: number;
    created_at: string;
};

const emptyForm = {
    name: '',
    email: '',
    phone: '',
    notes: '',
    status: 'active' as Marketer['status'],
};

function getReferralLink(code: string) {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    return buildReferralSignupUrl(base, code);
}

export default function AdminMarketersPage() {
    const [marketers, setMarketers] = useState<Marketer[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...emptyForm });
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const { showToast } = useToast();

    const load = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/marketers', { cache: 'no-store' });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            setMarketers(Array.isArray(json.data) ? json.data : []);
        } catch (err) {
            notifyError(showToast, err, 'Failed to load marketers.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingId ? `/api/admin/marketers/${editingId}` : '/api/admin/marketers';
            const method = editingId ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);

            notifySuccess(showToast, editingId ? 'Marketer updated.' : 'Marketer created.');
            setShowForm(false);
            setEditingId(null);
            setForm({ ...emptyForm });
            await load();
        } catch (err) {
            notifyError(showToast, err, 'Could not save marketer.');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (marketer: Marketer) => {
        try {
            const res = await fetch(`/api/admin/marketers/${marketer.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: marketer.status === 'active' ? 'inactive' : 'active' }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            notifySuccess(showToast, `${marketer.name} ${marketer.status === 'active' ? 'deactivated' : 'activated'}.`);
            await load();
        } catch (err) {
            notifyError(showToast, err, 'Could not update status.');
        }
    };

    const handleEdit = (marketer: Marketer) => {
        setForm({
            name: marketer.name,
            email: marketer.email ?? '',
            phone: marketer.phone ?? '',
            notes: marketer.notes ?? '',
            status: marketer.status,
        });
        setEditingId(marketer.id);
        setShowForm(true);
    };

    const copyReferralLink = async (code: string) => {
        try {
            await navigator.clipboard.writeText(getReferralLink(code));
            notifySuccess(showToast, 'Referral link copied.');
        } catch {
            notifyError(showToast, null, 'Could not copy link.');
        }
    };

    const copyReferralCode = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            notifySuccess(showToast, 'Referral code copied.');
        } catch {
            notifyError(showToast, null, 'Could not copy code.');
        }
    };

    const filtered = statusFilter === 'all'
        ? marketers
        : marketers.filter((m) => m.status === statusFilter);

    const activeCount = marketers.filter((m) => m.status === 'active').length;
    const totalReferrals = marketers.reduce((sum, m) => sum + (m.attributed_count ?? m.referral_count ?? 0), 0);
    const totalUsers = marketers.reduce((sum, m) => sum + (m.total_users ?? m.referral_count ?? 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <p className="text-xs text-slate-400">
                    {marketers.length} marketers · {activeCount} active · {totalReferrals} attributed · {totalUsers} total users
                </p>
                <button
                    onClick={() => {
                        setForm({ ...emptyForm });
                        setEditingId(null);
                        setShowForm(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-navy/90 transition-colors"
                >
                    <Plus size={13} /> Add Marketer
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {(['all', 'active', 'inactive'] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`rounded-xl border p-4 text-left transition-colors ${statusFilter === status ? 'border-brand-primary bg-brand-primary/5' : 'border-slate-100 bg-white hover:bg-slate-50'}`}
                    >
                        <p className="text-xs text-brand-gray capitalize">{status === 'all' ? 'All Marketers' : status}</p>
                        <p className="text-xl font-bold text-brand-navy mt-0.5">
                            {status === 'all' ? marketers.length : marketers.filter((m) => m.status === status).length}
                        </p>
                    </button>
                ))}
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-brand-navy flex items-center gap-2">
                            <Link2 size={16} />
                            {editingId ? 'Edit Marketer' : 'New Marketer'}
                        </h2>
                        <button type="button" onClick={() => setShowForm(false)} className="text-xs text-brand-gray hover:text-brand-navy">
                            Cancel
                        </button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <div>
                            <label className="block text-xs font-semibold text-brand-gray mb-1">Name</label>
                            <input
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-brand-gray mb-1">Email (optional)</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-brand-gray mb-1">Phone (optional)</label>
                            <input
                                value={form.phone}
                                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                                placeholder="08012345678"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-brand-gray">Active</label>
                            <button type="button" onClick={() => setForm((f) => ({ ...f, status: f.status === 'active' ? 'inactive' : 'active' }))}>
                                {form.status === 'active'
                                    ? <ToggleRight size={22} className="text-brand-primary" />
                                    : <ToggleLeft size={22} className="text-slate-300" />}
                            </button>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-brand-gray mb-1">Notes (internal)</label>
                            <textarea
                                value={form.notes}
                                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                                rows={2}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm resize-none"
                            />
                        </div>
                    </div>

                    <button
                        disabled={saving}
                        className="rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-primary-hover disabled:opacity-60 inline-flex items-center gap-2"
                    >
                        {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : editingId ? 'Update Marketer' : 'Create Marketer'}
                    </button>
                </form>
            )}

            {loading ? (
                <div className="rounded-xl border border-slate-100 bg-white p-8 text-center text-sm text-brand-gray">
                    <Loader2 size={20} className="animate-spin mx-auto mb-2" />
                    Loading marketers...
                </div>
            ) : filtered.length === 0 ? (
                <div className="rounded-xl border border-slate-100 bg-white p-8 text-center text-sm text-brand-gray">
                    No marketers yet. Create one to generate a referral link.
                </div>
            ) : (
                <div className="rounded-xl border border-slate-100 bg-white overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold text-brand-gray">
                                    <th className="px-4 py-3">Marketer</th>
                                    <th className="px-4 py-3">Referral Code</th>
                                    <th className="px-4 py-3">Users</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((marketer) => (
                                    <tr key={marketer.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                        <td className="px-4 py-3">
                                            <Link href={`/admin/marketers/${marketer.id}`} className="font-semibold text-brand-navy hover:underline">
                                                {marketer.name}
                                            </Link>
                                            <p className="text-xs text-brand-gray mt-0.5">
                                                {[marketer.email, marketer.phone].filter(Boolean).join(' · ') || 'No contact info'}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                type="button"
                                                onClick={() => void copyReferralCode(marketer.referral_code)}
                                                title="Copy referral code"
                                                className="inline-flex items-center gap-1.5 rounded bg-slate-100 px-2 py-1 text-xs font-mono text-brand-navy hover:bg-slate-200 transition-colors"
                                            >
                                                {marketer.referral_code}
                                                <Copy size={11} className="text-brand-gray shrink-0" />
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/admin/marketers/${marketer.id}`}
                                                className="inline-flex flex-col gap-0.5 text-brand-navy font-semibold hover:underline"
                                            >
                                                <span className="inline-flex items-center gap-1">
                                                    <Users size={13} />
                                                    {marketer.total_users ?? marketer.referral_count}
                                                </span>
                                                <span className="text-[10px] font-medium text-brand-gray no-underline">
                                                    {marketer.attributed_count ?? marketer.referral_count} attributed
                                                    {(marketer.pending_count ?? 0) > 0 ? ` · ${marketer.pending_count} pending` : ''}
                                                </span>
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${marketer.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                                {marketer.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <button
                                                    type="button"
                                                    onClick={() => void copyReferralLink(marketer.referral_code)}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-brand-navy hover:bg-slate-50"
                                                >
                                                    <Copy size={12} /> Copy link
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleEdit(marketer)}
                                                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-brand-gray hover:bg-slate-50"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => void handleToggleStatus(marketer)}
                                                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-brand-gray hover:bg-slate-50"
                                                >
                                                    {marketer.status === 'active' ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
