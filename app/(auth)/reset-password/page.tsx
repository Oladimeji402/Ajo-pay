'use client';

import React, { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, Check, CheckCircle2, Eye, EyeOff, Loader2, X } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';
import { mapAuthError } from '@/lib/auth-errors';

function ResetPasswordContent() {
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isOtpVerified, setIsOtpVerified] = useState(false);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();

    React.useEffect(() => {
        const emailFromQuery = searchParams.get('email');
        if (emailFromQuery) {
            setEmail(emailFromQuery.trim());
        }
    }, [searchParams]);

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setNotice('');

        const normalizedEmail = email.trim();

        if (!normalizedEmail) {
            const message = 'Enter the email address used for your account.';
            setError(message);
            notifyError(showToast, new Error(message), message);
            return;
        }

        if (!/^\d{6}$/.test(otp.trim())) {
            const message = 'Enter a valid 6-digit OTP code.';
            setError(message);
            notifyError(showToast, new Error(message), message);
            return;
        }

        setIsVerifyingOtp(true);
        const supabase = createSupabaseBrowserClient();
        const { error: verifyError } = await supabase.auth.verifyOtp({
            email: normalizedEmail,
            token: otp.trim(),
            type: 'email',
        });

        if (verifyError) {
            const message = mapAuthError(verifyError, 'OTP verification failed.');
            notifyError(showToast, new Error(message), message);
            setError(message);
            setIsVerifyingOtp(false);
            return;
        }

        setIsOtpVerified(true);
        setNotice('OTP verified. You can now set a new password.');
        notifySuccess(showToast, 'OTP verified. Set your new password.');
        setIsVerifyingOtp(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setNotice('');

        if (!isOtpVerified) {
            const message = 'Verify your OTP before resetting password.';
            setError(message);
            notifyError(showToast, new Error(message), message);
            return;
        }

        if (password !== confirmPassword) {
            const message = 'Passwords do not match.';
            setError(message);
            notifyError(showToast, new Error(message), message);
            return;
        }

        setIsLoading(true);

        const supabase = createSupabaseBrowserClient();
        const { error: updateError } = await supabase.auth.updateUser({
            password,
        });

        if (updateError) {
            const message = mapAuthError(updateError, 'Unable to update your password.');
            notifyError(showToast, new Error(message), message);
            setIsLoading(false);
            return;
        }

        setIsLoading(false);
        setIsSuccess(true);
        notifySuccess(showToast, 'Password updated successfully.');
    };

    const handleResendOtp = async () => {
        setError('');
        setNotice('');

        const normalizedEmail = email.trim();

        if (!normalizedEmail) {
            const message = 'Enter your email address first to resend OTP.';
            setError(message);
            notifyError(showToast, new Error(message), message);
            return;
        }

        setIsVerifyingOtp(true);
        const supabase = createSupabaseBrowserClient();
        const { error: resendError } = await supabase.auth.signInWithOtp({
            email: normalizedEmail,
            options: {
                shouldCreateUser: false,
            },
        });

        if (resendError) {
            const message = mapAuthError(resendError, 'Failed to resend OTP.');
            notifyError(showToast, new Error(message), message);
            setError(message);
            setIsVerifyingOtp(false);
            return;
        }

        const message = 'A new OTP has been sent to your email.';
        setNotice(message);
        notifySuccess(showToast, message);
        setIsVerifyingOtp(false);
    };

    const passwordChecks = useMemo(() => [
        { label: 'At least 8 characters', valid: password.length >= 8 },
        { label: 'One uppercase letter', valid: /[A-Z]/.test(password) },
        { label: 'One number', valid: /[0-9]/.test(password) },
        { label: 'One special character', valid: /[^A-Za-z0-9]/.test(password) },
    ], [password]);

    const strengthPercent = (passwordChecks.filter(c => c.valid).length / passwordChecks.length) * 100;
    const strengthColor = strengthPercent <= 25 ? 'bg-red-500' : strengthPercent <= 50 ? 'bg-amber-500' : strengthPercent <= 75 ? 'bg-blue-500' : 'bg-emerald-500';
    const strengthLabel = strengthPercent <= 25 ? 'Weak' : strengthPercent <= 50 ? 'Fair' : strengthPercent <= 75 ? 'Good' : 'Strong';

    const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
    const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;
    // Lock the email field permanently once the OTP flow has started (OTP typed, verifying, or verified).
    // This prevents the "email swap" attack where an attacker verifies OTP for one email
    // then changes the email field to reset a different account's password.
    const isEmailLockedForOtp = isOtpVerified || otp.trim().length > 0 || isVerifyingOtp;

    if (isSuccess) {
        return (
            <section aria-labelledby="reset-success-title" className="space-y-6">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1D4ED8]">All done</p>
                    <h2 id="reset-success-title" className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-brand-navy" style={{ fontFamily: 'var(--font-auth-heading)' }}>
                        Password updated.
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        You can now sign in with your new password.
                    </p>
                </div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                    className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50"
                >
                    <CheckCircle2 size={32} className="text-[#1D4ED8]" />
                </motion.div>
                <Button onClick={() => router.push('/login')} className="w-full">
                    Sign in
                </Button>
            </section>
        );
    }

    return (
        <section aria-labelledby="reset-title" className="space-y-6">
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1D4ED8]">Password reset</p>
                <h2 id="reset-title" className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-brand-navy" style={{ fontFamily: 'var(--font-auth-heading)' }}>
                    {isOtpVerified ? 'Set a new password.' : 'Verify your OTP.'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    {isOtpVerified ? 'Choose a secure password for your account.' : 'Enter the OTP sent to your email to continue.'}
                </p>
            </div>

            {notice && (
                <div role="status" aria-live="polite" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    {notice}
                </div>
            )}

            {error && (
                <div role="alert" aria-live="assertive" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    <p className="inline-flex items-center gap-2 font-medium"><AlertCircle size={16} />{error}</p>
                </div>
            )}

            <AnimatePresence mode="wait" initial={false}>
                {!isOtpVerified ? (
                    <motion.form
                        key="otp-step"
                        className="space-y-4"
                        onSubmit={handleVerifyOtp}
                        noValidate
                        initial={{ opacity: 0, x: 18 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -18 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                    >
                        <Input
                            label="Email address"
                            type="email"
                            autoComplete="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isEmailLockedForOtp}
                        />

                        {isEmailLockedForOtp && (
                            <p className="text-[11px] text-slate-500">Email is locked for this session for security.</p>
                        )}

                        <Input
                            label="Recovery OTP"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]{6}"
                            maxLength={6}
                            placeholder="Enter 6-digit code"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            required
                        />

                        <Button type="submit" className="w-full" disabled={isVerifyingOtp}>
                            {isVerifyingOtp ? (
                                <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" />Verifying OTP...</span>
                            ) : 'Verify OTP'}
                        </Button>

                        <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={isVerifyingOtp}
                            className="w-full text-sm font-medium text-slate-500 hover:text-brand-navy transition-colors disabled:opacity-50"
                        >
                            {isVerifyingOtp ? 'Please wait...' : "Didn't receive OTP? Resend"}
                        </button>
                    </motion.form>
                ) : (
                    <motion.form
                        key="password-step"
                        className="space-y-4"
                        onSubmit={handleSubmit}
                        noValidate
                        initial={{ opacity: 0, x: 18 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -18 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                    >
                        <div>
                            <div className="space-y-1 w-full">
                                <label htmlFor="reset-new-password" className="block text-sm font-semibold text-brand-navy">New Password</label>
                                <div className="relative">
                                    <input id="reset-new-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a strong password" required className="block w-full px-4 py-3 pr-12 rounded-lg border border-brand-border text-brand-navy placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200" />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((current) => !current)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-brand-navy transition-colors"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                            {password.length > 0 && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 space-y-2.5">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${strengthPercent}%` }} className={`h-full rounded-full transition-colors ${strengthColor}`} />
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${strengthPercent <= 25 ? 'text-red-500' : strengthPercent <= 50 ? 'text-amber-500' : strengthPercent <= 75 ? 'text-blue-500' : 'text-emerald-500'}`}>{strengthLabel}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                        {passwordChecks.map((check, i) => (
                                            <div key={i} className="flex items-center gap-1.5">
                                                {check.valid ? <Check size={12} className="text-emerald-500 shrink-0" /> : <X size={12} className="text-slate-300 shrink-0" />}
                                                <span className={`text-[11px] ${check.valid ? 'text-emerald-600' : 'text-slate-400'}`}>{check.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        <div>
                            <div className="space-y-1 w-full">
                                <label htmlFor="reset-confirm-password" className="block text-sm font-semibold text-brand-navy">Confirm New Password</label>
                                <div className="relative">
                                    <input id="reset-confirm-password" type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" required className={`block w-full px-4 py-3 pr-20 rounded-lg border text-brand-navy placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 ${passwordsMismatch ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400' : passwordsMatch ? 'border-emerald-300 focus:ring-emerald-500/20 focus:border-emerald-400' : 'border-brand-border focus:ring-brand-primary/20 focus:border-brand-primary'}`} />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword((current) => !current)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-brand-navy transition-colors"
                                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                    {passwordsMatch && <div className="absolute right-11 top-1/2 -translate-y-1/2"><Check size={16} className="text-emerald-500" /></div>}
                                </div>
                            </div>
                            {passwordsMismatch && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] text-red-500 font-medium mt-1.5">Passwords don&apos;t match</motion.p>}
                        </div>

                        <div className="pt-1">
                            <Button type="submit" className="w-full" disabled={isLoading || !isOtpVerified || !passwordsMatch || strengthPercent < 75}>
                                {isLoading ? <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" />Updating password...</span> : 'Reset password'}
                            </Button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>
        </section>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense
            fallback={
                <section aria-labelledby="reset-title" className="space-y-6">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1D4ED8]">Password reset</p>
                        <h2 id="reset-title" className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-brand-navy" style={{ fontFamily: 'var(--font-auth-heading)' }}>
                            Loading reset form...
                        </h2>
                    </div>
                </section>
            }
        >
            <ResetPasswordContent />
        </Suspense>
    );
}
