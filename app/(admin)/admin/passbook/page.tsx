'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { DataTable, DataTableColumn } from '@/components/admin/DataTable';
import { LastSynced } from '@/components/admin/LastSynced';
import { ChartCard } from '@/components/admin/charts/ChartCard';
import { AdminAreaChart } from '@/components/admin/charts/AreaChart';
import { useRealtimeSubscription } from '@/lib/hooks/useRealtimeSubscription';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';
import { useRefreshOnFocus } from '@/lib/hooks/useRefreshOnFocus';
import { BookOpen, CheckCircle2, XCircle, Mail, MessageSquare, Calendar } from 'lucide-react';

const PASSBOOK_REALTIME_TABLES = ['profiles'];

type PassbookUserRow = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  passbook_activated: boolean;
  passbook_activated_at?: string | null;
  wallet_balance: number;
  created_at: string;
};

type ActivationTrend = {
  date: string;
  activated: number;
  notActivated: number;
};

function initials(value: string) {
  const parts = value.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || 'U';
}

function AdminPassbookSkeleton() {
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
          <div key={idx} className="rounded-xl border border-slate-100 bg-white p-4 h-20" />
        ))}
      </div>
      <div className="rounded-xl border border-slate-100 bg-white p-4 h-48" />
      <div className="rounded-xl border border-slate-100 bg-white p-3 h-16" />
      <div className="rounded-xl border border-slate-100 bg-white p-3 h-72" />
    </div>
  );
}

