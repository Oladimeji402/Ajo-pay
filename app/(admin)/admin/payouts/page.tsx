'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronRight, Copy, ExternalLink, Loader2, Upload, X, Calendar, CreditCard } from 'lucide-react';
import { DateRangeSelector, DateRangeValue } from '@/components/admin/DateRangeSelector';
import { LastSynced } from '@/components/admin/LastSynced';
import { ChartCard } from '@/components/admin/charts/ChartCard';
import { AdminBarChart } from '@/components/admin/charts/BarChart';
import { useRealtimeSubscription } from '@/lib/hooks/useRealtimeSubscription';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';
import { formatScheduleDate, getDefaultPayoutDate, getDueWindow, getEffectivePayoutDate } from '@/lib/ajo-schedule';

const PAYOUTS_REALTIME_TABLES = ['payouts', 'profiles'];

const ALLOWED_PROOF_TYPES = new Set(['image/jpeg', 'image/png', 'application/pdf']);
const MAX_PROOF_SIZE = 5 * 1024 * 1024; // 5 MB

type PayoutRow = {
  id: string;
  status: string;
  amount: number;
  cycle_number: number;
  bank_account: string;
  bank_name: string;
  scheduled_for?: string | null;
  proof_url?: string | null;
  proof_note?: string | null;
  proof_uploaded_at?: string | null;
  approved_at?: string | null;
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

function statusBadgeClass(status: string) {
  if (status === 'done') return 'bg-emerald-100 text-emerald-700';
  if (status === 'processing') return 'bg-blue-100 text-blue-700';
  if (status === 'failed') return 'bg-red-100 text-red-700';
  return 'bg-amber-100 text-amber-700';
}

function AdminPayoutsSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-44 rounded bg-slate-200" />
          <div className="h-3 w-28 rounded bg-slate-200" />
        </div>
        <div className="h-9 w-40 rounded-xl bg-slate-200" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, idx) => (
          <div key={idx} className="rounded-2xl border border-slate-100 bg-white p-4 h-20" />
        ))}
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white p-4 h-56" />
      <div className="rounded-2xl border border-slate-100 bg-white p-3 h-16" />
      <div className="rounded-2xl border border-slate-100 bg-white p-3 h-80" />
    </div>
  );
}

// ── Savings Schedule ──────────────────────────────────────────────────────────

type ScheduleRow = {
  scheme_id: string;
  scheme_name: string;
  frequency: string;
  minimum_amount: number;
  status: string;
  next_payout: string;
  total_saved: number;
  total_paid_out: number;
  amount_owed: number;
  profile: {
    id: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    bank_account?: string | null;
    bank_name?: string | null;
    bank_account_name?: string | null;
  } | null;
};

