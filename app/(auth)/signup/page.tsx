'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { motion } from 'motion/react';
import { AlertCircle, Check, CheckCircle2, Eye, EyeOff, Loader2, X } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { notifySuccess } from '@/lib/toast';
import { mapAuthError } from '@/lib/auth-errors';

export default function SignUpPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [pendingEmail, setPendingEmail] = useState('');
    const [verificationMode, setVerificationMode] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const router = useRouter();
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setNotice('');
        setIsLoading(true);

        const supabase = createSupabaseBrowserClient();

        const fullName = `${firstName} ${lastName}`.trim();
        const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: fullName,
                    phone,
                },
            },
        });

        if (signUpError) {
            const message = mapAuthError(signUpError, 'Unable to create account right now.');
            setError(message);
            showToast(message, { type: 'error' });
            setIsLoading(false);
            return;
        }

        await supabase.auth.signOut();
        setPendingEmail(email.trim());
        setIsVerified(false);
        setVerificationMode(true);
        const otpNotice = 'A 6-digit OTP has been sent to your email. Enter it below to verify your account.';
        setNotice(otpNotice);
        notifySuccess(showToast, otpNotice);
        setIsLoading(false);
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isVerified) {
            return;
        }

        setError('');
        setNotice('');

        if (!/^\d{6}$/.test(otp.trim())) {
            const message = 'Enter a valid 6-digit OTP code.';
            setError(message);
            showToast(message, { type: 'error' });
            return;
        }

        setIsVerifying(true);
        const supabase = createSupabaseBrowserClient();
        const { error: verifyError } = await supabase.auth.verifyOtp({
            email: pendingEmail,
            token: otp.trim(),
            type: 'signup',
        });

        if (verifyError) {
            const message = mapAuthError(verifyError, 'OTP verification failed.');
            setError(message);
            showToast(message, { type: 'error' });
            setIsVerifying(false);
            return;
        }

        setIsVerified(true);
        notifySuccess(showToast, 'Email verified successfully. Continue onboarding.');
        router.push('/onboarding');
    };

    const handleResendOtp = async () => {
        setError('');
        setNotice('');
        setIsResending(true);

        const supabase = createSupabaseBrowserClient();

        const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email: pendingEmail,
        });

        if (resendError) {
            const message = mapAuthError(resendError, 'Failed to resend OTP.');
            setError(message);
            showToast(message, { type: 'error' });
            setIsResending(false);
            return;
        }

        const resendNotice = 'A new OTP has been sent to your email.';
        setNotice(resendNotice);
        notifySuccess(showToast, resendNotice);
        setIsResending(false);
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

    if (verificationMode) {
        return (
            <section aria-labelledby="verify-title" className="space-y-6">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0f766e]">Step 2 of 2</p>
                    <h2 id="verify-title" className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-brand-navy" style={{ fontFamily: 'var(--font-auth-heading)' }}>Check your inbox.</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        We sent a 6-digit code to{' '}
                        <span className="font-semibold text-brand-navy">{pendingEmail}</span>.
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

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <Input
                        label="Verification code"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        placeholder="— — — — — —"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        required
                    />

                    <Button type="submit" className="w-full" disabled={isVerifying || isVerified}>
                        {isVerifying || isVerified ? (
                            <span className="flex items-center gap-2">
                                <Loader2 size={16} className="animate-spin" />
                                {isVerified ? 'Verified — redirecting...' : 'Verifying...'}
                            </span>
                        ) : 'Verify & continue'}
                    </Button>

                    <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isResending || isVerified}
                        className="w-full text-sm font-medium text-slate-500 hover:text-brand-navy transition-colors disabled:opacity-50"
                    >
                        {isResending ? 'Sending...' : "Didn't receive a code? Resend"}
                    </button>
                </form>

                <div className="border-t border-slate-100 pt-5">
                    <p className="text-center text-sm text-slate-500">
                        Wrong email?{' '}
                        <button
                            type="button"
                            onClick={() => {
                                setVerificationMode(false);
                                setIsVerified(false);
                                setOtp('');
                                setError('');
                                setNotice('');
                            }}
                            className="font-semibold text-brand-navy hover:text-[#0f766e] transition-colors"
                        >
                            Go back and edit
                        </button>
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section aria-labelledby="signup-title" className="space-y-5">
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0f766e]">Step 1 of 2</p>
                <h2 id="signup-title" className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-brand-navy" style={{ fontFamily: 'var(--font-auth-heading)' }}>Join your circle.</h2>
                <p className="mt-1 text-sm text-slate-500">Create your AjoPay account.</p>
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

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-2 gap-3">
                    <Input label="First name" type="text" autoComplete="given-name" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                    <Input label="Last name" type="text" autoComplete="family-name" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>

                <Input label="Email address" type="email" autoComplete="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <Input label="Phone number" type="tel" autoComplete="tel" placeholder="+234 800 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} required />

                <div>
                    <div className="space-y-1 w-full">
                        <label htmlFor="signup-password" className="block text-sm font-semibold text-brand-navy">Password</label>
                        <div className="relative">
                            <input
                                id="signup-password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Create a strong password"
                                required
                                className="block w-full px-4 py-3 pr-12 rounded-lg border border-brand-border text-brand-navy placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200"
                            />
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
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-3 space-y-2.5"
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${strengthPercent}%` }}
                                        className={`h-full rounded-full transition-colors ${strengthColor}`}
                                    />
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${strengthPercent <= 25 ? 'text-red-500' : strengthPercent <= 50 ? 'text-amber-500' : strengthPercent <= 75 ? 'text-blue-500' : 'text-emerald-500'
                                    }`}>
                                    {strengthLabel}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                {passwordChecks.map((check, i) => (
                                    <div key={i} className="flex items-center gap-1.5">
                                        {check.valid ? (
                                            <Check size={12} className="text-emerald-500 shrink-0" />
                                        ) : (
                                            <X size={12} className="text-slate-300 shrink-0" />
                                        )}
                                        <span className={`text-[11px] ${check.valid ? 'text-emerald-600' : 'text-slate-400'}`}>
                                            {check.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Terms */}
                <div className="flex items-start gap-3 pt-1">
                    <label className="relative mt-0.5 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            className="sr-only peer"
                            required
                        />
                        <div className="h-5 w-5 rounded border-2 border-slate-300 peer-checked:border-brand-emerald peer-checked:bg-brand-emerald transition-all flex items-center justify-center shrink-0">
                            {agreedToTerms && (
                                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                    <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </div>
                    </label>
                    <span className="text-sm text-slate-600 leading-relaxed">
                        I agree to Ajopay&apos;s{' '}
                        <a href="#" className="font-semibold text-brand-navy underline decoration-dotted underline-offset-4 hover:text-brand-primary transition-colors">Terms of Service</a>
                        {' '}and{' '}
                        <a href="#" className="font-semibold text-brand-navy underline decoration-dotted underline-offset-4 hover:text-brand-primary transition-colors">Privacy Policy</a>
                    </span>
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || !agreedToTerms}
                >
                    {isLoading ? (
                        <span className="flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin" />
                            Creating account...
                        </span>
                    ) : 'Create account'}
                </Button>

            </form>

            <div className="border-t border-slate-100 pt-5">
                <p className="text-center text-sm text-slate-500">
                    Already have an account?{' '}
                    <Link
                        href="/login"
                        className="font-semibold text-brand-navy hover:text-[#0f766e] transition-colors"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
            {isVerified && (
                <p className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    <CheckCircle2 size={16} />
                    Email verified successfully. Redirecting to onboarding.
                </p>
            )}
        </section>
    );
}
