'use client';

import React, { useState } from 'react';
import { X, TriangleAlert, AlertCircle, Info, CheckCircle2, LucideIcon } from 'lucide-react';

export type ActionSeverity = 'danger' | 'warning' | 'info' | 'success';
export type InputField = {
    name: string;
    label: string;
    type?: 'text' | 'textarea' | 'number' | 'select';
    placeholder?: string;
    required?: boolean;
    options?: { value: string; label: string }[];
    defaultValue?: string | number;
    maxLength?: number;
    rows?: number;
};

export type AdminActionModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (formData?: Record<string, string | number>) => void | Promise<void>;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    severity?: ActionSeverity;
    icon?: LucideIcon;
    isLoading?: boolean;
    requiresInput?: InputField[];
    showAuditNote?: boolean;
};

const severityStyles = {
    danger: {
        icon: TriangleAlert,
        iconColor: 'text-red-600',
        borderColor: 'border-red-200',
        buttonBg: 'bg-red-600 hover:bg-red-700',
        label: 'CRITICAL ACTION',
        labelColor: 'text-red-600',
    },
    warning: {
        icon: AlertCircle,
        iconColor: 'text-amber-600',
        borderColor: 'border-amber-200',
        buttonBg: 'bg-amber-600 hover:bg-amber-700',
        label: 'WARNING',
        labelColor: 'text-amber-600',
    },
    info: {
        icon: Info,
        iconColor: 'text-blue-600',
        borderColor: 'border-blue-200',
        buttonBg: 'bg-blue-600 hover:bg-blue-700',
        label: 'INFORMATION',
        labelColor: 'text-blue-600',
    },
    success: {
        icon: CheckCircle2,
        iconColor: 'text-emerald-600',
        borderColor: 'border-emerald-200',
        buttonBg: 'bg-emerald-600 hover:bg-emerald-700',
        label: 'CONFIRM ACTION',
        labelColor: 'text-emerald-600',
    },
};

export function AdminActionModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    severity = 'warning',
    icon: CustomIcon,
    isLoading = false,
    requiresInput = [],
    showAuditNote = true,
}: AdminActionModalProps) {
    const [formData, setFormData] = useState<Record<string, string | number>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    const style = severityStyles[severity];
    const IconComponent = CustomIcon || style.icon;

    if (!isOpen) return null;

    const handleInputChange = (name: string, value: string | number) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        for (const field of requiresInput) {
            if (field.required) {
                const value = formData[field.name];
                if (!value || (typeof value === 'string' && value.trim() === '')) {
                    newErrors[field.name] = `${field.label} is required`;
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleConfirm = async () => {
        if (requiresInput.length > 0 && !validateForm()) {
            return;
        }

        await onConfirm(requiresInput.length > 0 ? formData : undefined);
    };

    const handleClose = () => {
        if (!isLoading) {
            setFormData({});
            setErrors({});
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] grid place-items-center bg-slate-950/60 px-4 backdrop-blur-sm">
            <div
                className={`w-full max-w-md rounded-2xl border ${style.borderColor} bg-white shadow-2xl shadow-slate-900/20`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
                    <div className="flex-1">
                        <p className={`text-[10px] font-bold uppercase tracking-[0.15em] ${style.labelColor}`}>
                            {style.label}
                        </p>
                        <h2
                            id="modal-title"
                            className="mt-1.5 text-lg font-bold text-brand-navy leading-tight"
                        >
                            {title}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isLoading}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                        aria-label="Close dialog"
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-4 space-y-4">
                    <div className="flex items-start gap-3">
                        <IconComponent size={18} className={`mt-0.5 shrink-0 ${style.iconColor}`} />
                        <p className="text-sm leading-relaxed text-slate-600">{description}</p>
                    </div>

                    {/* Input Fields */}
                    {requiresInput.length > 0 && (
                        <div className="space-y-3 pt-2">
                            {requiresInput.map((field) => (
                                <div key={field.name}>
                                    <label
                                        htmlFor={field.name}
                                        className="mb-1.5 block text-xs font-semibold text-brand-navy"
                                    >
                                        {field.label}
                                        {field.required && <span className="ml-1 text-red-500">*</span>}
                                    </label>

                                    {field.type === 'textarea' ? (
                                        <textarea
                                            id={field.name}
                                            name={field.name}
                                            value={(formData[field.name] as string) || ''}
                                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                                            placeholder={field.placeholder}
                                            maxLength={field.maxLength}
                                            rows={field.rows || 3}
                                            disabled={isLoading}
                                            className={`w-full rounded-lg border ${
                                                errors[field.name] ? 'border-red-300' : 'border-slate-200'
                                            } bg-white px-3 py-2 text-sm text-brand-navy placeholder:text-slate-400 focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20 disabled:bg-slate-50 disabled:opacity-60`}
                                        />
                                    ) : field.type === 'select' ? (
                                        <select
                                            id={field.name}
                                            name={field.name}
                                            value={(formData[field.name] as string) || ''}
                                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                                            disabled={isLoading}
                                            className={`w-full rounded-lg border ${
                                                errors[field.name] ? 'border-red-300' : 'border-slate-200'
                                            } bg-white px-3 py-2 text-sm text-brand-navy focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20 disabled:bg-slate-50 disabled:opacity-60`}
                                        >
                                            <option value="">Select {field.label}</option>
                                            {field.options?.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            id={field.name}
                                            name={field.name}
                                            type={field.type || 'text'}
                                            value={(formData[field.name] as string | number) || ''}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    field.name,
                                                    field.type === 'number'
                                                        ? Number(e.target.value)
                                                        : e.target.value
                                                )
                                            }
                                            placeholder={field.placeholder}
                                            maxLength={field.maxLength}
                                            disabled={isLoading}
                                            className={`w-full rounded-lg border ${
                                                errors[field.name] ? 'border-red-300' : 'border-slate-200'
                                            } bg-white px-3 py-2 text-sm text-brand-navy placeholder:text-slate-400 focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20 disabled:bg-slate-50 disabled:opacity-60`}
                                        />
                                    )}

                                    {errors[field.name] && (
                                        <p className="mt-1 text-xs text-red-600">{errors[field.name]}</p>
                                    )}

                                    {field.maxLength && (
                                        <p className="mt-1 text-xs text-slate-400">
                                            {((formData[field.name] as string)?.length || 0)}/{field.maxLength}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Audit Note */}
                    {showAuditNote && (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                            <p className="text-xs text-slate-600">
                                <Info size={12} className="mr-1 inline text-slate-400" />
                                This action will be recorded in the audit log.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex flex-wrap gap-2 border-t border-slate-100 px-6 py-4">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isLoading}
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-navy hover:bg-slate-50 disabled:opacity-60"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={() => void handleConfirm()}
                        disabled={isLoading}
                        className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg ${style.buttonBg} px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60`}
                    >
                        {isLoading ? (
                            <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <IconComponent size={14} />
                                {confirmLabel}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
