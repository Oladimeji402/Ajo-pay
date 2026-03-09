'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Users, Search, Calendar, Wallet, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react';

type GroupRow = {
    id: string;
    name: string;
    invite_code: string;
    contribution_amount: number;
    frequency: string;
    max_members: number;
    current_cycle: number;
    total_cycles: number;
    status: string;
    color: string;
};

type ContributionRow = {
    id: string;
    group_id: string;
    amount: number;
    status: 'pending' | 'success' | 'failed';
};

export default function GroupsPage() {
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [joinSearch, setJoinSearch] = useState('');
    const [joinedGroups, setJoinedGroups] = useState<GroupRow[]>([]);
    const [discoverGroups, setDiscoverGroups] = useState<GroupRow[]>([]);
    const [contributions, setContributions] = useState<ContributionRow[]>([]);

    const loadData = async (searchValue = joinSearch) => {
        try {
            setError('');
            setLoading(true);

            const discoverQuery = searchValue.trim()
                ? `?scope=all&q=${encodeURIComponent(searchValue.trim())}`
                : '?scope=all';

            const [joinedRes, discoverRes, contributionsRes] = await Promise.all([
                fetch('/api/groups', { cache: 'no-store' }),
                fetch(`/api/groups${discoverQuery}`, { cache: 'no-store' }),
                fetch('/api/contributions', { cache: 'no-store' }),
            ]);

            const joinedJson = await joinedRes.json();
            const discoverJson = await discoverRes.json();
            const contributionsJson = await contributionsRes.json();

            if (!joinedRes.ok) {
                throw new Error(joinedJson.error || 'Failed to load joined groups.');
            }

            if (!discoverRes.ok) {
                throw new Error(discoverJson.error || 'Failed to load groups to join.');
            }

            if (!contributionsRes.ok) {
                throw new Error(contributionsJson.error || 'Failed to load contributions.');
            }

            const joinedList = Array.isArray(joinedJson.data) ? (joinedJson.data as GroupRow[]) : [];
            const discoverList = Array.isArray(discoverJson.data) ? (discoverJson.data as GroupRow[]) : [];
            const joinedSet = new Set(joinedList.map((group) => group.id));

            setJoinedGroups(joinedList);
            setDiscoverGroups(discoverList.filter((group) => !joinedSet.has(group.id) && group.status !== 'completed'));
            setContributions(Array.isArray(contributionsJson.data) ? contributionsJson.data : []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to load groups.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadData(joinSearch);
        }, 280);

        return () => window.clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [joinSearch]);

    const contributionByGroup = useMemo(() => {
        const map = new Map<string, number>();
        for (const tx of contributions) {
            if (tx.status !== 'success') continue;
            map.set(tx.group_id, (map.get(tx.group_id) ?? 0) + Number(tx.amount));
        }
        return map;
    }, [contributions]);

    const joinedCount = joinedGroups.length;

    const filteredDiscoverGroups = useMemo(() => {
        const term = joinSearch.trim().toLowerCase();
        if (!term) return discoverGroups;

        return discoverGroups.filter((group) => {
            return group.name.toLowerCase().includes(term) || group.invite_code.toLowerCase().includes(term);
        });
    }, [discoverGroups, joinSearch]);

    const handleJoinGroup = async (groupId: string) => {
        try {
            setJoining(groupId);
            setError('');
            setNotice('');

            const response = await fetch(`/api/groups/${groupId}/join`, { method: 'POST' });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || 'Unable to join this group.');
            }

            setNotice('Group joined successfully.');
            await loadData(joinSearch);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to join this group.');
        } finally {
            setJoining(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-80 grid place-items-center text-brand-gray">
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <Loader2 className="animate-spin" size={16} />
                    Loading your groups...
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-5">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-brand-navy">My Groups</h1>
                    <p className="text-xs text-brand-gray">You joined {joinedCount} group{joinedCount === 1 ? '' : 's'}</p>
                </div>
            </div>

            {notice && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold p-3 flex items-center gap-2">
                    <CheckCircle2 size={14} />
                    {notice}
                </div>
            )}

            {!!error && (
                <div className="rounded-xl border border-red-100 bg-red-50 text-red-600 text-xs font-semibold p-3">
                    {error}
                </div>
            )}

            {joinedGroups.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-2xl p-6 text-sm text-brand-gray">
                    You are not in any groups yet.
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {joinedGroups.map((group) => {
                        const contributed = contributionByGroup.get(group.id) ?? 0;
                        return (
                            <Link
                                key={group.id}
                                href={`/groups/${group.id}`}
                                className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="h-10 w-10 rounded-xl grid place-items-center"
                                            style={{ backgroundColor: `${group.color}20`, color: group.color }}
                                        >
                                            <Users size={18} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-brand-navy text-sm">{group.name}</p>
                                            <p className="text-[11px] text-brand-gray capitalize">{group.status}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-400" />
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                                    <div className="rounded-xl bg-slate-50 p-2.5">
                                        <p className="text-brand-gray mb-1 flex items-center gap-1"><Wallet size={12} /> Per Cycle</p>
                                        <p className="font-bold text-brand-navy">NGN {Number(group.contribution_amount).toLocaleString('en-NG')}</p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-2.5">
                                        <p className="text-brand-gray mb-1 flex items-center gap-1"><Calendar size={12} /> Frequency</p>
                                        <p className="font-bold text-brand-navy capitalize">{group.frequency}</p>
                                    </div>
                                </div>

                                <p className="text-xs text-brand-gray mt-3">
                                    Total contributed: <span className="font-bold text-brand-navy">NGN {contributed.toLocaleString('en-NG')}</span>
                                </p>
                            </Link>
                        );
                    })}
                </div>
            )}

            <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="font-bold text-brand-navy">Join Group</h2>
                        <p className="text-xs text-brand-gray">Search by group name or invite code.</p>
                    </div>
                    <div className="relative w-72 max-w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                            type="text"
                            value={joinSearch}
                            onChange={(e) => setJoinSearch(e.target.value)}
                            placeholder="Search by name or code"
                            className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                        />
                    </div>
                </div>

                {filteredDiscoverGroups.length === 0 ? (
                    <p className="text-sm text-brand-gray">No available groups match your search.</p>
                ) : (
                    <div className="space-y-2">
                        {filteredDiscoverGroups.map((group) => (
                            <div key={group.id} className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-bold text-brand-navy">{group.name}</p>
                                    <p className="text-[11px] text-brand-gray">
                                        Code: <span className="font-mono font-semibold text-brand-navy">{group.invite_code}</span> · NGN {Number(group.contribution_amount).toLocaleString('en-NG')} · {group.frequency}
                                    </p>
                                </div>
                                <button
                                    onClick={() => void handleJoinGroup(group.id)}
                                    disabled={joining === group.id}
                                    className="inline-flex items-center justify-center rounded-xl bg-brand-emerald px-3 py-2 text-xs font-bold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {joining === group.id ? 'Joining...' : 'Join Group'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
