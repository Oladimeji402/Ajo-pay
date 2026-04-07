'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { LastSynced } from '@/components/admin/LastSynced';
import { DateRangeSelector, DateRangeValue } from '@/components/admin/DateRangeSelector';
import { DataTable, DataTableColumn } from '@/components/admin/DataTable';
import { ChartCard } from '@/components/admin/charts/ChartCard';
import { AdminAreaChart } from '@/components/admin/charts/AreaChart';
import { useRealtimeSubscription } from '@/lib/hooks/useRealtimeSubscription';

const TRANSACTIONS_REALTIME_TABLES = ['payment_records'];

type TxRow = {
  id: string;
  type: string;
  status: string;
  amount: number;
  reference: string;
  provider_reference?: string | null;
  created_at: string;
  groups?: { id: string; name: string } | null;
  profiles?: { id: string; name: string; email: string } | null;
};

type SortKey = 'amount' | 'created_at' | 'status';

function toCurrency(value: number) {
  return `NGN ${Number(value).toLocaleString('en-NG')}`;
}

function normalizeStatus(status: string | null | undefined) {
  return String(status ?? '').toLowerCase();
}

function AdminTransactionsSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-52 rounded bg-slate-200" />
          <div className="h-3 w-28 rounded bg-slate-200" />
        </div>
        <div className="h-9 w-28 rounded-xl bg-slate-200" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, idx) => (
          <div key={idx} className="rounded-2xl border border-slate-100 bg-white p-4 h-20" />
        ))}
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white p-4 h-56" />
      <div className="rounded-2xl border border-slate-100 bg-white p-3 h-16" />
      <div className="rounded-2xl border border-slate-100 bg-white p-3 h-72" />
    </div>
  );
}

