'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { motion } from 'motion/react';
import { AlertCircle, Check, CheckCircle2, Eye, EyeOff, Loader2, Mail, X } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { notifySuccess } from '@/lib/toast';
import { isDuplicateSignupWithoutError, mapAuthError } from '@/lib/auth-errors';
import { formatNigeriaPhoneE164, isValidNigeriaPhoneLocal, parseNigeriaPhoneToLocal } from '@/lib/phone';

export default function SignUpPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [pendingEmail, setPendingEmail] = useState('');
    const [verificationMode, setVerificationMode] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const { showToast } = useToast();

    const getEmailRedirectUrl = () => {
        const base = typeof window !== 'undefined' ? window.location.origin : process.env.APP_URL ?? '';
        return `${base}/api/auth/callback?next=/dashboard`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setNotice('');

        const localPhone = parseNigeriaPhoneToLocal(phone);
        if (!isValidNigeriaPhoneLocal(localPhone)) {
            const message = 'Enter a valid Nigerian mobile number (e.g. 08012345678).';
            setError(message);
            showToast(message, { type: 'error' });
            return;
        }
        const phoneE164 = formatNigeriaPhoneE164(localPhone);

        setIsLoading(true);

        const supabase = createSupabaseBrowserClient();
        const normalizedEmail = email.trim().toLowerCase();

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
                emailRedirectTo: getEmailRedirectUrl(),
                data: {
                    name: fullName.trim(),
                    phone: phoneE164,
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

        if (isDuplicateSignupWithoutError(signUpData)) {
            const message = 'An account with this email already exists. Please sign in instead.';
            setError(message);
            showToast(message, { type: 'error' });
            setIsLoading(false);
            return;
        }

        await supabase.auth.signOut();
        setPendingEmail(normalizedEmail);
        setVerificationMode(true);
        notifySuccess(showToast, 'Verification link sent! Check your inbox.');
        setIsLoading(false);
    };

    const handleResendLink = async () => {
        setError('');
        setNotice('');
        setIsResending(true);

        const supabase = createSupabaseBrowserClient();

        const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email: pendingEmail,
            options: {
                emailRedirectTo: getEmailRedirectUrl(),
            },
        });

        if (resendError) {
            const message = mapAuthError(resendError, 'Failed to resend verification link.');
            setError(message);
            showToast(message, { type: 'error' });
            setIsResending(false);
            return;
        }

        const resendNotice = 'A new verification link has been sent to your email.';
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

    // ── Verification screen ────────────────────────────────────────────────
    if (verificationMode) {
        return (
            <section aria-labelledby="verify-title" className="space-y-6">
                <div className="flex flex-col items-center text-center space-y-4 pt-2">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary/10">
                        <Mail size={28} className="text-brand-primary" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-accent">One more step</p>
                        <h2 id="verify-title" className="mt-2 text-[1.85rem] leading-tight text-brand-navy">
                            <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400 }}>Check your </span>
                            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.02em' }}>inbox.</span>
                        </h2>
                        <p className="mt-2 text-sm text-slate-500 max-w-xs mx-auto">
                            We sent a verification link to{' '}
                            <span className="font-semibold text-brand-navy">{pendingEmail}</span>.
                            Click the link in that email to activate your account.
                        </p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                    {[
                        { step: '1', text: 'Open the email from AjoFlow' },
                        { step: '2', text: 'Click the "Verify my email" button' },
                        { step: '3', text: "You'll be redirected to your dashboard automatically" },
                    ].map(({ step, text }) => (
                        <div key={step} className="flex items-center gap-3">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-primary text-[11px] font-bold text-white">
                                {step}
                            </div>
                            <p className="text-sm text-slate-600">{text}</p>
                        </div>
                    ))}
                </div>

                {notice && (
                    <div role="status" aria-live="polite" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 flex items-center gap-2 text-sm text-emerald-700">
                        <CheckCircle2 size={15} className="shrink-0" />
                        {notice}
                    </div>
                )}

                {error && (
                    <div role="alert" aria-live="assertive" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        <p className="inline-flex items-center gap-2 font-medium"><AlertCircle size={16} />{error}</p>
                    </div>
                )}

                <button
                    type="button"
                    onClick={handleResendLink}
                    disabled={isResending}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-brand-navy disabled:opacity-50 transition-colors"
                >
                    {isResending ? (
                        <><Loader2 size={15} className="animate-spin" /> Sending...</>
                    ) : (
                        <><Mail size={15} /> Resend verification email</>
                    )}
                </button>

                <div className="border-t border-slate-100 pt-4">
                    <p className="text-center text-sm text-slate-500">
                        Wrong email?{' '}
                        <button
                            type="button"
                            onClick={() => { setVerificationMode(false); setError(''); setNotice(''); }}
                            className="font-semibold text-brand-navy hover:text-brand-accent transition-colors"
                        >
                            Go back and edit
                        </button>
                    </p>
                </div>

                <p className="text-center text-xs text-slate-400">
                    Can&apos;t find the email? Check your spam or junk folder.
                </p>
            </section>
        );
    }

    // ── Signup form ────────────────────────────────────────────────────────
    return (
        <section aria-labelledby="signup-title" className="space-y-5">
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-accent">Sign up</p>
                <h2 id="signup-title" className="mt-2 text-[1.85rem] leading-tight text-brand-navy">
                    <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400 }}>Create your </span>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.02em' }}>account.</span>
                </h2>
                <p className="mt-1 text-sm text-slate-500">Start saving with your community in minutes.</p>
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
                <Input label="Full name" type="text" autoComplete="name" placeholder="Your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                <Input label="Email address" type="email" autoComplete="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />

                <div className="space-y-1 w-full">
                    <label htmlFor="signup-phone" className="block text-sm font-semibold text-brand-navy">Phone number</label>
                    <div className="flex items-center rounded-lg border border-brand-border focus-within:ring-2 focus-within:ring-brand-primary/20 focus-within:border-brand-primary transition-all duration-200 overflow-hidden">
                        <span className="px-3 py-3 text-sm text-slate-500 bg-slate-50 border-r border-brand-border select-none">+234</span>
                        <input
                            id="signup-phone"
                            type="tel"
                            inputMode="numeric"
                            autoComplete="tel"
                            placeholder="08012345678"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                            required
                            maxLength={11}
                            className="flex-1 px-3 py-3 text-sm text-brand-navy placeholder-slate-400 bg-white focus:outline-none"
                        />
                    </div>
                    <p className="text-[11px] text-slate-400">Your permanent account number will be linked to this.</p>
                </div>

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
                                onClick={() => setShowPassword((v) => !v)}
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
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${strengthPercent <= 25 ? 'text-red-500' : strengthPercent <= 50 ? 'text-amber-500' : strengthPercent <= 75 ? 'text-blue-500' : 'text-emerald-500'}`}>
                                    {strengthLabel}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                {passwordChecks.map((check, i) => (
                                    <div key={i} className="flex items-center gap-1.5">
                                        {check.valid
                                            ? <Check size={12} className="text-emerald-500 shrink-0" />
                                            : <X size={12} className="text-slate-300 shrink-0" />
                                        }
                                        <span className={`text-[11px] ${check.valid ? 'text-emerald-600' : 'text-slate-400'}`}>
                                            {check.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>

                <div className="flex items-start gap-3 pt-1">
                    <label className="relative mt-0.5 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            className="sr-only peer"
                            required
                        />
                        <div className="h-5 w-5 rounded border-2 border-slate-300 peer-checked:border-brand-accent peer-checked:bg-brand-accent transition-all flex items-center justify-center shrink-0">
                            {agreedToTerms && (
                                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                    <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </div>
                    </label>
                    <span className="text-sm text-slate-600 leading-relaxed">
                        I agree to AjoFlow&apos;s{' '}
                        <Link href="/terms" className="font-semibold text-brand-navy underline decoration-dotted underline-offset-4 hover:text-brand-primary transition-colors">Terms of Service</Link>
                        {' '}and{' '}
                        <Link href="/privacy" className="font-semibold text-brand-navy underline decoration-dotted underline-offset-4 hover:text-brand-primary transition-colors">Privacy Policy</Link>
                    </span>
                </div>

                <Button
                    type="submit"
                    className="w-full bg-brand-accent text-brand-navy hover:bg-[#FBBF24] focus-visible:ring-brand-accent shadow-[0_10px_24px_rgba(245,158,11,0.25)]"
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
                    <Link href="/login" className="font-semibold text-brand-navy hover:text-brand-accent transition-colors">
                        Sign in
                    </Link>
                </p>
            </div>
        </section>
    );
}
