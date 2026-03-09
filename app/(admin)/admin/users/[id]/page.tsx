'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';

type UserDetail = {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    role: string;
    status: string;
    kyc_level: number;
    wallet_balance: number;
    total_contributed: number;
    total_received: number;
};

export default function AdminUserDetailPage() {
    const params = useParams<{ id: string }>();
    const id = params.id;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [user, setUser] = useState<UserDetail | null>(null);
    const { showToast } = useToast();

    const loadUser = useCallback(async () => {
        const res = await fetch(`/api/admin/users/${id}`, { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load user.');
        setUser(json.data as UserDetail);
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

    if (loading) return <div className="min-h-80 grid place-items-center"><Loader2 className="animate-spin" size={16} /></div>;
    if (!user) return <div className="text-sm text-red-600">User not found.</div>;

    return (
        <div className="space-y-4">
            <Link href="/admin/users" className="text-xs font-semibold text-brand-gray hover:text-brand-navy">Back to users</Link>
            <div className="rounded-2xl border border-slate-100 bg-white p-4 space-y-3">
                <h1 className="text-xl font-bold text-brand-navy">{user.name || user.email}</h1>
                <p className="text-sm text-brand-gray">{user.email} · {user.phone || 'No phone'}</p>

                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-brand-gray">Total Contribution</p><p className="font-bold text-brand-navy">NGN {Number(user.total_contributed).toLocaleString('en-NG')}</p></div>
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-brand-gray">Total Received</p><p className="font-bold text-brand-navy">NGN {Number(user.total_received).toLocaleString('en-NG')}</p></div>
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-brand-gray">Role</p><p className="font-bold text-brand-navy capitalize">{user.role}</p></div>
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-brand-gray">Status</p><p className="font-bold text-brand-navy capitalize">{user.status}</p></div>
                </div>

                <div className="flex items-center gap-2">
                    <button disabled={saving} onClick={() => patchUser({ role: user.role === 'admin' ? 'user' : 'admin' })} className="px-3 py-2 rounded-lg bg-brand-navy text-white text-xs font-bold">{user.role === 'admin' ? 'Make User' : 'Make Admin'}</button>
                    <button disabled={saving} onClick={() => patchUser({ status: user.status === 'active' ? 'suspended' : 'active' })} className="px-3 py-2 rounded-lg bg-slate-100 text-brand-navy text-xs font-bold">{user.status === 'active' ? 'Suspend' : 'Activate'}</button>
                </div>

                {error && <p className="text-xs text-red-600">{error}</p>}
            </div>
        </div>
    );
}
