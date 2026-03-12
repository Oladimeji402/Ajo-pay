'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CalendarCheck2,
  Clock3,
  DollarSign,
  Layers3,
  Loader2,
  Percent,
  Users,
} from 'lucide-react';
import { StatCard } from '@/components/admin/StatCard';
import { ActivityFeed } from '@/components/admin/ActivityFeed';
import { LastSynced } from '@/components/admin/LastSynced';
import { ChartCard } from '@/components/admin/charts/ChartCard';
import { AdminAreaChart } from '@/components/admin/charts/AreaChart';
import { AdminPieChart } from '@/components/admin/charts/PieChart';
import { AdminBarChart } from '@/components/admin/charts/BarChart';
import { useRealtimeSubscription } from '@/lib/hooks/useRealtimeSubscription';

const OVERVIEW_REALTIME_TABLES = ['contributions', 'payment_records', 'payouts', 'profiles', 'groups'];

type AdminStats = {
  totalUsers: number;
  activeGroups: number;
  pendingPayouts: number;
  totalVolume: number;
};

type TrendPoint = {
  date: string;
  amount: number;
  count: number;
};

type GrowthPoint = {
  date: string;
  count: number;
};

type BreakdownPoint = {
  name: string;
  value: number;
};

type ActivityItem = {
  id: string;
  type: 'contribution' | 'payout' | 'signup' | 'group';
  title: string;
  description: string;
  timestamp: string;
};

type DashboardData = {
  stats: AdminStats;
  contributionTrends: TrendPoint[];
  payoutTrends: TrendPoint[];
  userGrowth: GrowthPoint[];
  groupsByCategory: BreakdownPoint[];
  contributionsByStatus: BreakdownPoint[];
  topGroupsByContributions: BreakdownPoint[];
  activities: ActivityItem[];
};

function formatCurrency(value: number) {
  return `NGN ${Number(value ?? 0).toLocaleString('en-NG')}`;
}

function percentChange(current: number, previous: number) {
  if (previous <= 0 && current <= 0) return 0;
  if (previous <= 0 && current > 0) return 100;
  return ((current - previous) / previous) * 100;
}

function trendBadge(current: number, previous: number) {
  const change = percentChange(current, previous);
  const sign = change > 0 ? '+' : '';
  return {
    value: `${sign}${change.toFixed(1)}%`,
    isUp: change >= 0,
  };
}

function sumLastDays(rows: TrendPoint[], days: number, key: 'amount' | 'count') {
  return rows.slice(Math.max(0, rows.length - days)).reduce((acc, row) => acc + Number(row[key] ?? 0), 0);
}

function sumPreviousDays(rows: TrendPoint[], days: number, key: 'amount' | 'count') {
  const start = Math.max(0, rows.length - days * 2);
  const end = Math.max(0, rows.length - days);
  return rows.slice(start, end).reduce((acc, row) => acc + Number(row[key] ?? 0), 0);
}

function sumCurrentMonth(rows: TrendPoint[]) {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  return rows.reduce((total, row) => {
    const d = new Date(row.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      return total + Number(row.amount ?? 0);
    }
    return total;
  }, 0);
}

function sumPreviousMonth(rows: TrendPoint[]) {
  const now = new Date();
  const previousMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const previousYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  return rows.reduce((total, row) => {
    const d = new Date(row.date);
    if (d.getFullYear() === previousYear && d.getMonth() === previousMonth) {
      return total + Number(row.amount ?? 0);
    }
    return total;
  }, 0);
}

