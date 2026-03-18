'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';

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
    const [phone, setPhone] = useState('');
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
                    supabase.from('profiles').select('name, phone, bank_account, bank_name, bank_account_name').eq('id', user.id).maybeSingle(),
                    fetch('/api/groups?scope=all', { cache: 'no-store' }),
                ]);

                if (profileError) throw new Error(profileError.message);

                if (profile?.name) setDisplayName(profile.name);
                if (profile?.phone) setPhone(profile.phone);
                if (profile?.bank_account) setBankAccount(profile.bank_account);
                if (profile?.bank_account_name) setResolvedAccountName(profile.bank_account_name);

                // If phone is not in database but is in auth metadata, use that
                if (!profile?.phone && user.user_metadata?.phone) {
                    setPhone(user.user_metadata.phone);
                }

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

                if (profile?.bank_name) {
                    const matchedBank = uniqueBanks.find((bank) => bank.name === profile.bank_name);
                    if (matchedBank) {
                        setBankCode(matchedBank.code);
                    }
                }
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

    const selectedGroupInfo = useMemo(
        () => groups.find((group) => group.id === selectedGroup) ?? null,
        [groups, selectedGroup],
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        setSaving(true);
        setError('');

        try {
            const res = await fetch('/api/user/onboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: displayName.trim(),
                    phone: phone.trim() || null,
                    bankAccount: bankAccount.trim(),
                    bankName: banks.find((bank) => bank.code === bankCode)?.name ?? '',
                    bankAccountName: resolvedAccountName,
                    groupId: selectedGroup,
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error((json as { error?: string }).error || 'Unable to complete onboarding.');

            notifySuccess(showToast, 'Onboarding completed. Welcome to your dashboard.');
            setTimeout(() => router.push('/dashboard'), 800);
        } catch (err) {
            const message = notifyError(showToast, err, 'Unable to complete onboarding.');
            setError(message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen grid place-items-center"><Loader2 className="animate-spin text-slate-400" size={20} /></div>;
    }

    const onboardingStep = (() => {
        if (selectedGroup) return 3;
        if (bankAccount.trim().length === 10 && !!bankCode && !!resolvedAccountName) return 2;
        if (displayName.trim().length > 1) return 1;
        return 0;
    })();

    const steps = [
        { label: 'Your name', note: 'How your circle will see you.' },
        { label: 'Bank account', note: 'Where your payout lands.' },
        { label: 'Join a group', note: 'Pick your savings circle.' },
    ];

    return (
        <main className="min-h-screen bg-[#F0F4F8]">
            <div className="mx-auto grid max-w-6xl min-h-screen items-start gap-0 lg:grid-cols-[2fr_3fr]">

                {/* Left panel */}
                <aside className="relative hidden overflow-hidden bg-[#0B1F3A] lg:flex lg:flex-col lg:min-h-screen">
                    {/* Warm glow */}
                    <div className="absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-[#C5843A]/15 blur-3xl" />
                    {/* Circle motif */}
                    <svg className="absolute inset-0 h-full w-full opacity-[0.06]" viewBox="0 0 400 600" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
                        <circle cx="200" cy="300" r="170" stroke="white" strokeWidth="1.5" />
                        <circle cx="200" cy="300" r="120" stroke="white" strokeWidth="1" />
                        <circle cx="200" cy="130" r="5" fill="white" />
                        <circle cx="347" cy="215" r="4" fill="white" />
                        <circle cx="347" cy="385" r="4" fill="white" />
                        <circle cx="200" cy="470" r="5" fill="white" />
                        <circle cx="53" cy="385" r="4" fill="white" />
                        <circle cx="53" cy="215" r="4" fill="white" />
                        <line x1="200" y1="130" x2="347" y2="215" stroke="white" strokeWidth="0.5" />
                        <line x1="347" y1="215" x2="347" y2="385" stroke="white" strokeWidth="0.5" />
                        <line x1="347" y1="385" x2="200" y2="470" stroke="white" strokeWidth="0.5" />
                        <line x1="200" y1="470" x2="53" y2="385" stroke="white" strokeWidth="0.5" />
                        <line x1="53" y1="385" x2="53" y2="215" stroke="white" strokeWidth="0.5" />
                        <line x1="53" y1="215" x2="200" y2="130" stroke="white" strokeWidth="0.5" />
                    </svg>

                    <div className="relative z-10 flex h-full flex-col justify-between px-10 py-10">
                        {/* Logo */}
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0f766e] text-sm font-bold text-white">A</div>
                            <span className="text-sm font-semibold tracking-widest text-white/50" style={{ fontFamily: 'var(--font-auth-heading, sans-serif)' }}>AJOPAY</span>
                        </div>

                        {/* Statement */}
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0f766e]">
                                Almost there
                            </p>
                            <h1 className="mt-4 text-[2.2rem] font-semibold leading-[1.08] tracking-[-0.02em] text-white">
                                A few details<br />and you&apos;re in.
                            </h1>
                            <p className="mt-4 max-w-65 text-sm leading-relaxed text-white/50">
                                Connect your bank account and choose your savings group to get started.
                            </p>

                            <div className="mt-8 space-y-4">
                                {[
                                    { step: '01', label: 'Your name', note: 'How your circle will see you.' },
                                    { step: '02', label: 'Bank account', note: 'Where your payout lands.' },
                                    { step: '03', label: 'Join a group', note: 'Pick your savings circle.' },
                                ].map((item) => (
                                    <div key={item.step} className="flex items-start gap-4">
                                        <span className="mt-0.5 text-xs font-bold tracking-widest text-white/25">{item.step}</span>
                                        <div>
                                            <p className="text-sm font-semibold text-white/80">{item.label}</p>
                                            <p className="text-xs text-white/35">{item.note}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <p className="text-[11px] text-white/25">&copy; 2026 AjoPay</p>
                    </div>
                </aside>

                {/* Right form */}
                <section className="flex flex-col justify-center px-5 py-10 sm:px-10 lg:px-12" aria-labelledby="onboarding-form-title">
                    {/* Mobile logo */}
                    <div className="mb-8 flex items-center gap-2 lg:hidden">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0f766e] text-xs font-bold text-white">A</div>
                        <span className="text-sm font-semibold tracking-widest text-brand-navy">AJOPAY</span>
                    </div>

                    {/* Mobile step-progress banner */}
                    <div className="mb-8 lg:hidden">
                        <div className="flex items-center gap-2 mb-3">
                            {steps.map((step, idx) => {
                                const stepNum = idx + 1;
                                const done = onboardingStep >= stepNum;
                                const active = onboardingStep === idx;
                                return (
                                    <React.Fragment key={step.label}>
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <div className={`h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold border transition-colors ${done ? 'bg-[#0f766e] border-[#0f766e] text-white' : active ? 'border-[#0f766e] text-[#0f766e] bg-white' : 'border-slate-200 text-slate-400 bg-white'}`}>
                                                {done ? '✓' : stepNum}
                                            </div>
                                            <p className={`text-xs font-semibold truncate leading-tight ${done || active ? 'text-brand-navy' : 'text-slate-400'}`}>{step.label}</p>
                                        </div>
                                        {idx < steps.length - 1 && (
                                            <div className={`h-px flex-1 rounded-full transition-colors ${onboardingStep > idx ? 'bg-[#0f766e]' : 'bg-slate-200'}`} />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-linear-to-r from-[#0f766e] to-[#34d399] transition-all duration-500"
                                style={{ width: `${Math.max(4, Math.round((onboardingStep / steps.length) * 100))}%` }}
                            />
                        </div>
                        <p className="mt-1.5 text-[11px] text-slate-400">
                            {onboardingStep === 0 && 'Start by entering your display name.'}
                            {onboardingStep === 1 && 'Great! Now add your bank details.'}
                            {onboardingStep === 2 && 'Almost there — choose your savings group.'}
                            {onboardingStep >= 3 && 'All set! Review and complete onboarding.'}
                        </p>
                    </div>

                    <div className="w-full max-w-120">
                        <div className="mb-7">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0f766e]">Setup</p>
                            <h2 id="onboarding-form-title" className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-brand-navy">
                                Complete your profile.
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Add your details to start contributing.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                            <fieldset className="space-y-4">
                                <legend className="sr-only">Personal details</legend>

                                <div>
                                    <label htmlFor="onboarding-display-name" className="mb-1.5 block text-sm font-semibold text-brand-navy">
                                        Display name
                                    </label>
                                    <input
                                        id="onboarding-display-name"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        autoComplete="name"
                                        className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus-visible:border-brand-primary focus-visible:ring-4 focus-visible:ring-brand-primary/10 placeholder:text-slate-400"
                                        placeholder="Your full name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="onboarding-bank" className="mb-1.5 block text-sm font-semibold text-brand-navy">
                                        Bank
                                    </label>
                                    <select
                                        id="onboarding-bank"
                                        value={bankCode}
                                        onChange={(e) => {
                                            setBankCode(e.target.value);
                                            setResolvedAccountName('');
                                            setVerificationError('');
                                        }}
                                        className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus-visible:border-brand-primary focus-visible:ring-4 focus-visible:ring-brand-primary/10"
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
                                    <label htmlFor="onboarding-account-number" className="mb-1.5 block text-sm font-semibold text-brand-navy">
                                        Account number
                                    </label>
                                    <input
                                        id="onboarding-account-number"
                                        value={bankAccount}
                                        onChange={(e) => {
                                            setBankAccount(e.target.value.replace(/\D/g, '').slice(0, 10));
                                            setResolvedAccountName('');
                                            setVerificationError('');
                                        }}
                                        inputMode="numeric"
                                        pattern="[0-9]{10}"
                                        maxLength={10}
                                        className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus-visible:border-brand-primary focus-visible:ring-4 focus-visible:ring-brand-primary/10 placeholder:text-slate-400"
                                        placeholder="10-digit account number"
                                        required
                                        aria-describedby="onboarding-account-status"
                                    />
                                    <div id="onboarding-account-status" role="status" aria-live="polite" className="mt-2 min-h-5 text-xs">
                                        {isVerifyingAccount && (
                                            <span className="inline-flex items-center gap-1.5 text-slate-500">
                                                <Loader2 size={12} className="animate-spin" />
                                                Verifying...
                                            </span>
                                        )}
                                        {!isVerifyingAccount && !!resolvedAccountName && (
                                            <span className="inline-flex items-center gap-1.5 font-semibold text-[#0f766e]">
                                                <CheckCircle2 size={12} />
                                                {resolvedAccountName}
                                            </span>
                                        )}
                                        {!isVerifyingAccount && !!verificationError && (
                                            <span className="inline-flex items-center gap-1.5 font-medium text-red-600">
                                                <XCircle size={12} />
                                                {verificationError}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </fieldset>

                            <fieldset className="space-y-3">
                                <legend className="sr-only">Group selection</legend>
                                <div>
                                    <label htmlFor="onboarding-group" className="mb-1.5 block text-sm font-semibold text-brand-navy">
                                        Savings group
                                    </label>
                                    <select
                                        id="onboarding-group"
                                        value={selectedGroup}
                                        onChange={(e) => setSelectedGroup(e.target.value)}
                                        className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus-visible:border-brand-primary focus-visible:ring-4 focus-visible:ring-brand-primary/10"
                                        required
                                    >
                                        <option value="">Choose a group</option>
                                        {groups.map((group) => (
                                            <option key={group.id} value={group.id}>
                                                {group.name} · NGN {Number(group.contribution_amount).toLocaleString('en-NG')} · {group.frequency}
                                            </option>
                                        ))}
                                    </select>
                                    {groups.length === 0 && (
                                        <p className="mt-1.5 text-xs text-slate-400">
                                            No active groups right now. Contact an admin.
                                        </p>
                                    )}
                                </div>

                                {selectedGroupInfo && (
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                        <p className="text-sm font-semibold text-brand-navy">{selectedGroupInfo.name}</p>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            NGN {Number(selectedGroupInfo.contribution_amount).toLocaleString('en-NG')} &middot; {selectedGroupInfo.frequency} &middot; {selectedGroupInfo.category}
                                        </p>
                                    </div>
                                )}
                            </fieldset>

                            <button
                                type="submit"
                                disabled={!canSubmit || saving || isVerifyingAccount || groups.length === 0}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-bold text-white shadow-md shadow-brand-primary/20 transition hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/25 disabled:cursor-not-allowed disabled:opacity-55"
                            >
                                {saving && <Loader2 size={15} className="animate-spin" />}
                                {saving ? 'Completing setup...' : 'Complete onboarding'}
                            </button>

                            {error && (
                                <div role="alert" aria-live="assertive" className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                                    <XCircle size={16} className="mt-0.5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </form>
                    </div>
                </section>

            </div>
        </main>
    );
}
