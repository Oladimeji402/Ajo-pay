'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Copy, Loader2 } from 'lucide-react';
import { DataTable, DataTableColumn } from '@/components/admin/DataTable';
import { DateRangeSelector, DateRangeValue } from '@/components/admin/DateRangeSelector';
import { LastSynced } from '@/components/admin/LastSynced';
import { ChartCard } from '@/components/admin/charts/ChartCard';
import { AdminBarChart } from '@/components/admin/charts/BarChart';
import { useRealtimeSubscription } from '@/lib/hooks/useRealtimeSubscription';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';
import { formatScheduleDate, getDefaultPayoutDate, getDueWindow, getEffectivePayoutDate } from '@/lib/ajo-schedule';

const PAYOUTS_REALTIME_TABLES = ['payouts', 'profiles'];

type PayoutRow = {
  id: string;
  status: string;
  amount: number;
  cycle_number: number;
  bank_account: string;
  bank_name: string;
  scheduled_for?: string | null;
  created_at: string;
  groups?: {
    id: string;
    name: string;
    start_date?: string | null;
    frequency?: string;
    current_cycle?: number;
  } | null;
  profiles?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    bank_account?: string | null;
    bank_name?: string | null;
  } | null;
};

function toCurrency(value: number) {
  return `NGN ${Number(value).toLocaleString('en-NG')}`;
}

