'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Calendar, Loader2 } from 'lucide-react';
import { useData } from '@/lib/hooks/useData';

type Deposit = {
  id: string;
  amount: number;
  paid_at: string;
  reference: string;
  status: string;
};

type SchemeDetail = {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  minimum_amount: number;
  status: string;
  created_at: string;
  deposits: Deposit[];
};

function freqLabel(frequency: string) {
  if (frequency === 'daily') return 'Daily';
  if (frequency === 'weekly') return 'Weekly';
  return 'Monthly';
}

export default function SchemeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, loading, error } = useData<SchemeDetail>(
    `scheme:${id}`,
    async () => {
      const res = await fetch(`/api/savings/schemes/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not load scheme.');
      return json.data as SchemeDetail;
    },
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-brand-gray">
        <Loader2 size={16} className="animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-16 text-center text-sm text-brand-gray">
        Not found. <Link href="/savings" className="text-brand-primary font-semibold">Go back</Link>
      </div>
    );
  }

  const total = data.deposits.reduce((sum, d) => sum + Number(d.amount ?? 0), 0);
  const fmt = (v: number) => `NGN ${Number(v).toLocaleString('en-NG')}`;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Link href={`/savings/frequency/${data.frequency}`} className="inline-flex items-center gap-1.5 text-xs text-brand-gray hover:text-brand-navy">
        <ArrowLeft size={13} /> Back
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-emerald-600" />
          <h1 className="text-base font-bold text-brand-navy">{data.name}</h1>
        </div>
        <p className="text-xs text-brand-gray">{freqLabel(data.frequency)} General Savings</p>
        <div className="flex gap-4 text-xs">
          <span className="text-brand-gray">Minimum: <strong className="text-brand-navy">{fmt(data.minimum_amount)}</strong></span>
          <span className="text-brand-gray">Total Saved: <strong className="text-brand-navy">{fmt(total)}</strong></span>
          <span className="text-brand-gray capitalize">Status: <strong className="text-brand-navy">{data.status}</strong></span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-slate-50 text-brand-gray">
              <th className="px-3 py-2 text-left font-semibold">Date</th>
              <th className="px-3 py-2 text-right font-semibold">Amount</th>
              <th className="px-3 py-2 text-left font-semibold">Reference</th>
              <th className="px-3 py-2 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.deposits.length === 0 && (
              <tr><td colSpan={4} className="px-3 py-4 text-center text-brand-gray">No deposits yet.</td></tr>
            )}
            {data.deposits.map((d) => (
              <tr key={d.id} className="border-t border-slate-100">
                <td className="px-3 py-2.5 text-brand-navy">{new Date(d.paid_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                <td className="px-3 py-2.5 text-right font-semibold text-brand-navy">{fmt(d.amount)}</td>
                <td className="px-3 py-2.5 text-brand-gray">{d.reference}</td>
                <td className="px-3 py-2.5 capitalize text-brand-gray">{d.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

