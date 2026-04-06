'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    AlertTriangle,
    ArrowLeft,
    Building2,
    ChevronRight,
    CheckCircle2,
    Copy,
    Eye,
    EyeOff,
    KeyRound,
    Landmark,
    Loader2,
    LogOut,
    Mail,
    Save,
    ShieldCheck,
    Trash2,
    User,
    XCircle,
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess, notifyWarning } from '@/lib/toast';
import { mapAuthError } from '@/lib/auth-errors';
import { formatNigeriaPhoneE164, isValidNigeriaPhoneLocal, normalizeNigeriaPhoneLocalInput, parseNigeriaPhoneToLocal } from '@/lib/phone';

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

type MobileSettingsView = 'menu' | 'profile' | 'bank' | 'email' | 'password' | 'danger';

export default function SettingsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const verificationRequestId = useRef(0);
    const hasEditedBankDetails = useRef(false);
    const bankSectionRef = useRef<HTMLDivElement>(null);
    const { showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [banksLoading, setBanksLoading] = useState(true);
    const [isVerifyingAccount, setIsVerifyingAccount] = useState(false);
    const [emailChanging, setEmailChanging] = useState(false);
    const [passwordChanging, setPasswordChanging] = useState(false);
    const [deletingAccount, setDeletingAccount] = useState(false);
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
    const [pendingEmail, setPendingEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [mobileView, setMobileView] = useState<MobileSettingsView>('menu');

    // Auto-focus the bank section when ?tab=bank is present in the URL
    useEffect(() => {
        if (searchParams.get('tab') === 'bank') {
            setMobileView('bank');
            // On desktop, scroll the bank section into view after data loads
            const timer = setTimeout(() => {
                bankSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 400);
            return () => clearTimeout(timer);
        }
    }, [searchParams]);

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
                setPendingEmail(profile.email ?? user.email ?? '');
                setPhone(parseNigeriaPhoneToLocal(profile.phone));
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

    const passwordChecks = useMemo(() => [
        { label: 'At least 8 characters', valid: newPassword.length >= 8 },
        { label: 'One uppercase letter', valid: /[A-Z]/.test(newPassword) },
        { label: 'One number', valid: /[0-9]/.test(newPassword) },
        { label: 'One special character', valid: /[^A-Za-z0-9]/.test(newPassword) },
    ], [newPassword]);

    const isNewPasswordStrong = passwordChecks.every((check) => check.valid);
    const passwordsMatch = newPassword.length > 0 && newPassword === confirmNewPassword;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profileId) return;

        const trimmedAccount = bankAccount.trim();
        const hasAccount = trimmedAccount.length > 0;
        const normalizedPhone = normalizeNigeriaPhoneLocalInput(phone);

        if (normalizedPhone && !isValidNigeriaPhoneLocal(normalizedPhone)) {
            notifyWarning(showToast, 'Enter a valid Nigerian mobile number (10 digits after +234).');
            return;
        }

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
                    phone: normalizedPhone ? formatNigeriaPhoneE164(normalizedPhone) : null,
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

    const copyToClipboard = async (value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            notifySuccess(showToast, 'Copied to clipboard.', { duration: 2200 });
        } catch (err) {
            notifyError(showToast, err, 'Could not copy to clipboard.');
        }
    };

    const createInAppNotification = async (payload: {
        type: string;
        title: string;
        body: string;
        metadata?: Record<string, unknown>;
    }) => {
        try {
            const supabase = createSupabaseBrowserClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) return;

            await supabase.from('notifications').insert({
                user_id: user.id,
                type: payload.type,
                title: payload.title,
                body: payload.body,
                metadata: payload.metadata ?? {},
            });
        } catch {
            // Notification creation should never block the main user action.
        }
    };

    const handleChangeEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        const nextEmail = pendingEmail.trim().toLowerCase();

        if (!nextEmail || nextEmail === email.toLowerCase()) {
            notifyWarning(showToast, 'Enter a different email address to update your account.');
            return;
        }

        setEmailChanging(true);
        try {
            const supabase = createSupabaseBrowserClient();
            const { error: updateError } = await supabase.auth.updateUser({ email: nextEmail });
            if (updateError) {
                throw new Error(mapAuthError(updateError, 'Unable to start email update.'));
            }

            await createInAppNotification({
                type: 'email_change_requested',
                title: 'Email change requested',
                body: `We sent verification links to ${email} and ${nextEmail}. Confirm both to finish updating your login email.`,
                metadata: { currentEmail: email, pendingEmail: nextEmail },
            });

            notifySuccess(showToast, 'Verification links have been sent to your old and new email addresses. Confirm the change to finish updating your email.');
        } catch (err) {
            notifyError(showToast, err, 'Unable to start email update.');
        } finally {
            setEmailChanging(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentPassword) {
            notifyWarning(showToast, 'Enter your current password to continue.');
            return;
        }

        if (!isNewPasswordStrong || !passwordsMatch) {
            notifyWarning(showToast, 'Choose a stronger password and make sure both fields match.');
            return;
        }

        setPasswordChanging(true);
        try {
            const supabase = createSupabaseBrowserClient();
            const { error: checkError } = await supabase.auth.signInWithPassword({
                email,
                password: currentPassword,
            });
            if (checkError) {
                throw new Error(mapAuthError(checkError, 'Your current password is incorrect.'));
            }

            const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
            if (updateError) {
                throw new Error(mapAuthError(updateError, 'Unable to update your password.'));
            }

            await createInAppNotification({
                type: 'password_changed',
                title: 'Password updated',
                body: 'Your password was changed successfully. If this was not you, reset your password immediately.',
            });

            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            notifySuccess(showToast, 'Password updated successfully.');
        } catch (err) {
            notifyError(showToast, err, 'Unable to update your password.');
        } finally {
            setPasswordChanging(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirm.trim().toUpperCase() !== 'DELETE ACCOUNT') {
            notifyWarning(showToast, 'Type DELETE ACCOUNT exactly to confirm.');
            return;
        }

        const confirmed = window.confirm('Delete your account permanently? This action cannot be undone.');
        if (!confirmed) return;

        setDeletingAccount(true);
        try {
            const response = await fetch('/api/user/account', {
                method: 'DELETE',
                cache: 'no-store',
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || 'Unable to delete your account.');
            }

            const supabase = createSupabaseBrowserClient();
            await supabase.auth.signOut();
            notifySuccess(showToast, 'Your account has been deleted.');
            window.location.href = '/login';
        } catch (err) {
            notifyError(showToast, err, 'Unable to delete your account right now.');
            setDeletingAccount(false);
        }
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
        <div className="max-w-2xl mx-auto space-y-4">
            <section className="md:hidden rounded-2xl border border-slate-200 bg-white overflow-hidden">
                {mobileView === 'menu' ? (
                    <div>
                        <div className="px-5 py-4 border-b border-slate-100">
                            <p className="text-xs font-semibold text-brand-gray">Choose what to manage</p>
                        </div>

                        <button onClick={() => setMobileView('profile')} className="w-full px-5 py-4 border-b border-slate-100 flex items-center justify-between text-left hover:bg-slate-50">
                            <div>
                                <p className="text-sm font-semibold text-brand-navy">My Profile</p>
                                <p className="text-xs text-slate-500">Name, phone number</p>
                            </div>
                            <ChevronRight size={16} className="text-slate-400" />
                        </button>

                        <button onClick={() => setMobileView('bank')} className="w-full px-5 py-4 border-b border-slate-100 flex items-center justify-between text-left hover:bg-slate-50">
                            <div>
                                <p className="text-sm font-semibold text-brand-navy">Bank Account</p>
                                <p className="text-xs text-slate-500">Where you receive your payout</p>
                            </div>
                            <ChevronRight size={16} className="text-slate-400" />
                        </button>

                        <button onClick={() => setMobileView('email')} className="w-full px-5 py-4 border-b border-slate-100 flex items-center justify-between text-left hover:bg-slate-50">
                            <div>
                                <p className="text-sm font-semibold text-brand-navy">Change Email</p>
                                <p className="text-xs text-slate-500">Update your login email</p>
                            </div>
                            <ChevronRight size={16} className="text-slate-400" />
                        </button>

                        <button onClick={() => setMobileView('password')} className="w-full px-5 py-4 border-b border-slate-100 flex items-center justify-between text-left hover:bg-slate-50">
                            <div>
                                <p className="text-sm font-semibold text-brand-navy">Change Password</p>
                                <p className="text-xs text-slate-500">Keep your account secure</p>
                            </div>
                            <ChevronRight size={16} className="text-slate-400" />
                        </button>

                        <button onClick={() => setMobileView('danger')} className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-red-50">
                            <div>
                                <p className="text-sm font-semibold text-red-700">Delete Account</p>
                                <p className="text-xs text-red-500">Permanent action</p>
                            </div>
                            <ChevronRight size={16} className="text-red-300" />
                        </button>
                    </div>
                ) : (
                    <div className="p-4 space-y-4">
                        <button onClick={() => setMobileView('menu')} className="inline-flex items-center gap-2 text-xs font-semibold text-brand-gray hover:text-brand-navy">
                            <ArrowLeft size={14} /> Back to settings menu
                        </button>

                        {mobileView === 'profile' && (
                            <form onSubmit={handleSave} className="space-y-4">
                                <h3 className="font-semibold text-brand-navy">Identity and Contact</h3>
                                <div>
                                    <label className="block text-xs font-semibold text-brand-gray mb-1">Full Name</label>
                                    <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-brand-gray mb-1">Phone</label>
                                    <div className="flex rounded-xl border border-slate-200 bg-slate-50">
                                        <span className="inline-flex items-center border-r border-slate-200 px-3 text-sm font-semibold text-slate-600">+234</span>
                                        <input
                                            value={phone}
                                            onChange={(e) => setPhone(normalizeNigeriaPhoneLocalInput(e.target.value))}
                                            inputMode="numeric"
                                            pattern="[0-9]{10}"
                                            maxLength={10}
                                            className="w-full rounded-r-xl bg-transparent px-3 py-2 text-sm focus:outline-none"
                                            placeholder="8012345678"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-brand-gray mb-1">Email</label>
                                    <input value={email} readOnly className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-brand-gray" />
                                </div>
                                <button disabled={saving || !canSave} className="w-full rounded-xl bg-brand-primary text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-60 hover:bg-brand-primary-hover">{saving ? 'Saving...' : 'Save'}</button>
                            </form>
                        )}

                        {mobileView === 'bank' && (
                            <form onSubmit={handleSave} className="space-y-4">
                                <h3 className="font-semibold text-brand-navy">Bank Account</h3>
                                <div>
                                    <label className="block text-xs font-semibold text-brand-gray mb-1">Bank</label>
                                    <select
                                        value={bankCode}
                                        onChange={(e) => {
                                            hasEditedBankDetails.current = true;
                                            setBankCode(e.target.value);
                                            setResolvedAccountName('');
                                            setVerificationError('');
                                        }}
                                        className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm"
                                        disabled={banksLoading}
                                    >
                                        <option value="">{banksLoading ? 'Loading banks...' : 'Select your bank'}</option>
                                        {banks.map((bank) => (
                                            <option key={`${bank.code}-${bank.name}`} value={bank.code}>{bank.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-brand-gray mb-1">Bank Account</label>
                                    <div className="relative">
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
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-10 text-sm"
                                            placeholder="0123456789"
                                        />
                                        {bankAccount && (
                                            <button
                                                type="button"
                                                onClick={() => void copyToClipboard(bankAccount)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                                title="Copy account number"
                                            >
                                                <Copy size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="min-h-7 text-xs rounded-xl border border-slate-200 bg-white px-3 py-2">
                                    {isVerifyingAccount && <span className="inline-flex items-center gap-1.5 font-medium text-brand-gray"><Loader2 size={13} className="animate-spin" />Verifying account details...</span>}
                                    {!isVerifyingAccount && !!resolvedAccountName && (
                                        <span className="inline-flex items-center justify-between">
                                            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700"><CheckCircle2 size={13} />{resolvedAccountName}</span>
                                            <button type="button" onClick={() => void copyToClipboard(resolvedAccountName)} className="text-emerald-700 hover:text-emerald-900"><Copy size={13} /></button>
                                        </span>
                                    )}
                                    {!isVerifyingAccount && !!verificationError && <span className="inline-flex items-center gap-1.5 font-medium text-red-600"><XCircle size={13} />{verificationError}</span>}
                                </div>
                                <button disabled={saving || !canSave} className="w-full rounded-xl bg-brand-primary text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-60 hover:bg-brand-primary-hover">{saving ? 'Saving...' : 'Save'}</button>
                            </form>
                        )}

                        {mobileView === 'email' && (
                            <form onSubmit={handleChangeEmail} className="space-y-4">
                                <h3 className="font-semibold text-brand-navy">Change email</h3>
                                <p className="text-sm text-slate-500">We&apos;ll send a link to your old and new email. Tap both links to confirm the change.</p>
                                <div>
                                    <label className="block text-xs font-semibold text-brand-gray mb-1">New email address</label>
                                    <input type="email" value={pendingEmail} onChange={(e) => setPendingEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" placeholder="new-email@example.com" />
                                </div>
                                <button type="submit" disabled={emailChanging} className="w-full rounded-xl bg-brand-primary text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-60 hover:bg-brand-primary-hover">{emailChanging ? 'Sending...' : 'Update email'}</button>
                            </form>
                        )}

                        {mobileView === 'password' && (
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <h3 className="font-semibold text-brand-navy">Change password</h3>
                                <div>
                                    <label className="block text-xs font-semibold text-brand-gray mb-1">Current password</label>
                                    <div className="relative">
                                        <input type={showCurrentPassword ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pr-10 text-sm" />
                                        <button type="button" onClick={() => setShowCurrentPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-navy">{showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-brand-gray mb-1">New password</label>
                                    <div className="relative">
                                        <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pr-10 text-sm" />
                                        <button type="button" onClick={() => setShowNewPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-navy">{showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-brand-gray mb-1">Confirm new password</label>
                                    <div className="relative">
                                        <input type={showConfirmPassword ? 'text' : 'password'} value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pr-10 text-sm" />
                                        <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-navy">{showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                                    </div>
                                </div>
                                <button type="submit" disabled={passwordChanging || !passwordsMatch || !isNewPasswordStrong} className="w-full rounded-xl bg-brand-primary text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-60 hover:bg-brand-primary-hover">{passwordChanging ? 'Updating...' : 'Update password'}</button>
                            </form>
                        )}

                        {mobileView === 'danger' && (
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 text-red-700">
                                    <AlertTriangle size={16} />
                                    <h3 className="font-semibold">Delete account</h3>
                                </div>
                                <p className="text-sm text-slate-600">Delete your account permanently. This action cannot be undone.</p>
                                <input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} className="w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm" placeholder="Type DELETE ACCOUNT to confirm" />
                                <button type="button" onClick={handleDeleteAccount} disabled={deletingAccount} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                                    <Trash2 size={14} />
                                    {deletingAccount ? 'Deleting...' : 'Delete account'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </section>

            <form onSubmit={handleSave} className="hidden md:block bg-white border border-slate-200 rounded-2xl p-5 space-y-5">
                <div className="flex items-center gap-2">
                    <User size={16} className="text-brand-gray" />
                    <h2 className="font-semibold text-brand-navy">My Profile</h2>
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
                        <div className="flex rounded-xl border border-slate-200 bg-slate-50 focus-within:ring-2 focus-within:ring-brand-primary/20">
                            <span className="inline-flex items-center border-r border-slate-200 px-3 text-sm font-semibold text-slate-600">+234</span>
                            <input
                                value={phone}
                                onChange={(e) => setPhone(normalizeNigeriaPhoneLocalInput(e.target.value))}
                                inputMode="numeric"
                                pattern="[0-9]{10}"
                                maxLength={10}
                                className="w-full rounded-r-xl bg-transparent px-3 py-2 text-sm focus:outline-none"
                                placeholder="8012345678"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-brand-gray mb-1">Email</label>
                    <input
                        value={email}
                        readOnly
                        className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-brand-gray"
                    />
                    <p className="mt-1 text-[11px] text-slate-500">This is the email you use to log in. To change it, use the section below.</p>
                </div>

                <div ref={bankSectionRef} className="rounded-2xl border border-slate-200 bg-linear-to-b from-slate-50 to-white p-4 space-y-4">
                    <div className="inline-flex items-center gap-2">
                        <Landmark size={15} className="text-brand-gray" />
                        <h3 className="text-sm font-semibold text-brand-navy">Bank Account (for payouts)</h3>
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
                            <div className="relative">
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
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-10 text-sm"
                                    placeholder="0123456789"
                                />
                                {bankAccount && (
                                    <button
                                        type="button"
                                        onClick={() => void copyToClipboard(bankAccount)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                        title="Copy account number"
                                    >
                                        <Copy size={16} />
                                    </button>
                                )}
                            </div>
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
                            <span className="inline-flex items-center justify-between">
                                <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                                    <CheckCircle2 size={13} />
                                    {resolvedAccountName}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => void copyToClipboard(resolvedAccountName)}
                                    className="text-emerald-700 hover:text-emerald-900 transition-colors"
                                    title="Copy account name"
                                >
                                    <Copy size={13} />
                                </button>
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
                    className="w-full rounded-xl bg-brand-primary text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-60 inline-flex items-center justify-center gap-2 hover:bg-brand-primary-hover transition-colors"
                >
                    <Save size={14} />
                    {saving ? 'Saving...' : 'Save changes'}
                </button>
            </form>

            <section className="hidden md:grid gap-4 lg:grid-cols-2">
                <form onSubmit={handleChangeEmail} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                    <div className="inline-flex items-center gap-2">
                        <Mail size={16} className="text-brand-gray" />
                        <h2 className="font-semibold text-brand-navy">Change email</h2>
                    </div>
                    <p className="text-sm text-slate-500">We&apos;ll send a confirmation link to your old and new email. Check both inboxes to confirm.</p>
                    <div>
                        <label className="block text-xs font-semibold text-brand-gray mb-1">New email address</label>
                        <input
                            type="email"
                            value={pendingEmail}
                            onChange={(e) => setPendingEmail(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                            placeholder="new-email@example.com"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={emailChanging}
                        className="w-full rounded-xl bg-brand-primary text-white px-4 py-2.5 text-sm font-semibold hover:bg-brand-primary-hover disabled:opacity-60"
                    >
                        {emailChanging ? 'Sending...' : 'Update email'}
                    </button>
                </form>

                <form onSubmit={handleChangePassword} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                    <div className="inline-flex items-center gap-2">
                        <KeyRound size={16} className="text-brand-gray" />
                        <h2 className="font-semibold text-brand-navy">Change password</h2>
                    </div>
                    <p className="text-sm text-slate-500">Enter your current password, then choose a new one.</p>

                    <div>
                        <label className="block text-xs font-semibold text-brand-gray mb-1">Current password</label>
                        <div className="relative">
                            <input
                                type={showCurrentPassword ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                            />
                            <button type="button" onClick={() => setShowCurrentPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-navy">
                                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-brand-gray mb-1">New password</label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                            />
                            <button type="button" onClick={() => setShowNewPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-navy">
                                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-brand-gray mb-1">Confirm new password</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                            />
                            <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-navy">
                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-600">
                        <p className="font-semibold text-brand-navy">Password requirements</p>
                        <div className="mt-2 grid gap-1 sm:grid-cols-2">
                            {passwordChecks.map((check) => (
                                <span key={check.label} className={check.valid ? 'text-emerald-700' : 'text-slate-500'}>
                                    {check.valid ? '✓' : '•'} {check.label}
                                </span>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={passwordChanging || !passwordsMatch || !isNewPasswordStrong}
                        className="w-full rounded-xl bg-brand-primary text-white px-4 py-2.5 text-sm font-semibold hover:bg-brand-primary-hover disabled:opacity-60"
                    >
                        {passwordChanging ? 'Updating...' : 'Update password'}
                    </button>
                </form>
            </section>

            <section className="hidden md:block rounded-2xl border border-red-200 bg-white p-5 space-y-4">
                <div className="inline-flex items-center gap-2 text-red-700">
                    <AlertTriangle size={16} />
                    <h2 className="font-semibold">Delete my account</h2>
                </div>
                <p className="text-sm text-slate-600">This will permanently delete your account. You cannot undo this.</p>
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                    <input
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        className="w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        placeholder="Type DELETE ACCOUNT to confirm"
                    />
                    <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={deletingAccount}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                        <Trash2 size={14} />
                        {deletingAccount ? 'Deleting...' : 'Delete account'}
                    </button>
                </div>
            </section>

            <button
                onClick={handleSignOut}
                className="hidden md:inline-flex w-full bg-white border border-red-100 rounded-2xl p-4 text-red-600 hover:bg-red-50 transition-colors items-center justify-center gap-2 text-sm font-semibold"
            >
                <LogOut size={16} />
                Sign Out
            </button>

            {error && <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        </div>
    );
}
