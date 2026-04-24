'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Activity, ArrowLeft, Banknote, Landmark, Shield, TriangleAlert, UserCog, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';
import { useRefreshOnFocus } from '@/lib/hooks/useRefreshOnFocus';

type UserDetail = {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    bank_name?: string | null;
    bank_account?: string | null;
    bank_account_name?: string | null;
    role: string;
    status: string;
    kyc_level: number;
    wallet_balance: number;
    total_contributed: number;
    total_received: number;
    created_at?: string;
    updated_at?: string;
};

type UserActivity = {
    id: string;
    type: 'target_contribution' | 'general_deposit' | 'general_payout' | string;
    status: string;
    title: string;
    description: string;
    amount: number | null;
    occurredAt: string;
};

type SavingsPlan = {
    id: string;
    planType: 'target' | 'general';
    name: string;
    frequency: string;
    status: string;
    targetAmount?: number;
    minimumAmount?: number;
    totalSaved: number;
    successfulCount: number;
    missedCount: number;
    skippedCount: number;
    pendingCount: number;
    startDate?: string | null;
    targetDate?: string | null;
    createdAt?: string;
    lastPaidAt?: string | null;
};

const actionButtonClassName = 'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow active:translate-y-0 disabled:opacity-60';

function UserDetailSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="h-4 w-28 rounded bg-slate-200" />
            <div className="rounded-xl border border-slate-100 bg-white p-4 space-y-4">
                <div className="h-7 w-60 rounded bg-slate-200" />
                <div className="h-4 w-80 rounded bg-slate-200" />
                <div className="grid sm:grid-cols-2 gap-3">
                    {Array.from({ length: 6 }, (_, idx) => (
                        <div key={idx} className="rounded-xl bg-slate-50 p-3 space-y-2">
                            <div className="h-3 w-24 rounded bg-slate-200" />
                            <div className="h-4 w-32 rounded bg-slate-200" />
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <div className="h-9 w-28 rounded-lg bg-slate-200" />
                    <div className="h-9 w-24 rounded-lg bg-slate-200" />
                </div>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white p-4 space-y-3">
                <div className="h-5 w-32 rounded bg-slate-200" />
                <div className="grid gap-2">
                    {Array.from({ length: 3 }, (_, idx) => (
                        <div key={idx} className="h-14 rounded-xl bg-slate-100" />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function AdminUserDetailPage() {
    const params = useParams<{ id: string }>();
    const id = params.id;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [user, setUser] = useState<UserDetail | null>(null);
    const [savingsPlans, setSavingsPlans] = useState<SavingsPlan[]>([]);
    const [recentActivity, setRecentActivity] = useState<UserActivity[]>([]);
    const [confirmAction, setConfirmAction] = useState<{ type: 'role' | 'status'; nextValue: string } | null>(null);
    const { showToast } = useToast();

    const loadUser = useCallback(async () => {
        const res = await fetch(`/api/admin/users/${id}`, { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load user.');
        setUser(json.data as UserDetail);
        setSavingsPlans(Array.isArray(json.savingsPlans) ? (json.savingsPlans as SavingsPlan[]) : []);
        setRecentActivity(Array.isArray(json.recentActivity) ? (json.recentActivity as UserActivity[]) : []);
    }, [id]);

    useEffect(() => {
        const run = async () => {
            setLoading(true);
            setError('');
            try {
                await loadUser();
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unable to load user.');
            } finally {
                setLoading(false);
            }
        };
        void run();
    }, [id, loadUser]);

    useRefreshOnFocus(() => {
        void loadUser();
    });

    const patchUser = async (updates: Record<string, unknown>) => {
        setSaving(true);
        setError('');

        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to update user.');
            notifySuccess(showToast, 'User updated successfully.');
            await loadUser();
        } catch (err) {
            notifyError(showToast, err, 'Unable to update user.');
        } finally {
            setSaving(false);
        }
    };

    const toggleRole = async () => {
        if (!user) return;
        const nextRole = user.role === 'admin' ? 'user' : 'admin';
        setConfirmAction({ type: 'role', nextValue: nextRole });
    };

    const toggleStatus = async () => {
        if (!user) return;
        const nextStatus = user.status === 'active' ? 'suspended' : 'active';
        setConfirmAction({ type: 'status', nextValue: nextStatus });
    };

    const executeConfirmedAction = async () => {
        if (!confirmAction) return;

        if (confirmAction.type === 'role') {
            await patchUser({ role: confirmAction.nextValue });
        } else {
            await patchUser({ status: confirmAction.nextValue });
        }

        setConfirmAction(null);
    };

    if (loading) return <UserDetailSkeleton />;
    if (!user) return <div className="text-sm text-red-600">User not found.</div>;

    return (
        <div className="space-y-4">
            <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-gray transition-colors hover:text-brand-navy"><ArrowLeft size={14} /> Back to users</Link>
            <div className="rounded-xl border border-slate-100 bg-white p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-brand-navy">{user.name || user.email}</h1>
                        <p className="mt-1 text-sm text-brand-gray">{user.email} · {user.phone || 'No phone'}</p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600">
                        <Shield size={12} className="text-emerald-600" /> Admin profile control
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3"><p className="text-xs text-brand-gray">Total Saved</p><p className="font-bold text-brand-navy">NGN {Number(user.total_contributed).toLocaleString('en-NG')}</p></div>
                    <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3"><p className="text-xs text-brand-gray">Total Received</p><p className="font-bold text-brand-navy">NGN {Number(user.total_received).toLocaleString('en-NG')}</p></div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs text-brand-gray">Role</p><p className="font-bold text-brand-navy capitalize">{user.role}</p></div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs text-brand-gray">Status</p><p className="font-bold text-brand-navy capitalize">{user.status}</p></div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs text-brand-gray">Wallet Balance</p><p className="font-bold text-brand-navy">NGN {Number(user.wallet_balance).toLocaleString('en-NG')}</p></div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs text-brand-gray">KYC Level</p><p className="font-bold text-brand-navy">Level {user.kyc_level}</p></div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs text-brand-gray">Profile Created</p><p className="font-bold text-brand-navy">{user.created_at ? new Date(user.created_at).toLocaleDateString('en-NG') : 'N/A'}</p></div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs text-brand-gray">Last Updated</p><p className="font-bold text-brand-navy">{user.updated_at ? new Date(user.updated_at).toLocaleDateString('en-NG') : 'N/A'}</p></div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        disabled={saving}
                        onClick={() => void toggleRole()}
                        className={`${actionButtonClassName} bg-brand-navy text-white focus:outline-none focus:ring-4 focus:ring-brand-navy/20`}
                    >
                        <UserCog size={14} /> {user.role === 'admin' ? 'Make User' : 'Make Admin'}
                    </button>
                    <button
                        disabled={saving}
                        onClick={() => void toggleStatus()}
                        className={`${actionButtonClassName} border border-slate-200 bg-white text-brand-navy focus:outline-none focus:ring-4 focus:ring-slate-200`}
                    >
                        <Shield size={14} /> {user.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                </div>

                {error && <p className="text-xs text-red-600">{error}</p>}
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-3">
                <h2 className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-navy"><Landmark size={14} className="text-indigo-600" /> Account details</h2>
                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs text-brand-gray">Bank</p>
                        <p className="font-bold text-brand-navy">{user.bank_name || 'Not set'}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs text-brand-gray">Account Number</p>
                        <p className="font-bold text-brand-navy">{user.bank_account || 'Not set'}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs text-brand-gray">Account Name</p>
                        <p className="font-bold text-brand-navy">{user.bank_account_name || 'Not set'}</p>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <h2 className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-navy">Savings plans</h2>
                    <span className="text-xs text-brand-gray">{savingsPlans.length} total</span>
                </div>

                {savingsPlans.length === 0 ? (
                    <p className="text-sm text-brand-gray">No target or general savings plans found for this user.</p>
                ) : (
                    <div className="space-y-2">
                        {savingsPlans.map((plan) => (
                            <div key={plan.id} className="rounded-xl border border-slate-200/70 bg-gradient-to-r from-white to-slate-50 p-3 shadow-sm">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-semibold text-brand-navy">{plan.name}</p>
                                        <p className="mt-1 text-xs text-brand-gray capitalize">
                                            {plan.planType} · {plan.frequency} · {plan.status}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-brand-gray">Saved</p>
                                        <p className="text-sm font-bold text-brand-navy">NGN {Number(plan.totalSaved).toLocaleString('en-NG')}</p>
                                    </div>
                                </div>

                                <div className="mt-2 grid gap-2 sm:grid-cols-5 text-xs">
                                    <div className="rounded-lg bg-slate-100 px-2 py-1.5">
                                        <p className="text-brand-gray">Paid</p>
                                        <p className="font-semibold text-brand-navy">{plan.successfulCount}</p>
                                    </div>
                                    <div className="rounded-lg bg-amber-50 px-2 py-1.5">
                                        <p className="text-brand-gray">Missed</p>
                                        <p className="font-semibold text-amber-700">{plan.missedCount}</p>
                                    </div>
                                    <div className="rounded-lg bg-rose-50 px-2 py-1.5">
                                        <p className="text-brand-gray">Skipped</p>
                                        <p className="font-semibold text-rose-700">{plan.skippedCount}</p>
                                    </div>
                                    <div className="rounded-lg bg-blue-50 px-2 py-1.5">
                                        <p className="text-brand-gray">Pending</p>
                                        <p className="font-semibold text-blue-700">{plan.pendingCount}</p>
                                    </div>
                                    <div className="rounded-lg bg-emerald-50 px-2 py-1.5">
                                        <p className="text-brand-gray">{plan.planType === 'target' ? 'Target' : 'Minimum'}</p>
                                        <p className="font-semibold text-emerald-700">
                                            NGN {Number(plan.planType === 'target' ? plan.targetAmount ?? 0 : plan.minimumAmount ?? 0).toLocaleString('en-NG')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-3">
                <h2 className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-navy"><Activity size={14} className="text-emerald-600" /> Recent activity</h2>

                {recentActivity.length === 0 ? (
                    <p className="text-sm text-brand-gray">No recent activity recorded for this user.</p>
                ) : (
                    <div className="space-y-2">
                        {recentActivity.map((item) => (
                            <div key={item.id} className="rounded-xl border border-slate-200/70 bg-gradient-to-r from-white to-slate-50 p-3 shadow-sm transition hover:border-slate-300 hover:shadow">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-semibold text-brand-navy">{item.title}</p>
                                        <p className="mt-1 text-xs text-brand-gray">{item.description}</p>
                                        <p className="mt-1 text-xs text-brand-gray">{new Date(item.occurredAt).toLocaleString('en-NG')}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-gray">{item.type.replace('_', ' ')}</p>
                                        <p className="mt-1 text-xs font-semibold capitalize text-brand-navy">{item.status}</p>
                                        {item.amount !== null ? (
                                            <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-emerald-700"><Banknote size={12} /> NGN {Number(item.amount).toLocaleString('en-NG')}</p>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {confirmAction && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-4">
                    <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-6 shadow-2xl shadow-slate-900/20">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600">Confirm action</p>
                                <h2 className="mt-2 text-xl font-semibold text-brand-navy">
                                    {confirmAction.type === 'role'
                                        ? `Change role to ${confirmAction.nextValue}?`
                                        : `Change status to ${confirmAction.nextValue}?`}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setConfirmAction(null)}
                                className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <p className="mt-4 text-sm leading-relaxed text-slate-600">
                            This admin action will be recorded in the audit log and applied immediately.
                        </p>

                        <div className="mt-5 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setConfirmAction(null)}
                                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-navy hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => void executeConfirmedAction()}
                                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                            >
                                <TriangleAlert size={14} />
                                {saving ? 'Applying...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
