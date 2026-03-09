'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

type GroupMember = {
    id: string;
    user_id: string;
    position: number;
    contribution_status: string;
    payout_status: string;
    profiles?: { id: string; name: string; email: string };
};

type GroupData = {
    id: string;
    name: string;
    status: string;
    category: string;
    contribution_amount: number;
    frequency: string;
    current_cycle: number;
    total_cycles: number;
    invite_code: string;
    members: GroupMember[];
};

export default function AdminGroupDetailPage() {
    const params = useParams<{ id: string }>();
    const id = params.id;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [group, setGroup] = useState<GroupData | null>(null);

    const loadData = useCallback(async () => {
        const res = await fetch(`/api/groups/${id}`, { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load group.');
        setGroup(json.data as GroupData);
    }, [id]);

    useEffect(() => {
        const run = async () => {
            try {
                setLoading(true);
                setError('');
                await loadData();
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unable to load group.');
            } finally {
                setLoading(false);
            }
        };

        void run();
    }, [id, loadData]);

    const updateStatus = async (status: string) => {
        if (!group) return;
        setSaving(true);
        setError('');
        try {
            const res = await fetch(`/api/groups/${group.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to update group.');
            await loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not update status.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="min-h-80 grid place-items-center"><Loader2 className="animate-spin" size={16} /></div>;
    if (!group) return <div className="text-sm text-red-600">Group not found.</div>;

    return (
        <div className="space-y-5">
            <Link href="/admin/groups" className="text-xs font-semibold text-brand-gray hover:text-brand-navy">Back to groups</Link>
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <h1 className="text-xl font-bold text-brand-navy">{group.name}</h1>
                <p className="text-xs text-brand-gray">{group.category} · {group.frequency} · code {group.invite_code}</p>
                <p className="text-sm mt-2">NGN {Number(group.contribution_amount).toLocaleString('en-NG')} per cycle · cycle {group.current_cycle}/{group.total_cycles}</p>

                <div className="flex items-center gap-2 mt-3">
                    {['pending', 'active', 'paused', 'completed'].map((s) => (
                        <button key={s} disabled={saving} onClick={() => updateStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${group.status === s ? 'bg-brand-navy text-white' : 'bg-slate-100 text-brand-navy'}`}>
                            {s}
                        </button>
                    ))}
                </div>
                {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <h2 className="font-bold text-brand-navy mb-3">Members</h2>
                <div className="space-y-2">
                    {group.members.map((member) => (
                        <div key={member.id} className="rounded-xl bg-slate-50 p-3 flex items-center justify-between text-sm">
                            <div>
                                <p className="font-semibold text-brand-navy">{member.profiles?.name || member.profiles?.email || member.user_id}</p>
                                <p className="text-xs text-brand-gray">Contribution: {member.contribution_status} · Payout: {member.payout_status}</p>
                            </div>
                            <p className="text-xs text-brand-gray">Position #{member.position}</p>
                        </div>
                    ))}
                    {group.members.length === 0 && <p className="text-sm text-brand-gray">No members yet.</p>}
                </div>
            </div>
        </div>
    );
}
