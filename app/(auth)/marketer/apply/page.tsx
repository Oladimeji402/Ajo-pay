'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Check, Eye, EyeOff, Loader2, Upload } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { notifySuccess } from '@/lib/toast';
import { isValidNigeriaPhoneLocal, parseNigeriaPhoneToLocal } from '@/lib/phone';
import { validateCustomReferralCode } from '@/lib/referrals/referral-code';

export default function MarketerApplyPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passportFile, setPassportFile] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [codeHint, setCodeHint] = useState<{ available?: boolean; message: string } | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [pendingEmail, setPendingEmail] = useState('');
    const { showToast } = useToast();

    useEffect(() => {
        const code = referralCode.trim();
        if (code.length < 4) {
            setCodeHint(null);
            return;
        }

        const handle = window.setTimeout(async () => {
            const local = validateCustomReferralCode(code);
            if (!local.ok) {
                setCodeHint({ available: false, message: local.error });
                return;
            }
            try {
                const res = await fetch(`/api/marketers/check-code?code=${encodeURIComponent(local.code)}`);
                const json = await res.json();
                if (json.data?.available) {
                    setCodeHint({ available: true, message: `${local.code} is available` });
                } else {
                    setCodeHint({
                        available: false,
                        message: json.data?.error || 'That referral code is already in use.',
                    });
                }
            } catch {
                setCodeHint(null);
            }
        }, 400);

        return () => window.clearTimeout(handle);
    }, [referralCode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const localPhone = parseNigeriaPhoneToLocal(phone);
        if (!isValidNigeriaPhoneLocal(localPhone)) {
            setError('Enter a valid Nigerian mobile number (e.g. 08012345678).');
            return;
        }

        const codeResult = validateCustomReferralCode(referralCode);
        if (!codeResult.ok) {
            setError(codeResult.error);
            return;
        }

        if (!passportFile) {
            setError('Please upload a clear passport photograph.');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);

        const formData = new FormData();
        formData.append('name', fullName.trim());
        formData.append('email', email.trim().toLowerCase());
        formData.append('phone', localPhone);
        formData.append('password', password);
        formData.append('referralCode', codeResult.code);
        formData.append('passport', passportFile);

        try {
            const res = await fetch('/api/marketers/register', { method: 'POST', body: formData });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Unable to submit application.');

            setPendingEmail(email.trim().toLowerCase());
            setSubmitted(true);
            notifySuccess(showToast, 'Application submitted. You can sign in to track your status.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to submit application.');
        } finally {
            setIsLoading(false);
        }
    };

    if (submitted) {
        return (
            <section className="space-y-5">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-accent">Marketer application</p>
                    <h2 className="mt-2 text-[1.75rem] leading-tight text-brand-navy font-bold">Application received</h2>
                    <p className="mt-2 text-sm text-slate-500">
                        Thanks for applying{pendingEmail ? <> as <span className="font-semibold text-brand-navy">{pendingEmail}</span></> : ''}.
                        Your application is under review. Sign in to track your status and access your portal once approved.
                    </p>
                </div>
                <Link
                    href="/login?next=/marketer"
                    className="inline-flex w-full items-center justify-center rounded-xl bg-brand-navy px-4 py-3 text-sm font-semibold text-white"
                >
                    Go to sign in
                </Link>
            </section>
        );
    }

    return (
        <section className="space-y-5">
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-accent">Become a marketer</p>
                <h2 className="mt-2 text-[1.85rem] leading-tight text-brand-navy">
                    <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400 }}>Apply to </span>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.02em' }}>partner with us.</span>
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Submit your details for review. You will access assigned tasks after an administrator approves your application.
                </p>
            </div>

            {error && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    <p className="inline-flex items-center gap-2 font-medium"><AlertCircle size={16} />{error}</p>
                </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />
                <Input label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />

                <div className="space-y-1">
                    <label htmlFor="marketer-phone" className="block text-sm font-semibold text-brand-navy">Phone number</label>
                    <div className="flex items-center rounded-lg border border-brand-border overflow-hidden focus-within:ring-2 focus-within:ring-brand-primary/20">
                        <span className="px-3 py-3 text-sm text-slate-500 bg-slate-50 border-r border-brand-border">+234</span>
                        <input
                            id="marketer-phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                            placeholder="08012345678"
                            required
                            className="flex-1 px-3 py-3 text-sm focus:outline-none"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <Input
                        label="Your referral code"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20))}
                        placeholder="e.g. ADEOLA2026"
                        required
                        autoComplete="off"
                    />
                    <p className="text-[11px] text-slate-400">Choose something memorable. 4–20 characters, letters, numbers, hyphens.</p>
                    {codeHint && (
                        <p className={`text-xs font-medium inline-flex items-center gap-1 ${codeHint.available ? 'text-emerald-600' : 'text-amber-700'}`}>
                            {codeHint.available && <Check size={12} />}
                            {codeHint.message}
                        </p>
                    )}
                </div>

                <div className="space-y-1">
                    <label className="block text-sm font-semibold text-brand-navy">Passport photograph</label>
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center hover:bg-slate-100">
                        <Upload size={18} className="text-brand-gray" />
                        <span className="text-sm text-brand-navy font-medium">
                            {passportFile ? passportFile.name : 'Upload a clear passport photo (JPEG or PNG)'}
                        </span>
                        <input
                            type="file"
                            accept="image/jpeg,image/png"
                            className="hidden"
                            onChange={(e) => setPassportFile(e.target.files?.[0] ?? null)}
                        />
                    </label>
                </div>

                <div className="space-y-1 relative">
                    <label htmlFor="marketer-password" className="block text-sm font-semibold text-brand-navy">Password</label>
                    <input
                        id="marketer-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="block w-full px-4 py-3 pr-12 rounded-lg border border-brand-border text-sm"
                    />
                    <button type="button" className="absolute right-3 top-9 text-slate-400" onClick={() => setShowPassword((v) => !v)}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                <div className="space-y-1 relative">
                    <label htmlFor="marketer-confirm" className="block text-sm font-semibold text-brand-navy">Confirm password</label>
                    <input
                        id="marketer-confirm"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="block w-full px-4 py-3 pr-12 rounded-lg border border-brand-border text-sm"
                    />
                    <button type="button" className="absolute right-3 top-9 text-slate-400" onClick={() => setShowConfirmPassword((v) => !v)}>
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                <Button type="submit" className="w-full bg-brand-navy text-white" disabled={isLoading || codeHint?.available === false}>
                    {isLoading ? <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Submitting...</span> : 'Submit application'}
                </Button>
            </form>

            <div className="border-t border-slate-100 pt-4 space-y-2 text-center text-sm text-slate-500">
                <p>
                    Already applied?{' '}
                    <Link href="/login?next=/marketer" className="font-semibold text-brand-navy hover:text-brand-accent">Sign in</Link>
                </p>
                <p>
                    Looking for a savings account?{' '}
                    <Link href="/signup" className="font-semibold text-brand-navy hover:text-brand-accent">User signup</Link>
                </p>
            </div>
        </section>
    );
}
