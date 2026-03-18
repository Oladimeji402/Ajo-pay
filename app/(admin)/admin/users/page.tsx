'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { DataTable, DataTableColumn } from '@/components/admin/DataTable';
import { LastSynced } from '@/components/admin/LastSynced';
import { ChartCard } from '@/components/admin/charts/ChartCard';
import { AdminAreaChart } from '@/components/admin/charts/AreaChart';
import { useRealtimeSubscription } from '@/lib/hooks/useRealtimeSubscription';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';

const USERS_REALTIME_TABLES = ['profiles'];

type UserRow = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
  wallet_balance: number;
  total_contributed: number;
  created_at: string;
};

type GrowthPoint = {
  date: string;
  count: number;
};

function initials(value: string) {
  const parts = value.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || 'U';
}

function AdminUsersSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 rounded bg-slate-200" />
          <div className="h-3 w-28 rounded bg-slate-200" />
        </div>
        <div className="h-9 w-40 rounded-xl bg-slate-200" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, idx) => (
          <div key={idx} className="rounded-2xl border border-slate-100 bg-white p-4 h-20" />
        ))}
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white p-4 h-48" />
      <div className="rounded-2xl border border-slate-100 bg-white p-3 h-16" />
      <div className="rounded-2xl border border-slate-100 bg-white p-3 h-72" />
    </div>
  );
}

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [userGrowth, setUserGrowth] = useState<GrowthPoint[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const { showToast } = useToast();
  const { refreshTrigger, lastEvent } = useRealtimeSubscription({
    channelName: 'admin-users-live',
    tables: USERS_REALTIME_TABLES,
  });

  useEffect(() => {
    if (lastEvent?.timestamp) {
      setLastSyncedAt(lastEvent.timestamp);
    }
  }, [lastEvent]);

  const loadAll = async () => {
    const [usersRes, trendsRes] = await Promise.all([
      fetch('/api/admin/users?page=1&pageSize=500', { cache: 'no-store' }),
      fetch('/api/admin/stats/trends?days=90', { cache: 'no-store' }),
    ]);

    const [usersJson, trendsJson] = await Promise.all([usersRes.json(), trendsRes.json()]);

    if (!usersRes.ok) throw new Error(usersJson.error || 'Failed to load users.');
    if (!trendsRes.ok) throw new Error(trendsJson.error || 'Failed to load user growth.');

    setUsers(Array.isArray(usersJson.data) ? usersJson.data : []);
    setUserGrowth(Array.isArray(trendsJson.data?.userGrowth) ? trendsJson.data.userGrowth : []);
    setLastSyncedAt(new Date().toISOString());
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        await loadAll();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load users.');
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [refreshTrigger]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;
      if (statusFilter !== 'all' && user.status !== statusFilter) return false;
      if (!search.trim()) return true;

      const haystack = [user.name, user.email, user.phone ?? ''].join(' ').toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [users, roleFilter, statusFilter, search]);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const totalUsers = filteredUsers.length;
  const activeUsers = filteredUsers.filter((u) => u.status === 'active').length;
  const suspendedUsers = filteredUsers.filter((u) => u.status === 'suspended').length;
  const newUsersThisMonth = filteredUsers.filter((u) => {
    const d = new Date(u.created_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const growthData = userGrowth.map((point) => ({ label: point.date.slice(5), count: point.count }));

  const allSelected = filteredUsers.length > 0 && filteredUsers.every((u) => selectedIds.includes(u.id));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredUsers.some((u) => u.id === id)));
      return;
    }

    const next = new Set(selectedIds);
    filteredUsers.forEach((u) => next.add(u.id));
    setSelectedIds(Array.from(next));
  };

  const runBulkAction = async (updates: Record<string, unknown>) => {
    if (selectedIds.length === 0) return;

    setBulkLoading(true);
    setError('');

    try {
      const results = await Promise.allSettled(
        selectedIds.map(async (id) => {
          const res = await fetch(`/api/admin/users/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || 'Bulk update failed.');
        }),
      );

      const successCount = results.filter((result) => result.status === 'fulfilled').length;
      const failureCount = results.length - successCount;

      setSelectedIds([]);
      if (failureCount > 0) {
        notifyError(showToast, new Error(`${failureCount} updates failed.`), `${successCount} of ${results.length} users updated. ${failureCount} failed.`);
      } else {
        notifySuccess(showToast, 'Bulk user update completed successfully.');
      }
      await loadAll();
    } catch (err) {
      notifyError(showToast, err, 'Unable to apply bulk action.');
    } finally {
      setBulkLoading(false);
    }
  };

  const columns: Array<DataTableColumn<UserRow>> = useMemo(
    () => [
      {
        key: 'select',
        header: 'Select',
        className: 'w-16',
        headerClassName: 'w-16',
        render: (user) => (
          <input
            type="checkbox"
            checked={selectedIds.includes(user.id)}
            onChange={() => toggleSelect(user.id)}
          />
        ),
      },
      {
        key: 'user',
        header: 'User',
        render: (user) => {
          const displayName = user.name || user.email;
          return (
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-primary text-xs font-bold text-white">
                {initials(displayName)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-bold text-brand-navy">{displayName}</p>
                <p className="truncate text-xs text-slate-500">{user.email} . {user.phone || 'No phone'}</p>
              </div>
            </div>
          );
        },
      },
      {
        key: 'roleStatus',
        header: 'Role / Status',
        render: (user) => (
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-lg bg-slate-100 px-2 py-1 font-semibold text-slate-700">{user.role}</span>
            <span
              className={`rounded-lg px-2 py-1 font-semibold ${user.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}
            >
              {user.status}
            </span>
          </div>
        ),
      },
      {
        key: 'balances',
        header: 'Balances',
        render: (user) => (
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-lg bg-blue-50 px-2 py-1 font-semibold text-blue-700">
              NGN {Number(user.wallet_balance || 0).toLocaleString('en-NG')}
            </span>
            <span className="rounded-lg bg-indigo-50 px-2 py-1 font-semibold text-indigo-700">
              NGN {Number(user.total_contributed || 0).toLocaleString('en-NG')} contributed
            </span>
          </div>
        ),
      },
      {
        key: 'actions',
        header: 'Action',
        className: 'w-24',
        headerClassName: 'w-24',
        render: (user) => (
          <Link
            href={`/admin/users/${user.id}`}
            className="inline-flex rounded-lg bg-slate-900 px-2 py-1 text-xs font-semibold text-white"
          >
            Open
          </Link>
        ),
      },
    ],
    [selectedIds],
  );

  if (loading) {
    return <AdminUsersSkeleton />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Admin Users</h1>
          <LastSynced timestamp={lastSyncedAt} loading={loading || bulkLoading} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-xs text-brand-gray">Total Users</p><p className="mt-1 text-xl font-bold text-brand-navy">{totalUsers}</p></div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-xs text-brand-gray">Active Users</p><p className="mt-1 text-xl font-bold text-emerald-700">{activeUsers}</p></div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-xs text-brand-gray">Suspended Users</p><p className="mt-1 text-xl font-bold text-red-600">{suspendedUsers}</p></div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-xs text-brand-gray">New This Month</p><p className="mt-1 text-xl font-bold text-brand-navy">{newUsersThisMonth}</p></div>
      </div>

      <ChartCard title="User Growth" subtitle="Signups across the last 90 days">
        <AdminAreaChart
          data={growthData}
          xKey="label"
          series={[{ key: 'count', name: 'New Users', color: '#0F766E' }]}
          valueFormatter={(v) => `${v.toLocaleString()}`}
        />
      </ChartCard>

      <div className="rounded-2xl border border-slate-100 bg-white p-3">
        <div className="grid gap-3 md:grid-cols-4">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users" className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2" />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-3">
          <label className="inline-flex items-center gap-2 px-1 text-xs font-semibold text-slate-600">
            <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} /> Select all filtered users
          </label>

          {selectedIds.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                {selectedIds.length} selected
              </span>
              <button
                disabled={bulkLoading}
                onClick={() => runBulkAction({ status: 'active' })}
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-100 disabled:opacity-50"
              >
                Bulk Activate
              </button>
              <button
                disabled={bulkLoading}
                onClick={() => runBulkAction({ status: 'suspended' })}
                className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-100 disabled:opacity-50"
              >
                Bulk Suspend
              </button>
              <button
                disabled={bulkLoading}
                onClick={() => runBulkAction({ role: 'admin' })}
                className="rounded-xl bg-brand-navy px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-navy/95 disabled:opacity-50"
              >
                Make Admin
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Select one or more users to apply bulk actions.</p>
          )}
        </div>

        <DataTable
          rows={filteredUsers}
          columns={columns}
          rowKey={(user) => user.id}
          emptyMessage="No users found."
        />
      </div>
    </div>
  );
}
