'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
    ArrowLeft,
    Loader2,
    MessageSquare,
    Clock,
    User,
    Shield,
    Send,
    Paperclip,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type TicketEvent = {
    id: string;
    event_type: string;
    actor_type: 'user' | 'admin';
    actor_id: string;
    message?: string | null;
    details_json?: Record<string, unknown> | null;
    created_at: string;
    admin_name?: string | null;
};

type Ticket = {
    id: string;
    case_number: string;
    summary: string;
    complaint_type: string;
    severity: string;
    status: string;
    created_at: string;
    updated_at: string;
    events: TicketEvent[];
};

export default function TicketDetailPage() {
    const params = useParams();
    const ticketId = params?.id as string;
    const { showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [reply, setReply] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Real-time subscription for new messages
    useEffect(() => {
        if (!ticketId) return;

        const supabase = createSupabaseBrowserClient();
        
        // Subscribe to new events on this ticket
        const channel = supabase
            .channel(`ticket-${ticketId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'support_case_events',
                    filter: `case_id=eq.${ticketId}`,
                },
                (payload) => {
                    console.log('New message received:', payload);
                    // Reload ticket to get the new message
                    void loadTicket();
                }
            )
            .subscribe();

        return () => {
            void supabase.removeChannel(channel);
        };
    }, [ticketId]);

    const loadTicket = useCallback(async () => {
        if (!ticketId) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/support/tickets/${ticketId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load ticket');
            }

            setTicket(data.data);
        } catch (error) {
            notifyError(showToast, error, 'Failed to load ticket details');
        } finally {
            setLoading(false);
        }
    }, [ticketId, showToast]);

    useEffect(() => {
        void loadTicket();
    }, [loadTicket]);

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!reply.trim()) {
            notifyError(showToast, new Error('Empty message'), 'Please enter a message');
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`/api/support/tickets/${ticketId}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: reply.trim() }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send reply');
            }

            notifySuccess(showToast, 'Reply sent successfully');
            setReply('');
            await loadTicket(); // Reload to show new message
        } catch (error) {
            notifyError(showToast, error, 'Failed to send reply');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-center py-16">
                    <div className="flex items-center gap-2 text-sm text-brand-gray">
                        <Loader2 size={16} className="animate-spin" />
                        Loading ticket...
                    </div>
                </div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="max-w-3xl mx-auto">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
                    <p className="text-sm text-red-800">Ticket not found</p>
                    <Link
                        href="/support/my-tickets"
                        className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-brand-primary hover:text-brand-primary-hover"
                    >
                        <ArrowLeft size={14} />
                        Back to My Tickets
                    </Link>
                </div>
            </div>
        );
    }

    const statusColors: Record<string, string> = {
        open: 'bg-amber-100 text-amber-700',
        'in-progress': 'bg-blue-100 text-blue-700',
        resolved: 'bg-emerald-100 text-emerald-700',
        closed: 'bg-slate-100 text-slate-600',
    };

    return (
        <div className="max-w-3xl mx-auto space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link
                    href="/support/my-tickets"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-brand-gray hover:text-brand-navy"
                >
                    <ArrowLeft size={14} /> Back to Tickets
                </Link>
            </div>

            {/* Ticket Header */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-mono text-slate-500">{ticket.case_number}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColors[ticket.status]}`}>
                                {ticket.status.replace('-', ' ')}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize bg-slate-100 text-slate-600">
                                {ticket.severity}
                            </span>
                        </div>
                        <h1 className="text-xl font-bold text-brand-navy mb-1">{ticket.summary}</h1>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Clock size={12} />
                            <span>Created {formatDate(ticket.created_at)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Conversation */}
            <div className="rounded-2xl border border-slate-200 bg-white">
                <div className="p-5 border-b border-slate-100">
                    <h2 className="text-sm font-bold text-brand-navy flex items-center gap-2">
                        <MessageSquare size={16} />
                        Conversation
                    </h2>
                </div>

                <div className="p-5 space-y-4 max-h-[500px] overflow-y-auto">
                    {ticket.events.map(event => {
                        const isUser = event.actor_type === 'user';
                        const isMessage = event.event_type === 'message' || event.event_type === 'case_opened';

                        if (!isMessage && !event.message) {
                            // System events (status changes)
                            return (
                                <div key={event.id} className="flex justify-center">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-xs text-slate-600">
                                        <Clock size={12} />
                                        <span className="capitalize">{event.event_type.replace('_', ' ')}</span>
                                        <span>•</span>
                                        <span>{formatDate(event.created_at)}</span>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div
                                key={event.id}
                                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[80%] ${isUser ? 'ml-auto' : 'mr-auto'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        {isUser ? (
                                            <User size={14} className="text-brand-primary" />
                                        ) : (
                                            <Shield size={14} className="text-emerald-600" />
                                        )}
                                        <span className="text-xs font-semibold text-slate-700">
                                            {isUser ? 'You' : event.admin_name || 'Support Team'}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {formatDate(event.created_at)}
                                        </span>
                                    </div>
                                    <div
                                        className={`rounded-xl p-3 ${
                                            isUser
                                                ? 'bg-brand-primary text-white'
                                                : 'bg-slate-100 text-slate-800'
                                        }`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap">
                                            {event.message || event.details_json?.summary as string || 'No message'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Reply Form - Only show if ticket is not closed */}
                {ticket.status !== 'closed' && (
                    <form onSubmit={handleReply} className="p-5 border-t border-slate-100">
                        <div className="flex gap-2">
                            <textarea
                                value={reply}
                                onChange={e => setReply(e.target.value)}
                                placeholder="Type your reply..."
                                rows={2}
                                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm resize-none focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                            />
                            <button
                                type="submit"
                                disabled={submitting || !reply.trim()}
                                className="px-4 py-3 rounded-xl bg-brand-primary text-white hover:bg-brand-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {submitting ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <Send size={18} />
                                )}
                            </button>
                        </div>
                    </form>
                )}

                {ticket.status === 'closed' && (
                    <div className="p-5 border-t border-slate-100 bg-slate-50 text-center">
                        <p className="text-xs text-slate-600">
                            This ticket has been closed. Please create a new ticket if you need further assistance.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
