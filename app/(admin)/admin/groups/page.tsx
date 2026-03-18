'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { LastSynced } from '@/components/admin/LastSynced';
import { ChartCard } from '@/components/admin/charts/ChartCard';
import { AdminPieChart } from '@/components/admin/charts/PieChart';
import { useRealtimeSubscription } from '@/lib/hooks/useRealtimeSubscription';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';
import { formatScheduleDate, getCurrentCycleDueDate, getDueWindow, getTodayDateInputValue } from '@/lib/ajo-schedule';

const GROUPS_REALTIME_TABLES = ['groups', 'group_members'];

type GroupRow = {
  id: string;
  name: string;
  category: string;
  contribution_amount: number;
  frequency: string;
  max_members: number;
  current_cycle: number;
  total_cycles: number;
  start_date: string | null;
  status: string;
  invite_code: string;
  group_members?: Array<{ count: number }>;
  contributions?: Array<{ user_id: string; cycle_number: number; status: string }>;
};

function asMemberCount(group: GroupRow) {
  if (!group.group_members || group.group_members.length === 0) return 0;
  return Number(group.group_members[0]?.count ?? 0);
}

export default function AdminGroupsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [syncingGroupId, setSyncingGroupId] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const { showToast } = useToast();
  const { refreshTrigger, lastEvent } = useRealtimeSubscription({
    channelName: 'admin-groups-live',
    tables: GROUPS_REALTIME_TABLES,
  });

  useEffect(() => {
    if (lastEvent?.timestamp) {
      setLastSyncedAt(lastEvent.timestamp);
    }
  }, [lastEvent]);

  const [form, setForm] = useState({
    name: '',
    category: 'ajo',
    contributionAmount: '50000',
    frequency: 'monthly',
    maxMembers: '10',
    totalCycles: '10',
    startDate: getTodayDateInputValue(),
    status: 'pending',
  });

  const loadGroups = async () => {
    const res = await fetch('/api/admin/groups', { cache: 'no-store' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load groups.');
    setGroups(Array.isArray(json.data) ? json.data : []);
    setLastSyncedAt(new Date().toISOString());
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
  }, [refreshTrigger]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
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
          startDate: form.startDate,
          status: form.status,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create group.');

      notifySuccess(showToast, 'Group created successfully.');
      setForm((prev) => ({ ...prev, name: '', startDate: getTodayDateInputValue() }));
      await loadGroups();
    } catch (err) {
      notifyError(showToast, err, 'Could not create group.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportGroup = async (groupId: string, groupName: string) => {
    setSyncingGroupId(groupId);
    try {
      const res = await fetch('/api/admin/integrations/google-sheets/export-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          sheetName: 'GroupMembers',
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Export failed.');

      notifySuccess(showToast, `${groupName} exported to Google Sheets.`);
    } catch (err) {
      notifyError(showToast, err, 'Could not export group.');
    } finally {
      setSyncingGroupId(null);
    }
  };

  const filtered = useMemo(() => {
    return groups.filter((group) => {
      if (categoryFilter !== 'all' && group.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && group.status !== statusFilter) return false;
      if (!search.trim()) return true;
      return group.name.toLowerCase().includes(search.toLowerCase());
    });
  }, [groups, categoryFilter, statusFilter, search]);

  const totalGroups = filtered.length;
  const activeGroups = filtered.filter((g) => g.status === 'active').length;
  const avgContribution = filtered.length > 0
    ? filtered.reduce((sum, group) => sum + Number(group.contribution_amount ?? 0), 0) / filtered.length
    : 0;

  const categoryMap = new Map<string, number>();
  filtered.forEach((group) => {
    categoryMap.set(group.category || 'unknown', (categoryMap.get(group.category || 'unknown') ?? 0) + 1);
  });
  const categoryData = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));

  if (loading) {
    return <div className="grid min-h-80 place-items-center"><Loader2 className="animate-spin" size={16} /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">Admin Groups</h1>
        <LastSynced timestamp={lastSyncedAt} loading={loading || saving} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-xs text-brand-gray">Total Groups</p><p className="text-xl font-bold text-brand-navy">{totalGroups}</p></div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-xs text-brand-gray">Active Groups</p><p className="text-xl font-bold text-emerald-700">{activeGroups}</p></div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-xs text-brand-gray">Avg Contribution</p><p className="text-xl font-bold text-brand-navy">NGN {Math.round(avgContribution).toLocaleString('en-NG')}</p></div>
      </div>

      <ChartCard title="Group Category Distribution" subtitle="Category spread for current filters">
        <AdminPieChart data={categoryData} />
      </ChartCard>

      <div className="rounded-2xl border border-slate-100 bg-white p-3">
        <div className="grid gap-3 md:grid-cols-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search groups" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="all">All Categories</option>
            <option value="ajo">Ajo</option>
            <option value="school">School</option>
            <option value="mosque">Mosque</option>
            <option value="church">Church</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <form onSubmit={handleCreate} className="grid gap-3 rounded-2xl border border-slate-100 bg-white p-4 md:grid-cols-4">
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
        <input value={form.startDate} onChange={(e) => setForm((s) => ({ ...s, startDate: e.target.value }))} type="date" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" required />
        <select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
          <option value="pending">pending</option><option value="active">active</option><option value="paused">paused</option><option value="completed">completed</option>
        </select>
        <button disabled={saving} className="rounded-xl bg-brand-navy px-3 py-2 text-sm font-bold text-white">{saving ? 'Creating...' : 'Create Group'}</button>
      </form>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</div>}

      <div className="rounded-2xl border border-slate-100 bg-white p-2">
        <div className="grid gap-2">
          {filtered.map((group) => {
            const memberCount = asMemberCount(group);
            const cycleProgress = group.total_cycles > 0 ? Math.min(100, (group.current_cycle / group.total_cycles) * 100) : 0;
            const fillProgress = group.max_members > 0 ? Math.min(100, (memberCount / group.max_members) * 100) : 0;
            const isSyncing = syncingGroupId === group.id;
            const dueDate = getCurrentCycleDueDate(group);
            const dueWindow = getDueWindow(dueDate);
            const successfulContributions = (group.contributions ?? []).filter(
              (contribution) => contribution.cycle_number === group.current_cycle && contribution.status === 'success',
            ).length;
            const pendingContributions = Math.max(memberCount - successfulContributions, 0);
            const overdueCount = dueWindow.phase === 'overdue' ? pendingContributions : 0;
            const payoutReadiness = memberCount === 0
              ? 'Waiting for members'
              : dueWindow.phase === 'scheduled'
                ? `Collection opens in ${dueWindow.daysUntilDue} day${dueWindow.daysUntilDue === 1 ? '' : 's'}`
                : pendingContributions === 0
                  ? 'Ready for payout'
                  : dueWindow.phase === 'overdue'
                    ? `${overdueCount} overdue payment${overdueCount === 1 ? '' : 's'}`
                    : `Awaiting ${pendingContributions} payment${pendingContributions === 1 ? '' : 's'}`;

            return (
              <div key={group.id} className="rounded-xl border border-slate-100 p-4 hover:bg-slate-50">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-brand-navy">{group.name}</p>
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={() => void handleExportGroup(group.id, group.name)}
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSyncing ? 'Exporting...' : 'Export to Sheets'}
                  </button>
                </div>

                <Link href={`/admin/groups/${group.id}`} className="block rounded-lg">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-brand-navy">{group.name}</p>
                      <p className="text-xs text-slate-500">{group.category} . {group.frequency} . code {group.invite_code}</p>
                      <p className="mt-1 text-xs text-slate-500">Current collection date: {formatScheduleDate(dueDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-brand-navy">NGN {Number(group.contribution_amount).toLocaleString('en-NG')}</p>
                      <p className="text-xs text-slate-500 capitalize">{group.status}</p>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-600"><span>Cycle Progress</span><span>{group.current_cycle}/{group.total_cycles}</span></div>
                      <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-brand-primary" style={{ width: `${cycleProgress}%` }} /></div>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-600"><span>Member Fill Rate</span><span>{memberCount}/{group.max_members}</span></div>
                      <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-emerald-500" style={{ width: `${fillProgress}%` }} /></div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-600">Paid {successfulContributions}/{memberCount || 0}</span>
                    <span className={`rounded-full border px-2.5 py-1 font-semibold ${dueWindow.phase === 'overdue' ? 'border-rose-200 bg-rose-50 text-rose-700' : dueWindow.phase === 'due' ? 'border-amber-200 bg-amber-50 text-amber-700' : dueWindow.phase === 'scheduled' ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                      {dueWindow.phase === 'overdue'
                        ? `Overdue by ${dueWindow.daysOverdue} day${dueWindow.daysOverdue === 1 ? '' : 's'}`
                        : dueWindow.phase === 'due'
                          ? 'Due today'
                          : dueWindow.phase === 'scheduled'
                            ? `Due in ${dueWindow.daysUntilDue} day${dueWindow.daysUntilDue === 1 ? '' : 's'}`
                            : 'Schedule needed'}
                    </span>
                    <span className={`rounded-full border px-2.5 py-1 font-semibold ${pendingContributions === 0 && memberCount > 0 && dueWindow.phase !== 'scheduled' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600'}`}>
                      {payoutReadiness}
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}

          {filtered.length === 0 && <p className="p-4 text-sm text-slate-500">No groups found.</p>}
        </div>
      </div>
    </div>
  );
}
