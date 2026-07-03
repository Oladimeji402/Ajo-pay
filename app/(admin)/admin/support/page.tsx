'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
    Search,
    Filter,
    Loader2,
    MessageSquare,
    Clock,
    AlertCircle,
    CheckCircle2,
    XCircle,
    User,
    ChevronRight,
    Send,
    X,
    Shield,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';
import { LastSynced } from '@/components/admin/LastSynced';
import { useRealtimeSubscription } from '@/lib/hooks/useRealtimeSubscription';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type SupportCase = {
    id: string;
    case_number: string;
    user_id: string;
    summary: string;
    complaint_type: string;
    severity: string;
    status: string;
    created_at: string;
    updated_at: string;
    profiles?: {
        id: string;
        name: string;
        email: string;
        phone?: string | null;
    } | null;
};

type CaseEvent = {
    id: string;
    event_type: string;
    actor_type: 'user' | 'admin';
    actor_id: string;
    message?: string | null;
    created_at: string;
    profiles?: {
        name: string;
    } | null;
};

const STATUS_OPTIONS = [
    { value: 'all', label: 'All Cases', icon: <Filter size={14} />, color: 'bg-slate-100 text-slate-700' },
    { value: 'open', label: 'Open', icon: <Clock size={14} />, color: 'bg-amber-100 text-amber-700' },
    { value: 'in-progress', label: 'In Progress', icon: <AlertCircle size={14} />, color: 'bg-blue-100 text-blue-700' },
    { value: 'resolved', label: 'Resolved', icon: <CheckCircle2 size={14} />, color: 'bg-emerald-100 text-emerald-700' },
    { value: 'closed', label: 'Closed', icon: <XCircle size={14} />, color: 'bg-slate-100 text-slate-600' },
];

const SEVERITY_OPTIONS = ['low', 'medium', 'high', 'critical'];

const CATEGORY_ICONS: Record<string, string> = {
    payment: '💳',
    payout: '💰',
    account: '🔐',
    savings: '🎯',
    technical: '⚙️',
    other: '❓',
};

function AdminSupportSkeleton() {
    return (
        <div className="space-y-5 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="h-7 w-48 rounded bg-slate-200" />
                <div className="h-4 w-32 rounded bg-slate-200" />
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
                {Array.from({ length: 4 }, (_, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-100 bg-white p-4 h-20" />
                ))}
            </div>
            <div className="rounded-xl border border-slate-100 bg-white p-3 h-16" />
            <div className="space-y-2">
                {Array.from({ length: 5 }, (_, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-100 bg-white p-4 h-24" />
                ))}
            </div>
        </div>
    );
}

