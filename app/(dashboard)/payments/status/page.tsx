'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, CheckCircle2, Clock3, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess, notifyWarning } from '@/lib/toast';

type PaymentState = 'idle' | 'loading' | 'success' | 'failed' | 'pending';

export default function PaymentStatusPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference')?.trim() ?? '';
  const trxref = searchParams.get('trxref')?.trim() ?? '';
  const effectiveReference = reference || trxref;
  const { showToast } = useToast();

  const [state, setState] = useState<PaymentState>('idle');
  const [message, setMessage] = useState('Checking your contribution status...');

  useEffect(() => {
    if (!effectiveReference) {
      setState('failed');
      setMessage('No payment reference was found in the callback.');
      return;
    }

    const run = async () => {
      setState('loading');
      setMessage('Verifying your contribution with Paystack...');

      try {
        const response = await fetch(`/api/payments/verify?reference=${encodeURIComponent(effectiveReference)}`, {
          cache: 'no-store',
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || 'Unable to verify this payment.');
        }

        const paymentStatus = String(payload.data?.status ?? '').toLowerCase();

        if (paymentStatus === 'success') {
          setState('success');
          setMessage('Your contribution has been verified successfully.');
          notifySuccess(showToast, 'Contribution verified successfully.');
          return;
        }

        if (paymentStatus === 'pending' || paymentStatus === 'processing') {
          setState('pending');
          setMessage('Your payment is still being processed. Please check back shortly.');
          notifyWarning(showToast, 'Payment is still being processed.');
          return;
        }

        setState('failed');
        setMessage('This payment was not completed successfully.');
        notifyWarning(showToast, 'Payment did not complete successfully.');
      } catch (err) {
        setState('failed');
        const nextMessage = err instanceof Error ? err.message : 'Unable to verify this payment.';
        setMessage(nextMessage);
        notifyError(showToast, err, 'Could not verify payment status.');
      }
    };

    void run();
  }, [effectiveReference, showToast]);

  const statusIcon = state === 'success'
    ? <CheckCircle2 className="text-emerald-600" size={24} />
    : state === 'pending' || state === 'loading'
      ? <Clock3 className="text-amber-600" size={24} />
      : <AlertTriangle className="text-rose-600" size={24} />;

  const statusTone = state === 'success'
    ? 'border-emerald-200 bg-emerald-50'
    : state === 'pending' || state === 'loading'
      ? 'border-amber-200 bg-amber-50'
      : 'border-rose-200 bg-rose-50';

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-xs font-bold text-brand-gray hover:text-brand-navy"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <section className={`rounded-3xl border p-6 sm:p-8 ${statusTone}`}>
        <div className="flex items-start gap-4">
          <div className="mt-0.5 rounded-2xl bg-white p-3 shadow-sm">
            {state === 'loading' ? <Loader2 className="animate-spin text-amber-600" size={24} /> : statusIcon}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-gray">Payment status</p>
            <h1 className="mt-2 text-2xl font-bold text-brand-navy">
              {state === 'success' ? 'Contribution confirmed' : state === 'pending' || state === 'loading' ? 'Contribution in review' : 'Contribution needs attention'}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-700">{message}</p>
            {effectiveReference && (
              <p className="mt-3 text-xs font-medium text-brand-gray">
                Reference: <span className="font-mono text-brand-navy">{effectiveReference}</span>
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-brand-navy">What you can do next</h2>
        <div className="mt-4 space-y-3 text-sm text-brand-gray">
          <p>If your contribution was successful, return to your groups or dashboard to confirm the updated status.</p>
          <p>If it is still pending, wait a little and refresh this page or reopen it from your dashboard flow.</p>
          <p>If it failed, try again from the group page or contact support if the charge looks inconsistent.</p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/groups" className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-bold text-white hover:bg-brand-primary-hover">
            Back to Groups
          </Link>
          <Link href="/support" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-brand-navy hover:bg-slate-50">
            Contact Support
          </Link>
        </div>
      </section>
    </div>
  );
}
