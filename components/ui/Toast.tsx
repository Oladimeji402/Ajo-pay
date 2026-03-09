'use client';

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

type ToastItem = {
    id: string;
    type: ToastType;
    message: string;
    duration: number;
};

type ToastOptions = {
    type?: ToastType;
    duration?: number;
};

type ToastContextValue = {
    showToast: (message: string, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function toastTone(type: ToastType) {
    if (type === 'success') {
        return {
            icon: <CheckCircle2 size={16} className="text-emerald-600" />,
            container: 'border-emerald-100 bg-emerald-50 text-emerald-800',
        };
    }

    if (type === 'error') {
        return {
            icon: <XCircle size={16} className="text-red-600" />,
            container: 'border-red-100 bg-red-50 text-red-800',
        };
    }

    if (type === 'warning') {
        return {
            icon: <TriangleAlert size={16} className="text-amber-600" />,
            container: 'border-amber-100 bg-amber-50 text-amber-800',
        };
    }

    return {
        icon: <Info size={16} className="text-blue-600" />,
        container: 'border-blue-100 bg-blue-50 text-blue-800',
    };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const timeoutMap = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const removeToast = useCallback((id: string) => {
        const timeoutId = timeoutMap.current.get(id);
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutMap.current.delete(id);
        }

        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback((message: string, options?: ToastOptions) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const duration = options?.duration ?? 4000;
        const nextToast: ToastItem = {
            id,
            type: options?.type ?? 'info',
            message,
            duration,
        };

        setToasts((prev) => [...prev, nextToast]);

        const timeoutId = setTimeout(() => {
            removeToast(id);
        }, duration);
        timeoutMap.current.set(id, timeoutId);
    }, [removeToast]);

    const value = useMemo(() => ({ showToast }), [showToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}

            <div className="pointer-events-none fixed right-4 top-4 z-9999 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
                {toasts.map((toast) => {
                    const tone = toastTone(toast.type);

                    return (
                        <div
                            key={toast.id}
                            className={`pointer-events-auto flex items-start gap-2 rounded-xl border px-3 py-2.5 shadow-lg ${tone.container}`}
                            role="status"
                            aria-live="polite"
                        >
                            <span className="mt-0.5 shrink-0">{tone.icon}</span>
                            <p className="grow text-xs font-semibold leading-relaxed">{toast.message}</p>
                            <button
                                type="button"
                                onClick={() => removeToast(toast.id)}
                                className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100"
                                aria-label="Close notification"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }

    return context;
}
