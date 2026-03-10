'use client';

import React from 'react';
import { Bar, BarChart as RechartsBarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type AdminBarChartProps<TData extends Record<string, string | number>> = {
    data: TData[];
    xKey: keyof TData;
    barKey: keyof TData;
    color?: string;
    valueFormatter?: (value: number) => string;
};

export function AdminBarChart<TData extends Record<string, string | number>>({
    data,
    xKey,
    barKey,
    color = '#1B2F6B',
    valueFormatter,
}: AdminBarChartProps<TData>) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey={xKey as string} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value: number) => (valueFormatter ? valueFormatter(value) : value.toLocaleString())}
                />
                <Tooltip
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0' }}
                    formatter={(value) => {
                        const numericValue = Number(value ?? 0);
                        return valueFormatter ? valueFormatter(numericValue) : numericValue.toLocaleString();
                    }}
                />
                <Bar dataKey={barKey as string} fill={color} radius={[8, 8, 0, 0]} />
            </RechartsBarChart>
        </ResponsiveContainer>
    );
}
