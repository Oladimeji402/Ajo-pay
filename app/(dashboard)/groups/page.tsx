'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Users, Search, Calendar, Wallet, ChevronRight, Loader2, Sparkles, Compass, Layers3, Copy, Check } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';
import { formatScheduleDate, getCurrentCycleDueDate } from '@/lib/ajo-schedule';

type GroupRow = {
    id: string;
    name: string;
    invite_code: string;
    contribution_amount: number;
    frequency: string;
    max_members: number;
    current_cycle: number;
    total_cycles: number;
    start_date: string | null;
    status: string;
    color: string;
    member_count?: number;
};

function getMemberCount(group: GroupRow): number {
    return group.member_count ?? 0;
}

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
    const [joinSearch, setJoinSearch] = useState('');
    const [joinedGroups, setJoinedGroups] = useState<GroupRow[]>([]);
    const [discoverGroups, setDiscoverGroups] = useState<GroupRow[]>([]);
    const [contributions, setContributions] = useState<ContributionRow[]>([]);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const { showToast } = useToast();

    const handleCopyCode = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopiedCode(code);
            setTimeout(() => setCopiedCode(null), 2000);
        } catch {
            notifyError(showToast, new Error('Copy failed'), 'Could not copy invite code.');
        }
    };

    const loadData = async (searchValue = joinSearch, isBackgroundUpdate = false) => {
        try {
            setError('');
            if (!isBackgroundUpdate) setLoading(true);
            else setIsSearching(true);

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
            notifyError(showToast, err, 'Failed to load groups. Please refresh.');
        } finally {
            if (!isBackgroundUpdate) setLoading(false);
            else setIsSearching(false);
        }
    };

    useEffect(() => {
        void loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadData(joinSearch, true);
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

            const response = await fetch(`/api/groups/${groupId}/join`, { method: 'POST' });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || 'Unable to join this group.');
            }

            notifySuccess(showToast, 'Group joined successfully.');
            await loadData(joinSearch);
        } catch (err) {
            notifyError(showToast, err, 'Unable to join this group.');
        } finally {
            setJoining(null);
        }
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
                <div className="rounded-3xl bg-slate-200 h-32" />
                <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden">
                    <div className="border-b border-slate-100 px-5 py-4">
                        <div className="h-5 w-40 rounded bg-slate-200" />
                        <div className="h-3 w-56 rounded bg-slate-100 mt-2" />
                    </div>
                    <div className="p-4 grid md:grid-cols-2 gap-4">
                        {[0, 1].map((i) => (
                            <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50 h-40" />
                        ))}
                    </div>
                </div>
                <div className="rounded-3xl border border-slate-100 bg-white p-4 md:p-5 space-y-3">
                    <div className="h-5 w-40 rounded bg-slate-200" />
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 h-16" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-br from-brand-navy via-[#182D63] to-brand-emerald text-white p-6 md:p-7">
                <div className="absolute -top-20 -right-10 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-14 -left-10 h-40 w-40 rounded-full bg-emerald-300/20 blur-3xl" />
                <div className="relative flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/70 font-semibold">Group Workspace</p>
                        <h1 className="text-2xl md:text-3xl font-semibold mt-1">Your savings circles, organized.</h1>
                        <p className="text-sm text-white/80 mt-2">Track active memberships and discover new circles that match your contribution rhythm.</p>
                    </div>

                    <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 min-w-56">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-white/70 mb-2">Membership Pulse</p>
                        <p className="text-sm inline-flex items-center gap-2"><Layers3 size={14} /> Joined Groups: <span className="font-semibold">{joinedCount}</span></p>
                    </div>
                </div>
            </section>

            {!!error && (
                <div className="rounded-xl border border-red-100 bg-red-50 text-red-600 text-xs font-semibold p-3">
                    {error}
                </div>
            )}

            <section className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div>
                        <h2 className="text-base font-semibold text-brand-navy inline-flex items-center gap-2"><Sparkles size={15} /> My Active Circles</h2>
                        <p className="text-xs text-brand-gray mt-1">Your joined groups with quick contribution and cycle context.</p>
                    </div>
                </div>

                {joinedGroups.length === 0 ? (
                    <div className="p-6 text-sm text-brand-gray">You are not in any groups yet.</div>
                ) : (
                    <div className="p-4 md:p-5 grid md:grid-cols-2 gap-4">
                        {joinedGroups.map((group) => {
                            const contributed = contributionByGroup.get(group.id) ?? 0;
                            const currentDueDate = getCurrentCycleDueDate(group);
                            const memberCount = getMemberCount(group);
                            const capacityPct = group.max_members > 0 ? Math.min(100, Math.round((memberCount / group.max_members) * 100)) : 0;
                            return (
                                <Link
                                    key={group.id}
                                    href={`/groups/${group.id}`}
                                    className="rounded-2xl border border-slate-200 bg-linear-to-b from-white to-slate-50/70 p-4 hover:border-slate-300 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div
                                                className="h-11 w-11 rounded-xl grid place-items-center border border-white shadow-sm"
                                                style={{ backgroundColor: `${group.color}24`, color: group.color }}
                                            >
                                                <Users size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-brand-navy text-sm truncate">{group.name}</p>
                                                <p className="text-[11px] text-brand-gray capitalize">{group.status}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[11px] font-semibold text-brand-gray">{memberCount}/{group.max_members}</span>
                                            <ChevronRight size={16} className="text-slate-400" />
                                        </div>
                                    </div>

                                    <div className="mt-3 space-y-1">
                                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                            <div className="h-full rounded-full bg-linear-to-r from-brand-primary to-brand-emerald transition-all" style={{ width: `${capacityPct}%` }} />
                                        </div>
                                        <p className="text-[10px] text-brand-gray">{memberCount} of {group.max_members} members</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                                        <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                                            <p className="text-brand-gray mb-1 inline-flex items-center gap-1"><Wallet size={12} /> Per Cycle</p>
                                            <p className="font-semibold text-brand-navy">NGN {Number(group.contribution_amount).toLocaleString('en-NG')}</p>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                                            <p className="text-brand-gray mb-1 inline-flex items-center gap-1"><Calendar size={12} /> Frequency</p>
                                            <p className="font-semibold text-brand-navy capitalize">{group.frequency}</p>
                                        </div>
                                    </div>

                                    <p className="text-xs text-brand-gray mt-3">
                                        Total contributed: <span className="font-semibold text-brand-navy">NGN {contributed.toLocaleString('en-NG')}</span>
                                    </p>
                                    <p className="text-xs text-brand-gray mt-1">Current collection date: <span className="font-semibold text-brand-navy">{formatScheduleDate(currentDueDate)}</span></p>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4 md:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="font-semibold text-brand-navy inline-flex items-center gap-2"><Compass size={15} /> Discover and Join</h2>
                        <p className="text-xs text-brand-gray">Search by group name or invite code.</p>
                    </div>
                    <div className="relative w-80 max-w-full">
                        {isSearching ? (
                            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" size={14} />
                        ) : (
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        )}
                        <input
                            type="text"
                            value={joinSearch}
                            onChange={(e) => setJoinSearch(e.target.value)}
                            placeholder="Search by name or paste invite code"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                        />
                    </div>
                </div>

                {filteredDiscoverGroups.length === 0 ? (
                    <p className="text-sm text-brand-gray">No available groups match your search.</p>
                ) : (
                    <div className="space-y-2">
                        {filteredDiscoverGroups.map((group) => {
                            const memberCount = getMemberCount(group);
                            const spotsLeft = Math.max(group.max_members - memberCount, 0);
                            return (
                                <div key={group.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-linear-to-r from-slate-50 to-white p-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-semibold text-brand-navy">{group.name}</p>
                                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${spotsLeft === 0 ? 'border-red-100 bg-red-50 text-red-600' : spotsLeft <= 2 ? 'border-amber-100 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-600'}`}>
                                                <Users size={10} /> {memberCount}/{group.max_members}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                            <p className="text-[11px] text-brand-gray">
                                                Code: <span className="font-mono font-semibold text-brand-navy">{group.invite_code}</span>
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => void handleCopyCode(group.invite_code)}
                                                title="Copy invite code"
                                                className="inline-flex items-center gap-0.5 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 hover:border-slate-300 hover:text-brand-navy transition-colors"
                                            >
                                                {copiedCode === group.invite_code
                                                    ? <><Check size={10} className="text-emerald-500" /> Copied!</>
                                                    : <><Copy size={10} /> Copy</>}
                                            </button>
                                            <span className="text-[11px] text-brand-gray">· NGN {Number(group.contribution_amount).toLocaleString('en-NG')} · {group.frequency}</span>
                                        </div>
                                        <p className="text-[11px] text-brand-gray mt-0.5">Current collection date: {formatScheduleDate(getCurrentCycleDueDate(group))}</p>
                                    </div>
                                    <button
                                        onClick={() => void handleJoinGroup(group.id)}
                                        disabled={joining === group.id || spotsLeft === 0}
                                        className="inline-flex items-center justify-center rounded-xl bg-brand-emerald px-3 py-2 text-xs font-bold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {joining === group.id ? 'Joining...' : spotsLeft === 0 ? 'Group full' : 'Join Group'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
