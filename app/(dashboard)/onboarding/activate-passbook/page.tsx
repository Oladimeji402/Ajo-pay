'use client';

import React, { useState } from 'react';
import { BookOpen, CheckCircle2, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { openPaystackInline } from '@/lib/paystack-inline';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess, notifyWarning } from '@/lib/toast';

const PASSBOOK_FEE = 500;

export default function ActivatePassbookPage() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleActivate = async () => {
        setLoading(true);
        try {
            const initRes = await fetch('/api/payments/passbook-activation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const initJson = await initRes.json();

            if (initRes.status === 409) {
                notifySuccess(showToast, 'Your passbook is already active!');
                window.location.href = '/dashboard';
                return;
            }

            if (!initRes.ok) {
                throw new Error(initJson.error || 'Could not initialise payment.');
            }

            const { reference, accessCode, authorizationUrl, email } = initJson.data as {
                reference: string;
                accessCode: string;
                authorizationUrl: string;
                email: string;
            };

            const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
            if (!publicKey) {
                window.location.href = authorizationUrl;
                return;
            }

            await openPaystackInline({
                key: publicKey,
                email,
                amount: PASSBOOK_FEE * 100,
                ref: reference,
                access_code: accessCode,
                callback: (response) => {
                    void (async () => {
                        try {
                            const verifyRes = await fetch(
                                `/api/payments/verify?reference=${encodeURIComponent(response.reference)}`,
                                { cache: 'no-store' },
                            );
                            const verifyJson = await verifyRes.json();

                            if (!verifyRes.ok || verifyJson.data?.status !== 'success') {
                                notifyWarning(showToast, 'Payment not yet confirmed. Please wait a moment and refresh.');
                                return;
                            }

                            notifySuccess(showToast, 'Passbook activated! Welcome to your savings journey.');
                            // Hard navigate so the layout re-fetches the updated passbook_activated flag.
                            window.location.href = '/dashboard';
                        } catch (err) {
                            notifyError(showToast, err, 'Could not verify payment.');
                        }
                    })();
                },
                onClose: () => {
                    notifyWarning(showToast, 'Payment window closed. Your passbook is not yet active.');
                    setLoading(false);
                },
            });
        } catch (err) {
            notifyError(showToast, err, 'Unable to start passbook activation.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="w-full max-w-md space-y-6">
                {/* Header */}
                <div className="text-center space-y-3">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary">
                        <BookOpen size={28} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-brand-navy">Activate Your Passbook</h1>
                        <p className="mt-1 text-sm text-brand-gray">
                            One-time activation fee to unlock your personal savings ledger.
                        </p>
                    </div>
                </div>

                {/* Fee card */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-5">
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-200 px-5 py-4">
                        <div>
                            <p className="text-xs font-semibold text-brand-gray">Activation fee</p>
                            <p className="text-3xl font-bold text-brand-navy mt-0.5">NGN 500</p>
                            <p className="text-[11px] text-brand-gray mt-0.5">One-time · Non-refundable</p>
                        </div>
                        <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-brand-primary/10">
                            <BookOpen size={22} className="text-brand-primary" />
                        </div>
                    </div>

                    {/* What you unlock */}
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-brand-gray">What you unlock</p>
                        {[
                            'Your personal passbook ledger — every payment tracked',
                            'Festive savings goals (Detty December, Sallah, Easter & more)',
                            'Unified payment page — pay all savings in one go',
                            'Priority savings with visual progress tables',
                        ].map((item) => (
                            <div key={item} className="flex items-start gap-2.5">
                                <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-emerald-500" />
                                <p className="text-sm text-slate-700">{item}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                        <ShieldCheck size={13} className="shrink-0" />
                        Payment verified securely by Paystack. Your funds are safe.
                    </div>

                    <button
                        onClick={handleActivate}
                        disabled={loading}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-bold text-white hover:bg-brand-primary-hover disabled:opacity-60 transition-colors"
                    >
                        {loading ? (
                            <><Loader2 size={16} className="animate-spin" /> Processing...</>
                        ) : (
                            <>Activate for NGN 500 <ArrowRight size={16} /></>
                        )}
                    </button>
                </div>

                <p className="text-center text-[11px] text-brand-gray">
                    Your existing group contributions are unaffected. This only unlocks the passbook and savings features.
                </p>
            </div>
        </div>
    );
}
