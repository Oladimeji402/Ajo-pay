'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { TriangleAlert, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { notifySuccess } from '@/lib/toast';
import { formatScheduleDate, getCurrentCycleDueDate } from '@/lib/ajo-schedule';

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
    start_date: string | null;
    invite_code: string;
    members: GroupMember[];
};

function GroupDetailSkeleton() {
    return (
        <div className="space-y-5 animate-pulse">
            <div className="h-4 w-28 rounded bg-slate-200" />
            <div className="rounded-2xl border border-slate-100 bg-white p-4 h-64" />
            <div className="rounded-2xl border border-slate-100 bg-white p-4 h-72" />
        </div>
    );
}

export default function AdminGroupDetailPage() {
    const params = useParams<{ id: string }>();
    const id = params.id;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [group, setGroup] = useState<GroupData | null>(null);
    const [startDate, setStartDate] = useState('');
    const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
    const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(null);
    const { showToast } = useToast();

    const loadData = useCallback(async () => {
        const res = await fetch(`/api/groups/${id}`, { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load group.');
        const nextGroup = json.data as GroupData;
        setGroup(nextGroup);
        setStartDate(nextGroup.start_date ?? '');
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
            notifySuccess(showToast, 'Group status updated successfully.');
            await loadData();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Could not update status.';
            setError(message);
            showToast(message, { type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const updateSchedule = async () => {
        if (!group || !startDate) return;
        setSaving(true);
        setError('');

        try {
            const res = await fetch(`/api/groups/${group.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ startDate }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to update collection date.');
            notifySuccess(showToast, 'Collection date updated successfully.');
            await loadData();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Could not update collection date.';
            setError(message);
            showToast(message, { type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const removeMember = async (member: GroupMember) => {
        if (!group) return;

        if (memberToRemove?.id !== member.id) {
            setMemberToRemove(member);
            return;
        }

        setRemovingMemberId(member.id);
        setError('');

        try {
            const res = await fetch(`/api/admin/groups/${group.id}/members/${member.user_id}`, {
                method: 'DELETE',
                cache: 'no-store',
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to remove member.');
            notifySuccess(showToast, 'Member removed successfully.');
            await loadData();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Could not remove member.';
            setError(message);
            showToast(message, { type: 'error' });
        } finally {
            setRemovingMemberId(null);
            setMemberToRemove(null);
        }
    };

    if (loading) return <GroupDetailSkeleton />;
    if (!group) return <div className="text-sm text-red-600">Group not found.</div>;

    const currentDueDate = getCurrentCycleDueDate(group);

    return (
        <div className="space-y-5">
            <Link href="/admin/groups" className="text-xs font-semibold text-brand-gray hover:text-brand-navy">Back to groups</Link>
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <h1 className="text-xl font-bold text-brand-navy">{group.name}</h1>
                <p className="text-xs text-brand-gray">{group.category} · {group.frequency} · code {group.invite_code}</p>
                <p className="text-sm mt-2">NGN {Number(group.contribution_amount).toLocaleString('en-NG')} per cycle · cycle {group.current_cycle}/{group.total_cycles}</p>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 p-3 text-sm">
                        <p className="text-xs text-brand-gray">First collection date</p>
                        <p className="font-semibold text-brand-navy">{formatScheduleDate(group.start_date)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-sm">
                        <p className="text-xs text-brand-gray">Current cycle due</p>
                        <p className="font-semibold text-brand-navy">{formatScheduleDate(currentDueDate)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-sm">
                        <p className="text-xs text-brand-gray">Members in rotation</p>
                        <p className="font-semibold text-brand-navy">{group.members.length}</p>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap items-end gap-3">
                    <label className="grid gap-1 text-xs font-semibold text-brand-gray">
                        <span>Collection date for cycle 1</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-brand-navy"
                        />
                    </label>
                    <button disabled={saving || !startDate} onClick={() => void updateSchedule()} className="rounded-lg bg-brand-emerald px-3 py-2 text-xs font-bold text-white disabled:opacity-60">
                        {saving ? 'Saving...' : 'Save collection date'}
                    </button>
                </div>

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
                            <div className="flex items-center gap-2">
                                <p className="text-xs text-brand-gray">Position #{member.position}</p>
                                <button
                                    disabled={saving || removingMemberId === member.id}
                                    onClick={() => setMemberToRemove(member)}
                                    className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-bold text-red-700 hover:bg-red-100 disabled:opacity-60"
                                >
                                    {removingMemberId === member.id ? 'Removing...' : 'Remove'}
                                </button>
                            </div>
                        </div>
                    ))}
                    {group.members.length === 0 && <p className="text-sm text-brand-gray">No members yet.</p>}
                </div>
            </div>

            {memberToRemove && group && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-4">
                    <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-6 shadow-2xl shadow-slate-900/20">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600">Remove member</p>
                                <h2 className="mt-2 text-xl font-semibold text-brand-navy">Confirm member removal?</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setMemberToRemove(null)}
                                className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <p className="mt-4 text-sm leading-relaxed text-slate-600">
                            Remove {memberToRemove.profiles?.name || memberToRemove.profiles?.email || 'this member'} from {group.name}? This action is tracked in the audit log.
                        </p>

                        <div className="mt-5 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setMemberToRemove(null)}
                                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-navy hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={removingMemberId === memberToRemove.id}
                                onClick={() => void removeMember(memberToRemove)}
                                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                            >
                                <TriangleAlert size={14} />
                                {removingMemberId === memberToRemove.id ? 'Removing...' : 'Confirm remove'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
