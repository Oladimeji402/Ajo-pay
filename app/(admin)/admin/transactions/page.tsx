'use client';

import React, { useState } from 'react';
import {
    History,
    Search,
    Filter,
    Download,
    ArrowUpRight,
    ArrowDownLeft,
    Calendar,
    ChevronDown,
    ChevronRight,
    FileText,
    ExternalLink
} from 'lucide-react';
import { motion } from 'motion/react';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { dummyTransactions as initialTransactions, Transaction } from '@/lib/dummy-data';

export default function AdminTransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'contribution' | 'payout'>('all');

    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = t.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.groupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.reference.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' || t.type === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-brand-navy tracking-tight mb-2">Platform Ledger</h1>
                    <p className="text-brand-gray text-[15px]">Audit trail of all contributions, payouts, and wallet movements.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-500 hover:text-brand-navy transition-all shadow-sm">
                        <Download size={18} />
                        Export Audit Log
                    </button>
                </div>
            </div>

            {/* Filter Tabs Mini */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 rounded-2xl w-fit border border-slate-200">
                {['all', 'contribution', 'payout'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilter(type as any)}
                        className={`px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${filter === type
                                ? 'bg-white text-brand-navy shadow-sm border border-slate-100'
                                : 'text-slate-400 hover:text-brand-navy'
                            }`}
                    >
                        {type}s
                    </button>
                ))}
            </div>

            {/* Search & Date Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow max-w-lg">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by name, group, or reference..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-brand-primary/5 transition-all shadow-sm"
                    />
                </div>
                <div className="flex gap-2">
                    <button className="px-6 py-4 bg-white border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-400 hover:text-brand-navy flex items-center gap-2 transition-all shadow-sm">
                        <Calendar size={18} />
                        Last 30 Days
                        <ChevronDown size={16} />
                    </button>
                </div>
            </div>

            {/* Ledger Table */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-50">
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Transaction ID</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Participant</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Context</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Type</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Amount</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-[13px]">
                            {filteredTransactions.map((tx, index) => (
                                <motion.tr
                                    key={tx.id}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="hover:bg-slate-50/50 transition-colors group"
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-slate-400">#</span>
                                            <span className="font-mono font-bold text-brand-navy">{tx.reference}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-0.5">{tx.date}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-brand-navy font-bold text-[11px]">
                                                {tx.userName.charAt(0)}
                                            </div>
                                            <span className="font-bold text-brand-navy">{tx.userName}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="font-bold text-brand-navy truncate max-w-[150px]">{tx.groupName}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{tx.method}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className={`flex items-center gap-2 w-fit px-3 py-1.5 rounded-xl border ${tx.type === 'contribution'
                                                ? 'bg-blue-50 text-brand-primary border-blue-100'
                                                : 'bg-emerald-50 text-brand-emerald border-emerald-100'
                                            }`}>
                                            {tx.type === 'contribution' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                                            <span className="text-[10px] font-black uppercase tracking-widest">{tx.type}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className={`text-[15px] font-black ${tx.type === 'contribution' ? 'text-brand-navy' : 'text-brand-emerald'
                                            }`}>
                                            {tx.type === 'contribution' ? '-' : '+'}{tx.amount}
                                        </p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <StatusBadge status={tx.status} />
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button className="p-2 text-slate-300 hover:text-brand-navy transition-colors">
                                            <ExternalLink size={18} />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredTransactions.length === 0 && (
                    <div className="p-20 text-center text-slate-300">
                        <History size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-sm font-bold">No transactions matched your search criteria.</p>
                    </div>
                )}

                <div className="p-6 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">End of Ledger Data</p>
                    <div className="flex gap-4">
                        <button className="flex items-center gap-2 text-[11px] font-bold text-brand-navy hover:underline">
                            <FileText size={14} />
                            Generate Monthly Report
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
