'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Users, Wallet, PiggyBank, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

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

      {/* Savings Plans Table */}
      <div>
        <h2 className="text-lg font-bold text-brand-navy mb-3">General Savings Plans (Grouped by Frequency)</h2>
        
        {data.savingsPlans.length === 0 ? (
          <div className="rounded-xl border border-slate-100 bg-white p-8 text-center text-slate-400">
            No active savings plans found.
          </div>
        ) : (
          <div className="space-y-3">
            {/* Group plans by frequency for cleaner display */}
            {['daily', 'weekly', 'monthly'].map((frequency) => {
              const plansForFrequency = data.savingsPlans.filter(p => p.frequency === frequency);
              if (plansForFrequency.length === 0) return null;

              // Combine all users from all plans of this frequency
              const allUsers = plansForFrequency.flatMap(p => p.users);
              const totalSaved = plansForFrequency.reduce((sum, p) => sum + p.total_saved, 0);
              const totalPaidOut = plansForFrequency.reduce((sum, p) => sum + p.total_paid_out, 0);
              const currentBalance = plansForFrequency.reduce((sum, p) => sum + p.current_balance, 0);
              const totalUsers = allUsers.length;
              const minAmount = Math.min(...plansForFrequency.map(p => p.minimum_amount));

              const frequencyKey = `${frequency}-group`;

              return (
                <div key={frequencyKey} className="rounded-xl border border-slate-100 bg-white overflow-hidden shadow-sm">
                  {/* Frequency Group Header */}
                  <div 
                    onClick={() => setExpandedPlanId(expandedPlanId === frequencyKey ? null : frequencyKey)}
                    className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-brand-navy capitalize">{frequency} Savings</h3>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-600">
                          {frequency}
                        </span>
                        <span className="text-xs text-slate-500">
                          Min: {toCurrency(minAmount)}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Users size={14} className="text-slate-400" />
                          <span className="font-semibold text-slate-600">{totalUsers} users</span>
                        </div>
                        <div className="text-slate-500">
                          Total Saved: <span className="font-bold text-emerald-700">{toCurrency(totalSaved)}</span>
                        </div>
                        <div className="text-slate-500">
                          Paid Out: <span className="font-bold text-purple-600">{toCurrency(totalPaidOut)}</span>
                        </div>
                        <div className="text-slate-500">
                          Current Balance: <span className="font-bold text-brand-navy">{toCurrency(currentBalance)}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {expandedPlanId === frequencyKey ? (
                        <ChevronUp size={20} className="text-slate-400" />
                      ) : (
                        <ChevronDown size={20} className="text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded User List */}
                  {expandedPlanId === frequencyKey && (
                    <div className="border-t border-slate-100 bg-slate-50/50">
                      <div className="px-5 py-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                          All users on {frequency} savings
                        </p>
                        
                        {allUsers.length === 0 ? (
                          <p className="text-sm text-slate-400 py-4 text-center">No users on this frequency yet.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-slate-200">
                                  <th className="text-left py-2 px-3 font-semibold text-slate-600">User</th>
                                  <th className="text-left py-2 px-3 font-semibold text-slate-600">Plan Name</th>
                                  <th className="text-right py-2 px-3 font-semibold text-slate-600">Total Saved</th>
                                  <th className="text-right py-2 px-3 font-semibold text-slate-600">Total Paid Out</th>
                                  <th className="text-right py-2 px-3 font-semibold text-slate-600">Current Balance</th>
                                </tr>
                              </thead>
                              <tbody>
                                {plansForFrequency.map((plan) => 
                                  plan.users.map((user) => (
                                    <tr key={`${plan.plan_id}-${user.user_id}`} className="border-b border-slate-100 last:border-0 hover:bg-white transition-colors">
                                      <td className="py-3 px-3">
                                        <div>
                                          <p className="font-semibold text-brand-navy">{user.user_name}</p>
                                          <p className="text-xs text-slate-500">{user.user_email}</p>
                                        </div>
                                      </td>
                                      <td className="py-3 px-3">
                                        <p className="text-xs text-slate-600">{plan.plan_name}</p>
                                      </td>
                                      <td className="py-3 px-3 text-right">
                                        <span className="font-bold text-emerald-700">{toCurrency(user.total_saved)}</span>
                                      </td>
                                      <td className="py-3 px-3 text-right">
                                        <span className="font-bold text-purple-600">{toCurrency(user.total_paid_out)}</span>
                                      </td>
                                      <td className="py-3 px-3 text-right">
                                        <span className="font-bold text-brand-navy">{toCurrency(user.current_balance)}</span>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                              <tfoot>
                                <tr className="border-t-2 border-slate-300 bg-slate-100">
                                  <td colSpan={2} className="py-3 px-3 font-bold text-brand-navy">{frequency.charAt(0).toUpperCase() + frequency.slice(1)} Total</td>
                                  <td className="py-3 px-3 text-right font-bold text-emerald-700">{toCurrency(totalSaved)}</td>
                                  <td className="py-3 px-3 text-right font-bold text-purple-600">{toCurrency(totalPaidOut)}</td>
                                  <td className="py-3 px-3 text-right font-bold text-brand-navy">{toCurrency(currentBalance)}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
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
