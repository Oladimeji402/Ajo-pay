'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [email, setEmail] = useState('');
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const supabase = createSupabaseBrowserClient();
        const redirectTo = `${window.location.origin}/reset-password`;
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo,
        });

        if (resetError) {
            notifyError(showToast, resetError, 'Unable to send reset instructions.');
            setIsLoading(false);
            return;
        }

        setIsLoading(false);
        setIsSubmitted(true);
        notifySuccess(showToast, 'Password reset instructions sent. Check your email.');
    };

    if (isSubmitted) {
        return (
            <section aria-labelledby="email-sent-title" className="space-y-6">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0f766e]">Email sent</p>
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
                        className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#0f766e] shadow-md"
                    >
                        <CheckCircle2 size={13} className="text-white" />
                    </motion.div>
                </motion.div>

                <p className="text-[13px] leading-relaxed text-slate-500">
                    If this email is registered, a reset link will arrive shortly. Also check your spam folder.
                </p>

                <div className="space-y-3">
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
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0f766e]">Password recovery</p>
                <h2 id="forgot-title" className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-brand-navy" style={{ fontFamily: 'var(--font-auth-heading)' }}>
                    Forgot your password?
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Enter your email and we&apos;ll send a reset link.
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
                    ) : 'Send reset link'}
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

