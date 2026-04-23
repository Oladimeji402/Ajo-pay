'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Wallet } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';

export default function WalletPage() {
  const [amount, setAmount] = useState('5000');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleFundWallet = async () => {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed < 100) {
      notifyError(showToast, new Error('Invalid amount'), 'Enter at least NGN 100.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/wallet/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(parsed) }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Could not start wallet funding.');

      notifySuccess(showToast, 'Redirecting to Paystack...');
      window.location.href = payload.data.authorizationUrl;
    } catch (error) {
      notifyError(showToast, error, 'Could not fund wallet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-brand-gray hover:text-brand-navy">
        <ArrowLeft size={14} /> Back
      </Link>

      <div>
        <h1 className="text-xl font-bold text-brand-navy flex items-center gap-2">
          <Wallet size={20} className="text-brand-primary" />
          Fund Wallet
        </h1>
        <p className="text-xs text-brand-gray mt-0.5">
          Add money to wallet, then split it to savings goals. Wallet funds cannot be withdrawn.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <label className="block text-sm font-semibold text-brand-navy">Amount (NGN)</label>
        <input
          type="number"
          min={100}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
        />
        <button
          onClick={handleFundWallet}
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-bold text-white hover:bg-brand-primary-hover disabled:opacity-60 transition-colors"
        >
          {loading ? <><Loader2 size={15} className="animate-spin" /> Processing...</> : 'Continue to Paystack'}
        </button>
      </div>
    </div>
  );
}