export default function AdminPayoutsPage() {
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [range, setRange] = useState<DateRangeValue>('30');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [payoutDateDrafts, setPayoutDateDrafts] = useState<Record<string, string>>({});
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const { showToast } = useToast();
  const { refreshTrigger, lastEvent } = useRealtimeSubscription({
    channelName: 'admin-payouts-live',
    tables: PAYOUTS_REALTIME_TABLES,
  });

  useEffect(() => {
    if (lastEvent?.timestamp) {
      setLastSyncedAt(lastEvent.timestamp);
    }
  }, [lastEvent]);

  const loadPayouts = useCallback(async () => {
    const res = await fetch('/api/admin/payouts', { cache: 'no-store' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load payouts.');
    const nextPayouts = Array.isArray(json.data) ? json.data as PayoutRow[] : [];
    setPayouts(nextPayouts);
    setPayoutDateDrafts(
      Object.fromEntries(
        nextPayouts.map((payout) => [
          payout.id,
          payout.scheduled_for ?? getDefaultPayoutDate(payout.groups?.start_date ?? null, payout.groups?.frequency ?? '', payout.cycle_number) ?? '',
        ]),
      ),
    );
    setLastSyncedAt(new Date().toISOString());
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        await loadPayouts();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load payouts.');
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [loadPayouts, refreshTrigger]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const days = Number(range);

    return payouts.filter((payout) => {
      if (statusFilter !== 'all' && payout.status !== statusFilter) return false;
      if (range !== 'all' && Number.isFinite(days)) {
        const diff = now - new Date(payout.created_at).getTime();
        if (diff > days * 24 * 60 * 60 * 1000) return false;
      }
      return true;
    });
  }, [payouts, statusFilter, range]);

  const totalPaidOut = filtered
    .filter((payout) => payout.status === 'done')
    .reduce((sum, payout) => sum + Number(payout.amount ?? 0), 0);

  const pendingAmount = filtered
    .filter((payout) => payout.status === 'pending')
    .reduce((sum, payout) => sum + Number(payout.amount ?? 0), 0);

  const processingCount = filtered.filter((payout) => payout.status === 'processing').length;

  const timelineMap = new Map<string, { label: string; value: number }>();
  for (const payout of filtered) {
    const key = payout.created_at.slice(0, 10);
    const found = timelineMap.get(key);
    if (found) {
      found.value += Number(payout.amount ?? 0);
    } else {
      timelineMap.set(key, { label: key.slice(5), value: Number(payout.amount ?? 0) });
    }
  }

  const timelineData = Array.from(timelineMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, value]) => value);

  const markDone = useCallback(async (payoutId: string) => {
    setSavingId(payoutId);
    setError('');

    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId, status: 'done' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to mark payout as done.');
      notifySuccess(showToast, 'Payout marked as done.');
      await loadPayouts();
    } catch (err) {
      notifyError(showToast, err, 'Unable to update payout.');
    } finally {
      setSavingId('');
    }
  }, [loadPayouts, showToast]);

  const savePayoutDate = useCallback(async (payoutId: string) => {
    const scheduledFor = payoutDateDrafts[payoutId] ?? '';

    setSavingId(`date:${payoutId}`);
    setError('');

    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId, scheduledFor }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update payout date.');
      notifySuccess(showToast, 'Payout date updated.');
      await loadPayouts();
    } catch (err) {
      notifyError(showToast, err, 'Unable to update payout date.');
    } finally {
      setSavingId('');
    }
  }, [loadPayouts, payoutDateDrafts, showToast]);

  const runBatchMarkDone = async () => {
    if (selectedIds.length === 0) return;

    setSavingId('batch');
    setError('');

    try {
      const results = await Promise.allSettled(
        selectedIds.map(async (payoutId) => {
          const res = await fetch('/api/admin/payouts', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payoutId, status: 'done' }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || 'Failed to update a payout.');
        }),
      );

      const successCount = results.filter((result) => result.status === 'fulfilled').length;
      const failureCount = results.length - successCount;

      setSelectedIds([]);
      if (failureCount > 0) {
        notifyError(showToast, new Error(`${failureCount} payout updates failed.`), `${successCount} of ${results.length} payouts marked as done. ${failureCount} failed.`);
      } else {
        notifySuccess(showToast, 'Selected payouts marked as done.');
      }
      await loadPayouts();
    } catch (err) {
      notifyError(showToast, err, 'Unable to complete batch action.');
    } finally {
      setSavingId('');
    }
  };

  const copyToClipboard = useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      notifySuccess(showToast, 'Copied to clipboard.', { duration: 2200 });
    } catch (err) {
      notifyError(showToast, err, 'Could not copy to clipboard in this browser session.');
    }
  }, [showToast]);

  const selectableRows = filtered.filter((payout) => payout.status !== 'done');
  const allSelected = selectableRows.length > 0 && selectableRows.every((row) => selectedIds.includes(row.id));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !selectableRows.some((row) => row.id === id)));
      return;
    }

    const next = new Set(selectedIds);
    selectableRows.forEach((row) => next.add(row.id));
    setSelectedIds(Array.from(next));
  };

  const columns: Array<DataTableColumn<PayoutRow>> = useMemo(
    () => [
      {
        key: 'recipient',
        header: 'Recipient',
        render: (payout) => {
          const canSelect = payout.status !== 'done';
          const isSelected = selectedIds.includes(payout.id);

          return (
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <input
                  type="checkbox"
                  disabled={!canSelect}
                  checked={isSelected}
                  onChange={() => toggleSelect(payout.id)}
                />
                <p className="font-semibold text-brand-navy">
                  {payout.profiles?.name || payout.profiles?.email || 'Recipient'} . {payout.groups?.name || 'Group'}
                </p>
              </div>
              <p className="text-xs text-slate-500">
                Cycle {payout.cycle_number} . {new Date(payout.created_at).toLocaleString()}
              </p>
            </div>
          );
        },
      },
      {
        key: 'bank',
        header: 'Bank Details',
        render: (payout) => {
          const payoutBankName = payout.bank_name || payout.profiles?.bank_name || '';
          const payoutBankAccount = payout.bank_account || payout.profiles?.bank_account || '';

          return (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-xs">
                <p className="font-semibold text-slate-700">Bank Name</p>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <span className="truncate text-slate-600">{payoutBankName || 'Not set'}</span>
                  {payoutBankName ? (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(payoutBankName)}
                      className="text-slate-500 hover:text-slate-800"
                    >
                      <Copy size={12} />
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-xs">
                <p className="font-semibold text-slate-700">Account Number</p>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <span className="font-mono tracking-wide text-slate-600">{payoutBankAccount || 'Not set'}</span>
                  {payoutBankAccount ? (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(payoutBankAccount)}
                      className="text-slate-500 hover:text-slate-800"
                    >
                      <Copy size={12} />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        key: 'schedule',
        header: 'Scheduled',
        render: (payout) => {
          const payoutDate = getEffectivePayoutDate({
            scheduledFor: payout.scheduled_for ?? null,
            startDate: payout.groups?.start_date ?? null,
            frequency: payout.groups?.frequency ?? '',
            cycleNumber: payout.cycle_number,
          });
          const defaultPayoutDate = getDefaultPayoutDate(payout.groups?.start_date ?? null, payout.groups?.frequency ?? '', payout.cycle_number);
          const dueWindow = getDueWindow(payoutDate);
          const draftValue = payoutDateDrafts[payout.id] ?? defaultPayoutDate ?? '';
          const isSavingDate = savingId === `date:${payout.id}`;

          return (
            <div className="space-y-2 text-xs text-slate-600">
              <div>
                <p className="font-semibold text-brand-navy">{formatScheduleDate(payoutDate)}</p>
                <p className="mt-1">
                {dueWindow.phase === 'overdue'
                  ? `${dueWindow.daysOverdue} day${dueWindow.daysOverdue === 1 ? '' : 's'} past payout date`
                  : dueWindow.phase === 'due'
                    ? 'Payout date is today'
                    : dueWindow.phase === 'scheduled'
                      ? `In ${dueWindow.daysUntilDue} day${dueWindow.daysUntilDue === 1 ? '' : 's'}`
                      : 'Schedule missing'}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {payout.scheduled_for ? 'Admin-set payout date' : `Default payout date from cycle schedule: ${formatScheduleDate(defaultPayoutDate)}`}
                </p>
              </div>

              <div className="flex flex-wrap items-end gap-2">
                <input
                  type="date"
                  value={draftValue}
                  onChange={(event) => setPayoutDateDrafts((prev) => ({ ...prev, [payout.id]: event.target.value }))}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-brand-navy"
                />
                <button
                  type="button"
                  disabled={isSavingDate || !draftValue}
                  onClick={() => void savePayoutDate(payout.id)}
                  className="rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold text-slate-700 disabled:opacity-50"
                >
                  {isSavingDate ? 'Saving...' : 'Save date'}
                </button>
              </div>
            </div>
          );
        },
      },
      {
        key: 'amount',
        header: 'Amount',
        className: 'w-44',
        headerClassName: 'w-44',
        render: (payout) => <span className="font-bold text-brand-navy">{toCurrency(Number(payout.amount ?? 0))}</span>,
      },
      {
        key: 'status',
        header: 'Status',
        className: 'w-32',
        headerClassName: 'w-32',
        render: (payout) => <span className="capitalize text-slate-700">{payout.status}</span>,
      },
      {
        key: 'action',
        header: 'Action',
        className: 'w-40',
        headerClassName: 'w-40',
        render: (payout) => (
          <button
            disabled={savingId === payout.id || payout.status === 'done'}
            onClick={() => markDone(payout.id)}
            className="rounded-lg bg-brand-navy px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
          >
            {payout.status === 'done' ? 'Done' : savingId === payout.id ? 'Saving...' : 'Mark Done'}
          </button>
        ),
      },
    ],
    [copyToClipboard, markDone, payoutDateDrafts, savePayoutDate, selectedIds, savingId],
  );

  if (loading) return <div className="grid min-h-80 place-items-center"><Loader2 className="animate-spin" size={16} /></div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Admin Payouts</h1>
          <LastSynced timestamp={lastSyncedAt} loading={loading || savingId !== ''} />
        </div>
        <button disabled={savingId === 'batch' || selectedIds.length === 0} onClick={runBatchMarkDone} className="inline-flex items-center gap-2 rounded-xl bg-brand-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          <CheckCircle2 size={14} /> Mark Selected Done
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-xs text-brand-gray">Total Paid Out</p><p className="text-xl font-bold text-brand-navy">{toCurrency(totalPaidOut)}</p></div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-xs text-brand-gray">Pending Amount</p><p className="text-xl font-bold text-amber-700">{toCurrency(pendingAmount)}</p></div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-xs text-brand-gray">Processing Count</p><p className="text-xl font-bold text-brand-navy">{processingCount}</p></div>
      </div>

      <ChartCard title="Payout Timeline" subtitle="Payout amount by day for selected range">
        <AdminBarChart data={timelineData} xKey="label" barKey="value" color="#0F766E" valueFormatter={toCurrency} />
      </ChartCard>

      <div className="rounded-2xl border border-slate-100 bg-white p-3">
        <div className="grid gap-3 md:grid-cols-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="done">Done</option>
            <option value="failed">Failed</option>
          </select>
          <DateRangeSelector value={range} onChange={setRange} className="justify-self-start md:justify-self-stretch" />
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <div className="space-y-2">
        <label className="mb-2 inline-flex items-center gap-2 px-2 text-xs font-semibold text-slate-600">
          <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} /> Select all non-done payouts
        </label>

        <DataTable rows={filtered} columns={columns} rowKey={(payout) => payout.id} emptyMessage="No payouts found." />
      </div>
    </div>
  );
}
