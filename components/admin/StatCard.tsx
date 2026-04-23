'use client';

import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    trend?: {
        value: string;
        isUp: boolean;
    };
    delay?: number;
    pulseOnChange?: boolean;
}

export const StatCard = ({
    label,
    value,
    icon: Icon,
    trend,
    delay = 0,
    pulseOnChange = false,
}: StatCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={
                pulseOnChange
                    ? { opacity: 1, y: 0, scale: [1, 1.008, 1] }
                    : { opacity: 1, y: 0 }
            }
            transition={pulseOnChange ? { delay, duration: 0.9 } : { delay }}
            className="bg-white rounded-xl border border-slate-100 p-4 hover:border-slate-200 transition-colors"
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                    {Icon && <Icon size={13} className="text-slate-400" strokeWidth={2} />}
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                        {label}
                    </span>
                </div>
                {trend && (
                    <span
                        className={`flex items-center gap-0.5 text-[11px] font-semibold ${
                            trend.isUp ? 'text-emerald-600' : 'text-red-500'
                        }`}
                    >
                        {trend.isUp ? (
                            <TrendingUp size={11} strokeWidth={2.5} />
                        ) : (
                            <TrendingDown size={11} strokeWidth={2.5} />
                        )}
                        {trend.value}
                    </span>
                )}
            </div>
            <p className="text-[22px] font-bold text-brand-navy tabular-nums leading-none">
                {value}
            </p>
        </motion.div>
    );
};
