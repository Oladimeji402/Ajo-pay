'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Copy, Loader2, RefreshCw, Wallet } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';

const WALLET_CACHE_KEY = 'AjoFlow_wallet_account_cache_v1';

type WalletCache = {
  accountNumber: string | null;
  bankName: string | null;
  accountName: string | null;
  lastCheckedAt: string | null;
};

export default function WalletPage() {
  const [checking, setChecking] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  // Prevents flashing "no account" UI while the initial server check is in flight
  const [initialLoading, setInitialLoading] = useState(true);
  const [accountNumber, setAccountNumber] = useState<string | null>(null);
  const [bankName, setBankName] = useState<string | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [creditedNow, setCreditedNow] = useState(0);
  const [showPhoneUpdate, setShowPhoneUpdate] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [updatingPhone, setUpdatingPhone] = useState(false);
  const [provisionError, setProvisionError] = useState<string | null>(null);
  const [missingVerification, setMissingVerification] = useState<{ nin: boolean; bvn: boolean } | null>(null);
  const { showToast } = useToast();

  // Use localStorage so account details persist across logout/login cycles
  const writeCache = (next: Partial<WalletCache>) => {
    try {
      const currentRaw = localStorage.getItem(WALLET_CACHE_KEY);
      const current: WalletCache = currentRaw
        ? JSON.parse(currentRaw) as WalletCache
        : { accountNumber: null, bankName: null, accountName: null, lastCheckedAt: null };
      const merged: WalletCache = {
        accountNumber: next.accountNumber ?? current.accountNumber,
        bankName: next.bankName ?? current.bankName,
        accountName: next.accountName ?? current.accountName,
        lastCheckedAt: next.lastCheckedAt ?? current.lastCheckedAt,
      };
      localStorage.setItem(WALLET_CACHE_KEY, JSON.stringify(merged));
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
    setProvisionError(null);
    setMissingVerification(null);
    try {
      const response = await fetch('/api/user/provision-virtual-account', { method: 'POST' });
      const payload = await response.json();
      if (!response.ok) {
        // Check if it's a duplicate phone number error
        if (payload.code === 'DUPLICATE_PHONE_NUMBER') {
          setProvisionError(payload.error);
          setShowPhoneUpdate(true);
          return false;
        }
        // Check if it's a rate limit error
        if (payload.code === 'RATE_LIMIT_EXCEEDED') {
          setProvisionError('Too many attempts. Please wait a moment before trying again.');
          return false;
        }
        // Check if it's a missing verification error
        if (payload.code === 'MISSING_VERIFICATION') {
          setMissingVerification(payload.missing || { nin: true, bvn: true });
          setProvisionError('Please provide your NIN or BVN to generate your virtual account.');
          return false;
        }
        throw new Error(payload.error ?? 'Could not provision virtual account.');
      }

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

  const updatePhone = async () => {
    if (!newPhone.trim()) {
      notifyError(showToast, new Error('Please enter a phone number.'), 'Phone number required');
      return;
    }

    setUpdatingPhone(true);
    try {
      const response = await fetch('/api/user/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: newPhone.trim() }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Could not update phone number.');

      notifySuccess(showToast, 'Phone number updated successfully.');
      setShowPhoneUpdate(false);
      setNewPhone('');
      setProvisionError(null);
      
      // Try provisioning again with new phone
      await provisionVirtualAccount();
    } catch (error) {
      notifyError(showToast, error, 'Could not update phone number.');
    } finally {
      setUpdatingPhone(false);
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

  // On mount: load cache first, then silently verify with the server.
  // Never auto-provision — the user must explicitly request account generation.
  useEffect(() => {
    let active = true;
    void (async () => {
      // 1. Hydrate from localStorage immediately so returning users see their account right away
      try {
        const cachedRaw = localStorage.getItem(WALLET_CACHE_KEY);
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

      // 2. Silently confirm with the server (no spinner, no auto-provision)
      await checkDeposits(true);
      if (active) setInitialLoading(false);
    })();

    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Define accountReady before using it in useEffect
  const accountReady = Boolean(accountNumber && bankName && accountName);

  // Auto-check for deposits periodically when account is ready
  useEffect(() => {
    if (!accountReady) return;

    // Check every 30 seconds while user is on the page
    const interval = setInterval(() => {
      void checkDeposits(true); // Silent check
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountReady]);

  const handleManualRefresh = async () => {
    await checkDeposits();
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return 'Not checked yet';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return 'Not checked yet';
    return date.toLocaleString('en-NG');
  };

  // Only show a loader during the first check when there's nothing cached to show yet
  if (initialLoading && !accountReady) {
    return (
      <div className="max-w-lg mx-auto space-y-5">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-brand-gray hover:text-brand-navy">
          <ArrowLeft size={14} /> Back
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-brand-gray inline-flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" />
          Loading your account details...
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
            Generate your permanent account number to start funding your wallet.
          </p>
        </div>

        {/* Show errors only after a provisioning attempt */}
        {provisionError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
            <p className="text-sm text-red-800 font-medium">{provisionError}</p>

            {missingVerification && (
              <div className="pt-2 border-t border-red-200">
                <p className="text-xs text-red-700 mb-2">Add either your NIN or BVN in settings to continue:</p>
                <ul className="text-xs text-red-700 list-disc list-inside space-y-1">
                  <li>NIN (National Identification Number)</li>
                  <li>BVN (Bank Verification Number)</li>
                </ul>
                <Link
                  href="/settings"
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-primary-hover transition-colors"
                >
                  Go to Settings to Add Details
                </Link>
              </div>
            )}

            {!missingVerification && !showPhoneUpdate && (
              <button
                onClick={provisionVirtualAccount}
                disabled={provisioning}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-bold text-white hover:bg-brand-primary-hover disabled:opacity-60 transition-colors"
              >
                {provisioning ? <><Loader2 size={15} className="animate-spin" /> Creating account...</> : 'Try again'}
              </button>
            )}
          </div>
        )}

        {/* Primary CTA — shown when no error and no phone update form */}
        {!provisionError && !showPhoneUpdate && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            <p className="text-sm text-slate-600">
              Your permanent account number lets you receive money directly into your AjoFlow wallet from any bank in Nigeria.
            </p>
            <button
              onClick={provisionVirtualAccount}
              disabled={provisioning}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-bold text-white hover:bg-brand-primary-hover disabled:opacity-60 transition-colors"
            >
              {provisioning ? <><Loader2 size={15} className="animate-spin" /> Setting up your account...</> : 'Generate Account Number'}
            </button>
          </div>
        )}

        {/* Phone update form — shown when provisioning fails due to duplicate phone */}
        {showPhoneUpdate && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-brand-navy mb-1">Update Phone Number</h3>
              <p className="text-xs text-brand-gray">
                Enter a different phone number to create your virtual account.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-xs font-semibold text-brand-navy">
                New Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="e.g., 08012345678"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={updatePhone}
                disabled={updatingPhone}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-bold text-white hover:bg-brand-primary-hover disabled:opacity-60 transition-colors"
              >
                {updatingPhone ? <><Loader2 size={15} className="animate-spin" /> Updating...</> : 'Update & Retry'}
              </button>
              <button
                onClick={() => {
                  setShowPhoneUpdate(false);
                  setProvisionError(null);
                }}
                disabled={updatingPhone}
                className="px-4 py-3 text-sm font-semibold text-brand-gray hover:text-brand-navy disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
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
          Transfer to your permanent account details below. You can fund anytime, even outside AjoFlow.
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

        {/* Minimum deposit notice */}
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 flex items-start gap-2">
          <span className="text-amber-500 mt-0.5 text-base leading-none">⚠</span>
          <p className="text-xs text-amber-800">
            <span className="font-semibold">Minimum deposit: NGN 500.</span> Bank transfer charges may apply.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
        <div className="inline-flex items-center gap-2 text-xs text-slate-600">
          {statusIcon}
          {statusText}
        </div>
        <p className="text-[11px] text-slate-500">
          Last checked: {formatDate(lastCheckedAt)}
          <span className="ml-2 text-emerald-600 font-medium">• Auto-checking every 30s</span>
        </p>
        <button
          onClick={handleManualRefresh}
          disabled={checking}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-bold text-white hover:bg-brand-primary-hover disabled:opacity-60 transition-colors"
        >
          {checking ? <><Loader2 size={15} className="animate-spin" /> Checking...</> : <><RefreshCw size={15} /> Check now</>}
        </button>
      </div>
    </div>
  );
}