export default function AdminPassbookPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'activated' | 'not_activated'>('all');
  const [users, setUsers] = useState<PassbookUserRow[]>([]);
  const [activationTrends, setActivationTrends] = useState<ActivationTrend[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const { showToast } = useToast();
  const { refreshTrigger, lastEvent } = useRealtimeSubscription({
    channelName: 'admin-passbook-live',
    tables: PASSBOOK_REALTIME_TABLES,
  });

  useEffect(() => {
    if (lastEvent?.timestamp) {
      setLastSyncedAt(lastEvent.timestamp);
    }
  }, [lastEvent]);

  const loadAll = useCallback(async () => {
    const [usersRes, trendsRes] = await Promise.all([
      fetch('/api/admin/passbook?page=1&pageSize=500', { cache: 'no-store' }),
      fetch('/api/admin/passbook/trends?days=90', { cache: 'no-store' }),
    ]);

    const [usersJson, trendsJson] = await Promise.all([usersRes.json(), trendsRes.json()]);

    if (!usersRes.ok) throw new Error(usersJson.error || 'Failed to load passbook data.');
    if (!trendsRes.ok) throw new Error(trendsJson.error || 'Failed to load activation trends.');

    setUsers(Array.isArray(usersJson.data) ? usersJson.data : []);
    setActivationTrends(Array.isArray(trendsJson.data) ? trendsJson.data : []);
    setLastSyncedAt(new Date().toISOString());
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        await loadAll();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load passbook data.');
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [refreshTrigger, loadAll]);

  useRefreshOnFocus(() => {
    void loadAll();
  });

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (statusFilter === 'activated' && !user.passbook_activated) return false;
      if (statusFilter === 'not_activated' && user.passbook_activated) return false;
      if (!search.trim()) return true;

      const haystack = [user.name, user.email, user.phone ?? ''].join(' ').toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [users, statusFilter, search]);

  const totalUsers = filteredUsers.length;
  const activatedUsers = filteredUsers.filter((u) => u.passbook_activated).length;
  const notActivatedUsers = filteredUsers.filter((u) => !u.passbook_activated).length;
  const activationRate = totalUsers > 0 ? ((activatedUsers / totalUsers) * 100).toFixed(1) : '0.0';

  const chartData = activationTrends.map((point) => ({
    label: point.date.slice(5),
    activated: point.activated,
    notActivated: point.notActivated,
  }));

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

  const sendCommunication = async (type: 'email' | 'in_app') => {
    if (selectedIds.length === 0) {
      notifyError(showToast, new Error('No users selected'), 'Please select users to send communication');
      return;
    }

    // Get selected users
    const selectedUsers = users.filter(u => selectedIds.includes(u.id));
    const notActivatedSelected = selectedUsers.filter(u => !u.passbook_activated);

    if (notActivatedSelected.length === 0) {
      notifyError(showToast, new Error('Invalid selection'), 'Selected users have already activated their passbook');
      return;
    }

    // Redirect to communications page with pre-filled data
    const params = new URLSearchParams({
      campaign_name: 'Passbook Activation Reminder',
      channel: type,
      user_ids: notActivatedSelected.map(u => u.id).join(','),
      prefill: 'true',
    });

    window.location.href = `/admin/communications?${params.toString()}`;
  };

  const columns: Array<DataTableColumn<PassbookUserRow>> = useMemo(
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
                <p className="truncate text-xs text-slate-500">{user.email}</p>
                {user.phone && <p className="truncate text-xs text-slate-500">{user.phone}</p>}
              </div>
            </div>
          );
        },
      },
      {
        key: 'status',
        header: 'Passbook Status',
        render: (user) => (
          <div className="flex flex-col gap-1">
            <span
              className={`inline-flex items-center gap-1.5 w-fit rounded-lg px-2 py-1 text-xs font-semibold ${
                user.passbook_activated
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {user.passbook_activated ? (
                <>
                  <CheckCircle2 size={12} />
                  Activated
                </>
              ) : (
                <>
                  <XCircle size={12} />
                  Not Activated
                </>
              )}
            </span>
            {user.passbook_activated && user.passbook_activated_at && (
              <span className="text-[10px] text-slate-500">
                {new Date(user.passbook_activated_at).toLocaleDateString('en-NG', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'wallet',
        header: 'Wallet Balance',
        render: (user) => (
          <div className="text-xs">
            <span className="rounded-lg bg-blue-50 px-2 py-1 font-semibold text-blue-700">
              NGN {Number(user.wallet_balance || 0).toLocaleString('en-NG')}
            </span>
          </div>
        ),
      },
      {
        key: 'joined',
        header: 'Joined',
        render: (user) => (
          <div className="text-xs text-slate-600">
            <p className="flex items-center gap-1">
              <Calendar size={12} />
              {new Date(user.created_at).toLocaleDateString('en-NG', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
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
            View
          </Link>
        ),
      },
    ],
    [selectedIds],
  );

  if (loading) {
    return <AdminPassbookSkeleton />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy flex items-center gap-2">
            <BookOpen size={24} />
            Passbook Management
          </h1>
          <p className="text-sm text-brand-gray mt-1">
            Track passbook activation status and engage users
          </p>
        </div>
      </div>

      <LastSynced timestamp={lastSyncedAt} loading={loading} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-brand-gray">Total Users</p>
          <p className="mt-1 text-xl font-bold text-brand-navy">{totalUsers}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-brand-gray">Activated</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">{activatedUsers}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-brand-gray">Not Activated</p>
          <p className="mt-1 text-xl font-bold text-amber-700">{notActivatedUsers}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-brand-gray">Activation Rate</p>
          <p className="mt-1 text-xl font-bold text-brand-navy">{activationRate}%</p>
        </div>
      </div>

      <ChartCard
        title="Passbook Activation Trends"
        subtitle="Activation status across the last 90 days"
      >
        <AdminAreaChart
          data={chartData}
          xKey="label"
          series={[
            { key: 'activated', name: 'Activated', color: '#10b981' },
            { key: 'notActivated', name: 'Not Activated', color: '#f59e0b' },
          ]}
          valueFormatter={(v) => `${v.toLocaleString()}`}
        />
      </ChartCard>

      <div className="rounded-xl border border-slate-100 bg-white p-3">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'activated' | 'not_activated')}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="activated">Activated</option>
            <option value="not_activated">Not Activated</option>
          </select>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3">
          <label className="inline-flex items-center gap-2 px-1 text-xs font-semibold text-slate-600">
            <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} /> Select all
            filtered users
          </label>

          {selectedIds.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                {selectedIds.length} selected
              </span>
              <button
                onClick={() => sendCommunication('email')}
                className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-100 inline-flex items-center gap-1.5"
              >
                <Mail size={14} />
                Send Email
              </button>
              <button
                onClick={() => sendCommunication('in_app')}
                className="rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-purple-100 inline-flex items-center gap-1.5"
              >
                <MessageSquare size={14} />
                Send In-App
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Select users to send activation reminders.
            </p>
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
