'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, Clock3, Loader2, Settings, ShieldCheck, Users, Wallet, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';

type NotificationCategory = 'all' | 'transaction' | 'reminder' | 'security' | 'group' | 'account';

type NotificationRow = {
    id: string;
    type: string;
    title: string;
    body: string;
    read: boolean;
    metadata?: Record<string, unknown>;
    created_at: string;
};

const FILTERS: Array<{ key: NotificationCategory; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'transaction', label: 'Transactions' },
    { key: 'reminder', label: 'Reminders' },
    { key: 'security', label: 'Security' },
    { key: 'group', label: 'Groups' },
    { key: 'account', label: 'Account' },
];

function getNotificationCategory(type: string): NotificationCategory {
    if (type === 'payment_success') return 'transaction';
    if (type === 'group_leave') return 'group';
    if (type === 'password_changed') return 'security';
    if (type === 'email_change_requested') return 'account';
    if (type.includes('reminder')) return 'reminder';
    return 'account';
}

function getCategoryBadge(category: NotificationCategory) {
    if (category === 'transaction') return { label: 'Transaction', icon: Wallet, className: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (category === 'reminder') return { label: 'Reminder', icon: Clock3, className: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (category === 'security') return { label: 'Security', icon: ShieldCheck, className: 'bg-red-50 text-red-700 border-red-200' };
    if (category === 'group') return { label: 'Group', icon: Users, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    return { label: 'Account', icon: Settings, className: 'bg-slate-100 text-slate-700 border-slate-200' };
}

export default function NotificationsPage() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<NotificationRow[]>([]);
    const [error, setError] = useState('');
    const [activeFilter, setActiveFilter] = useState<NotificationCategory>('all');
    const [selectedNotification, setSelectedNotification] = useState<NotificationRow | null>(null);

    const loadNotifications = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/notifications?limit=50', { cache: 'no-store' });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || 'Unable to load notifications.');
            }

            setNotifications(Array.isArray(payload.data) ? payload.data : []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to load notifications.');
            notifyError(showToast, err, 'Unable to load notifications.');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        void loadNotifications();
    }, [loadNotifications]);

    const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);
    const filteredNotifications = useMemo(() => {
        if (activeFilter === 'all') return notifications;
        return notifications.filter((item) => getNotificationCategory(item.type) === activeFilter);
    }, [activeFilter, notifications]);

    const markOneAsRead = async (id: string) => {
        setSaving(id);
        try {
            const response = await fetch(`/api/notifications/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ read: true }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || 'Unable to update notification.');
            }

            setNotifications((current) => current.map((item) => item.id === id ? { ...item, read: true } : item));
        } catch (err) {
            notifyError(showToast, err, 'Unable to mark this notification as read.');
        } finally {
            setSaving(null);
        }
    };

    const markAllAsRead = async () => {
        setSaving('all');
        try {
            const response = await fetch('/api/notifications', {
                method: 'PATCH',
                cache: 'no-store',
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || 'Unable to mark all notifications as read.');
            }

            setNotifications((current) => current.map((item) => ({ ...item, read: true })));
            notifySuccess(showToast, 'All notifications marked as read.');
        } catch (err) {
            notifyError(showToast, err, 'Unable to mark all notifications as read.');
        } finally {
            setSaving(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-80 grid place-items-center text-brand-gray">
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <Loader2 className="animate-spin" size={16} />
                    Loading notifications...
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-brand-gray font-semibold">Updates and alerts</p>
                        <h1 className="mt-2 text-2xl font-semibold text-brand-navy">Notifications</h1>
                        <p className="mt-2 text-sm text-slate-500">Payment confirmations, account security updates, and group activity will appear here.</p>
                    </div>
                    <button
                        type="button"
                        onClick={markAllAsRead}
                        disabled={saving === 'all' || unreadCount === 0}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-brand-navy hover:bg-slate-50 disabled:opacity-60"
                    >
                        <CheckCheck size={15} />
                        Mark all as read
                    </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter.key}
                            type="button"
                            onClick={() => setActiveFilter(filter.key)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${activeFilter === filter.key
                                ? 'border-brand-navy bg-brand-navy text-white'
                                : 'border-slate-200 bg-white text-brand-navy hover:bg-slate-50'}`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </section>

            {error && <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

            {filteredNotifications.length === 0 ? (
                <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-50 text-slate-500">
                        <Bell size={22} />
                    </div>
                    <h2 className="mt-4 text-lg font-semibold text-brand-navy">No notifications in this filter</h2>
                    <p className="mt-2 text-sm text-slate-500">Try another filter to view more updates.</p>
                </section>
            ) : (
                <section className="space-y-3">
                    {filteredNotifications.map((item) => {
                        const category = getNotificationCategory(item.type);
                        const badge = getCategoryBadge(category);
                        const BadgeIcon = badge.icon;

                        return (
                            <article key={item.id} className={`rounded-2xl border p-4 ${item.read ? 'border-slate-200 bg-white' : 'border-emerald-200 bg-emerald-50/60'}`}>
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="space-y-2">
                                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badge.className}`}>
                                            <BadgeIcon size={12} />
                                            {badge.label}
                                        </span>
                                        <p className="text-sm font-semibold text-brand-navy">{item.title}</p>
                                        <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
                                        <p className="text-xs text-slate-400">{new Date(item.created_at).toLocaleString('en-NG')}</p>
                                    </div>

                                    <div className="flex gap-2">
                                        {!item.read && (
                                            <button
                                                type="button"
                                                onClick={() => markOneAsRead(item.id)}
                                                disabled={saving === item.id}
                                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-brand-navy hover:bg-slate-50 disabled:opacity-60"
                                            >
                                                {saving === item.id ? 'Saving...' : 'Read'}
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedNotification(item)}
                                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-brand-navy hover:bg-slate-50"
                                        >
                                            View details
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </section>
            )}

            {selectedNotification && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-4">
                    <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/20">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-gray">Notification details</p>
                                <h2 className="mt-2 text-xl font-semibold text-brand-navy">{selectedNotification.title}</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedNotification(null)}
                                className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Message</p>
                                <p className="mt-1 text-sm leading-relaxed text-slate-700">{selectedNotification.body}</p>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Type</p>
                                    <p className="mt-1 text-sm font-medium text-brand-navy">{selectedNotification.type}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Time</p>
                                    <p className="mt-1 text-sm font-medium text-brand-navy">{new Date(selectedNotification.created_at).toLocaleString('en-NG')}</p>
                                </div>
                            </div>
                            {selectedNotification.metadata && Object.keys(selectedNotification.metadata).length > 0 && (
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Metadata</p>
                                    <pre className="mt-1 overflow-auto rounded-xl border border-slate-200 bg-white p-3 text-[11px] leading-relaxed text-slate-700">
                                        {JSON.stringify(selectedNotification.metadata, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}