function SavingsScheduleTab() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [freqFilter, setFreqFilter] = useState('all');
  const [selected, setSelected] = useState<ScheduleRow | null>(null);
  const [recording, setRecording] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ amount: '', periodLabel: '', notes: '' });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetch('/api/admin/savings-schedule', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok) setRows(Array.isArray(json.data) ? json.data : []);
      setLoading(false);
    };
    void load();
  }, []);

  const filtered = useMemo(() => {
    if (freqFilter === 'all') return rows;
    return rows.filter(r => r.frequency === freqFilter);
  }, [rows, freqFilter]);

  const handleRecord = async () => {
    if (!selected) return;
    const amount = Number(payoutForm.amount);
    if (!amount || amount <= 0) { notifyError(showToast, new Error('Invalid amount'), 'Enter a valid amount.'); return; }
    if (!payoutForm.periodLabel.trim()) { notifyError(showToast, new Error('Period required'), 'Enter a period label.'); return; }
    setRecording(true);
    try {
      const res = await fetch('/api/admin/passbook-payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemeId: selected.scheme_id,
          userId: selected.profile?.id,
          amount,
          periodLabel: payoutForm.periodLabel.trim(),
          notes: payoutForm.notes.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to record payout.');
      notifySuccess(showToast, 'Payout recorded.');
      setRows(prev => prev.map(r => r.scheme_id === selected.scheme_id
        ? { ...r, total_paid_out: r.total_paid_out + amount, amount_owed: Math.max(0, r.amount_owed - amount) }
        : r));
      setSelected(null);
      setPayoutForm({ amount: '', periodLabel: '', notes: '' });
    } catch (err) {
      notifyError(showToast, err, 'Could not record payout.');
    } finally {
      setRecording(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center gap-2 py-16 text-sm text-brand-gray"><Loader2 size={16} className="animate-spin" /> Loading schedule...</div>;

  const totalOwed = filtered.reduce((s, r) => s + r.amount_owed, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-brand-gray">Total Owed (filtered)</p>
          <p className="text-xl font-bold text-rose-700">{toCurrency(totalOwed)}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-brand-gray">Active Schemes</p>
          <p className="text-xl font-bold text-brand-navy">{filtered.filter(r => r.status === 'active').length}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-brand-gray">Total Saved (filtered)</p>
          <p className="text-xl font-bold text-emerald-700">{toCurrency(filtered.reduce((s, r) => s + r.total_saved, 0))}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-3">
        <select value={freqFilter} onChange={e => setFreqFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
          <option value="all">All Frequencies</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
        <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 border-b border-slate-100 bg-slate-50/80 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <span>User / Scheme</span>
          <span>Frequency</span>
          <span>Total Saved</span>
          <span>Amount Owed</span>
          <span>Next Payout</span>
        </div>

        {filtered.length === 0 && <p className="p-8 text-center text-sm text-slate-400">No savings schemes found.</p>}

        {filtered.map((row, idx) => (
          <div
            key={row.scheme_id}
            onClick={() => { setSelected(row); setPayoutForm({ amount: String(row.amount_owed), periodLabel: '', notes: '' }); }}
            className={`grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-4 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors${idx < filtered.length - 1 ? ' border-b border-slate-100' : ''}`}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-brand-navy">{row.profile?.name || row.profile?.email || 'User'}</p>
              <p className="text-xs text-slate-400 truncate">{row.scheme_name}</p>
            </div>
            <span className="hidden sm:block shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold capitalize text-slate-600">{row.frequency}</span>
            <p className="hidden sm:block shrink-0 text-sm font-semibold text-brand-navy">{toCurrency(row.total_saved)}</p>
            <p className={`hidden sm:block shrink-0 text-sm font-bold ${row.amount_owed > 0 ? 'text-rose-700' : 'text-slate-400'}`}>{toCurrency(row.amount_owed)}</p>
            <p className="hidden sm:block shrink-0 text-xs text-brand-gray">{row.next_payout}</p>
          </div>
        ))}
      </div>

      {/* Record payout drawer */}
      {selected && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px]" onClick={() => setSelected(null)} />
          <div className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <p className="font-bold text-brand-navy">Record Payout</p>
                <p className="text-xs text-slate-400">{selected.profile?.name || selected.profile?.email} · {selected.scheme_name}</p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-400">Total Saved</p>
                  <p className="text-lg font-bold text-brand-navy">{toCurrency(selected.total_saved)}</p>
                </div>
                <div className="rounded-xl bg-rose-50 p-3">
                  <p className="text-[11px] text-rose-500">Amount Owed</p>
                  <p className="text-lg font-bold text-rose-700">{toCurrency(selected.amount_owed)}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Bank Details</p>
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 space-y-0.5">
                  <p className="text-xs text-brand-gray">{selected.profile?.bank_name || '—'}</p>
                  <p className="text-sm font-bold text-brand-navy font-mono">{selected.profile?.bank_account || '—'}</p>
                  <p className="text-xs text-brand-gray">{selected.profile?.bank_account_name || selected.profile?.name || '—'}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Payout Details</p>
                <div>
                  <label className="text-xs font-semibold text-brand-navy mb-1 block">Amount (NGN)</label>
                  <input
                    type="number"
                    min={1}
                    value={payoutForm.amount}
                    onChange={e => setPayoutForm(f => ({ ...f, amount: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-brand-navy mb-1 block">Period Label (e.g. March 2026)</label>
                  <input
                    type="text"
                    value={payoutForm.periodLabel}
                    onChange={e => setPayoutForm(f => ({ ...f, periodLabel: e.target.value }))}
                    placeholder="March 2026"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-brand-navy mb-1 block">Notes (optional)</label>
                  <textarea
                    value={payoutForm.notes}
                    onChange={e => setPayoutForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm resize-none"
                  />
                </div>
              </div>
            </div>
            <div className="border-t border-slate-100 p-5">
              <button
                disabled={recording}
                onClick={handleRecord}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {recording ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
                {recording ? 'Recording...' : 'Record Payout'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminPayoutsPage() {
  const [activeTab, setActiveTab] = useState<'payouts' | 'schedule'>('payouts');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [range, setRange] = useState<DateRangeValue>('30');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [payoutDateDrafts, setPayoutDateDrafts] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [proofFiles, setProofFiles] = useState<Record<string, { file: File | null; note: string; uploading: boolean }>>({});
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null); const [viewingProofId, setViewingProofId] = useState<string | null>(null); const { showToast } = useToast();
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
    setProofFiles(
      Object.fromEntries(
        nextPayouts.map((payout) => [
          payout.id,
          { file: null, note: payout.proof_note ?? '', uploading: false },
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

  const updatePayoutStatus = useCallback(async (payoutId: string, nextStatus: 'processing' | 'done') => {
    setSavingId(payoutId);
    setError('');

    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId, status: nextStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update payout status.');
      notifySuccess(showToast, nextStatus === 'processing' ? 'Payout approved.' : 'Payout marked as done.');
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

  const uploadProofFile = useCallback(async (payoutId: string) => {
    const state = proofFiles[payoutId] ?? { file: null, note: '', uploading: false };
    if (!state.file) return;

    setProofFiles((prev) => ({ ...prev, [payoutId]: { ...state, uploading: true } }));
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', state.file);
      formData.append('payoutId', payoutId);
      formData.append('proofNote', state.note);

      const res = await fetch('/api/admin/payouts/upload', { method: 'POST', body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to upload proof.');
      notifySuccess(showToast, 'Proof uploaded successfully.');
      setProofFiles((prev) => ({ ...prev, [payoutId]: { file: null, note: '', uploading: false } }));
      await loadPayouts();
    } catch (err) {
      notifyError(showToast, err, 'Unable to upload proof.');
      setProofFiles((prev) => ({ ...prev, [payoutId]: { ...state, uploading: false } }));
    }
  }, [loadPayouts, proofFiles, showToast]);

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

  const viewProof = useCallback(async (payoutId: string) => {
    setViewingProofId(payoutId);
    try {
      const res = await fetch(`/api/admin/payouts/proof-url?payoutId=${encodeURIComponent(payoutId)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not generate proof URL.');
      window.open(json.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      notifyError(showToast, err, 'Unable to open proof document.');
    } finally {
      setViewingProofId(null);
    }
  }, [showToast]);

  const copyToClipboard = useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      notifySuccess(showToast, 'Copied to clipboard.', { duration: 2200 });
    } catch (err) {
      notifyError(showToast, err, 'Could not copy to clipboard in this browser session.');
    }
  }, [showToast]);

  const selectableRows = filtered.filter((payout) => payout.status === 'processing' && Boolean(payout.proof_url));
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

  if (loading) return <AdminPayoutsSkeleton />;

  const expandedPayout = expandedId ? filtered.find((p) => p.id === expandedId) ?? null : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Payouts</h1>
          <LastSynced timestamp={lastSyncedAt} loading={loading || savingId !== ''} />
        </div>
        {activeTab === 'payouts' && (
          <button
            disabled={savingId === 'batch' || selectedIds.length === 0}
            onClick={runBatchMarkDone}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            <CheckCircle2 size={14} />
            {selectedIds.length > 0 ? `Mark ${selectedIds.length} Done` : 'Mark Selected Done'}
          </button>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1 max-w-xs">
        <button
          onClick={() => setActiveTab('payouts')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${activeTab === 'payouts' ? 'bg-white shadow-sm text-brand-navy' : 'text-brand-gray hover:text-brand-navy'}`}
        >
          Payouts
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'schedule' ? 'bg-white shadow-sm text-brand-navy' : 'text-brand-gray hover:text-brand-navy'}`}
        >
          <Calendar size={11} /> Savings Schedule
        </button>
      </div>

      {activeTab === 'schedule' && <SavingsScheduleTab />}
      {activeTab === 'payouts' && (<>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-brand-gray">Total Paid Out</p>
          <p className="text-xl font-bold text-brand-navy">{toCurrency(totalPaidOut)}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-brand-gray">Pending Amount</p>
          <p className="text-xl font-bold text-amber-700">{toCurrency(pendingAmount)}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-brand-gray">Processing</p>
          <p className="text-xl font-bold text-blue-700">{processingCount}</p>
        </div>
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

      <label className="inline-flex cursor-pointer items-center gap-2 px-1 text-xs font-semibold text-slate-600 select-none">
        <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
        Select all approved payouts with proof
      </label>

      <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
        <div className="hidden sm:grid sm:grid-cols-[1.5rem_1fr_auto_auto_1.5rem] items-center gap-4 border-b border-slate-100 bg-slate-50/80 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <span />
          <span>Recipient</span>
          <span>Amount</span>
          <span>Due Date</span>
          <span />
        </div>

        {filtered.length === 0 && (
          <p className="p-8 text-center text-sm text-slate-400">No payouts found.</p>
        )}

        {filtered.map((payout, idx) => {
          const canSelect = payout.status === 'processing' && Boolean(payout.proof_url);
          const isSelected = selectedIds.includes(payout.id);
          const payoutDate = getEffectivePayoutDate({
            scheduledFor: payout.scheduled_for ?? null,
            startDate: payout.groups?.start_date ?? null,
            frequency: payout.groups?.frequency ?? '',
            cycleNumber: payout.cycle_number,
          });
          const dueWindow = getDueWindow(payoutDate);

          return (
            <div
              key={payout.id}
              className={`grid grid-cols-[1.5rem_1fr_auto] sm:grid-cols-[1.5rem_1fr_auto_auto_1.5rem] items-center gap-4 px-4 py-3.5 transition-colors hover:bg-slate-50 cursor-pointer${idx < filtered.length - 1 ? ' border-b border-slate-100' : ''
                }${isSelected ? ' bg-blue-50/40' : ''}`}
              onClick={() => setExpandedId(payout.id)}
            >
              <input
                type="checkbox"
                disabled={!canSelect}
                checked={isSelected}
                onClick={(e) => e.stopPropagation()}
                onChange={() => toggleSelect(payout.id)}
                className="shrink-0"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-brand-navy">
                  {payout.profiles?.name || payout.profiles?.email || 'Recipient'}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {payout.groups?.name || 'Group'}  Cycle {payout.cycle_number}
                </p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${statusBadgeClass(payout.status)}`}>
                    {payout.status}
                  </span>
                  {payout.proof_url
                    ? <span className="text-[10px] font-semibold text-teal-600">Proof uploaded</span>
                    : payout.status !== 'done' && <span className="text-[10px] text-slate-400">No proof</span>}
                </div>
              </div>
              <p className="hidden sm:block shrink-0 text-sm font-bold text-brand-navy">
                {toCurrency(Number(payout.amount ?? 0))}
              </p>
              <div className="hidden sm:block shrink-0 text-right">
                <p className="text-xs font-semibold text-brand-navy">{formatScheduleDate(payoutDate)}</p>
                <p className={`text-[11px] ${dueWindow.phase === 'overdue' ? 'text-red-500 font-semibold'
                  : dueWindow.phase === 'due' ? 'text-amber-500 font-semibold'
                    : 'text-slate-400'
                  }`}>
                  {dueWindow.phase === 'overdue'
                    ? `${dueWindow.daysOverdue}d overdue`
                    : dueWindow.phase === 'due' ? 'Due today'
                      : dueWindow.phase === 'scheduled' ? `In ${dueWindow.daysUntilDue}d`
                        : ''}
                </p>
              </div>
              <ChevronRight size={15} className="hidden sm:block shrink-0 text-slate-300" />
            </div>
          );
        })}
      </div>
      </>)}
      {activeTab === 'payouts' && expandedPayout && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px]"
            onClick={() => setExpandedId(null)}
          />
          <div className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-lg flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <p className="truncate font-bold text-brand-navy">
                  {expandedPayout.profiles?.name || expandedPayout.profiles?.email || 'Recipient'}
                </p>
                <p className="text-xs text-slate-400">{expandedPayout.groups?.name}  Cycle {expandedPayout.cycle_number}</p>
              </div>
              <div className="ml-3 flex shrink-0 items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusBadgeClass(expandedPayout.status)}`}>
                  {expandedPayout.status}
                </span>
                <button type="button" onClick={() => setExpandedId(null)} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-400">Amount</p>
                  <p className="text-xl font-bold text-brand-navy">{toCurrency(Number(expandedPayout.amount ?? 0))}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-400">Created</p>
                  <p className="text-sm font-semibold text-brand-navy">
                    {new Date(expandedPayout.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                {expandedPayout.approved_at && (
                  <div className="col-span-2 rounded-xl bg-emerald-50 p-3">
                    <p className="text-[11px] text-emerald-600">Approved</p>
                    <p className="text-sm font-semibold text-emerald-700">{new Date(expandedPayout.approved_at).toLocaleString('en-NG')}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Bank Details</p>
                <div className="space-y-2">
                  {([
                    { label: 'Bank Name', value: expandedPayout.bank_name || expandedPayout.profiles?.bank_name || '', mono: false },
                    { label: 'Account Number', value: expandedPayout.bank_account || expandedPayout.profiles?.bank_account || '', mono: true },
                  ] as const).map(({ label, value, mono }) => (
                    <div key={label} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                      <div>
                        <p className="text-[11px] text-slate-400">{label}</p>
                        <p className={`text-sm font-semibold ${value ? 'text-brand-navy' : 'text-slate-400 font-normal'} ${mono && value ? 'font-mono' : ''}`}>
                          {value ? (mono ? `\u2022\u2022\u2022\u2022\u2022\u2022${value.slice(-4)}` : value) : 'Not set'}
                        </p>
                      </div>
                      {value && (
                        <button type="button" onClick={() => void copyToClipboard(value)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-brand-navy transition-colors">
                          <Copy size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {(() => {
                const payoutDate = getEffectivePayoutDate({
                  scheduledFor: expandedPayout.scheduled_for ?? null,
                  startDate: expandedPayout.groups?.start_date ?? null,
                  frequency: expandedPayout.groups?.frequency ?? '',
                  cycleNumber: expandedPayout.cycle_number,
                });
                const defaultPayoutDate = getDefaultPayoutDate(expandedPayout.groups?.start_date ?? null, expandedPayout.groups?.frequency ?? '', expandedPayout.cycle_number);
                const dueWindow = getDueWindow(payoutDate);
                const draftValue = payoutDateDrafts[expandedPayout.id] ?? defaultPayoutDate ?? '';
                const isSavingDate = savingId === `date:${expandedPayout.id}`;
                return (
                  <div>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Payout Schedule</p>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-3">
                      <div>
                        <p className="text-sm font-bold text-brand-navy">{formatScheduleDate(payoutDate)}</p>
                        <p className={`text-xs mt-0.5 ${dueWindow.phase === 'overdue' ? 'text-red-600 font-semibold' : dueWindow.phase === 'due' ? 'text-amber-600 font-semibold' : 'text-slate-500'}`}>
                          {dueWindow.phase === 'overdue' ? `${dueWindow.daysOverdue} day${dueWindow.daysOverdue === 1 ? '' : 's'} overdue`
                            : dueWindow.phase === 'due' ? 'Due today'
                              : dueWindow.phase === 'scheduled' ? `In ${dueWindow.daysUntilDue} day${dueWindow.daysUntilDue === 1 ? '' : 's'}`
                                : 'No schedule set'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {expandedPayout.scheduled_for ? 'Admin-set date' : `Default: ${formatScheduleDate(defaultPayoutDate)}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={draftValue}
                          onChange={(e) => setPayoutDateDrafts((prev) => ({ ...prev, [expandedPayout.id]: e.target.value }))}
                          className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-brand-navy"
                        />
                        <button
                          type="button"
                          disabled={isSavingDate || !draftValue}
                          onClick={() => void savePayoutDate(expandedPayout.id)}
                          className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                        >
                          {isSavingDate ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Transfer Proof</p>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                  {expandedPayout.proof_url ? (
                    <div className="rounded-lg border border-teal-100 bg-teal-50/60 p-3">
                      <p className="mb-1 text-[11px] font-semibold text-teal-600">Current proof</p>
                      <button
                        type="button"
                        onClick={() => viewProof(expandedPayout.id)}
                        disabled={viewingProofId === expandedPayout.id}
                        className="flex items-center gap-1.5 text-sm font-semibold text-teal-700 underline underline-offset-2 disabled:opacity-60"
                      >
                        {viewingProofId === expandedPayout.id
                          ? <Loader2 size={13} className="animate-spin" />
                          : <ExternalLink size={13} />}
                        View proof document
                      </button>
                      {expandedPayout.proof_uploaded_at && (
                        <p className="mt-1 text-[11px] text-slate-400">Uploaded {new Date(expandedPayout.proof_uploaded_at).toLocaleString('en-NG')}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No proof uploaded yet.</p>
                  )}
                  <p className="text-xs font-semibold text-slate-600">{expandedPayout.proof_url ? 'Replace proof' : 'Upload proof'}</p>
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 bg-white px-4 py-5 text-slate-400 transition-colors hover:border-slate-300 hover:bg-slate-50/50">
                    <Upload size={20} className={proofFiles[expandedPayout.id]?.file ? 'text-teal-600' : ''} />
                    <span className="text-xs text-center leading-relaxed">
                      {proofFiles[expandedPayout.id]?.file
                        ? proofFiles[expandedPayout.id]!.file!.name
                        : 'Click to select  JPEG, PNG or PDF  max 5 MB'}
                    </span>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        if (!file) return;
                        if (!ALLOWED_PROOF_TYPES.has(file.type)) {
                          notifyError(showToast, new Error('Invalid type'), 'Only JPEG, PNG and PDF are allowed.');
                          e.target.value = '';
                          return;
                        }
                        if (file.size > MAX_PROOF_SIZE) {
                          notifyError(showToast, new Error('Too large'), 'File must be under 5 MB.');
                          e.target.value = '';
                          return;
                        }
                        setProofFiles((prev) => ({ ...prev, [expandedPayout.id]: { ...(prev[expandedPayout.id] ?? { note: '', uploading: false }), file } }));
                      }}
                    />
                  </label>
                  <input
                    value={proofFiles[expandedPayout.id]?.note ?? ''}
                    onChange={(e) => setProofFiles((prev) => ({ ...prev, [expandedPayout.id]: { ...(prev[expandedPayout.id] ?? { file: null, uploading: false }), note: e.target.value } }))}
                    placeholder="Optional transfer note"
                    maxLength={500}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-brand-navy placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    disabled={!proofFiles[expandedPayout.id]?.file || proofFiles[expandedPayout.id]?.uploading}
                    onClick={() => void uploadProofFile(expandedPayout.id)}
                    className="w-full rounded-xl bg-teal-600 py-2.5 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-50"
                  >
                    {proofFiles[expandedPayout.id]?.uploading ? 'Uploading...' : 'Upload Proof'}
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 p-5">
              {expandedPayout.status === 'done' ? (
                <div className="flex items-center justify-center gap-2 py-1 font-bold text-emerald-700">
                  <CheckCircle2 size={18} /> Paid Out
                </div>
              ) : expandedPayout.status === 'pending' || expandedPayout.status === 'failed' ? (
                <button
                  disabled={savingId === expandedPayout.id}
                  onClick={() => void updatePayoutStatus(expandedPayout.id, 'processing')}
                  className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {savingId === expandedPayout.id ? 'Saving...' : 'Approve Payout'}
                </button>
              ) : (
                <>
                  <button
                    disabled={savingId === expandedPayout.id || !expandedPayout.proof_url}
                    onClick={() => void updatePayoutStatus(expandedPayout.id, 'done')}
                    className="w-full rounded-xl bg-brand-navy py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {savingId === expandedPayout.id ? 'Saving...' : 'Mark as Done'}
                  </button>
                  {!expandedPayout.proof_url && (
                    <p className="mt-2 text-center text-xs text-slate-400">Upload proof before marking done</p>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

