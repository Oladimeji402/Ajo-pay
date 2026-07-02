'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Loader2, Users, Wallet, PiggyBank, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';

type SavingsPlanRow = {
  plan_id: string;
  plan_name: string;
  frequency: string;
  minimum_amount: number;
  total_users: number;
  total_saved: number;
  total_paid_out: number;
  current_balance: number;
  users: Array<{
    user_id: string;
    user_name: string;
    user_email: string;
    total_saved: number;
    total_paid_out: number;
    current_balance: number;
  }>;
};

type OverviewData = {
  savingsPlans: SavingsPlanRow[];
  totalWalletBalance: number;
  totalInSavings: number;
  totalPaidOut: number;
  totalUsers: number;
};

type FrequencyType = 'daily' | 'weekly' | 'monthly';

type FrequencyData = {
  users: Array<{
    user_id: string;
    user_name: string;
    user_email: string;
    plan_name: string;
    total_saved: number;
    total_paid_out: number;
    current_balance: number;
  }>;
  totalSaved: number;
  totalPaidOut: number;
  currentBalance: number;
  minAmount: number;
};

function toCurrency(value: number) {
  return `NGN ${Number(value).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function SavingsOverviewSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-7 w-64 rounded bg-slate-200" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, idx) => (
          <div key={idx} className="rounded-xl border border-slate-100 bg-white p-4 h-24" />
        ))}
      </div>
      <div className="rounded-xl border border-slate-100 bg-white p-3 h-96" />
    </div>
  );
}

export default function AdminSavingsOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<OverviewData | null>(null);
  const [activeTab, setActiveTab] = useState<FrequencyType>('daily');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/admin/savings-overview', { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load savings overview.');
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load savings overview.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  // Reset to page 1 when switching tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Process data by frequency
  const frequencyData = useMemo<Record<FrequencyType, FrequencyData>>(() => {
    if (!data) {
      return {
        daily: { users: [], totalSaved: 0, totalPaidOut: 0, currentBalance: 0, minAmount: 0 },
        weekly: { users: [], totalSaved: 0, totalPaidOut: 0, currentBalance: 0, minAmount: 0 },
        monthly: { users: [], totalSaved: 0, totalPaidOut: 0, currentBalance: 0, minAmount: 0 },
      };
    }

    const result: Record<FrequencyType, FrequencyData> = {
      daily: { users: [], totalSaved: 0, totalPaidOut: 0, currentBalance: 0, minAmount: 0 },
      weekly: { users: [], totalSaved: 0, totalPaidOut: 0, currentBalance: 0, minAmount: 0 },
      monthly: { users: [], totalSaved: 0, totalPaidOut: 0, currentBalance: 0, minAmount: 0 },
    };

    (['daily', 'weekly', 'monthly'] as FrequencyType[]).forEach((freq) => {
      const plansForFrequency = data.savingsPlans.filter((p) => p.frequency === freq);
      
      if (plansForFrequency.length > 0) {
        // Flatten all users from all plans of this frequency
        const allUsers = plansForFrequency.flatMap((plan) =>
          plan.users.map((user) => ({
            ...user,
            plan_name: plan.plan_name,
          }))
        );

        result[freq] = {
          users: allUsers,
          totalSaved: plansForFrequency.reduce((sum, p) => sum + p.total_saved, 0),
          totalPaidOut: plansForFrequency.reduce((sum, p) => sum + p.total_paid_out, 0),
          currentBalance: plansForFrequency.reduce((sum, p) => sum + p.current_balance, 0),
          minAmount: Math.min(...plansForFrequency.map((p) => p.minimum_amount)),
        };
      }
    });

    return result;
  }, [data]);

  // Get current tab data with pagination
  const currentFrequencyData = frequencyData[activeTab];
  const totalPages = Math.ceil(currentFrequencyData.users.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = currentFrequencyData.users.slice(startIndex, endIndex);

  if (loading) return <SavingsOverviewSkeleton />;

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-brand-navy">Savings Overview</h1>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-brand-navy">Savings Overview</h1>
        <div className="rounded-xl border border-slate-100 bg-white p-8 text-center text-slate-400">
          No data available.
        </div>
      </div>
    );
  }

  const grandTotal = data.totalWalletBalance + data.totalInSavings;

  const tabs: Array<{ key: FrequencyType; label: string }> = [
    { key: 'daily', label: 'Daily Savings' },
    { key: 'weekly', label: 'Weekly Savings' },
    { key: 'monthly', label: 'Monthly Savings' },
  ];

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">Savings Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Complete view of all user savings and wallet balances</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-lg bg-blue-100 p-2">
              <Wallet size={20} className="text-blue-700" />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total in Wallets</p>
          </div>
          <p className="text-2xl font-bold text-blue-700">{toCurrency(data.totalWalletBalance)}</p>
          <p className="text-xs text-slate-500 mt-1">Liquid funds (not in savings)</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-lg bg-emerald-100 p-2">
              <PiggyBank size={20} className="text-emerald-700" />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total in Savings</p>
          </div>
          <p className="text-2xl font-bold text-emerald-700">{toCurrency(data.totalInSavings)}</p>
          <p className="text-xs text-slate-500 mt-1">Locked in savings plans</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-lg bg-purple-100 p-2">
              <TrendingUp size={20} className="text-purple-700" />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Paid Out</p>
          </div>
          <p className="text-2xl font-bold text-purple-700">{toCurrency(data.totalPaidOut)}</p>
          <p className="text-xs text-slate-500 mt-1">Withdrawals to users</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-lg bg-amber-100 p-2">
              <Users size={20} className="text-amber-700" />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Grand Total</p>
          </div>
          <p className="text-2xl font-bold text-brand-navy">{toCurrency(grandTotal)}</p>
          <p className="text-xs text-slate-500 mt-1">{data.totalUsers} active users</p>
        </div>
      </div>

      {/* Money Flow Breakdown */}
      <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-5">
        <h2 className="text-sm font-bold text-brand-navy mb-3">Money Flow Summary</h2>
        <div className="grid gap-3 sm:grid-cols-3 text-sm">
          <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-3">
            <span className="font-semibold text-slate-600">In Wallets (Liquid)</span>
            <span className="font-bold text-blue-700">{toCurrency(data.totalWalletBalance)}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/50 px-4 py-3">
            <span className="font-semibold text-slate-600">In Savings (Locked)</span>
            <span className="font-bold text-emerald-700">{toCurrency(data.totalInSavings)}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-purple-100 bg-purple-50/50 px-4 py-3">
            <span className="font-semibold text-slate-600">Paid Out (Withdrawn)</span>
            <span className="font-bold text-purple-700">{toCurrency(data.totalPaidOut)}</span>
          </div>
        </div>
      </div>

      {/* Tabbed Savings Plans View */}
      <div>
        <h2 className="text-lg font-bold text-brand-navy mb-4">General Savings Plans by Frequency</h2>
        
        {/* Tab Navigation */}
        <div className="rounded-t-xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex border-b border-slate-200">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const tabData = frequencyData[tab.key];
              const userCount = tabData.users.length;
              
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 px-6 py-4 text-sm font-semibold transition-all relative ${
                    isActive
                      ? 'text-brand-navy bg-slate-50'
                      : 'text-slate-500 hover:text-brand-navy hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>{tab.label}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        isActive
                          ? 'bg-brand-navy text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {userCount}
                    </span>
                  </div>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-navy" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Frequency Summary */}
            <div className="mb-6 grid gap-3 sm:grid-cols-4 text-sm">
              <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Users</p>
                <p className="text-lg font-bold text-brand-navy flex items-center gap-1">
                  <Users size={16} className="text-slate-400" />
                  {currentFrequencyData.users.length}
                </p>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 px-4 py-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Saved</p>
                <p className="text-lg font-bold text-emerald-700">{toCurrency(currentFrequencyData.totalSaved)}</p>
              </div>
              <div className="rounded-lg border border-purple-100 bg-purple-50/50 px-4 py-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Paid Out</p>
                <p className="text-lg font-bold text-purple-600">{toCurrency(currentFrequencyData.totalPaidOut)}</p>
              </div>
              <div className="rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Current Balance</p>
                <p className="text-lg font-bold text-brand-navy">{toCurrency(currentFrequencyData.currentBalance)}</p>
              </div>
            </div>

            {/* Users Table */}
            {currentFrequencyData.users.length === 0 ? (
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-12 text-center">
                <p className="text-slate-400 font-medium">No users on {activeTab} savings yet.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">User</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Plan Name</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">Total Saved</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">Total Paid Out</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">Current Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUsers.map((user, idx) => (
                        <tr
                          key={`${user.user_id}-${idx}`}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-semibold text-brand-navy">{user.user_name}</p>
                              <p className="text-xs text-slate-500">{user.user_email}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-slate-600">{user.plan_name}</p>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-bold text-emerald-700">{toCurrency(user.total_saved)}</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-bold text-purple-600">{toCurrency(user.total_paid_out)}</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-bold text-brand-navy">{toCurrency(user.current_balance)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <p className="text-sm text-slate-600">
                      Showing <span className="font-semibold">{startIndex + 1}</span> to{' '}
                      <span className="font-semibold">{Math.min(endIndex, currentFrequencyData.users.length)}</span> of{' '}
                      <span className="font-semibold">{currentFrequencyData.users.length}</span> users
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft size={16} />
                        Previous
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          // Show first page, last page, current page, and pages around current
                          const showPage =
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1);
                          
                          const showEllipsis =
                            (page === currentPage - 2 && currentPage > 3) ||
                            (page === currentPage + 2 && currentPage < totalPages - 2);

                          if (showEllipsis) {
                            return (
                              <span key={page} className="px-2 text-slate-400">
                                ...
                              </span>
                            );
                          }

                          if (!showPage) return null;

                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`w-9 h-9 text-sm font-medium rounded-lg transition-colors ${
                                currentPage === page
                                  ? 'bg-brand-navy text-white'
                                  : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-semibold mb-1">💡 Understanding the numbers:</p>
        <ul className="list-disc list-inside space-y-1 text-blue-800">
          <li><strong>Total in Wallets:</strong> Money users can spend immediately (not locked in savings)</li>
          <li><strong>Total in Savings:</strong> Money locked in savings plans (Current Balance across all plans)</li>
          <li><strong>Total Paid Out:</strong> Money already withdrawn to users' bank accounts</li>
          <li><strong>Grand Total:</strong> Wallets + Savings = Total money in the system right now</li>
        </ul>
      </div>
    </div>
  );
}