export default function AdminOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [metric, setMetric] = useState<'amount' | 'count'>('amount');
  const [trendRange, setTrendRange] = useState('30');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const { refreshTrigger, lastEvent } = useRealtimeSubscription({
    channelName: 'admin-overview-live',
    tables: OVERVIEW_REALTIME_TABLES,
  });

  useEffect(() => {
    if (lastEvent?.timestamp) {
      setLastSyncedAt(lastEvent.timestamp);
    }
  }, [lastEvent]);

  useEffect(() => {
    const run = async () => {
      if (refreshTrigger > 0) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      try {
        const requestedDays = Math.max(Number(trendRange) || 30, 90);

        const [statsRes, trendsRes, breakdownRes, activityRes] = await Promise.all([
          fetch('/api/admin/stats', { cache: 'no-store' }),
          fetch(`/api/admin/stats/trends?days=${requestedDays}`, { cache: 'no-store' }),
          fetch('/api/admin/stats/breakdown', { cache: 'no-store' }),
          fetch('/api/admin/activity?limit=20', { cache: 'no-store' }),
        ]);

        const [statsJson, trendsJson, breakdownJson, activityJson] = await Promise.all([
          statsRes.json(),
          trendsRes.json(),
          breakdownRes.json(),
          activityRes.json(),
        ]);

        if (!statsRes.ok) throw new Error(statsJson.error || 'Failed to load stats.');
        if (!trendsRes.ok) throw new Error(trendsJson.error || 'Failed to load trends.');
        if (!breakdownRes.ok) throw new Error(breakdownJson.error || 'Failed to load breakdown.');
        if (!activityRes.ok) throw new Error(activityJson.error || 'Failed to load activity.');

        setDashboard({
          stats: (statsJson.data ?? {}) as AdminStats,
          contributionTrends: Array.isArray(trendsJson.data?.contributionTrends)
            ? trendsJson.data.contributionTrends
            : [],
          payoutTrends: Array.isArray(trendsJson.data?.payoutTrends) ? trendsJson.data.payoutTrends : [],
          userGrowth: Array.isArray(trendsJson.data?.userGrowth) ? trendsJson.data.userGrowth : [],
          groupsByCategory: Array.isArray(breakdownJson.data?.groupsByCategory)
            ? breakdownJson.data.groupsByCategory
            : [],
          contributionsByStatus: Array.isArray(breakdownJson.data?.contributionsByStatus)
            ? breakdownJson.data.contributionsByStatus
            : [],
          topGroupsByContributions: Array.isArray(breakdownJson.data?.topGroupsByContributions)
            ? breakdownJson.data.topGroupsByContributions
            : [],
          activities: Array.isArray(activityJson.data?.activities) ? activityJson.data.activities : [],
        });
        setLastSyncedAt(new Date().toISOString());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load admin dashboard.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    void run();
  }, [refreshTrigger, trendRange]);

  if (loading && !dashboard) {
    return (
      <div className="grid min-h-80 place-items-center text-sm text-brand-gray">
        <Loader2 className="animate-spin" size={16} />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-600">
        {error || 'No data'}
      </div>
    );
  }

  const filteredTrends = dashboard.contributionTrends.slice(
    Math.max(0, dashboard.contributionTrends.length - Number(trendRange)),
  );

  const recentUsers = dashboard.userGrowth;
  const usersCurrentPeriod = recentUsers
    .slice(Math.max(0, recentUsers.length - 30))
    .reduce((a, b) => a + b.count, 0);
  const usersPreviousPeriod = recentUsers
    .slice(Math.max(0, recentUsers.length - 60), Math.max(0, recentUsers.length - 30))
    .reduce((a, b) => a + b.count, 0);

  const volumeCurrent = sumLastDays(dashboard.contributionTrends, 30, 'amount');
  const volumePrevious = sumPreviousDays(dashboard.contributionTrends, 30, 'amount');

  const payoutCurrent = sumLastDays(dashboard.payoutTrends, 30, 'count');
  const payoutPrevious = sumPreviousDays(dashboard.payoutTrends, 30, 'count');

  const contributionsThisMonth = sumCurrentMonth(dashboard.contributionTrends);
  const contributionsPreviousMonth = sumPreviousMonth(dashboard.contributionTrends);

  const totalContributions = dashboard.contributionsByStatus.reduce(
    (sum, item) => sum + Number(item.value ?? 0),
    0,
  );
  const successContributions = dashboard.contributionsByStatus
    .filter((item) => item.name === 'success')
    .reduce((sum, item) => sum + Number(item.value ?? 0), 0);
  const successRate = totalContributions > 0 ? (successContributions / totalContributions) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Admin Overview</h1>
          <LastSynced timestamp={lastSyncedAt} loading={refreshing || loading} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/groups"
            className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Create Group
          </Link>
          <Link
            href="/admin/payouts"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-brand-navy transition hover:bg-slate-50"
          >
            Process Payouts
          </Link>
          <Link
            href="/admin/transactions"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-brand-navy transition hover:bg-slate-50"
          >
            Export Data
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          label="Total Users"
          value={dashboard.stats.totalUsers}
          icon={Users}
          trend={trendBadge(usersCurrentPeriod, usersPreviousPeriod)}
          pulseOnChange={refreshing}
        />
        <StatCard
          label="Active Groups"
          value={dashboard.stats.activeGroups}
          icon={Layers3}
          trend={trendBadge(
            sumLastDays(dashboard.contributionTrends, 30, 'count'),
            sumPreviousDays(dashboard.contributionTrends, 30, 'count'),
          )}
          delay={0.05}
          pulseOnChange={refreshing}
        />
        <StatCard
          label="Total Volume"
          value={formatCurrency(dashboard.stats.totalVolume)}
          icon={DollarSign}
          trend={trendBadge(volumeCurrent, volumePrevious)}
          delay={0.1}
          pulseOnChange={refreshing}
        />
        <StatCard
          label="Pending Payouts"
          value={dashboard.stats.pendingPayouts}
          icon={Clock3}
          trend={trendBadge(payoutCurrent, payoutPrevious)}
          delay={0.15}
          pulseOnChange={refreshing}
        />
        <StatCard
          label="Success Rate"
          value={`${successRate.toFixed(1)}%`}
          icon={Percent}
          trend={{ value: successRate >= 80 ? 'On target' : 'Below target', isUp: successRate >= 80 }}
          delay={0.2}
          pulseOnChange={refreshing}
        />
        <StatCard
          label="Contributions This Month"
          value={formatCurrency(contributionsThisMonth)}
          icon={CalendarCheck2}
          trend={trendBadge(contributionsThisMonth, contributionsPreviousMonth)}
          delay={0.25}
          pulseOnChange={refreshing}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <ChartCard
          title="Contribution Trends"
          subtitle="Track contribution volume over time"
          range={trendRange}
          ranges={[
            { label: '7D', value: '7' },
            { label: '30D', value: '30' },
            { label: '90D', value: '90' },
          ]}
          onRangeChange={setTrendRange}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
              <button
                type="button"
                className={`rounded-md px-3 py-1 ${metric === 'amount' ? 'bg-white text-brand-navy shadow-sm' : 'text-slate-500'}`}
                onClick={() => setMetric('amount')}
              >
                Amount
              </button>
              <button
                type="button"
                className={`rounded-md px-3 py-1 ${metric === 'count' ? 'bg-white text-brand-navy shadow-sm' : 'text-slate-500'}`}
                onClick={() => setMetric('count')}
              >
                Count
              </button>
            </div>
            {refreshing ? <Loader2 size={14} className="animate-spin text-slate-500" /> : null}
          </div>

          <AdminAreaChart
            data={filteredTrends.map((item) => ({ ...item, label: item.date.slice(5) }))}
            xKey="label"
            series={[
              {
                key: metric,
                name: metric === 'amount' ? 'Contribution Amount' : 'Contribution Count',
                color: metric === 'amount' ? '#1B2F6B' : '#0F766E',
              },
            ]}
            valueFormatter={(value) => (metric === 'amount' ? formatCurrency(value) : value.toLocaleString())}
          />
        </ChartCard>

        <ActivityFeed activities={dashboard.activities} loading={refreshing && dashboard.activities.length === 0} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Groups by Category" subtitle="Ajo, school, mosque, church">
          <AdminPieChart data={dashboard.groupsByCategory} />
        </ChartCard>

        <ChartCard title="Transaction Status" subtitle="Contribution status distribution">
          <AdminPieChart
            data={dashboard.contributionsByStatus}
            colors={['#0F766E', '#F59E0B', '#EF4444', '#1B2F6B']}
          />
        </ChartCard>

        <ChartCard title="Top Groups" subtitle="Highest contribution totals">
          <AdminBarChart
            data={dashboard.topGroupsByContributions}
            xKey="name"
            barKey="value"
            color="#1B2F6B"
            valueFormatter={formatCurrency}
          />
        </ChartCard>
      </div>
    </div>
  );
}
