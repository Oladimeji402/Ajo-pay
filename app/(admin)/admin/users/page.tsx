'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

type UserRow = {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    role: string;
    status: string;
    wallet_balance: number;
    total_contributed: number;
    created_at: string;
};

export default function AdminUsersPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState<UserRow[]>([]);

    useEffect(() => {
        const run = async () => {
            setLoading(true);
            setError('');
            try {
                const q = search ? `?search=${encodeURIComponent(search)}&page=1&pageSize=100` : '?page=1&pageSize=100';
                const res = await fetch(`/api/admin/users${q}`, { cache: 'no-store' });
                const json = await res.json();
                if (!res.ok) throw new Error(json.error || 'Failed to load users.');
                setUsers(Array.isArray(json.data) ? json.data : []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unable to load users.');
            } finally {
                setLoading(false);
            }
        };

        void run();
    }, [search]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <h1 className="text-2xl font-bold text-brand-navy">Admin Users</h1>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            </div>

            {loading ? (
                <div className="min-h-80 grid place-items-center"><Loader2 className="animate-spin" size={16} /></div>
            ) : error ? (
                <div className="rounded-xl border border-red-100 bg-red-50 text-red-600 p-3 text-sm font-semibold">{error}</div>
            ) : (
                <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
                    <div className="divide-y divide-slate-50">
                        {users.map((user) => (
                            <Link key={user.id} href={`/admin/users/${user.id}`} className="p-4 flex items-center justify-between text-sm hover:bg-slate-50">
                                <div>
                                    <p className="font-bold text-brand-navy">{user.name || user.email}</p>
                                    <p className="text-xs text-brand-gray">{user.email} · {user.phone || 'No phone'} · {user.role}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-brand-navy">NGN {Number(user.wallet_balance || 0).toLocaleString('en-NG')}</p>
                                    <p className="text-xs text-brand-gray capitalize">{user.status}</p>
                                </div>
                            </Link>
                        ))}
                        {users.length === 0 && <p className="p-4 text-sm text-brand-gray">No users found.</p>}
                    </div>
                </div>
            )}
        </div>
    );
}
