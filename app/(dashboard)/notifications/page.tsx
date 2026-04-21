'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, BookOpen, CheckCheck, Clock3, Layers, Loader2, Settings, ShieldCheck, Target, Users, Wallet, X } from 'lucide-react';
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

function getNotificationMeta(type: string): {
    category: NotificationCategory;
    badge: { label: string; icon: React.ElementType; className: string };
} {
    switch (type) {
        case 'passbook_activated':
            return { category: 'transaction', badge: { label: 'Passbook', icon: BookOpen, className: 'bg-amber-50 text-amber-700 border-amber-200' } };
        case 'payment_success':
            return { category: 'transaction', badge: { label: 'Transaction', icon: Wallet, className: 'bg-blue-50 text-blue-700 border-blue-200' } };
        case 'individual_savings_paid':
            return { category: 'transaction', badge: { label: 'Savings', icon: Target, className: 'bg-purple-50 text-purple-700 border-purple-200' } };
        case 'bulk_payment_confirmed':
            return { category: 'transaction', badge: { label: 'Bulk Pay', icon: Layers, className: 'bg-indigo-50 text-indigo-700 border-indigo-200' } };
        case 'group_leave':
            return { category: 'group', badge: { label: 'Group', icon: Users, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' } };
        case 'password_changed':
            return { category: 'security', badge: { label: 'Security', icon: ShieldCheck, className: 'bg-red-50 text-red-700 border-red-200' } };
        case 'email_change_requested':
            return { category: 'account', badge: { label: 'Account', icon: Settings, className: 'bg-slate-100 text-slate-700 border-slate-200' } };
        default:
            if (type.includes('reminder')) {
                return { category: 'reminder', badge: { label: 'Reminder', icon: Clock3, className: 'bg-amber-50 text-amber-700 border-amber-200' } };
            }
            if (type.includes('group')) {
                return { category: 'group', badge: { label: 'Group', icon: Users, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' } };
            }
            return { category: 'account', badge: { label: 'Account', icon: Settings, className: 'bg-slate-100 text-slate-700 border-slate-200' } };
    }
}

function getNotificationCategory(type: string): NotificationCategory {
    return getNotificationMeta(type).category;
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
        <div className="max-w-2xl mx-auto space-y-4">
            {/* Top bar: filters + mark all */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter.key}
                            type="button"
                            onClick={() => setActiveFilter(filter.key)}
                            className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${activeFilter === filter.key
                                ? 'border-brand-primary bg-brand-primary text-white'
                                : 'border-slate-200 bg-white text-brand-navy hover:bg-blue-50 hover:border-blue-200'}`}
                        >
                            {filter.label}
                            {filter.key === 'all' && unreadCount > 0 && (
                                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={markAllAsRead}
                    disabled={saving === 'all' || unreadCount === 0}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-brand-primary hover:bg-blue-100 disabled:opacity-50"
                >
                    <CheckCheck size={13} />
                    Mark all read
                </button>
            </div>

            {error && <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

            {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white p-10 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                        <Bell size={20} />
                    </div>
                    <p className="text-sm font-semibold text-brand-navy">No notifications here</p>
                    <p className="text-xs text-brand-gray">Try another filter to see more.</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
                    {filteredNotifications.map((item) => {
                        const { badge } = getNotificationMeta(item.type);
                        const BadgeIcon = badge.icon;

                        return (
                            <article key={item.id} className={`p-4 ${!item.read ? 'bg-blue-50/40' : ''}`}>
                                <div className="flex items-start gap-3">
                                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${badge.className}`}>
                                        <BadgeIcon size={14} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-semibold text-brand-navy leading-snug">{item.title}</p>
                                            {!item.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-primary" />}
                                        </div>
                                        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">{item.body}</p>
                                        <div className="mt-2 flex items-center gap-3">
                                            <p className="text-[10px] text-slate-400">{new Date(item.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                            {!item.read && (
                                                <button
                                                    type="button"
                                                    onClick={() => markOneAsRead(item.id)}
                                                    disabled={saving === item.id}
                                                    className="text-[10px] font-semibold text-brand-primary hover:underline disabled:opacity-60"
                                                >
                                                    {saving === item.id ? 'Saving...' : 'Mark as read'}
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setSelectedNotification(item)}
                                                className="text-[10px] font-semibold text-slate-400 hover:text-brand-navy"
                                            >
                                                View
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {selectedNotification && (
                <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-slate-950/60 px-0 sm:px-4">
                    <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-gray">Notification</p>
                                <h2 className="mt-1 text-base font-bold text-brand-navy">{selectedNotification.title}</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedNotification(null)}
                                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50"
                            >
                                <X size={15} />
                            </button>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-600 mb-4">{selectedNotification.body}</p>
                        <p className="text-xs text-slate-400 mb-5">{new Date(selectedNotification.created_at).toLocaleString('en-NG')}</p>
                        <button
                            type="button"
                            onClick={() => setSelectedNotification(null)}
                            className="w-full rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary-hover"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}