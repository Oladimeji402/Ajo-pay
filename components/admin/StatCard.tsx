'use client';

import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: string;
        isUp: boolean;
    };
    color?: string;
    delay?: number;
}

export const StatCard = ({ label, value, icon: Icon, trend, color = 'brand-navy', delay = 0 }: StatCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all group"
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-${color} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${trend.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                        }`}>
                        {trend.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {trend.value}
                    </div>
                )}
            </div>
            <div>
                <p className="text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                <h3 className="text-2xl font-black text-brand-navy tracking-tight">{value}</h3>
            </div>
        </motion.div>
    );
};
