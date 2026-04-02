'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';
import { mapAuthError } from '@/lib/auth-errors';

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [email, setEmail] = useState('');
    const router = useRouter();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
    const isLocalSupabase = supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost');
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const normalizedEmail = email.trim();

        if (!normalizedEmail) {
            notifyError(showToast, new Error('Please enter your email address.'), 'Please enter your email address.');
            return;
        }

        setIsLoading(true);

        const supabase = createSupabaseBrowserClient();
        const { error: otpError } = await supabase.auth.signInWithOtp({
            email: normalizedEmail,
            options: {
                shouldCreateUser: false,
            },
        });

        if (otpError) {
            const message = mapAuthError(otpError, 'Unable to send reset OTP.');
            notifyError(showToast, new Error(message), message);
            setIsLoading(false);
            return;
        }

        setIsLoading(false);
        setIsSubmitted(true);
        notifySuccess(showToast, 'Password reset OTP sent. Check your email.');
    };

    if (isSubmitted) {
        return (
            <section aria-labelledby="email-sent-title" className="space-y-6">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1D4ED8]">Email sent</p>
                    <h2 id="email-sent-title" className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-brand-navy" style={{ fontFamily: 'var(--font-auth-heading)' }}>
                        Check your inbox.
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Instructions on the way to{' '}
                        <span className="font-semibold text-brand-navy">{email}</span>.
                    </p>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                    className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50"
                >
                    <Mail size={30} className="text-brand-navy" />
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
                        className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#1D4ED8] shadow-md"
                    >
                        <CheckCircle2 size={13} className="text-white" />
                    </motion.div>
                </motion.div>

                <p className="text-[13px] leading-relaxed text-slate-500">
                    If this email is registered, a recovery OTP will arrive shortly. Also check your spam folder.
                </p>

                {isLocalSupabase && (
                    <p className="text-[12px] leading-relaxed text-slate-500">
                        Local Supabase detected: check test emails at <span className="font-semibold text-brand-navy">http://127.0.0.1:54324</span> (Inbucket).
                    </p>
                )}

                <div className="space-y-3">
                    <button
                        onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email.trim())}`)}
                        className="inline-flex w-full items-center justify-center rounded-xl border border-[#1D4ED8]/20 bg-[#1D4ED8]/5 px-4 py-2.5 text-sm font-semibold text-[#1D4ED8] hover:bg-[#1D4ED8]/10 transition-colors"
                    >
                        I have the OTP code
                    </button>
                    <button
                        onClick={() => setIsSubmitted(false)}
                        className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-navy shadow-sm hover:bg-slate-50 transition-colors"
                    >
                        Try a different email
                    </button>
                    <div className="text-center">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-navy transition-colors"
                        >
                            <ArrowLeft size={15} />
                            Back to sign in
                        </Link>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section aria-labelledby="forgot-title" className="space-y-6">
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1D4ED8]">Password recovery</p>
                <h2 id="forgot-title" className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-brand-navy" style={{ fontFamily: 'var(--font-auth-heading)' }}>
                    Forgot your password?
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Enter your email and we&apos;ll send a password reset OTP.
                </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <Input
                    label="Email address"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    required
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                />

                <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <span className="flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin" />
                            Sending...
                        </span>
                    ) : 'Send reset OTP'}
                </Button>
            </form>

            <div className="border-t border-slate-100 pt-5 text-center">
                <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-navy transition-colors"
                >
                    <ArrowLeft size={15} />
                    Back to sign in
                </Link>
            </div>
        </section>
    );
}

