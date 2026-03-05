'use client';

import React from 'react';

type StatusType = 'Active' | 'Suspended' | 'Pending' | 'Done' | 'Paid' | 'Upcoming' | 'Your Turn' | 'Received' | 'Success' | 'Failed' | 'Completed';

interface StatusBadgeProps {
    status: StatusType | string;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
    const getStyles = (s: string) => {
        switch (s) {
            case 'Active':
            case 'Success':
            case 'Done':
            case 'Paid':
            case 'Received':
            case 'Completed':
                return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Pending':
            case 'Your Turn':
                return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'Suspended':
            case 'Failed':
                return 'bg-red-50 text-red-600 border-red-100';
            case 'Upcoming':
                return 'bg-slate-50 text-slate-500 border-slate-100';
            default:
                return 'bg-slate-50 text-slate-500 border-slate-100';
        }
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getStyles(status)}`}>
            {status}
        </span>
    );
};
