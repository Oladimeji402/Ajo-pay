'use client';

import React from 'react';
import { motion } from 'motion/react';

type DateRangeOption = {
  label: string;
  value: string;
};

type ChartCardProps = {
  title: string;
  subtitle?: string;
  loading?: boolean;
  range?: string;
  ranges?: DateRangeOption[];
  onRangeChange?: (nextRange: string) => void;
  children: React.ReactNode;
};

const DEFAULT_RANGES: DateRangeOption[] = [
  { label: '7D', value: '7' },
  { label: '30D', value: '30' },
  { label: '90D', value: '90' },
  { label: '1Y', value: '365' },
];

export function ChartCard({
  title,
  subtitle,
  loading = false,
  range,
  ranges = DEFAULT_RANGES,
  onRangeChange,
  children,
}: ChartCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-slate-100 bg-white p-5"
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-brand-navy">{title}</h3>
          {subtitle ? (
            <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
          ) : null}
        </div>

        {onRangeChange && range ? (
          <div className="flex items-center gap-0.5">
            {ranges.map((option) => {
              const isActive = option.value === range;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onRangeChange(option.value)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                    isActive
                      ? 'bg-slate-100 text-brand-navy'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </header>

      <div className="h-64">
        {loading ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            Loading...
          </div>
        ) : (
          children
        )}
      </div>
    </motion.section>
  );
}