export default function AdminSupportPage() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [cases, setCases] = useState<SupportCase[]>([]);
    const [selectedCase, setSelectedCase] = useState<SupportCase | null>(null);
    const [caseEvents, setCaseEvents] = useState<CaseEvent[]>([]);
    const [statusFilter, setStatusFilter] = useState('all');
    const [severityFilter, setSeverityFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [response, setResponse] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [newSeverity, setNewSeverity] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [lastSync, setLastSync] = useState(new Date());

    // Real-time subscription
    const { refreshTrigger } = useRealtimeSubscription({
        channelName: 'admin-support-cases',
        tables: ['support_cases', 'support_case_events'],
    });

    const loadCases = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (severityFilter !== 'all') params.append('severity', severityFilter);
            if (searchTerm.trim()) params.append('search', searchTerm.trim());

            const response = await fetch(`/api/admin/support-cases?${params}`, {
                cache: 'no-store',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load support cases');
            }

            setCases(data.data || []);
            setLastSync(new Date());
        } catch (error) {
            notifyError(showToast, error, 'Failed to load support cases');
        } finally {
            setLoading(false);
        }
    }, [statusFilter, severityFilter, searchTerm, showToast]);

    useEffect(() => {
        void loadCases();
    }, [loadCases, refreshTrigger]);

    const loadCaseDetails = async (caseItem: SupportCase) => {
        setSelectedCase(caseItem);
        setNewStatus(caseItem.status);
        setNewSeverity(caseItem.severity);

        try {
            const response = await fetch(`/api/admin/support-cases/${caseItem.id}`, {
                cache: 'no-store',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load case details');
            }

            setCaseEvents(data.data.events || []);
        } catch (error) {
            notifyError(showToast, error, 'Failed to load case details');
        }
    };

    // Real-time subscription for selected case messages
    useEffect(() => {
        if (!selectedCase) return;

        const supabase = createSupabaseBrowserClient();
        
        const channel = supabase
            .channel(`admin-case-${selectedCase.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'support_case_events',
                    filter: `case_id=eq.${selectedCase.id}`,
                },
                (payload) => {
                    console.log('New message received:', payload);
                    // Reload case details to get the new message
                    void loadCaseDetails(selectedCase);
                }
            )
            .subscribe();

        return () => {
            void supabase.removeChannel(channel);
        };
    }, [selectedCase?.id]);

    const handleSendResponse = async () => {
        if (!selectedCase || !response.trim()) {
            notifyError(showToast, new Error('Empty response'), 'Please enter a response');
            return;
        }

        setSubmitting(true);
        try {
            const requestData: {
                message: string;
                status?: string;
                severity?: string;
            } = {
                message: response.trim(),
            };

            // Include status and severity if they changed
            if (newStatus !== selectedCase.status) {
                requestData.status = newStatus;
            }
            if (newSeverity !== selectedCase.severity) {
                requestData.severity = newSeverity;
            }

            const apiResponse = await fetch(
                `/api/admin/support-cases/${selectedCase.id}/respond`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestData),
                }
            );

            const data = await apiResponse.json();

            if (!apiResponse.ok) {
                throw new Error(data.error || 'Failed to send response');
            }

            notifySuccess(showToast, 'Response sent successfully');
            setResponse('');
            
            // Reload case details and list
            await loadCaseDetails({ ...selectedCase, status: newStatus, severity: newSeverity });
            await loadCases();
        } catch (error) {
            notifyError(showToast, error, 'Failed to send response');
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusChange = async (caseId: string, status: string) => {
        try {
            const response = await fetch(`/api/admin/support-cases/${caseId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update status');
            }

            notifySuccess(showToast, 'Status updated');
            await loadCases();
            
            if (selectedCase?.id === caseId) {
                setSelectedCase({ ...selectedCase, status });
                setNewStatus(status);
            }
        } catch (error) {
            notifyError(showToast, error, 'Failed to update status');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString('en-NG', { 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const stats = {
        total: cases.length,
        open: cases.filter(c => c.status === 'open').length,
        inProgress: cases.filter(c => c.status === 'in-progress').length,
        resolved: cases.filter(c => c.status === 'resolved').length,
    };

    if (loading && cases.length === 0) {
        return <AdminSupportSkeleton />;
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-brand-navy">Support Cases</h1>
                    <p className="text-sm text-brand-gray mt-0.5">Manage user support tickets and inquiries</p>
                </div>
                <LastSynced timestamp={lastSync.toISOString()} />
            </div>

            {/* Stats */}
            <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                    <p className="text-xs font-semibold text-brand-gray mb-1">Total Cases</p>
                    <p className="text-2xl font-bold text-brand-navy">{stats.total}</p>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                    <p className="text-xs font-semibold text-amber-700 mb-1">Open</p>
                    <p className="text-2xl font-bold text-amber-700">{stats.open}</p>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-xs font-semibold text-blue-700 mb-1">In Progress</p>
                    <p className="text-2xl font-bold text-blue-700">{stats.inProgress}</p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-xs font-semibold text-emerald-700 mb-1">Resolved</p>
                    <p className="text-2xl font-bold text-emerald-700">{stats.resolved}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="rounded-xl border border-slate-100 bg-white p-4 space-y-3">
                {/* Status Filter */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {STATUS_OPTIONS.map(option => (
                        <button
                            key={option.value}
                            onClick={() => setStatusFilter(option.value)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                                statusFilter === option.value
                                    ? 'bg-brand-primary text-white'
                                    : option.color + ' hover:opacity-80'
                            }`}
                        >
                            {option.icon}
                            {option.label}
                        </button>
                    ))}
                </div>

                {/* Search and Severity */}
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search by case number, user, or summary..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                        />
                    </div>
                    <select
                        value={severityFilter}
                        onChange={e => setSeverityFilter(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-brand-navy focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    >
                        <option value="all">All Severities</option>
                        {SEVERITY_OPTIONS.map(sev => (
                            <option key={sev} value={sev} className="capitalize">
                                {sev}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Cases List */}
            <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
                {/* List */}
                <div className="space-y-2">
                    {cases.length === 0 ? (
                        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
                            <MessageSquare size={48} className="text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-brand-navy mb-2">No cases found</h3>
                            <p className="text-sm text-brand-gray">
                                {statusFilter !== 'all' || severityFilter !== 'all' || searchTerm
                                    ? 'Try adjusting your filters'
                                    : 'No support cases have been submitted yet'}
                            </p>
                        </div>
                    ) : (
                        cases.map(caseItem => {
                            const statusInfo = STATUS_OPTIONS.find(s => s.value === caseItem.status) || STATUS_OPTIONS[1];
                            const categoryIcon = CATEGORY_ICONS[caseItem.complaint_type] || '❓';
                            const isSelected = selectedCase?.id === caseItem.id;

                            return (
                                <button
                                    key={caseItem.id}
                                    onClick={() => loadCaseDetails(caseItem)}
                                    className={`w-full text-left rounded-xl border p-4 transition-all ${
                                        isSelected
                                            ? 'border-brand-primary bg-brand-primary/5'
                                            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-base">{categoryIcon}</span>
                                                <span className="text-xs font-mono text-slate-500">
                                                    {caseItem.case_number}
                                                </span>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                                                    {statusInfo.icon}
                                                    {statusInfo.label}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                                                    caseItem.severity === 'critical' ? 'bg-red-100 text-red-700' :
                                                    caseItem.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                                                    caseItem.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {caseItem.severity}
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-bold text-brand-navy mb-1 truncate">
                                                {caseItem.summary}
                                            </h3>
                                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <User size={12} />
                                                    {caseItem.profiles?.name || caseItem.profiles?.email || 'Unknown'}
                                                </span>
                                                <span>•</span>
                                                <span>{formatDate(caseItem.created_at)}</span>
                                            </div>
                                        </div>
                                        <ChevronRight size={20} className={`flex-shrink-0 ${isSelected ? 'text-brand-primary' : 'text-slate-400'}`} />
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Case Detail Panel */}
                {selectedCase && (
                    <div className="lg:sticky lg:top-5 lg:self-start rounded-xl border border-slate-200 bg-white overflow-hidden max-h-[calc(100vh-120px)] flex flex-col">
                        {/* Header */}
                        <div className="p-4 border-b border-slate-100 bg-slate-50">
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-bold text-brand-navy mb-1 truncate">
                                        {selectedCase.summary}
                                    </h3>
                                    <p className="text-xs text-brand-gray">
                                        {selectedCase.profiles?.name || 'Unknown User'} • {selectedCase.profiles?.email}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedCase(null)}
                                    className="lg:hidden p-1 rounded-lg hover:bg-slate-200"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Status and Severity Controls */}
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    value={newStatus}
                                    onChange={e => {
                                        setNewStatus(e.target.value);
                                        void handleStatusChange(selectedCase.id, e.target.value);
                                    }}
                                    className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:border-brand-primary focus:outline-none"
                                >
                                    <option value="open">Open</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                </select>
                                <select
                                    value={newSeverity}
                                    onChange={e => setNewSeverity(e.target.value)}
                                    className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold capitalize focus:border-brand-primary focus:outline-none"
                                >
                                    {SEVERITY_OPTIONS.map(sev => (
                                        <option key={sev} value={sev} className="capitalize">
                                            {sev}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Conversation */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {caseEvents.map(event => {
                                const isUser = event.actor_type === 'user';
                                const isMessage = event.event_type === 'message' || event.event_type === 'case_opened';

                                if (!isMessage && !event.message) {
                                    return (
                                        <div key={event.id} className="flex justify-center">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-xs text-slate-600">
                                                <Clock size={10} />
                                                <span className="capitalize">{event.event_type.replace('_', ' ')}</span>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={event.id} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-[85%] ${isUser ? 'mr-auto' : 'ml-auto'}`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                {isUser ? (
                                                    <User size={12} className="text-blue-600" />
                                                ) : (
                                                    <Shield size={12} className="text-emerald-600" />
                                                )}
                                                <span className="text-xs font-semibold text-slate-700">
                                                    {isUser ? selectedCase.profiles?.name || 'User' : event.profiles?.name || 'Admin'}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    {formatDate(event.created_at)}
                                                </span>
                                            </div>
                                            <div className={`rounded-xl p-3 text-sm ${
                                                isUser
                                                    ? 'bg-slate-100 text-slate-800'
                                                    : 'bg-emerald-600 text-white'
                                            }`}>
                                                <p className="whitespace-pre-wrap">{event.message}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Response Form */}
                        <div className="p-4 border-t border-slate-100">
                            <div className="space-y-2">
                                <textarea
                                    value={response}
                                    onChange={e => setResponse(e.target.value)}
                                    placeholder="Type your response..."
                                    rows={3}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                                />
                                <button
                                    onClick={handleSendResponse}
                                    disabled={submitting || !response.trim()}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={16} />
                                            Send Response
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