export default function AdminTransactionsPage() {
  const [loading, setLoading] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [highlightedTxId, setHighlightedTxId] = useState('');
  const { refreshTrigger, lastEvent } = useRealtimeSubscription({
    channelName: 'admin-transactions-live',
    tables: TRANSACTIONS_REALTIME_TABLES,
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [range, setRange] = useState<DateRangeValue>('30');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const pageSize = 12;

  useEffect(() => {
    if (lastEvent?.timestamp) {
      setLastSyncedAt(lastEvent.timestamp);
    }
  }, [lastEvent]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/admin/transactions?page=1&pageSize=500', { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load transactions.');
        const nextRows = Array.isArray(json.data) ? json.data : [];

        setTransactions((previousRows) => {
          if (refreshTrigger > 0 && nextRows.length > 0 && nextRows[0]?.id !== previousRows[0]?.id) {
            const nextId = String(nextRows[0].id);
            setHighlightedTxId(nextId);
            setTimeout(() => setHighlightedTxId(''), 2200);
          }

          return nextRows;
        });
        setLastSyncedAt(new Date().toISOString());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load transactions.');
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [refreshTrigger]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const days = Number(range);

    return transactions.filter((tx) => {
      if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;

      if (range !== 'all' && Number.isFinite(days)) {
        const diff = now - new Date(tx.created_at).getTime();
        const max = days * 24 * 60 * 60 * 1000;
        if (diff > max) return false;
      }

      if (!search.trim()) return true;
      const haystack = [
        tx.reference,
        tx.provider_reference ?? '',
        tx.profiles?.name ?? '',
        tx.profiles?.email ?? '',
        tx.groups?.name ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [transactions, statusFilter, typeFilter, range, search]);

  const sorted = useMemo(() => {
    const clone = [...filtered];
    clone.sort((a, b) => {
      let compare = 0;
      if (sortKey === 'amount') compare = Number(a.amount) - Number(b.amount);
      if (sortKey === 'created_at') compare = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortKey === 'status') compare = (a.status ?? '').localeCompare(b.status ?? '');
      return sortDir === 'asc' ? compare : -compare;
    });
    return clone;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPageRows = useMemo(() => sorted.slice((page - 1) * pageSize, page * pageSize), [sorted, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const successfulTransactions = filtered.filter((tx) => {
    const status = normalizeStatus(tx.status);
    return status === 'success' || status === 'successful';
  });
  const pendingTransactions = filtered.filter((tx) => normalizeStatus(tx.status) === 'pending');

  const successfulVolume = successfulTransactions.reduce((sum, tx) => sum + Number(tx.amount ?? 0), 0);
  const pendingVolume = pendingTransactions.reduce((sum, tx) => sum + Number(tx.amount ?? 0), 0);
  const successCount = successfulTransactions.length;
  const successRate = filtered.length > 0 ? (successCount / filtered.length) * 100 : 0;

  const trendMap = new Map<string, { label: string; amount: number }>();
  for (const tx of filtered) {
    const key = tx.created_at.slice(0, 10);
    const found = trendMap.get(key);
    if (found) {
      found.amount += Number(tx.amount ?? 0);
    } else {
      trendMap.set(key, { label: key.slice(5), amount: Number(tx.amount ?? 0) });
    }
  }
  const trendData = Array.from(trendMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, value]) => value);

  const toggleSort = useCallback((next: SortKey) => {
    if (sortKey === next) {
      setSortDir((value) => (value === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(next);
    setSortDir('desc');
  }, [sortKey]);

  const exportCsv = () => {
    const header = ['Date', 'User', 'Group', 'Type', 'Status', 'Amount', 'Reference', 'Provider Reference'];
    const rows = sorted.map((tx) => [
      new Date(tx.created_at).toISOString(),
      tx.profiles?.name || tx.profiles?.email || 'User',
      tx.groups?.name || 'Group',
      tx.type,
      tx.status,
      String(tx.amount ?? 0),
      tx.reference,
      tx.provider_reference ?? '',
    ]);

    const csv = [header, ...rows]
      .map((line) => line.map((item) => `"${String(item).replaceAll('"', '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const columns: Array<DataTableColumn<TxRow>> = useMemo(
    () => [
      {
        key: 'userGroup',
        header: 'User / Group',
        render: (tx) => (
          <>
            <p className="font-semibold text-brand-navy">{tx.profiles?.name || tx.profiles?.email || 'User'}</p>
            <p className="text-xs text-slate-500">{tx.groups?.name || 'Group'} . {tx.type}</p>
          </>
        ),
      },
      {
        key: 'reference',
        header: 'Reference',
        render: (tx) => <span className="text-xs text-slate-500">{tx.reference} . {tx.provider_reference || '-'}</span>,
      },
      {
        key: 'amount',
        header: (
          <button type="button" onClick={() => toggleSort('amount')} className="font-semibold text-brand-navy">
            Amount
          </button>
        ),
        render: (tx) => <span className="font-bold text-brand-navy">{toCurrency(Number(tx.amount ?? 0))}</span>,
      },
      {
        key: 'status',
        header: (
          <button type="button" onClick={() => toggleSort('status')} className="font-semibold text-brand-navy">
            Status
          </button>
        ),
        render: (tx) => <span className="capitalize">{tx.status}</span>,
      },
      {
        key: 'date',
        header: (
          <button type="button" onClick={() => toggleSort('created_at')} className="font-semibold text-brand-navy">
            Date
          </button>
        ),
        render: (tx) => <span className="text-xs text-slate-600">{new Date(tx.created_at).toLocaleString()}</span>,
      },
    ],
    [toggleSort],
  );

  if (loading) return <AdminTransactionsSkeleton />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Admin Transactions</h1>
          <LastSynced timestamp={lastSyncedAt} loading={loading} />
        </div>
        <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-brand-navy hover:bg-slate-50">
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-xs text-brand-gray">Successful Volume</p><p className="text-xl font-bold text-emerald-700">{toCurrency(successfulVolume)}</p></div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-xs text-brand-gray">Pending Volume</p><p className="text-xl font-bold text-amber-700">{toCurrency(pendingVolume)}</p></div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-xs text-brand-gray">Transaction Count</p><p className="text-xl font-bold text-brand-navy">{filtered.length.toLocaleString()}</p></div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-xs text-brand-gray">Success Rate</p><p className="text-xl font-bold text-brand-navy">{successRate.toFixed(1)}%</p></div>
      </div>

      <ChartCard title="Transaction Volume Trend" subtitle="Volume for selected filters">
        <AdminAreaChart
          data={trendData}
          xKey="label"
          series={[{ key: 'amount', name: 'Amount', color: '#1B2F6B' }]}
          valueFormatter={toCurrency}
        />
      </ChartCard>

      <div className="rounded-2xl border border-slate-100 bg-white p-3">
        <div className="grid gap-3 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by user, group or reference" className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm" />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="abandoned">Abandoned</option>
            <option value="failed">Failed</option>
          </select>
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="all">All Types</option>
            <option value="contribution">Contribution</option>
            <option value="payout">Payout</option>
          </select>
          <DateRangeSelector
            value={range}
            onChange={(next) => {
              setRange(next);
              setPage(1);
            }}
            className="justify-self-start md:justify-self-stretch"
          />
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <DataTable
        rows={currentPageRows}
        columns={columns}
        rowKey={(tx) => tx.id}
        rowClassName={(tx) => (tx.id === highlightedTxId ? 'bg-emerald-50 transition-colors' : '')}
        emptyMessage="No transactions found for current filters."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((n) => (
            <button key={n} onClick={() => setPage(n)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${n === page ? 'bg-brand-navy text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
