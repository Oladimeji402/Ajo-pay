'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Loader2,
    MessageSquare,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ChevronRight,
    Plus,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { notifyError } from '@/lib/toast';

type Ticket = {
    id: string;
    case_number: string;
    summary: string;
    complaint_type: string;
    severity: string;
    status: string;
    created_at: string;
    updated_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    open: {
        label: 'Open',
        icon: <Clock size={14} />,
        color: 'bg-amber-100 text-amber-700',
    },
    'in-progress': {
        label: 'In Progress',
        icon: <AlertCircle size={14} />,
        color: 'bg-blue-100 text-blue-700',
    },
    resolved: {
        label: 'Resolved',
        icon: <CheckCircle2 size={14} />,
        color: 'bg-emerald-100 text-emerald-700',
    },
    closed: {
        label: 'Closed',
        icon: <XCircle size={14} />,
        color: 'bg-slate-100 text-slate-600',
    },
};

const CATEGORY_ICONS: Record<string, string> = {
    payment: '💳',
    payout: '💰',
    account: '🔐',
    savings: '🎯',
    technical: '⚙️',
    other: '❓',
};

export default function MyTicketsPage() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [filter, setFilter] = useState<string>('all');

    const loadTickets = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter !== 'all') {
                params.append('status', filter);
            }

            const response = await fetch(`/api/support/tickets?${params}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load tickets');
            }

            setTickets(data.data || []);
        } catch (error) {
            notifyError(showToast, error, 'Failed to load support tickets');
        } finally {
            setLoading(false);
        }
    }, [filter, showToast]);

    useEffect(() => {
        void loadTickets();
    }, [loadTickets]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString('en-NG', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-center py-16">
                    <div className="flex items-center gap-2 text-sm text-brand-gray">
                        <Loader2 size={16} className="animate-spin" />
                        Loading your tickets...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-xs font-semibold text-brand-gray hover:text-brand-navy"
                    >
                        <ArrowLeft size={14} /> Back
                    </Link>
                </div>
                <Link
                    href="/support"
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-bold text-white hover:bg-brand-primary-hover transition-colors"
                >
                    <Plus size={16} />
                    New Ticket
                </Link>
            </div>

            <div>
                <h1 className="text-2xl font-bold text-brand-navy flex items-center gap-2">
                    <MessageSquare size={24} className="text-brand-primary" />
                    My Support Tickets
                </h1>
                <p className="text-sm text-brand-gray mt-1">
                    Track your support requests and view responses from our team.
                </p>
            </div>

            {/* Filters */}
            <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex gap-2 overflow-x-auto">
                    {['all', 'open', 'in-progress', 'resolved', 'closed'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                                filter === status
                                    ? 'bg-brand-primary text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {status === 'all' ? 'All Tickets' : STATUS_CONFIG[status]?.label || status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tickets List */}
            {tickets.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                    <MessageSquare size={48} className="text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-brand-navy mb-2">No tickets found</h3>
                    <p className="text-sm text-brand-gray mb-6">
                        {filter === 'all'
                            ? "You haven't submitted any support tickets yet."
                            : `You don't have any ${filter} tickets.`}
                    </p>
                    <Link
                        href="/support"
                        className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-6 py-3 text-sm font-bold text-white hover:bg-brand-primary-hover transition-colors"
                    >
                        <Plus size={16} />
                        Submit Your First Ticket
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {tickets.map(ticket => {
                        const statusInfo = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
                        const categoryIcon = CATEGORY_ICONS[ticket.complaint_type] || '❓';

                        return (
                            <Link
                                key={ticket.id}
                                href={`/support/my-tickets/${ticket.id}`}
                                className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-brand-primary hover:shadow-sm transition-all"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-lg">{categoryIcon}</span>
                                            <span className="text-xs font-mono text-slate-500">
                                                {ticket.case_number}
                                            </span>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                                                {statusInfo.icon}
                                                {statusInfo.label}
                                            </span>
                                        </div>
                                        <h3 className="text-sm font-bold text-brand-navy mb-1 truncate">
                                            {ticket.summary}
                                        </h3>
                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                            <span>Created {formatDate(ticket.created_at)}</span>
                                            <span>•</span>
                                            <span className="capitalize">{ticket.severity} priority</span>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-slate-400 flex-shrink-0" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
