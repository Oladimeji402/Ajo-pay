'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Building2, CheckCircle2, Loader2, ShieldCheck, Sparkles, User2, WalletCards, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess, notifyWarning } from '@/lib/toast';

type GroupRow = {
    id: string;
    name: string;
    category: string;
    contribution_amount: number;
    frequency: string;
    max_members: number;
    status: string;
};

type BankOption = {
    name: string;
    code: string;
};

export default function OnboardingPage() {
    const router = useRouter();
    const verificationRequestId = useRef(0);
    const { showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [banksLoading, setBanksLoading] = useState(true);
    const [isVerifyingAccount, setIsVerifyingAccount] = useState(false);
    const [error, setError] = useState('');
    const [verificationError, setVerificationError] = useState('');

    const [displayName, setDisplayName] = useState('');
    const [bankCode, setBankCode] = useState('');
    const [bankAccount, setBankAccount] = useState('');
    const [resolvedAccountName, setResolvedAccountName] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [groups, setGroups] = useState<GroupRow[]>([]);
    const [banks, setBanks] = useState<BankOption[]>([]);

    useEffect(() => {
        const run = async () => {
            setLoading(true);
            setError('');

            try {
                const supabase = createSupabaseBrowserClient();
                const {
                    data: { user },
                } = await supabase.auth.getUser();

                if (!user) {
                    router.push('/login');
                    return;
                }

                const [{ data: profile, error: profileError }, groupsRes] = await Promise.all([
                    supabase.from('profiles').select('name, bank_account').eq('id', user.id).maybeSingle(),
                    fetch('/api/groups?scope=all', { cache: 'no-store' }),
                ]);

                if (profileError) throw new Error(profileError.message);

                if (profile?.name) setDisplayName(profile.name);
                if (profile?.bank_account) setBankAccount(profile.bank_account);

                const groupsJson = await groupsRes.json();
                if (!groupsRes.ok) throw new Error(groupsJson.error || 'Failed to load groups.');

                const list = Array.isArray(groupsJson.data) ? (groupsJson.data as GroupRow[]) : [];
                setGroups(list.filter((g) => g.status !== 'completed'));

                const banksRes = await fetch('/api/banks', { cache: 'no-store' });
                const banksJson = await banksRes.json();
                if (!banksRes.ok) throw new Error(banksJson.error || 'Failed to load supported banks.');

                const bankList = Array.isArray(banksJson.data) ? (banksJson.data as BankOption[]) : [];
                const uniqueBanks = Array.from(
                    new Map(bankList.map((bank) => [bank.code, bank])).values(),
                );
                setBanks(uniqueBanks);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unable to start onboarding.');
            } finally {
                setBanksLoading(false);
                setLoading(false);
            }
        };

        void run();
    }, [router]);

    useEffect(() => {
        if (!bankCode || bankAccount.trim().length !== 10) {
            setResolvedAccountName('');
            setVerificationError('');
            setIsVerifyingAccount(false);
            return;
        }

        const currentRequestId = verificationRequestId.current + 1;
        verificationRequestId.current = currentRequestId;
        setIsVerifyingAccount(true);
        setVerificationError('');

        const timeout = setTimeout(async () => {
            try {
                const response = await fetch('/api/banks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        bankCode,
                        accountNumber: bankAccount.trim(),
                    }),
                });

                const payload = await response.json();
                if (currentRequestId !== verificationRequestId.current) {
                    return;
                }

                if (!response.ok) {
                    setResolvedAccountName('');
                    setVerificationError(payload.error || 'Unable to verify account details.');
                    return;
                }

                setResolvedAccountName(String(payload.data?.accountName ?? ''));
                setVerificationError('');
            } catch {
                if (currentRequestId !== verificationRequestId.current) {
                    return;
                }

                setResolvedAccountName('');
                setVerificationError('Unable to verify account details right now.');
            } finally {
                if (currentRequestId === verificationRequestId.current) {
                    setIsVerifyingAccount(false);
                }
            }
        }, 450);

        return () => {
            clearTimeout(timeout);
        };
    }, [bankCode, bankAccount]);

    const canSubmit = useMemo(() => {
        return displayName.trim().length > 1
            && /^\d{10}$/.test(bankAccount.trim())
            && bankCode
            && !!resolvedAccountName
            && selectedGroup;
    }, [bankAccount, bankCode, displayName, resolvedAccountName, selectedGroup]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        setSaving(true);
        setError('');

        try {
            const supabase = createSupabaseBrowserClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                notifyWarning(showToast, 'Your session has expired. Please log in again.');
                router.push('/login');
                return;
            }

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    name: displayName.trim(),
                    bank_account: bankAccount.trim(),
                })
                .eq('id', user.id);

            if (updateError) throw new Error(updateError.message);

            const joinRes = await fetch(`/api/groups/${selectedGroup}/join`, { method: 'POST' });
            const joinJson = await joinRes.json();
            if (!joinRes.ok) throw new Error(joinJson.error || 'Failed to join selected group.');

            notifySuccess(showToast, 'Onboarding completed. Welcome to your dashboard.');
            setTimeout(() => router.push('/dashboard'), 800);
        } catch (err) {
            notifyError(showToast, err, 'Unable to complete onboarding.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen grid place-items-center"><Loader2 className="animate-spin" size={18} /></div>;
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-emerald-50 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-[1fr_1.25fr]">
                <section className="relative overflow-hidden rounded-3xl border border-brand-primary/10 bg-brand-primary p-7 text-white shadow-2xl shadow-brand-primary/20 sm:p-8">
                    <div className="pointer-events-none absolute -top-14 -right-14 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-16 -left-8 h-44 w-44 rounded-full bg-emerald-300/20 blur-2xl" />

                    <div className="relative space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
                            <Sparkles size={14} />
                            Quick setup
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">Welcome to AjoPay</h1>
                            <p className="max-w-md text-sm text-blue-100">
                                Complete your onboarding, verify your bank details, and join a trusted contribution group in minutes.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3">
                                <ShieldCheck className="h-5 w-5 text-emerald-300" />
                                <p className="text-sm text-blue-50">Your account details are verified in real-time before you continue.</p>
                            </div>
                            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3">
                                <WalletCards className="h-5 w-5 text-emerald-300" />
                                <p className="text-sm text-blue-50">Choose a live group and start your first savings cycle today.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-brand-navy">Set up your profile</h2>
                        <p className="mt-1 text-sm text-brand-gray">Use your real bank details so payouts can be completed without delays.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-gray">
                                <User2 size={14} />
                                Display Name
                            </label>
                            <input
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-brand-primary/20 transition focus:border-brand-primary focus:ring-4"
                                placeholder="Your full name"
                                required
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-gray">
                                <Building2 size={14} />
                                Bank
                            </label>
                            <select
                                value={bankCode}
                                onChange={(e) => {
                                    setBankCode(e.target.value);
                                    setResolvedAccountName('');
                                    setVerificationError('');
                                }}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-brand-primary/20 transition focus:border-brand-primary focus:ring-4"
                                required
                                disabled={banksLoading}
                            >
                                <option value="">{banksLoading ? 'Loading banks...' : 'Select your bank'}</option>
                                {banks.map((bank) => (
                                    <option key={bank.code} value={bank.code}>{bank.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-brand-gray">Bank Account Number</label>
                            <input
                                value={bankAccount}
                                onChange={(e) => {
                                    setBankAccount(e.target.value.replace(/\D/g, '').slice(0, 10));
                                    setResolvedAccountName('');
                                    setVerificationError('');
                                }}
                                inputMode="numeric"
                                pattern="[0-9]{10}"
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-brand-primary/20 transition focus:border-brand-primary focus:ring-4"
                                placeholder="0123456789"
                                required
                            />
                            <div className="mt-2 min-h-6 text-xs">
                                {isVerifyingAccount && (
                                    <span className="inline-flex items-center gap-1.5 font-medium text-brand-gray">
                                        <Loader2 size={13} className="animate-spin" />
                                        Verifying account details...
                                    </span>
                                )}
                                {!isVerifyingAccount && !!resolvedAccountName && (
                                    <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                                        <CheckCircle2 size={13} />
                                        {resolvedAccountName}
                                    </span>
                                )}
                                {!isVerifyingAccount && !!verificationError && (
                                    <span className="inline-flex items-center gap-1.5 font-medium text-red-600">
                                        <XCircle size={13} />
                                        {verificationError}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-brand-gray">Select Group</label>
                            <select
                                value={selectedGroup}
                                onChange={(e) => setSelectedGroup(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-brand-primary/20 transition focus:border-brand-primary focus:ring-4"
                                required
                            >
                                <option value="">Choose a group</option>
                                {groups.map((group) => (
                                    <option key={group.id} value={group.id}>
                                        {group.name} · NGN {Number(group.contribution_amount).toLocaleString('en-NG')} · {group.frequency}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            disabled={!canSubmit || saving || isVerifyingAccount}
                            className="w-full rounded-xl bg-brand-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? 'Completing...' : 'Complete Onboarding'}
                        </button>
                    </form>

                    {error && <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
                </section>
            </div>
        </div>
    );
}
