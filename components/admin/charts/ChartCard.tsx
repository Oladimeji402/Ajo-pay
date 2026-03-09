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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-brand-navy">{title}</h3>
          {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
        </div>

        {onRangeChange && range ? (
          <div className="flex items-center gap-1 rounded-xl bg-slate-50 p-1">
            {ranges.map((option) => {
              const isActive = option.value === range;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onRangeChange(option.value)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    isActive ? 'bg-white text-brand-navy shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </header>

      <div className="h-72">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">Loading chart...</div>
        ) : (
          children
        )}
      </div>
    </motion.section>
  );
}
