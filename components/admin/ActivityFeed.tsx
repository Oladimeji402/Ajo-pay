'use client';

import React from 'react';
import { Banknote, HandCoins, UserPlus, Users } from 'lucide-react';

type ActivityType = 'contribution' | 'payout' | 'signup' | 'group';

type ActivityItem = {
    id: string;
    type: ActivityType;
    title: string;
    description: string;
    timestamp: string;
};

type ActivityFeedProps = {
    activities: ActivityItem[];
    loading?: boolean;
};

function formatRelativeTime(timestamp: string) {
    const value = new Date(timestamp).getTime();
    if (!Number.isFinite(value)) return 'just now';
    const diffSeconds = Math.max(0, Math.floor((Date.now() - value) / 1000));
    if (diffSeconds < 60) return `${diffSeconds}s`;
    const minutes = Math.floor(diffSeconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return new Date(timestamp).toLocaleDateString();
}

const activityConfig: Record<ActivityType, { icon: typeof Banknote; color: string; dot: string }> = {
    contribution: { icon: Banknote, color: 'text-emerald-600', dot: 'bg-emerald-500' },
    payout: { icon: HandCoins, color: 'text-amber-600', dot: 'bg-amber-400' },
    signup: { icon: UserPlus, color: 'text-blue-600', dot: 'bg-blue-500' },
    group: { icon: Users, color: 'text-violet-600', dot: 'bg-violet-500' },
};

export function ActivityFeed({ activities, loading = false }: ActivityFeedProps) {
    return (
        <section className="rounded-xl border border-slate-100 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-brand-navy">Activity</h3>
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                </span>
            </div>

            <div className="max-h-96 overflow-y-auto pr-1 space-y-0">
                {loading && (
                    <p className="text-xs text-slate-400 py-2">Loading...</p>
                )}
                {!loading && activities.length === 0 && (
                    <p className="text-xs text-slate-400 py-2">No activity yet.</p>
                )}
                {!loading &&
                    activities.slice(0, 15).map((item, idx) => {
                        const cfg = activityConfig[item.type] ?? activityConfig.group;
                        const Icon = cfg.icon;
                        const isLast = idx === Math.min(activities.length, 15) - 1;
                        return (
                            <div key={item.id} className="flex gap-3">
                                {/* Timeline */}
                                <div className="flex flex-col items-center">
                                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${cfg.dot}`} />
                                    {!isLast && (
                                        <div className="w-px flex-1 bg-slate-100 my-1" />
                                    )}
                                </div>
                                {/* Content */}
                                <div className={`pb-3 min-w-0 flex-1 ${isLast ? '' : ''}`}>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <Icon size={12} className={cfg.color} strokeWidth={2} />
                                            <p className="text-[12px] font-semibold text-brand-navy truncate">
                                                {item.title}
                                            </p>
                                        </div>
                                        <span className="text-[10px] text-slate-400 shrink-0 mt-px">
                                            {formatRelativeTime(item.timestamp)}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
            </div>
        </section>
    );
}
