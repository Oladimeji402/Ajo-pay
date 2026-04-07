'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Users, Search, ChevronRight, Loader2, Sparkles, Compass, Copy, Check } from 'lucide-react';
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
    status: 'pending' | 'success' | 'failed' | 'abandoned';
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
            <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
                <div className="rounded-2xl bg-white border border-slate-100 h-28" />
                <div className="rounded-2xl bg-white border border-slate-100 h-40" />
                <div className="rounded-2xl bg-white border border-slate-100 h-36" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            {!!error && (
                <div className="rounded-xl border border-red-100 bg-red-50 text-red-600 text-xs font-semibold p-3">
                    {error}
                </div>
            )}

            {/* My Groups */}
            <section>
                <div className="mb-2.5 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-brand-navy inline-flex items-center gap-1.5">
                        <Sparkles size={14} className="text-brand-primary" /> Groups I&apos;m In
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{joinedCount}</span>
                    </h2>
                </div>

                {joinedGroups.length === 0 ? (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10">
                                <Users size={18} className="text-brand-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-brand-navy">You haven&apos;t joined any groups yet</p>
                                <p className="mt-0.5 text-xs text-brand-gray">Search below for a group to join, or ask your group admin to share their invite code.</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {joinedGroups.map((group) => {
                            const contributed = contributionByGroup.get(group.id) ?? 0;
                            const currentDueDate = getCurrentCycleDueDate(group);
                            const memberCount = getMemberCount(group);
                            const capacityPct = group.max_members > 0 ? Math.min(100, Math.round((memberCount / group.max_members) * 100)) : 0;
                            return (
                                <Link
                                    key={group.id}
                                    href={`/groups/${group.id}`}
                                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 transition-colors hover:border-slate-300"
                                >
                                    <div
                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white shadow-sm"
                                        style={{ backgroundColor: `${group.color}24`, color: group.color }}
                                    >
                                        <Users size={18} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <p className="truncate text-sm font-semibold text-brand-navy">{group.name}</p>
                                            <span className="shrink-0 text-[10px] text-brand-gray">{memberCount}/{group.max_members}</span>
                                        </div>
                                        <div className="h-1.5 overflow-hidden rounded-full bg-blue-100">
                                            <div className="h-full rounded-full bg-linear-to-r from-brand-primary to-brand-electric transition-all" style={{ width: `${capacityPct}%` }} />
                                        </div>
                                        <div className="mt-1.5 flex items-center justify-between">
                                            <p className="text-[10px] capitalize text-brand-gray">{group.frequency} · <span className="font-semibold text-brand-navy">NGN {Number(group.contribution_amount).toLocaleString('en-NG')}</span></p>
                                            <p className="text-[10px] text-brand-gray">Due: {formatScheduleDate(currentDueDate)}</p>
                                        </div>
                                        {contributed > 0 && (
                                            <p className="mt-0.5 text-[10px] text-brand-gray">Paid: <span className="font-semibold text-brand-navy">NGN {contributed.toLocaleString('en-NG')}</span></p>
                                        )}
                                    </div>
                                    <ChevronRight size={14} className="shrink-0 text-slate-300" />
                                </Link>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Find a Group */}
            <section>
                <div className="mb-2.5 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-brand-navy inline-flex items-center gap-1.5">
                        <Compass size={14} className="text-brand-primary" /> Find a Group
                    </h2>
                </div>

                <div className="relative mb-3">
                    {isSearching ? (
                        <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" size={14} />
                    ) : (
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    )}
                    <input
                        type="text"
                        value={joinSearch}
                        onChange={(e) => setJoinSearch(e.target.value)}
                        placeholder="Search by name or invite code"
                        className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                </div>

                {filteredDiscoverGroups.length === 0 ? (
                    <p className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-brand-gray">
                        {joinSearch.trim() ? 'No groups match that name or code.' : 'No open groups available right now.'}
                    </p>
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
                        {filteredDiscoverGroups.map((group) => {
                            const memberCount = getMemberCount(group);
                            const spotsLeft = Math.max(group.max_members - memberCount, 0);
                            return (
                                <div key={group.id} className="flex items-center gap-3 p-3.5">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-semibold text-brand-navy">{group.name}</p>
                                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${spotsLeft === 0 ? 'border-red-100 bg-red-50 text-red-600' : spotsLeft <= 2 ? 'border-amber-100 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-600'}`}>
                                                <Users size={9} /> {memberCount}/{group.max_members}
                                            </span>
                                        </div>
                                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                            <p className="text-[10px] text-brand-gray">
                                                Code: <span className="font-mono font-semibold text-brand-navy">{group.invite_code}</span>
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => void handleCopyCode(group.invite_code)}
                                                className="inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-slate-500 hover:border-slate-300"
                                            >
                                                {copiedCode === group.invite_code ? <><Check size={9} className="text-emerald-500" /> Copied!</> : <><Copy size={9} /> Copy</>}
                                            </button>
                                            <span className="text-[10px] text-brand-gray">· NGN {Number(group.contribution_amount).toLocaleString('en-NG')} · {group.frequency}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => void handleJoinGroup(group.id)}
                                        disabled={joining === group.id || spotsLeft === 0}
                                        className="shrink-0 inline-flex items-center justify-center rounded-xl bg-brand-primary px-3 py-2 text-xs font-bold text-white hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {joining === group.id ? 'Joining...' : spotsLeft === 0 ? 'Full' : 'Join'}
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
