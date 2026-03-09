'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

type GroupRow = {
    id: string;
    name: string;
    category: string;
    contribution_amount: number;
    frequency: string;
    max_members: number;
    current_cycle: number;
    total_cycles: number;
    status: string;
    invite_code: string;
};

export default function AdminGroupsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [groups, setGroups] = useState<GroupRow[]>([]);

    const [form, setForm] = useState({
        name: '',
        category: 'ajo',
        contributionAmount: '50000',
        frequency: 'monthly',
        maxMembers: '10',
        totalCycles: '10',
        status: 'pending',
    });

    const loadGroups = async () => {
        const res = await fetch('/api/admin/groups', { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load groups.');
        setGroups(Array.isArray(json.data) ? json.data : []);
    };

    useEffect(() => {
        const run = async () => {
            setLoading(true);
            setError('');
            try {
                await loadGroups();
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unable to load groups.');
            } finally {
                setLoading(false);
            }
        };
        void run();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setNotice('');
        setError('');

        try {
            const res = await fetch('/api/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    category: form.category,
                    contributionAmount: Number(form.contributionAmount),
                    frequency: form.frequency,
                    maxMembers: Number(form.maxMembers),
                    totalCycles: Number(form.totalCycles),
                    status: form.status,
                }),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to create group.');

            setNotice('Group created successfully.');
            setForm((prev) => ({ ...prev, name: '' }));
            await loadGroups();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not create group.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="min-h-80 grid place-items-center"><Loader2 className="animate-spin" size={16} /></div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-brand-navy">Admin Groups</h1>

            <form onSubmit={handleCreate} className="rounded-2xl border border-slate-100 bg-white p-4 grid md:grid-cols-4 gap-3">
                <input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} placeholder="Group name" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" required />
                <select value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                    <option value="ajo">ajo</option><option value="school">school</option><option value="mosque">mosque</option><option value="church">church</option>
                </select>
                <input value={form.contributionAmount} onChange={(e) => setForm((s) => ({ ...s, contributionAmount: e.target.value }))} type="number" min={1} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <select value={form.frequency} onChange={(e) => setForm((s) => ({ ...s, frequency: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                    <option value="weekly">weekly</option><option value="biweekly">biweekly</option><option value="monthly">monthly</option>
                </select>
                <input value={form.maxMembers} onChange={(e) => setForm((s) => ({ ...s, maxMembers: e.target.value }))} type="number" min={2} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <input value={form.totalCycles} onChange={(e) => setForm((s) => ({ ...s, totalCycles: e.target.value }))} type="number" min={1} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                    <option value="pending">pending</option><option value="active">active</option><option value="paused">paused</option><option value="completed">completed</option>
                </select>
                <button disabled={saving} className="rounded-xl bg-brand-navy text-white px-3 py-2 text-sm font-bold">{saving ? 'Creating...' : 'Create Group'}</button>
            </form>

            {notice && <div className="rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700 p-3 text-sm font-semibold">{notice}</div>}
            {error && <div className="rounded-xl border border-red-100 bg-red-50 text-red-600 p-3 text-sm font-semibold">{error}</div>}

            <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
                <div className="divide-y divide-slate-50">
                    {groups.map((group) => (
                        <Link key={group.id} href={`/admin/groups/${group.id}`} className="flex items-center justify-between p-4 text-sm hover:bg-slate-50">
                            <div>
                                <p className="font-bold text-brand-navy">{group.name}</p>
                                <p className="text-xs text-brand-gray">{group.category} · {group.frequency} · code {group.invite_code}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-brand-navy">NGN {Number(group.contribution_amount).toLocaleString('en-NG')}</p>
                                <p className="text-xs text-brand-gray">Cycle {group.current_cycle}/{group.total_cycles} · {group.status}</p>
                            </div>
                        </Link>
                    ))}
                    {groups.length === 0 && <p className="p-4 text-sm text-brand-gray">No groups yet.</p>}
                </div>
            </div>
        </div>
    );
}
