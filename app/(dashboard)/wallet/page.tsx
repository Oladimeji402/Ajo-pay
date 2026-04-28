'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Copy, Loader2, RefreshCw, Wallet } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';

const WALLET_CACHE_KEY = 'ajopay_wallet_account_cache_v1';

type WalletCache = {
  accountNumber: string | null;
  bankName: string | null;
  accountName: string | null;
  lastCheckedAt: string | null;
};

export default function WalletPage() {
  const [checking, setChecking] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [accountNumber, setAccountNumber] = useState<string | null>(null);
  const [bankName, setBankName] = useState<string | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [creditedNow, setCreditedNow] = useState(0);
  const { showToast } = useToast();

  const writeCache = (next: Partial<WalletCache>) => {
    try {
      const currentRaw = sessionStorage.getItem(WALLET_CACHE_KEY);
      const current: WalletCache = currentRaw
        ? JSON.parse(currentRaw) as WalletCache
        : { accountNumber: null, bankName: null, accountName: null, lastCheckedAt: null };
      const merged: WalletCache = {
        accountNumber: next.accountNumber ?? current.accountNumber,
        bankName: next.bankName ?? current.bankName,
        accountName: next.accountName ?? current.accountName,
        lastCheckedAt: next.lastCheckedAt ?? current.lastCheckedAt,
      };
      sessionStorage.setItem(WALLET_CACHE_KEY, JSON.stringify(merged));
    } catch {
      // Ignore cache failures; network-backed flow still works.
    }
  };

  const copyValue = async (value: string | null, label: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      notifySuccess(showToast, `${label} copied.`);
    } catch (error) {
      notifyError(showToast, error, `Could not copy ${label.toLowerCase()}.`);
    }
  };

  const provisionVirtualAccount = async () => {
    setProvisioning(true);
    try {
      const response = await fetch('/api/user/provision-virtual-account', { method: 'POST' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Could not provision virtual account.');

      const nextAccountNumber = payload.data.accountNumber ?? null;
      const nextBankName = payload.data.bankName ?? null;
      const nextAccountName = payload.data.accountName ?? null;
      setAccountNumber(nextAccountNumber);
      setBankName(nextBankName);
      setAccountName(nextAccountName);
      writeCache({
        accountNumber: nextAccountNumber,
        bankName: nextBankName,
        accountName: nextAccountName,
      });
      return true;
    } catch (error) {
      notifyError(showToast, error, 'Could not create your permanent account details.');
      return false;
    } finally {
      setProvisioning(false);
    }
  };

  const checkDeposits = async (silent = false) => {
    if (!silent) setChecking(true);
    try {
      const response = await fetch('/api/wallet/check-deposits', { method: 'POST' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Could not check for new deposits.');

      const data = payload.data ?? {};
      const nextAccountNumber = data.accountNumber ?? null;
      const nextBankName = data.bankName ?? null;
      const nextAccountName = data.accountName ?? null;
      const nextLastCheckedAt = data.lastCheckedAt ?? null;
      setAccountNumber(nextAccountNumber);
      setBankName(nextBankName);
      setAccountName(nextAccountName);
      setLastCheckedAt(nextLastCheckedAt);
      setCreditedNow(Number(data.credited ?? 0));
      writeCache({
        accountNumber: nextAccountNumber,
        bankName: nextBankName,
        accountName: nextAccountName,
        lastCheckedAt: nextLastCheckedAt,
      });

      if (!silent && Number(data.credited ?? 0) > 0) {
        notifySuccess(showToast, `Wallet credited with NGN ${Number(data.credited).toLocaleString('en-NG')}.`);
      }
      return Boolean(nextAccountNumber && nextBankName && nextAccountName);
    } catch (error) {
      if (!silent) {
        notifyError(showToast, error, 'Could not check for new deposits.');
      }
      return false;
    } finally {
      if (!silent) setChecking(false);
    }
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const cachedRaw = sessionStorage.getItem(WALLET_CACHE_KEY);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw) as WalletCache;
          if (cached.accountNumber && cached.bankName && cached.accountName) {
            setAccountNumber(cached.accountNumber);
            setBankName(cached.bankName);
            setAccountName(cached.accountName);
            setLastCheckedAt(cached.lastCheckedAt ?? null);
          }
        }
      } catch {
        // Ignore cache parse failures.
      }

      const hasAccountFromCheck = await checkDeposits(true);
      if (!active) return;
      if (!hasAccountFromCheck) {
        const provisioned = await provisionVirtualAccount();
        if (!active || !provisioned) return;
        await checkDeposits(true);
      }
    })();

    return () => {
      active = false;
    };
  // Intentionally one-time mount behavior.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualRefresh = async () => {
    if (!accountNumber) {
      const provisioned = await provisionVirtualAccount();
      if (!provisioned) {
        return;
      }
    }

    setChecking(true);
    try {
      await checkDeposits();
    } finally {
      setChecking(false);
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return 'Not checked yet';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return 'Not checked yet';
    return date.toLocaleString('en-NG');
  };

  const accountReady = Boolean(accountNumber && bankName && accountName);

  if (provisioning && !accountReady) {
    return (
      <div className="max-w-lg mx-auto space-y-5">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-brand-gray hover:text-brand-navy">
          <ArrowLeft size={14} /> Back
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-brand-gray inline-flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" />
          Setting up your permanent account details...
        </div>
      </div>
    );
  }

  const statusText = creditedNow > 0
    ? `Wallet credited with NGN ${creditedNow.toLocaleString('en-NG')} on last check.`
    : 'No new deposits found on your last check.';

  const statusIcon = creditedNow > 0 ? <CheckCircle2 size={15} className="text-emerald-600" /> : null;

  if (!accountReady) {
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
            We could not load your permanent account details yet.
          </p>
        </div>

        <button
          onClick={provisionVirtualAccount}
          disabled={provisioning}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-bold text-white hover:bg-brand-primary-hover disabled:opacity-60 transition-colors"
        >
          {provisioning ? <><Loader2 size={15} className="animate-spin" /> Creating account...</> : 'Try again'}
        </button>
      </div>
    );
  }

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
          Transfer to your permanent account details below. You can fund anytime, even outside AjoPay.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-wide text-brand-gray">Bank</p>
          <div className="text-sm font-semibold text-brand-navy">{bankName}</div>
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-wide text-brand-gray">Account Number</p>
          <div className="flex items-center justify-between gap-2">
            <div className="text-lg font-bold tracking-wide text-brand-navy">{accountNumber}</div>
            <button
              onClick={() => copyValue(accountNumber, 'Account number')}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-brand-navy hover:bg-slate-50"
            >
              <Copy size={14} />
              Copy
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-wide text-brand-gray">Account Name</p>
          <div className="text-sm font-semibold text-brand-navy">{accountName}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
        <div className="inline-flex items-center gap-2 text-xs text-slate-600">
          {statusIcon}
          {statusText}
        </div>
        <p className="text-[11px] text-slate-500">Last checked: {formatDate(lastCheckedAt)}</p>
        <button
          onClick={handleManualRefresh}
          disabled={checking}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-bold text-white hover:bg-brand-primary-hover disabled:opacity-60 transition-colors"
        >
          {checking ? <><Loader2 size={15} className="animate-spin" /> Checking...</> : <><RefreshCw size={15} /> Check for new deposit</>}
        </button>
      </div>
    </div>
  );
}
