'use client';

import React from 'react';

export type DateRangeValue = '7' | '30' | '90' | 'all';

type DateRangeOption = {
    label: string;
    value: DateRangeValue;
};

type DateRangeSelectorProps = {
    value: DateRangeValue;
    onChange: (value: DateRangeValue) => void;
    options?: DateRangeOption[];
    className?: string;
};

const DEFAULT_OPTIONS: DateRangeOption[] = [
    { label: '7D', value: '7' },
    { label: '30D', value: '30' },
    { label: '90D', value: '90' },
    { label: 'All', value: 'all' },
];

export function DateRangeSelector({
    value,
    onChange,
    options = DEFAULT_OPTIONS,
    className = '',
}: DateRangeSelectorProps) {
    return (
        <div className={`inline-flex items-center rounded-xl bg-slate-100 p-1 ${className}`.trim()}>
            {options.map((option) => {
                const isActive = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${isActive ? 'bg-white text-brand-navy shadow-sm' : 'text-slate-600 hover:text-slate-800'
                            }`}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
