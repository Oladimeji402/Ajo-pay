'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
    Send,
    MessageSquare,
    Mail,
    Phone,
    Users,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    Plus,
    Eye,
    Calendar,
    Filter,
    FileText,
    AlertCircle,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';
import { LastSynced } from '@/components/admin/LastSynced';

// ============================================================================
// Types
// ============================================================================

type Message = {
    id: string;
    campaign_name: string;
    channel: 'email' | 'sms' | 'in_app' | 'email_sms' | 'email_in_app' | 'sms_in_app' | 'all';
    status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';
    total_recipients: number;
    sent_count: number;
    failed_count: number;
    delivered_count: number;
    scheduled_for?: string | null;
    sent_at?: string | null;
    created_at: string;
};

type Template = {
    id: string;
    name: string;
    description?: string;
    channel: 'email' | 'sms' | 'in_app' | 'email_sms' | 'email_in_app' | 'sms_in_app' | 'all';
    subject?: string;
    email_body?: string;
    sms_body?: string;
    in_app_body?: string;
    category?: string;
    variables: string[];
    usage_count: number;
    is_active: boolean;
};

type Group = {
    id: string;
    name: string;
    member_count: number;
};

// REMOVED: No group savings in platform anymore

type DeliveryLog = {
    id: string;
    channel: 'email' | 'sms' | 'in_app';
    recipient_address: string;
    status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
    user: {
        name: string;
        email: string;
    };
    sent_at?: string | null;
    error_message?: string | null;
};

// ============================================================================
// Compose Message Form
// ============================================================================

