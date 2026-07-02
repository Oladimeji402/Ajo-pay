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
          <div key={idx} className="rounded-xl border border-slate-100 bg-white p-4 h-20" />
        ))}
      </div>
      <div className="rounded-xl border border-slate-100 bg-white p-4 h-56" />
      <div className="rounded-xl border border-slate-100 bg-white p-3 h-16" />
      <div className="rounded-xl border border-slate-100 bg-white p-3 h-80" />
    </div>
  );
}

// ── Payment History ───────────────────────────────────────────────────────────

type PaymentHistoryRow = {
  id: string;
  type: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    bank_account?: string | null;
    bank_name?: string | null;
  };
  group_or_scheme: string;
  amount: number;
  reference: string;
  period?: string | null;
  paid_at: string;
  notes?: string | null;
};

function PaymentHistoryTab() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentHistoryRow[]>([]);
  const [summary, setSummary] = useState({ totalPaidOut: 0, totalPayments: 0, uniqueUsers: 0, savingsPayouts: 0, groupPayouts: 0 });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/payment-history', { cache: 'no-store' });
        const json = await res.json();
        if (res.ok) {
          setPayments(json.data.payments || []);
          setSummary(json.data.summary || {});
        }
      } catch (err) {
        console.error('Failed to load payment history:', err);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return payments;
    const term = searchTerm.toLowerCase();
    return payments.filter(p =>
      p.user.name.toLowerCase().includes(term) ||
      p.user.email.toLowerCase().includes(term) ||
      p.group_or_scheme.toLowerCase().includes(term) ||
      p.reference.toLowerCase().includes(term)
    );
  }, [payments, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-brand-gray">
        <Loader2 size={16} className="animate-spin" /> Loading payment history...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-brand-gray">Total Paid Out</p>
          <p className="text-xl font-bold text-emerald-700">{toCurrency(summary.totalPaidOut)}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-brand-gray">Total Payments</p>
          <p className="text-xl font-bold text-brand-navy">{summary.totalPayments}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-brand-gray">Users Paid</p>
          <p className="text-xl font-bold text-blue-700">{summary.uniqueUsers}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-brand-gray">Savings vs Group</p>
          <p className="text-sm font-bold text-slate-600">{summary.savingsPayouts} / {summary.groupPayouts}</p>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-xl border border-slate-100 bg-white p-3">
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search by user name, email, or reference..."
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      {/* Payment List */}
      <div className="rounded-xl border border-slate-100 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">User</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Plan / Group</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Period</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">Amount</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Bank Details</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Reference</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    {searchTerm ? 'No payments match your search' : 'No payment history found'}
                  </td>
                </tr>
              )}
              {filtered.map((payment) => (
                <tr key={payment.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <p className="text-xs text-slate-600">{new Date(payment.paid_at).toLocaleDateString()}</p>
                    <p className="text-[10px] text-slate-400">{new Date(payment.paid_at).toLocaleTimeString()}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-brand-navy">{payment.user.name}</p>
                    <p className="text-xs text-slate-500">{payment.user.email}</p>
                    {payment.user.phone && <p className="text-xs text-slate-400">{payment.user.phone}</p>}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-700">{payment.group_or_scheme}</p>
                    <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${payment.type === 'savings_withdrawal' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {payment.type === 'savings_withdrawal' ? 'Savings' : 'Group'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-slate-600">{payment.period || '—'}</p>
                    {payment.notes && <p className="text-xs text-slate-400 mt-0.5">{payment.notes}</p>}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <p className="font-bold text-emerald-700">{toCurrency(payment.amount)}</p>
                  </td>
                  <td className="py-3 px-4">
                    {payment.user.bank_account ? (
                      <>
                        <p className="text-xs font-semibold text-slate-600">{payment.user.bank_name || 'Bank'}</p>
                        <p className="text-xs font-mono text-slate-500">{payment.user.bank_account}</p>
                      </>
                    ) : (
                      <p className="text-xs text-slate-400">No bank details</p>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-xs font-mono text-slate-500">{payment.reference}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Note */}
      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
        <p className="font-semibold mb-1">✅ Payment History</p>
        <p className="text-emerald-800">
          This shows all completed payouts to users. Each entry represents money that has been sent to a user's bank account.
          You can search by user name, email, plan name, or reference number.
        </p>
      </div>
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
  const [showDueOnly, setShowDueOnly] = useState(true);
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
    return rows.filter((r) => {
      if (freqFilter !== 'all' && r.frequency !== freqFilter) return false;
      if (showDueOnly && r.amount_owed <= 0) return false;
      return true;
    });
  }, [rows, freqFilter, showDueOnly]);

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
        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-brand-gray">Total Owed (filtered)</p>
          <p className="text-xl font-bold text-rose-700">{toCurrency(totalOwed)}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-brand-gray">Active Schemes</p>
          <p className="text-xl font-bold text-brand-navy">{filtered.filter(r => r.status === 'active').length}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-brand-gray">Total Saved (filtered)</p>
          <p className="text-xl font-bold text-emerald-700">{toCurrency(filtered.reduce((s, r) => s + r.total_saved, 0))}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-3">
        <div className="flex flex-wrap items-center gap-3">
          <select value={freqFilter} onChange={e => setFreqFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="all">All Frequencies</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={showDueOnly}
              onChange={(e) => setShowDueOnly(e.target.checked)}
            />
            Show only users with amount owed
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white overflow-hidden">
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
  const [activeTab, setActiveTab] = useState<'schedule' | 'history'>('schedule');
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
      <LastSynced timestamp={lastSyncedAt} loading={loading || savingId !== ''} />

      {/* Tab switcher */}
      <div className="flex gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'schedule' ? 'bg-white text-brand-navy' : 'text-slate-400 hover:text-brand-navy'}`}
        >
          <Calendar size={11} /> Pending Withdrawals
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'history' ? 'bg-white text-brand-navy' : 'text-slate-400 hover:text-brand-navy'}`}
        >
          <CheckCircle2 size={11} /> Payment History
        </button>
      </div>

      {activeTab === 'schedule' && <SavingsScheduleTab />}
      {activeTab === 'history' && <PaymentHistoryTab />}
    </div>
  );
}
