'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { motion } from 'motion/react';
import { Check, CheckCircle2, Loader2, X } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';

export default function ResetPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const router = useRouter();
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const supabase = createSupabaseBrowserClient();
        const { error: updateError } = await supabase.auth.updateUser({
            password,
        });

        if (updateError) {
            notifyError(showToast, updateError, 'Unable to update your password.');
            setIsLoading(false);
            return;
        }

        setIsLoading(false);
        setIsSuccess(true);
        notifySuccess(showToast, 'Password updated successfully.');
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

    if (isSuccess) {
        return (
            <section aria-labelledby="reset-success-title" className="space-y-6">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0f766e]">All done</p>
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
                    <CheckCircle2 size={32} className="text-[#0f766e]" />
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
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0f766e]">Password reset</p>
                <h2 id="reset-title" className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-brand-navy" style={{ fontFamily: 'var(--font-auth-heading)' }}>
                    Set a new password.
                </h2>
                <p className="mt-1 text-sm text-slate-500">Make it strong — your circle depends on it.</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <div>
                    <div className="space-y-1 w-full">
                        <label htmlFor="reset-new-password" className="block text-sm font-semibold text-brand-navy">New Password</label>
                        <input id="reset-new-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a strong password" required className="block w-full px-4 py-3 rounded-lg border border-brand-border text-brand-navy placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200" />
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
                            <input id="reset-confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" required className={`block w-full px-4 py-3 rounded-lg border text-brand-navy placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 ${passwordsMismatch ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400' : passwordsMatch ? 'border-emerald-300 focus:ring-emerald-500/20 focus:border-emerald-400' : 'border-brand-border focus:ring-brand-primary/20 focus:border-brand-primary'}`} />
                            {passwordsMatch && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Check size={16} className="text-emerald-500" /></div>}
                        </div>
                    </div>
                    {passwordsMismatch && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] text-red-500 font-medium mt-1.5">Passwords don&apos;t match</motion.p>}
                </div>

                <div className="pt-1">
                    <Button type="submit" className="w-full" disabled={isLoading || !passwordsMatch || strengthPercent < 75}>
                        {isLoading ? <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" />Updating password...</span> : 'Reset password'}
                    </Button>
                </div>
            </form>
        </section>
    );
}