function ComposeMessageForm({ templates, onMessageSent }: {
    templates: Template[];
    onMessageSent: () => void;
}) {
    const { showToast } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    
    const [formData, setFormData] = useState({
        campaign_name: '',
        channel: 'email_in_app' as 'email' | 'sms' | 'in_app' | 'email_sms' | 'email_in_app' | 'sms_in_app' | 'all',
        subject: '',
        email_body: '',
        sms_body: '',
        in_app_body: '',
        audience_type: 'all' as 'all' | 'group_members' | 'custom_filter',
        group_ids: [] as string[],
        scheduled_for: '',
        send_now: false,
    });

    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplate(templateId);
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setFormData(prev => ({
                ...prev,
                channel: template.channel,
                subject: template.subject || '',
                email_body: template.email_body || '',
                sms_body: template.sms_body || '',
                in_app_body: template.in_app_body || '',
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.campaign_name.trim()) {
            notifyError(showToast, new Error('Campaign name required'), 'Please enter a campaign name');
            return;
        }

        if ((formData.channel === 'email' || formData.channel === 'email_sms' || formData.channel === 'email_in_app' || formData.channel === 'all') && !formData.email_body.trim()) {
            notifyError(showToast, new Error('Email body required'), 'Please enter email content');
            return;
        }

        if ((formData.channel === 'sms' || formData.channel === 'email_sms' || formData.channel === 'sms_in_app' || formData.channel === 'all') && !formData.sms_body.trim()) {
            // SMS is disabled, so skip this validation
            // notifyError(showToast, new Error('SMS body required'), 'Please enter SMS content');
            // return;
        }

        if ((formData.channel === 'in_app' || formData.channel === 'email_in_app' || formData.channel === 'sms_in_app' || formData.channel === 'all') && !formData.in_app_body.trim()) {
            notifyError(showToast, new Error('In-app message required'), 'Please enter in-app notification content');
            return;
        }

        setSubmitting(true);

        try {
            // Clean up payload before sending
            const payload: any = {
                campaign_name: formData.campaign_name,
                channel: formData.channel,
                audience_type: formData.audience_type,
                send_now: formData.send_now,
            };

            // Only add fields that have values
            if (formData.subject?.trim()) payload.subject = formData.subject;
            if (formData.email_body?.trim()) payload.email_body = formData.email_body;
            if (formData.sms_body?.trim()) payload.sms_body = formData.sms_body;
            if (formData.in_app_body?.trim()) payload.in_app_body = formData.in_app_body;
            if (formData.scheduled_for?.trim()) payload.scheduled_for = formData.scheduled_for;
            if (formData.group_ids?.length > 0) payload.group_ids = formData.group_ids;
            if (selectedTemplate) payload.template_id = selectedTemplate;

            const response = await fetch('/api/admin/communications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('API Error Response:', data);
                throw new Error(data.error || data.details?.[0]?.message || 'Failed to create message');
            }

            notifySuccess(
                showToast,
                `Message ${formData.send_now ? 'sent' : 'saved'} to ${data.recipients_count} recipient(s)`
            );

            // Reset form
            setFormData({
                campaign_name: '',
                channel: 'email_in_app',
                subject: '',
                email_body: '',
                sms_body: '',
                in_app_body: '',
                audience_type: 'all',
                group_ids: [],
                scheduled_for: '',
                send_now: false,
            });
            setSelectedTemplate('');
            onMessageSent();
        } catch (error) {
            notifyError(showToast, error, 'Failed to send message');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campaign Name */}
            <div>
                <label className="block text-sm font-semibold text-brand-navy mb-2">
                    Campaign Name *
                </label>
                <input
                    type="text"
                    value={formData.campaign_name}
                    onChange={e => setFormData(prev => ({ ...prev, campaign_name: e.target.value }))}
                    placeholder="e.g., Payment Reminder - March 2026"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
            </div>

            {/* Template Selection */}
            <div>
                <label className="block text-sm font-semibold text-brand-navy mb-2">
                    Use Template (Optional)
                </label>
                <select
                    value={selectedTemplate}
                    onChange={e => handleTemplateSelect(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                >
                    <option value="">Start from scratch</option>
                    {templates.filter(t => t.is_active).map(template => (
                        <option key={template.id} value={template.id}>
                            {template.name} ({template.channel})
                        </option>
                    ))}
                </select>
            </div>

            {/* Channel Selection */}
            <div>
                <label className="block text-sm font-semibold text-brand-navy mb-2">
                    Channel *
                </label>
                <div className="grid grid-cols-3 gap-2">
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, channel: 'email' }))}
                        className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                            formData.channel === 'email'
                                ? 'border-brand-primary bg-brand-primary text-white'
                                : 'border-slate-200 bg-white text-brand-navy hover:border-slate-300'
                        }`}
                    >
                        <Mail size={16} />
                        Email
                    </button>
                    {/* SMS Disabled for now */}
                    {/* <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, channel: 'sms' }))}
                        className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                            formData.channel === 'sms'
                                ? 'border-brand-primary bg-brand-primary text-white'
                                : 'border-slate-200 bg-white text-brand-navy hover:border-slate-300'
                        }`}
                    >
                        <Phone size={16} />
                        SMS
                    </button> */}
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, channel: 'in_app' }))}
                        className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                            formData.channel === 'in_app'
                                ? 'border-brand-primary bg-brand-primary text-white'
                                : 'border-slate-200 bg-white text-brand-navy hover:border-slate-300'
                        }`}
                    >
                        <MessageSquare size={16} />
                        In-App
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, channel: 'email_in_app' }))}
                        className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                            formData.channel === 'email_in_app'
                                ? 'border-brand-primary bg-brand-primary text-white'
                                : 'border-slate-200 bg-white text-brand-navy hover:border-slate-300'
                        }`}
                    >
                        <Users size={16} />
                        Both
                    </button>
                </div>
            </div>

            {/* Email Content */}
            {(formData.channel === 'email' || formData.channel === 'email_sms' || formData.channel === 'email_in_app' || formData.channel === 'all') && (
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-semibold text-brand-navy mb-2">
                            Email Subject
                        </label>
                        <input
                            type="text"
                            value={formData.subject}
                            onChange={e => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                            placeholder="Enter email subject"
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-brand-navy mb-2">
                            Email Body *
                        </label>
                        <textarea
                            value={formData.email_body}
                            onChange={e => setFormData(prev => ({ ...prev, email_body: e.target.value }))}
                            placeholder="Enter email content. Use {{name}}, {{group_name}}, etc. for variables"
                            rows={6}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm resize-none focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                        />
                    </div>
                </div>
            )}

            {/* SMS Content */}
            {(formData.channel === 'sms' || formData.channel === 'email_sms' || formData.channel === 'sms_in_app' || formData.channel === 'all') && (
                <div>
                    <label className="block text-sm font-semibold text-brand-navy mb-2">
                        SMS Body * <span className="text-xs text-slate-500">(160 chars recommended)</span>
                    </label>
                    <textarea
                        value={formData.sms_body}
                        onChange={e => setFormData(prev => ({ ...prev, sms_body: e.target.value }))}
                        placeholder="Enter SMS content. Keep it short!"
                        rows={3}
                        maxLength={320}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm resize-none focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        {formData.sms_body.length} / 320 characters
                    </p>
                </div>
            )}

            {/* In-App Notification Content */}
            {(formData.channel === 'in_app' || formData.channel === 'email_in_app' || formData.channel === 'sms_in_app' || formData.channel === 'all') && (
                <div>
                    <label className="block text-sm font-semibold text-brand-navy mb-2">
                        In-App Notification Body *
                    </label>
                    <textarea
                        value={formData.in_app_body}
                        onChange={e => setFormData(prev => ({ ...prev, in_app_body: e.target.value }))}
                        placeholder="Enter in-app notification content. Use {{name}}, {{group_name}}, etc. for variables"
                        rows={4}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm resize-none focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        This will appear in the user's notification center within the app
                    </p>
                </div>
            )}

            {/* Audience Selection */}
            <div>
                <label className="block text-sm font-semibold text-brand-navy mb-2">
                    Send To *
                </label>
                <div className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3">
                    <p className="text-sm font-semibold text-brand-navy">All Users</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                        Message will be sent to all users (admins excluded)
                    </p>
                </div>
            </div>

            {/* Group Selection - REMOVED (no group savings) */}

            {/* Schedule */}
            <div>
                <label className="block text-sm font-semibold text-brand-navy mb-2">
                    Schedule (Optional)
                </label>
                <input
                    type="datetime-local"
                    value={formData.scheduled_for}
                    onChange={e => setFormData(prev => ({ ...prev, scheduled_for: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3">
                <button
                    type="submit"
                    onClick={() => setFormData(prev => ({ ...prev, send_now: false }))}
                    disabled={submitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-brand-navy hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                    {submitting && !formData.send_now ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <FileText size={16} />
                    )}
                    Save as Draft
                </button>
                <button
                    type="submit"
                    onClick={() => setFormData(prev => ({ ...prev, send_now: true }))}
                    disabled={submitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-semibold text-white hover:bg-brand-primary-hover disabled:opacity-50 transition-colors"
                >
                    {submitting && formData.send_now ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <Send size={16} />
                    )}
                    Send Now
                </button>
            </div>
        </form>
    );
}

// ============================================================================
// Message History List
// ============================================================================

function MessageHistoryList({ messages, onViewDetails }: {
    messages: Message[];
    onViewDetails: (id: string) => void;
}) {
    const getStatusBadge = (status: string) => {
        const badges: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
            draft: { 
                label: 'Draft', 
                className: 'bg-slate-100 text-slate-700',
                icon: <FileText size={12} />
            },
            scheduled: { 
                label: 'Scheduled', 
                className: 'bg-blue-100 text-blue-700',
                icon: <Clock size={12} />
            },
            sending: { 
                label: 'Sending', 
                className: 'bg-amber-100 text-amber-700',
                icon: <Loader2 size={12} className="animate-spin" />
            },
            sent: { 
                label: 'Sent', 
                className: 'bg-emerald-100 text-emerald-700',
                icon: <CheckCircle2 size={12} />
            },
            failed: { 
                label: 'Failed', 
                className: 'bg-red-100 text-red-700',
                icon: <XCircle size={12} />
            },
            cancelled: { 
                label: 'Cancelled', 
                className: 'bg-slate-100 text-slate-600',
                icon: <XCircle size={12} />
            },
        };

        const badge = badges[status] || badges.draft;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
                {badge.icon}
                {badge.label}
            </span>
        );
    };

    const getChannelIcon = (channel: string) => {
        if (channel === 'email') return <Mail size={14} className="text-blue-600" />;
        if (channel === 'sms') return <Phone size={14} className="text-emerald-600" />;
        if (channel === 'in_app') return <MessageSquare size={14} className="text-purple-600" />;
        return <Users size={14} className="text-orange-600" />; // 'all' or combinations
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (messages.length === 0) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
                <MessageSquare size={48} className="text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-brand-navy mb-2">No messages yet</h3>
                <p className="text-sm text-brand-gray">
                    Create your first campaign to start communicating with users
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {messages.map(message => (
                <div
                    key={message.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 hover:shadow-sm transition-all"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                {getChannelIcon(message.channel)}
                                <h3 className="text-sm font-bold text-brand-navy truncate">
                                    {message.campaign_name}
                                </h3>
                                {getStatusBadge(message.status)}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-600">
                                <span className="flex items-center gap-1">
                                    <Users size={12} />
                                    {message.total_recipients} recipients
                                </span>
                                {message.status === 'sent' && (
                                    <>
                                        <span className="flex items-center gap-1 text-emerald-600">
                                            <CheckCircle2 size={12} />
                                            {message.sent_count} sent
                                        </span>
                                        {message.failed_count > 0 && (
                                            <span className="flex items-center gap-1 text-red-600">
                                                <XCircle size={12} />
                                                {message.failed_count} failed
                                            </span>
                                        )}
                                    </>
                                )}
                                <span>•</span>
                                <span>{formatDate(message.created_at)}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => onViewDetails(message.id)}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-brand-navy hover:bg-slate-50 transition-colors"
                        >
                            <Eye size={14} />
                            View Details
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ============================================================================
// Main Communication Center Page
// ============================================================================

export default function CommunicationCenterPage() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [migrationNeeded, setMigrationNeeded] = useState(false);
    const [activeTab, setActiveTab] = useState<'compose' | 'history' | 'templates'>('compose');
    const [messages, setMessages] = useState<Message[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [lastSync, setLastSync] = useState(new Date());

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // Load templates first (lightest query)
            const templatesRes = await fetch('/api/admin/communications/templates?active_only=true', { 
                cache: 'no-store',
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });
            
            if (templatesRes.ok) {
                const templatesData = await templatesRes.json();
                
                // Check if migration is needed
                if (templatesData.error?.includes('migration')) {
                    setMigrationNeeded(true);
                }
                
                setTemplates(templatesData.data || []);
            }

            // Load messages only (no groups needed)
            const messagesRes = await fetch('/api/admin/communications?pageSize=20', { 
                cache: 'no-store',
                signal: AbortSignal.timeout(10000)
            }).catch(() => null);

            if (messagesRes?.ok) {
                const messagesData = await messagesRes.json();
                setMessages(messagesData.data || []);
            }

            setLastSync(new Date());
        } catch (error) {
            console.error('Load data error:', error);
            notifyError(showToast, error, 'Failed to load some data. Some features may be limited.');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    // Load data only on mount, not on every tab change
    useEffect(() => {
        void loadData();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const stats = {
        total: messages.length,
        sent: messages.filter(m => m.status === 'sent').length,
        scheduled: messages.filter(m => m.status === 'scheduled').length,
        draft: messages.filter(m => m.status === 'draft').length,
    };

    if (loading) {
        return (
            <div className="space-y-5 animate-pulse">
                {/* Header skeleton */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="h-8 w-64 rounded bg-slate-200 mb-2" />
                        <div className="h-4 w-48 rounded bg-slate-200" />
                    </div>
                </div>
                {/* Stats skeleton */}
                <div className="grid gap-3 sm:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, idx) => (
                        <div key={idx} className="rounded-xl border border-slate-100 bg-white p-4">
                            <div className="h-3 w-24 rounded bg-slate-200 mb-2" />
                            <div className="h-8 w-16 rounded bg-slate-200" />
                        </div>
                    ))}
                </div>
                {/* Content skeleton */}
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <div className="h-64 flex items-center justify-center">
                        <div className="flex items-center gap-2 text-sm text-brand-gray">
                            <Loader2 size={16} className="animate-spin" />
                            Loading Communication Center...
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Migration Warning Banner */}
            {migrationNeeded && (
                <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-amber-900 mb-1">
                                Database Migration Required
                            </h3>
                            <p className="text-sm text-amber-800 mb-3">
                                The Communication Center tables haven't been created yet. Please run the migration file:
                            </p>
                            <code className="block bg-amber-100 text-amber-900 px-3 py-2 rounded-lg text-xs font-mono mb-2">
                                supabase/migrations/20260702000001_communication_center.sql
                            </code>
                            <p className="text-xs text-amber-700">
                                Run this via Supabase Dashboard SQL Editor or CLI: <code className="bg-amber-100 px-1 rounded">npx supabase db push</code>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-brand-navy">Communication Center</h1>
                    <p className="text-sm text-brand-gray mt-0.5">Send bulk emails and SMS to users</p>
                </div>
                <LastSynced timestamp={lastSync.toISOString()} />
            </div>

            {/* Stats */}
            <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                    <p className="text-xs font-semibold text-brand-gray mb-1">Total Campaigns</p>
                    <p className="text-2xl font-bold text-brand-navy">{stats.total}</p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-xs font-semibold text-emerald-700 mb-1">Sent</p>
                    <p className="text-2xl font-bold text-emerald-700">{stats.sent}</p>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-xs font-semibold text-blue-700 mb-1">Scheduled</p>
                    <p className="text-2xl font-bold text-blue-700">{stats.scheduled}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-700 mb-1">Drafts</p>
                    <p className="text-2xl font-bold text-slate-700">{stats.draft}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('compose')}
                    className={`px-4 py-3 text-sm font-semibold transition-all ${
                        activeTab === 'compose'
                            ? 'text-brand-primary border-b-2 border-brand-primary'
                            : 'text-brand-gray hover:text-brand-navy'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <Send size={16} />
                        Compose Message
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-3 text-sm font-semibold transition-all ${
                        activeTab === 'history'
                            ? 'text-brand-primary border-b-2 border-brand-primary'
                            : 'text-brand-gray hover:text-brand-navy'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <Clock size={16} />
                        Message History
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('templates')}
                    className={`px-4 py-3 text-sm font-semibold transition-all ${
                        activeTab === 'templates'
                            ? 'text-brand-primary border-b-2 border-brand-primary'
                            : 'text-brand-gray hover:text-brand-navy'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <FileText size={16} />
                        Templates ({templates.length})
                    </div>
                </button>
            </div>

            {/* Tab Content */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
                {activeTab === 'compose' && (
                    <ComposeMessageForm
                        templates={templates}
                        onMessageSent={loadData}
                    />
                )}

                {activeTab === 'history' && (
                    <MessageHistoryList
                        messages={messages}
                        onViewDetails={(id) => {
                            // TODO: Open message details modal
                            console.log('View details for:', id);
                        }}
                    />
                )}

                {activeTab === 'templates' && (
                    <div className="space-y-3">
                        {templates.map(template => (
                            <div
                                key={template.id}
                                className="rounded-xl border border-slate-200 p-4"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-sm font-bold text-brand-navy mb-1">
                                            {template.name}
                                        </h3>
                                        <p className="text-xs text-brand-gray mb-2">
                                            {template.description}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 capitalize">
                                                {template.channel}
                                            </span>
                                            {template.category && (
                                                <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                                                    {template.category}
                                                </span>
                                            )}
                                            <span className="text-slate-500">
                                                Used {template.usage_count} times
                                            </span>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                        template.is_active
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        {template.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
