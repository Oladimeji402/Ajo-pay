'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, Loader2, Search } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';

type Marketer = {
  id: string;
  name: string;
  email?: string | null;
  referral_code: string;
  status: string;
};

type AssignedTask = {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  marketers?: { id: string; name: string; referral_code: string } | null;
};

export default function AdminAssignMarketerTasksPage() {
  const [marketers, setMarketers] = useState<Marketer[]>([]);
  const [recentTasks, setRecentTasks] = useState<AssignedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueAt, setDueAt] = useState('');
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [marketersRes, tasksRes] = await Promise.all([
        fetch('/api/admin/marketers', { cache: 'no-store' }),
        fetch('/api/admin/marketers/tasks?page=1&pageSize=30', { cache: 'no-store' }),
      ]);
      const [marketersJson, tasksJson] = await Promise.all([marketersRes.json(), tasksRes.json()]);
      if (!marketersRes.ok) throw new Error(marketersJson.error || 'Failed to load marketers.');
      if (!tasksRes.ok) throw new Error(tasksJson.error || 'Failed to load tasks.');

      const active = (Array.isArray(marketersJson.data) ? marketersJson.data : []).filter(
        (m: Marketer) => m.status === 'active',
      );
      setMarketers(active);
      setRecentTasks(Array.isArray(tasksJson.data) ? tasksJson.data : []);
    } catch (err) {
      notifyError(showToast, err, 'Failed to load assign page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return marketers;
    return marketers.filter((m) =>
      [m.name, m.email, m.referral_code].filter(Boolean).join(' ').toLowerCase().includes(q),
    );
  }, [marketers, search]);

  const toggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectAllFiltered = () => {
    const ids = filtered.map((m) => m.id);
    setSelectedIds((prev) => {
      const allSelected = ids.every((id) => prev.includes(id));
      if (allSelected) return prev.filter((id) => !ids.includes(id));
      return [...new Set([...prev, ...ids])];
    });
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      notifyError(showToast, null, 'Select at least one marketer.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/marketers/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          dueAt: dueAt ? new Date(dueAt).toISOString() : null,
          marketerIds: selectedIds,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Assignment failed.');

      notifySuccess(
        showToast,
        `Task assigned to ${json.data?.assigned ?? selectedIds.length} marketer${(json.data?.assigned ?? selectedIds.length) === 1 ? '' : 's'}.`,
      );
      setTitle('');
      setDescription('');
      setDueAt('');
      setSelectedIds([]);
      await load();
    } catch (err) {
      notifyError(showToast, err, 'Could not assign task.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white p-8 text-center text-sm text-brand-gray">
        <Loader2 size={20} className="animate-spin mx-auto mb-2" />
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-slate-400">
          Assign a task to one marketer or several at once. Only approved (active) marketers are listed.
        </p>
      </div>

      <form onSubmit={handleAssign} className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <h2 className="font-semibold text-brand-navy flex items-center gap-2">
          <ClipboardList size={16} />
          New assignment
        </h2>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-brand-gray mb-1">Task title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={2}
              placeholder="e.g. Share referral link in community groups"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-brand-gray mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Instructions, targets, or notes for the marketer"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-gray mb-1">Due date (optional)</label>
            <input
              type="date"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end">
            <p className="text-xs text-brand-gray">
              Selected: <span className="font-semibold text-brand-navy">{selectedIds.length}</span> marketer{selectedIds.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-3 py-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search marketers..."
                className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs"
              />
            </div>
            <button
              type="button"
              onClick={selectAllFiltered}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-brand-navy hover:bg-slate-50"
            >
              {filtered.length > 0 && filtered.every((m) => selectedIds.includes(m.id))
                ? 'Clear filtered'
                : 'Select all filtered'}
            </button>
          </div>

          {filtered.length === 0 ? (
            <p className="p-4 text-sm text-brand-gray">No active marketers match your search.</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto divide-y divide-slate-50">
              {filtered.map((m) => {
                const checked = selectedIds.includes(m.id);
                return (
                  <li key={m.id}>
                    <label className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(m.id)}
                        className="rounded border-slate-300"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-brand-navy truncate">{m.name}</p>
                        <p className="text-[11px] text-brand-gray truncate">
                          {m.referral_code}
                          {m.email ? ` · ${m.email}` : ''}
                        </p>
                      </div>
                      <Link
                        href={`/admin/marketers/${m.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11px] font-semibold text-brand-gray hover:text-brand-navy"
                      >
                        Profile
                      </Link>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <button
          type="submit"
          disabled={saving || selectedIds.length === 0}
          className="rounded-xl bg-brand-navy px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-navy/90 disabled:opacity-60 inline-flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Assigning...
            </>
          ) : (
            `Assign to ${selectedIds.length || 0} marketer${selectedIds.length === 1 ? '' : 's'}`
          )}
        </button>
      </form>

      <div className="rounded-xl border border-slate-100 bg-white p-4 space-y-3">
        <h2 className="font-semibold text-brand-navy">Recent assignments</h2>
        {recentTasks.length === 0 ? (
          <p className="text-sm text-brand-gray">No tasks assigned yet.</p>
        ) : (
          <div className="space-y-2">
            {recentTasks.map((task) => (
              <div key={task.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-brand-navy">{task.title}</p>
                    <p className="text-xs text-brand-gray mt-0.5">
                      {task.marketers?.name ?? 'Marketer'}
                      {task.marketers?.referral_code ? ` · ${task.marketers.referral_code}` : ''}
                      {' · '}
                      {new Date(task.created_at).toLocaleString('en-NG')}
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-gray">
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
