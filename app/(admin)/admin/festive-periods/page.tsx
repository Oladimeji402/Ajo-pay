'use client';

import React, { useEffect, useState } from 'react';
import { CalendarDays, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';
import { getTodayDateInputValue } from '@/lib/ajo-schedule';
import { ConfirmPopup } from '@/components/ui/ConfirmPopup';

type FestivePeriod = {
    id: string;
    name: string;
    slug: string;
    description: string;
    category: 'religious' | 'national' | 'cultural' | 'personal';
    emoji: string;
    color: string;
    target_date: string;
    savings_start_date: string;
    savings_end_date: string;
    suggested_frequency: 'daily' | 'weekly' | 'monthly';
    is_active: boolean;
    year: number;
};

const categoryColors: Record<string, string> = {
    religious: 'bg-amber-50 text-amber-700 border-amber-100',
    national: 'bg-blue-50 text-blue-700 border-blue-100',
    cultural: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    personal: 'bg-slate-50 text-slate-700 border-slate-100',
};

const emptyForm = {
    name: '',
    slug: '',
    description: '',
    category: 'cultural' as FestivePeriod['category'],
    emoji: '',
    color: '#3B82F6',
    target_date: getTodayDateInputValue(),
    savings_start_date: getTodayDateInputValue(),
    savings_end_date: getTodayDateInputValue(),
    suggested_frequency: 'monthly' as FestivePeriod['suggested_frequency'],
    is_active: true,
    year: new Date().getFullYear(),
};

export default function AdminFestivePeriodsPage() {
    const [periods, setPeriods] = useState<FestivePeriod[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ ...emptyForm });
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [deletingPeriod, setDeletingPeriod] = useState<FestivePeriod | null>(null);
    const { showToast } = useToast();

    const load = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/festive-periods', { cache: 'no-store' });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            setPeriods(Array.isArray(json.data) ? json.data : []);
        } catch (err) {
            notifyError(showToast, err, 'Failed to load festive periods.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void load(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingId
                ? `/api/admin/festive-periods/${editingId}`
                : '/api/admin/festive-periods';
            const method = editingId ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);

            notifySuccess(showToast, editingId ? 'Festive period updated.' : 'Festive period created.');
            setShowForm(false);
            setEditingId(null);
            setForm({ ...emptyForm });
            await load();
        } catch (err) {
            notifyError(showToast, err, 'Could not save festive period.');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (period: FestivePeriod) => {
        try {
            const res = await fetch(`/api/admin/festive-periods/${period.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !period.is_active }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            notifySuccess(showToast, `${period.name} ${!period.is_active ? 'activated' : 'deactivated'}.`);
            await load();
        } catch (err) {
            notifyError(showToast, err, 'Could not update status.');
        }
    };

    const handleDelete = async (period: FestivePeriod) => {
        try {
            const res = await fetch(`/api/admin/festive-periods/${period.id}`, { method: 'DELETE' });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            notifySuccess(showToast, `${period.name} deleted.`);
            await load();
        } catch (err) {
            notifyError(showToast, err, 'Could not delete.');
        }
    };

    const handleEdit = (period: FestivePeriod) => {
        setForm({
            name: period.name,
            slug: period.slug,
            description: period.description,
            category: period.category,
            emoji: period.emoji,
            color: period.color,
            target_date: period.target_date,
            savings_start_date: period.savings_start_date,
            savings_end_date: period.savings_end_date,
            suggested_frequency: period.suggested_frequency,
            is_active: period.is_active,
            year: period.year,
        });
        setEditingId(period.id);
        setShowForm(true);
    };

    const filtered = categoryFilter === 'all'
        ? periods
        : periods.filter(p => p.category === categoryFilter);

    const active = filtered.filter(p => p.is_active).length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <p className="text-xs text-slate-400">{periods.length} total · {active} active</p>
                <button
                    onClick={() => { setForm({ ...emptyForm }); setEditingId(null); setShowForm(true); }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-navy/90 transition-colors"
                >
                    <Plus size={13} /> Add Period
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(['all', 'religious', 'national', 'cultural', 'personal'] as const).slice(0, 4).map(cat => (
                    <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`rounded-xl border p-4 text-left transition-colors ${categoryFilter === cat ? 'border-brand-primary bg-brand-primary/5' : 'border-slate-100 bg-white hover:bg-slate-50'}`}
                    >
                        <p className="text-xs text-brand-gray capitalize">{cat === 'all' ? 'All Periods' : cat}</p>
                        <p className="text-xl font-bold text-brand-navy mt-0.5">
                            {cat === 'all' ? periods.length : periods.filter(p => p.category === cat).length}
                        </p>
                    </button>
                ))}
            </div>

            {/* Create / Edit form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-brand-navy flex items-center gap-2">
                            <CalendarDays size={16} />
                            {editingId ? 'Edit Festive Period' : 'New Festive Period'}
                        </h2>
                        <button type="button" onClick={() => setShowForm(false)} className="text-xs text-brand-gray hover:text-brand-navy">Cancel</button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <div>
                            <label className="block text-xs font-semibold text-brand-gray mb-1">Name</label>
                            <input
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + `-${form.year}` }))}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-brand-gray mb-1">Slug</label>
                            <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono" required />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-brand-gray mb-1">Category</label>
                            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as FestivePeriod['category'] }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                                <option value="religious">Religious</option>
                                <option value="national">National</option>
                                <option value="cultural">Cultural</option>
                                <option value="personal">Personal</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-brand-gray mb-1">Suggested Frequency</label>
                            <select value={form.suggested_frequency} onChange={e => setForm(f => ({ ...f, suggested_frequency: e.target.value as FestivePeriod['suggested_frequency'] }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-brand-gray mb-1">Target Date</label>
                            <input type="date" value={form.target_date} onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" required />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-brand-gray mb-1">Savings Start Date</label>
                            <input type="date" value={form.savings_start_date} onChange={e => setForm(f => ({ ...f, savings_start_date: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" required />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-brand-gray mb-1">Savings End Date</label>
                            <input type="date" value={form.savings_end_date} onChange={e => setForm(f => ({ ...f, savings_end_date: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" required />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-brand-gray mb-1">Year</label>
                            <input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-brand-gray mb-1">Description</label>
                            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm resize-none" />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-brand-gray">Active</label>
                            <button type="button" onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}>
                                {form.is_active
                                    ? <ToggleRight size={22} className="text-brand-primary" />
                                    : <ToggleLeft size={22} className="text-slate-300" />}
                            </button>
                        </div>
                    </div>

                    <button disabled={saving} className="rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-primary-hover disabled:opacity-60 inline-flex items-center gap-2">
                        {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : editingId ? 'Update Period' : 'Create Period'}
                    </button>
                </form>
            )}

            {/* List */}
            {loading ? (
                <div className="flex items-center gap-2 py-8 text-sm text-brand-gray justify-center">
                    <Loader2 size={16} className="animate-spin" /> Loading...
                </div>
            ) : (
                <div className="rounded-xl border border-slate-100 bg-white overflow-hidden">
                    <div className="divide-y divide-slate-100">
                        {filtered.length === 0 && (
                            <p className="p-6 text-sm text-brand-gray text-center">No festive periods found.</p>
                        )}
                        {filtered.map(period => (
                            <div key={period.id} className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 transition-colors">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-semibold text-brand-navy">{period.name}</p>
                                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize ${categoryColors[period.category]}`}>
                                            {period.category}
                                        </span>
                                        {!period.is_active && (
                                            <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                                                Inactive
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-brand-gray mt-0.5">
                                        Target: {period.target_date} · Saves {period.savings_start_date} → {period.savings_end_date} · {period.suggested_frequency}
                                    </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-1">
                                    <button
                                        onClick={() => void handleToggleActive(period)}
                                        title={period.is_active ? 'Deactivate' : 'Activate'}
                                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-primary transition-colors"
                                    >
                                        {period.is_active ? <ToggleRight size={16} className="text-brand-primary" /> : <ToggleLeft size={16} />}
                                    </button>
                                    <button onClick={() => handleEdit(period)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-navy transition-colors">
                                        <Pencil size={14} />
                                    </button>
                                    <button onClick={() => setDeletingPeriod(period)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <ConfirmPopup
                open={Boolean(deletingPeriod)}
                title="Delete festive period?"
                message={deletingPeriod ? `Delete "${deletingPeriod.name}"? This cannot be undone.` : ''}
                confirmLabel="Delete"
                tone="danger"
                onCancel={() => setDeletingPeriod(null)}
                onConfirm={() => {
                    if (!deletingPeriod) return;
                    void handleDelete(deletingPeriod).finally(() => setDeletingPeriod(null));
                }}
            />
        </div>
    );
}
