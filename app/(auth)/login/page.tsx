'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Loader2 } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';
import { mapAuthError } from '@/lib/auth-errors';

/** Only redirect to same-origin paths to prevent open-redirect attacks. */
function getSafeRedirect(raw: string | null): string {
    if (!raw) return '/dashboard';
    try {
        const url = new URL(raw, window.location.origin);
        if (url.origin === window.location.origin) return url.pathname + url.search;
    } catch {
        // not a valid URL — ignore
    }
    return '/dashboard';
}

function LoginContent() {
    const [isLoading, setIsLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [formError, setFormError] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setIsLoading(true);

        const supabase = createSupabaseBrowserClient({ persistSession: rememberMe });
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (signInError) {
            const message = mapAuthError(signInError, 'Unable to sign in with those credentials.');
            setFormError(message);
            notifyError(showToast, new Error(message), message);
            setIsLoading(false);
            return;
        }

        notifySuccess(showToast, rememberMe ? 'Signed in successfully. Redirecting...' : 'Signed in for this browser session only. Redirecting...');
        const redirect = getSafeRedirect(searchParams.get('next'));
        window.location.href = redirect;
    };

    return (
        <section aria-labelledby="login-title" className="space-y-6">

            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1D4ED8]">Sign in</p>
                <h2 id="login-title" className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-brand-navy" style={{ fontFamily: 'var(--font-auth-heading)' }}>
                    Welcome back.
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Enter your details to continue.
                </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <Input
                    label="Email address"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="login-password" className="text-sm font-semibold text-brand-navy">Password</label>
                        <Link
                            href="/forgot-password"
                            className="text-xs font-medium text-slate-500 hover:text-brand-navy transition-colors"
                        >
                            Forgot password?
                        </Link>
                    </div>
                    <Input
                        id="login-password"
                        label=""
                        type="password"
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {formError && (
                    <div role="alert" aria-live="assertive" className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <span className="font-medium">{formError}</span>
                    </div>
                )}

                <div className="flex items-center gap-2.5 pt-1">
                    <label className="relative flex cursor-pointer items-center gap-2.5 text-sm text-slate-600">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="h-4 w-4 shrink-0 rounded border-2 border-slate-300 peer-checked:border-brand-emerald peer-checked:bg-brand-emerald transition-all flex items-center justify-center">
                            {rememberMe && (
                                <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                                    <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </div>
                        Keep me signed in
                    </label>
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <span className="flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin" />
                            Signing in...
                        </span>
                    ) : 'Sign in'}
                </Button>
            </form>

            <div className="border-t border-slate-100 pt-5">
                <p className="text-center text-sm text-slate-500">
                    New to Subtech Ajo Solution?{' '}
                    <Link
                        href="/signup"
                        className="font-semibold text-brand-navy hover:text-[#1D4ED8] transition-colors"
                    >
                        Create an account
                    </Link>
                </p>
            </div>
        </section>
    );
}
export default function LoginPage() {
    return (
        <Suspense fallback={
            <section aria-labelledby="login-title" className="space-y-6">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1D4ED8]">Sign in</p>
                    <h2 id="login-title" className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-brand-navy">
                        Welcome back.
                    </h2>
                </div>
            </section>
        }>
            <LoginContent />
        </Suspense>
    );
}
