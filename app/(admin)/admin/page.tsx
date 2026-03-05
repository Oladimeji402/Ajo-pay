'use client';

import React from 'react';
import {
    Users,
    UsersRound,
    Banknote,
    TrendingUp,
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    ChevronRight,
    Search
} from 'lucide-react';
import { motion } from 'motion/react';
import { StatCard } from '@/components/admin/StatCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { adminStats, dummyTransactions, dummyPayouts } from '@/lib/dummy-data';
import { useRouter } from 'next/navigation';

export default function AdminOverviewPage() {
    const router = useRouter();

    return (
        <div className="space-y-10">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-black text-brand-navy tracking-tight mb-2">Platform Overview</h1>
                <p className="text-brand-gray text-[15px]">Central control center for AjoPay financial activity and user metrics.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Users"
                    value={adminStats.totalUsers.toLocaleString()}
                    icon={Users}
                    trend={{ value: '12% inc', isUp: true }}
                    delay={0.1}
                />
                <StatCard
                    label="Active Groups"
                    value={adminStats.activeGroups}
                    icon={UsersRound}
                    trend={{ value: '3 new', isUp: true }}
                    color="brand-primary"
                    delay={0.2}
                />
                <StatCard
                    label="Total Volume"
                    value={adminStats.totalVolume}
                    icon={Banknote}
                    trend={{ value: '8% inc', isUp: true }}
                    color="emerald-600"
                    delay={0.3}
                />
                <StatCard
                    label="Pending Payouts"
                    value={adminStats.pendingPayouts}
                    icon={Clock}
                    trend={{ value: 'Urgent', isUp: false }}
                    color="amber-600"
                    delay={0.4}
                />
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Urgent Payouts */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="lg:col-span-2 bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden"
                >
                    <div className="p-8 pb-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-black text-brand-navy">Urgent Payouts</h3>
                            <p className="text-sm text-brand-gray">Recent cycles requiring manual bank transfers.</p>
                        </div>
                        <button
                            onClick={() => router.push('/admin/payouts')}
                            className="bg-slate-50 hover:bg-slate-100 p-2.5 rounded-xl transition-colors text-brand-navy"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <div className="px-4 pb-4">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-separate border-spacing-y-2">
                                <thead>
                                    <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                                        <th className="px-4 py-3">Recipient</th>
                                        <th className="px-4 py-3">Group / Pot</th>
                                        <th className="px-4 py-3">Bank Details</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dummyPayouts.filter(p => p.status === 'pending').slice(0, 5).map((payout) => (
                                        <tr key={payout.id} className="group hover:bg-slate-50/80 transition-all rounded-2xl">
                                            <td className="px-4 py-4 bg-white ring-1 ring-slate-100 rounded-l-2xl">
                                                <p className="text-sm font-bold text-brand-navy">{payout.userName}</p>
                                                <p className="text-[10px] text-slate-400">Cycle #{payout.cycleNumber}</p>
                                            </td>
                                            <td className="px-4 py-4 bg-white ring-1 ring-slate-100">
                                                <p className="text-sm font-bold text-brand-navy truncate">{payout.groupName}</p>
                                                <p className="text-[10px] text-brand-emerald font-bold">{payout.amount}</p>
                                            </td>
                                            <td className="px-4 py-4 bg-white ring-1 ring-slate-100">
                                                <p className="text-sm font-medium text-brand-navy">{payout.bankAccount}</p>
                                                <p className="text-[10px] text-slate-400 font-bold">{payout.bankName}</p>
                                            </td>
                                            <td className="px-4 py-4 bg-white ring-1 ring-slate-100 rounded-r-2xl text-right">
                                                <button
                                                    onClick={() => router.push('/admin/payouts')}
                                                    className="px-4 py-2 bg-brand-emerald hover:bg-emerald-600 text-white text-[11px] font-bold rounded-xl transition-all shadow-md shadow-brand-emerald/10"
                                                >
                                                    Process
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>

                {/* Recent Platform Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col"
                >
                    <div className="p-8 pb-4">
                        <h3 className="text-lg font-black text-brand-navy">Recent Activity</h3>
                        <p className="text-sm text-brand-gray">Latest network-wide transactions.</p>
                    </div>

                    <div className="flex-grow p-4 space-y-2 overflow-y-auto max-h-[480px]">
                        {dummyTransactions.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-all rounded-2xl group border border-transparent hover:border-slate-100">
                                <div className="flex items-center gap-3.5">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'contribution' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-emerald-50 text-brand-emerald'
                                        }`}>
                                        {tx.type === 'contribution' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-brand-navy truncate">{tx.userName}</p>
                                        <p className="text-[10px] text-slate-400 font-medium truncate">{tx.groupName}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-[13px] font-black ${tx.type === 'contribution' ? 'text-brand-navy' : 'text-brand-emerald'
                                        }`}>
                                        {tx.type === 'contribution' ? '-' : '+'}{tx.amount}
                                    </p>
                                    <StatusBadge status={tx.status} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 border-t border-slate-50">
                        <button
                            onClick={() => router.push('/admin/transactions')}
                            className="w-full py-3 text-[12px] font-bold text-slate-400 hover:text-brand-navy transition-colors flex items-center justify-center gap-2"
                        >
                            View Transaction Ledger
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
