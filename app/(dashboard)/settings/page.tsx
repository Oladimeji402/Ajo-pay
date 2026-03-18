'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Building2,
    CheckCircle2,
    Landmark,
    Loader2,
    LogOut,
    Save,
    ShieldCheck,
    User,
    XCircle,
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess, notifyWarning } from '@/lib/toast';

type Profile = {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    bank_account: string | null;
    bank_name: string | null;
    bank_account_name: string | null;
};

type BankOption = {
    name: string;
    code: string;
};

export default function SettingsPage() {
    const router = useRouter();
    const verificationRequestId = useRef(0);
    const hasEditedBankDetails = useRef(false);
    const { showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [banksLoading, setBanksLoading] = useState(true);
    const [isVerifyingAccount, setIsVerifyingAccount] = useState(false);
    const [error, setError] = useState('');
    const [verificationError, setVerificationError] = useState('');

    const [profileId, setProfileId] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [bankCode, setBankCode] = useState('');
    const [bankAccount, setBankAccount] = useState('');
    const [resolvedAccountName, setResolvedAccountName] = useState('');
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
                    notifyWarning(showToast, 'Your session has expired. Please log in again.');
                    router.push('/login');
                    return;
                }

                const { data, error: profileError } = await supabase
                    .from('profiles')
                    .select('id, name, email, phone, bank_account, bank_name, bank_account_name')
                    .eq('id', user.id)
                    .maybeSingle();

                if (profileError) {
                    throw new Error(profileError.message);
                }

                const profile = data as Profile | null;
                if (!profile) {
                    throw new Error('Profile not found.');
                }

                const banksRes = await fetch('/api/banks', { cache: 'no-store' });
                const banksJson = await banksRes.json();

                if (!banksRes.ok) {
                    throw new Error(banksJson.error || 'Failed to load supported banks.');
                }

                const bankList = Array.isArray(banksJson.data) ? (banksJson.data as BankOption[]) : [];
                const uniqueBanks = Array.from(
                    new Map(
                        bankList
                            .filter((bank) => bank.code && bank.name)
                            .map((bank) => [bank.code, bank]),
                    ).values(),
                );

                setProfileId(profile.id);
                setName(profile.name ?? '');
                setEmail(profile.email ?? user.email ?? '');
                setPhone(profile.phone ?? '');
                setBankAccount(profile.bank_account ?? '');
                setResolvedAccountName(profile.bank_account_name ?? '');
                setBanks(uniqueBanks);

                if (profile.bank_name) {
                    const matchedBank = uniqueBanks.find((bank) => bank.name === profile.bank_name);
                    if (matchedBank) {
                        setBankCode(matchedBank.code);
                    }
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unable to load settings.');
            } finally {
                setBanksLoading(false);
                setLoading(false);
            }
        };

        void run();
    }, [router, showToast]);

    useEffect(() => {
        if (!hasEditedBankDetails.current) {
            return;
        }

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

    const canSave = useMemo(() => {
        const account = bankAccount.trim();
        const hasAccount = account.length > 0;

        if (!hasAccount) {
            return name.trim().length > 0;
        }

        return name.trim().length > 0
            && /^\d{10}$/.test(account)
            && !!bankCode
            && !!resolvedAccountName
            && !isVerifyingAccount;
    }, [bankAccount, bankCode, isVerifyingAccount, name, resolvedAccountName]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profileId) return;

        const trimmedAccount = bankAccount.trim();
        const hasAccount = trimmedAccount.length > 0;

        if (hasAccount && !canSave) {
            notifyWarning(showToast, 'Complete bank verification before saving account changes.');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const supabase = createSupabaseBrowserClient();
            const selectedBankName = hasAccount
                ? banks.find((bank) => bank.code === bankCode)?.name ?? null
                : null;

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    name: name.trim(),
                    phone: phone.trim() || null,
                    bank_account: hasAccount ? trimmedAccount : null,
                    bank_name: selectedBankName,
                    bank_account_name: hasAccount ? resolvedAccountName : null,
                })
                .eq('id', profileId);

            if (updateError) {
                throw new Error(updateError.message);
            }

            notifySuccess(showToast, 'Settings updated successfully.');
        } catch (err) {
            notifyError(showToast, err, 'Failed to update settings.');
        } finally {
            setSaving(false);
        }
    };

    const handleSignOut = async () => {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
        notifySuccess(showToast, 'Signed out successfully.');
        router.push('/login');
        router.refresh();
    };

    if (loading) {
        return (
            <div className="min-h-80 grid place-items-center text-brand-gray">
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <Loader2 className="animate-spin" size={16} />
                    Loading settings...
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-br from-brand-navy via-[#142B5E] to-brand-emerald text-white p-6">
                <div className="absolute -right-8 -top-10 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -left-8 -bottom-10 h-36 w-36 rounded-full bg-emerald-300/20 blur-3xl" />
                <div className="relative flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/70 font-semibold">Account and Payout Profile</p>
                        <h1 className="text-2xl font-semibold mt-1">Settings</h1>
                        <p className="text-sm text-white/80 mt-2">Keep your profile accurate and your payout details verified for smooth disbursements.</p>
                    </div>
                    <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm inline-flex items-center gap-2">
                        <ShieldCheck size={15} /> Verified details improve payout reliability
                    </div>
                </div>
            </section>

            <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 space-y-5">
                <div className="flex items-center gap-2">
                    <User size={16} className="text-brand-gray" />
                    <h2 className="font-semibold text-brand-navy">Identity and Contact</h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="block text-xs font-semibold text-brand-gray mb-1">Full Name</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-brand-gray mb-1">Phone</label>
                        <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-brand-gray mb-1">Email</label>
                    <input
                        value={email}
                        readOnly
                        className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-brand-gray"
                    />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-linear-to-b from-slate-50 to-white p-4 space-y-4">
                    <div className="inline-flex items-center gap-2">
                        <Landmark size={15} className="text-brand-gray" />
                        <h3 className="text-sm font-semibold text-brand-navy">Payout Bank Details</h3>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="block text-xs font-semibold text-brand-gray mb-1">Bank</label>
                            <div className="relative">
                                <Building2 size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <select
                                    value={bankCode}
                                    onChange={(e) => {
                                        hasEditedBankDetails.current = true;
                                        setBankCode(e.target.value);
                                        setResolvedAccountName('');
                                        setVerificationError('');
                                    }}
                                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm"
                                    disabled={banksLoading}
                                >
                                    <option value="">{banksLoading ? 'Loading banks...' : 'Select your bank'}</option>
                                    {banks.map((bank) => (
                                        <option key={`${bank.code}-${bank.name}`} value={bank.code}>{bank.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-brand-gray mb-1">Bank Account</label>
                            <input
                                value={bankAccount}
                                onChange={(e) => {
                                    hasEditedBankDetails.current = true;
                                    setBankAccount(e.target.value.replace(/\D/g, '').slice(0, 10));
                                    setResolvedAccountName('');
                                    setVerificationError('');
                                }}
                                inputMode="numeric"
                                pattern="[0-9]{10}"
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                                placeholder="0123456789"
                            />
                        </div>
                    </div>

                    <div className="min-h-7 text-xs rounded-xl border border-slate-200 bg-white px-3 py-2">
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

                <button
                    disabled={saving || !canSave}
                    className="w-full rounded-xl bg-brand-navy text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                    <Save size={14} />
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </form>

            <button
                onClick={handleSignOut}
                className="w-full bg-white border border-red-100 rounded-2xl p-4 text-red-600 hover:bg-red-50 transition-colors inline-flex items-center justify-center gap-2 text-sm font-semibold"
            >
                <LogOut size={16} />
                Sign Out
            </button>

            {error && <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        </div>
    );
}
