'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Copy, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';
import { buildReferralSignupUrl } from '@/lib/referrals/referral-code';

type MarketerMe = {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'rejected' | 'inactive';
  referral_code: string;
  rejection_reason?: string | null;
  open_tasks?: number;
};

export default function MarketerOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [marketer, setMarketer] = useState<MarketerMe | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/marketer/me', { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load.');
        setMarketer(json.data);
      } catch (err) {
        notifyError(showToast, err, 'Unable to load overview.');
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [showToast]);

  if (loading) {
    return <div className="py-16 text-center text-brand-gray"><Loader2 className="animate-spin mx-auto" /></div>;
  }

  if (!marketer) return null;

  const link = typeof window !== 'undefined'
    ? buildReferralSignupUrl(window.location.origin, marketer.referral_code)
    : '';

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      notifySuccess(showToast, `${label} copied.`);
    } catch {
      notifyError(showToast, null, `Could not copy ${label.toLowerCase()}.`);
    }
  };

  if (marketer.status === 'pending') {
    return (
      <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-6 space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Application under review</p>
        <h1 className="text-2xl font-bold text-brand-navy">Thank you for applying, {marketer.name.split(' ')[0]}.</h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Your application is under review. You will get access to assigned tasks once an administrator approves your account.
        </p>
        <div className="rounded-xl border border-amber-200 bg-white p-4">
          <p className="text-xs text-brand-gray">Your referral code (reserved)</p>
          <p className="font-mono font-bold text-brand-navy mt-1">{marketer.referral_code}</p>
          <p className="text-xs text-brand-gray mt-1">This code activates for user signups after approval.</p>
        </div>
      </div>
    );
  }

  if (marketer.status === 'rejected') {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50/70 p-6 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-red-700">Application not approved</p>
        <h1 className="text-2xl font-bold text-brand-navy">We could not approve your application at this time.</h1>
        {marketer.rejection_reason && (
          <p className="text-sm text-slate-600"><span className="font-semibold">Reason:</span> {marketer.rejection_reason}</p>
        )}
        <p className="text-sm text-slate-500">If you believe this is an error, please contact support.</p>
      </div>
    );
  }

  if (marketer.status === 'inactive') {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-2">
        <h1 className="text-xl font-bold text-brand-navy">Account inactive</h1>
        <p className="text-sm text-brand-gray">Your marketer account has been deactivated. Contact an administrator for assistance.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-accent">Marketer portal</p>
        <h1 className="mt-1 text-2xl font-bold text-brand-navy">Welcome back, {marketer.name.split(' ')[0]}.</h1>
        <p className="text-sm text-brand-gray mt-1">Your account is approved. Share your code and complete assigned tasks.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
          <p className="text-xs text-brand-gray">Referral code</p>
          <div className="flex items-center gap-2">
            <code className="font-mono font-bold text-brand-navy">{marketer.referral_code}</code>
            <button
              type="button"
              onClick={() => void copy(marketer.referral_code, 'Referral code')}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold"
            >
              <Copy size={12} /> Copy
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <code className="text-[11px] truncate max-w-full text-brand-gray">{link}</code>
            <button
              type="button"
              onClick={() => void copy(link, 'Referral link')}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold"
            >
              <Copy size={12} /> Copy link
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-brand-gray">Open tasks</p>
          <p className="text-3xl font-bold text-brand-navy mt-1">{marketer.open_tasks ?? 0}</p>
          <Link href="/marketer/tasks" className="text-xs font-semibold text-brand-navy underline mt-2 inline-block">
            View tasks
          </Link>
        </div>
      </div>
    </div>
  );
}
