'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Upload,
    X,
    Loader2,
    MessageSquare,
    CheckCircle2,
    AlertCircle,
    FileText,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';

const ISSUE_CATEGORIES = [
    { value: 'payment', label: 'Payment Issue', icon: '💳' },
    { value: 'payout', label: 'Payout Problem', icon: '💰' },
    { value: 'account', label: 'Account Access', icon: '🔐' },
    { value: 'savings', label: 'Savings & Goals', icon: '🎯' },
    { value: 'technical', label: 'Technical Problem', icon: '⚙️' },
    { value: 'other', label: 'Other', icon: '❓' },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

export default function SupportPage() {
    const router = useRouter();
    const { showToast } = useToast();

    const [category, setCategory] = useState('');
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [transactionRef, setTransactionRef] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        
        // Validate file types and sizes
        const invalidFiles = selectedFiles.filter(
            file => !ALLOWED_FILE_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE
        );

        if (invalidFiles.length > 0) {
            notifyError(
                showToast,
                new Error('Invalid files'),
                'Only JPG, PNG, and PDF files under 5MB are allowed.'
            );
            return;
        }

        // Limit to 3 files total
        const remainingSlots = 3 - files.length;
        if (selectedFiles.length > remainingSlots) {
            notifyError(
                showToast,
                new Error('Too many files'),
                `You can only upload ${remainingSlots} more file(s).`
            );
            return;
        }

        setFiles(prev => [...prev, ...selectedFiles]);
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!category || !subject.trim() || !description.trim()) {
            notifyError(
                showToast,
                new Error('Missing fields'),
                'Please fill in all required fields.'
            );
            return;
        }

        setSubmitting(true);

        try {
            // Upload files to Supabase storage (if any)
            let attachmentUrls: string[] = [];
            if (files.length > 0) {
                const formData = new FormData();
                files.forEach(file => formData.append('files', file));

                const uploadRes = await fetch('/api/support/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!uploadRes.ok) {
                    throw new Error('Failed to upload attachments');
                }

                const uploadData = await uploadRes.json();
                attachmentUrls = uploadData.data?.urls || [];
            }

            // Create support ticket
            const response = await fetch('/api/support/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category,
                    subject: subject.trim(),
                    description: description.trim(),
                    transactionRef: transactionRef.trim() || null,
                    attachments: attachmentUrls,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit ticket');
            }

            notifySuccess(showToast, 'Support ticket submitted successfully. We\'ll get back to you soon!');
            
            // Reset form
            setCategory('');
            setSubject('');
            setDescription('');
            setTransactionRef('');
            setFiles([]);

            // Redirect to tickets list
            setTimeout(() => {
                router.push('/support/my-tickets');
            }, 1500);

        } catch (error) {
            notifyError(showToast, error, 'Failed to submit support ticket');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-brand-gray hover:text-brand-navy"
                >
                    <ArrowLeft size={14} /> Back
                </Link>
            </div>

            <div>
                <h1 className="text-2xl font-bold text-brand-navy flex items-center gap-2">
                    <MessageSquare size={24} className="text-brand-primary" />
                    Get Help
                </h1>
                <p className="text-sm text-brand-gray mt-1">
                    Submit a support ticket and our team will assist you within 24 hours.
                </p>
            </div>

            {/* Quick Help Links */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <AlertCircle size={14} />
                    Before you submit
                </p>
                <div className="space-y-1.5 text-xs text-blue-800">
                    <p>• <Link href="/activity" className="underline hover:text-blue-900">Check your transaction history</Link> for payment status</p>
                    <p>• Wallet funding takes 2-5 minutes to process</p>
                    <p>• Payouts are processed within 24 hours of approval</p>
                </div>
            </div>

            {/* Ticket Form */}
            <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-5">
                {/* Category Selection */}
                <div>
                    <label className="block text-sm font-semibold text-brand-navy mb-2">
                        What do you need help with? <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {ISSUE_CATEGORIES.map(cat => (
                            <button
                                key={cat.value}
                                type="button"
                                onClick={() => setCategory(cat.value)}
                                className={`rounded-xl border-2 p-3 text-left transition-all ${
                                    category === cat.value
                                        ? 'border-brand-primary bg-brand-primary/5'
                                        : 'border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <span className="text-xl mb-1 block">{cat.icon}</span>
                                <span className="text-xs font-semibold text-brand-navy">{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Subject */}
                <div>
                    <label htmlFor="subject" className="block text-sm font-semibold text-brand-navy mb-2">
                        Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="subject"
                        type="text"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        placeholder="Brief summary of your issue"
                        maxLength={100}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                    <p className="text-xs text-slate-500 mt-1">{subject.length}/100 characters</p>
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="description" className="block text-sm font-semibold text-brand-navy mb-2">
                        Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Please provide as much detail as possible about your issue..."
                        rows={6}
                        maxLength={1000}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm resize-none focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                    <p className="text-xs text-slate-500 mt-1">{description.length}/1000 characters</p>
                </div>

                {/* Transaction Reference (Optional) */}
                <div>
                    <label htmlFor="transactionRef" className="block text-sm font-semibold text-brand-navy mb-2">
                        Transaction Reference <span className="text-xs text-slate-500 font-normal">(Optional)</span>
                    </label>
                    <input
                        id="transactionRef"
                        type="text"
                        value={transactionRef}
                        onChange={e => setTransactionRef(e.target.value)}
                        placeholder="e.g., TXN-1234567890"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-mono focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                    <p className="text-xs text-slate-500 mt-1">If this is about a specific transaction, add the reference</p>
                </div>

                {/* File Attachments */}
                <div>
                    <label className="block text-sm font-semibold text-brand-navy mb-2">
                        Attachments <span className="text-xs text-slate-500 font-normal">(Optional, max 3 files)</span>
                    </label>
                    
                    {files.length < 3 && (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-brand-primary hover:bg-slate-50 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload size={24} className="text-slate-400 mb-2" />
                                <p className="text-xs text-slate-600 font-semibold">Click to upload</p>
                                <p className="text-xs text-slate-500 mt-1">JPG, PNG, or PDF (max 5MB)</p>
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                accept=".jpg,.jpeg,.png,.pdf"
                                multiple
                                onChange={handleFileSelect}
                            />
                        </label>
                    )}

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="mt-3 space-y-2">
                            {files.map((file, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                                >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <FileText size={16} className="text-slate-400 flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold text-brand-navy truncate">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {(file.size / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeFile(index)}
                                        className="ml-2 p-1 rounded-lg hover:bg-slate-200 transition-colors"
                                    >
                                        <X size={14} className="text-slate-500" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <div className="pt-3 border-t border-slate-100">
                    <button
                        type="submit"
                        disabled={submitting || !category || !subject.trim() || !description.trim()}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-bold text-white hover:bg-brand-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {submitting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={16} />
                                Submit Ticket
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* View Tickets Link */}
            <div className="text-center">
                <Link
                    href="/support/my-tickets"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:text-brand-primary-hover"
                >
                    <FileText size={16} />
                    View My Tickets
                </Link>
            </div>
        </div>
    );
}
