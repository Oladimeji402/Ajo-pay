'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, CheckCircle2, Loader2, LogOut, Save, User, XCircle } from 'lucide-react';
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

                const banksRes = await fetch('/api/banks', { cache: 'no-store' });
                const banksJson = await banksRes.json();

                if (!banksRes.ok) {
                    throw new Error(banksJson.error || 'Failed to load supported banks.');
                }

                if (profileError) {
                    throw new Error(profileError.message);
                }

                const profile = data as Profile | null;
                if (!profile) {
                    throw new Error('Profile not found.');
                }

                setProfileId(profile.id);
                setName(profile.name ?? '');
                setEmail(profile.email ?? user.email ?? '');
                setPhone(profile.phone ?? '');
                setBankAccount(profile.bank_account ?? '');
                setResolvedAccountName(profile.bank_account_name ?? '');

                const bankList = Array.isArray(banksJson.data) ? (banksJson.data as BankOption[]) : [];
                setBanks(bankList);

                if (profile.bank_name) {
                    const matchedBank = bankList.find((bank) => bank.name === profile.bank_name);
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
        <div className="max-w-2xl mx-auto space-y-5">
            <div>
                <h1 className="text-xl font-bold text-brand-navy">Settings</h1>
                <p className="text-xs text-brand-gray">Manage your account details</p>
            </div>

            <form onSubmit={handleSave} className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                    <User size={16} className="text-brand-gray" />
                    <h2 className="font-bold text-brand-navy">Profile</h2>
                </div>

                <div>
                    <label className="block text-xs font-bold text-brand-gray mb-1">Full Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" required />
                </div>

                <div>
                    <label className="block text-xs font-bold text-brand-gray mb-1">Email</label>
                    <input value={email} readOnly className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-brand-gray" />
                </div>

                <div>
                    <label className="block text-xs font-bold text-brand-gray mb-1">Phone</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                </div>

                <div>
                    <label className="block text-xs font-bold text-brand-gray mb-1">Bank</label>
                    <div className="relative">
                        <Building2 size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select
                            value={bankCode}
                            onChange={(e) => {
                                setBankCode(e.target.value);
                                setResolvedAccountName('');
                                setVerificationError('');
                            }}
                            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm"
                            disabled={banksLoading}
                        >
                            <option value="">{banksLoading ? 'Loading banks...' : 'Select your bank'}</option>
                            {banks.map((bank) => (
                                <option key={bank.code} value={bank.code}>{bank.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-brand-gray mb-1">Bank Account</label>
                    <input
                        value={bankAccount}
                        onChange={(e) => {
                            setBankAccount(e.target.value.replace(/\D/g, '').slice(0, 10));
                            setResolvedAccountName('');
                            setVerificationError('');
                        }}
                        inputMode="numeric"
                        pattern="[0-9]{10}"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="0123456789"
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

                <button disabled={saving || !canSave} className="w-full rounded-xl bg-brand-navy text-white px-4 py-2.5 text-sm font-bold disabled:opacity-60 inline-flex items-center justify-center gap-2">
                    <Save size={14} />
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </form>

            <button onClick={handleSignOut} className="w-full bg-white border border-red-100 rounded-2xl p-4 text-red-600 hover:bg-red-50 transition-colors inline-flex items-center justify-center gap-2 text-sm font-bold">
                <LogOut size={16} />
                Sign Out
            </button>

            {error && <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        </div>
    );
}
