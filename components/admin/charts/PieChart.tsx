'use client';

import React from 'react';
import { Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from 'recharts';

type PieDatum = {
  name: string;
  value: number;
};

type AdminPieChartProps = {
  data: PieDatum[];
  colors?: string[];
  innerRadius?: number;
  outerRadius?: number;
};

const DEFAULT_COLORS = ['#1B2F6B', '#0F766E', '#F59E0B', '#EF4444', '#64748B', '#0EA5E9'];

export function AdminPieChart({
  data,
  colors = DEFAULT_COLORS,
  innerRadius = 52,
  outerRadius = 84,
}: AdminPieChartProps) {
  return (
    <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_200px]">
      <div className="h-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Tooltip
              formatter={(value) => Number(value ?? 0).toLocaleString()}
              contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0' }}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${entry.name}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2 overflow-auto pr-1">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
                aria-hidden="true"
              />
              <span className="text-sm font-medium text-slate-700">{item.name}</span>
            </div>
            <span className="text-sm font-bold text-brand-navy">{item.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
