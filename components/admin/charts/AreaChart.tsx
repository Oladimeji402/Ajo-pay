'use client';

import React from 'react';
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type AreaChartSeries = {
  key: string;
  name: string;
  color: string;
};

type AdminAreaChartProps<TData extends Record<string, string | number>> = {
  data: TData[];
  xKey: keyof TData;
  series: AreaChartSeries[];
  valueFormatter?: (value: number) => string;
};

export function AdminAreaChart<TData extends Record<string, string | number>>({
  data,
  xKey,
  series,
  valueFormatter,
}: AdminAreaChartProps<TData>) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsAreaChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
        <defs>
          {series.map((item) => (
            <linearGradient key={item.key} id={`gradient-${item.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={item.color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={item.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>

        <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
        <XAxis dataKey={xKey as string} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 12, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value: number) => (valueFormatter ? valueFormatter(value) : value.toLocaleString())}
        />
        <Tooltip
          contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0' }}
          formatter={(value, name) => {
            const numericValue = Number(value ?? 0);
            const formattedValue = valueFormatter ? valueFormatter(numericValue) : numericValue.toLocaleString();
            return [formattedValue, String(name)];
          }}
        />

        {series.map((item) => (
          <Area
            key={item.key}
            type="monotone"
            dataKey={item.key}
            name={item.name}
            stroke={item.color}
            strokeWidth={2}
            fill={`url(#gradient-${item.key})`}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
