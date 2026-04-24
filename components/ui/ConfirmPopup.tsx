'use client';

import React from 'react';

type ConfirmPopupProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  tone?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmPopup({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  tone = 'default',
  onConfirm,
  onCancel,
}: ConfirmPopupProps) {
  if (!open) return null;

  const confirmClass = tone === 'danger'
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-brand-primary hover:bg-brand-primary-hover';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <h3 className="text-base font-bold text-brand-navy">{title}</h3>
        <p className="mt-2 text-sm text-brand-gray">{message}</p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:opacity-60 ${confirmClass}`}
          >
            {loading ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
