'use client';

import React, { useState } from 'react';
import {
    Banknote,
    Search,
    Filter,
    ChevronRight,
    Copy,
    CheckCircle2,
    Clock,
    Eye,
    ExternalLink,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { dummyPayouts as initialPayouts, Payout } from '@/lib/dummy-data';

export default function AdminPayoutsPage() {
    const [payouts, setPayouts] = useState<Payout[]>(initialPayouts);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('pending');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const filteredPayouts = payouts.filter(p => {
        const matchesSearch = p.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.groupName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' || p.status === filter;
        return matchesSearch && matchesFilter;
    });

    const handleMarkAsDone = (id: string) => {
        setPayouts(prev => prev.map(p =>
            p.id === id ? { ...p, status: 'done' as const, markedDoneAt: new Date().toISOString() } : p
        ));
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-brand-navy tracking-tight mb-2">Payout Management</h1>
                    <p className="text-brand-gray text-[15px]">Manual bank transfer verification and distribution workflow.</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                    {['pending', 'done', 'all'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab as any)}
                            className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${filter === tab
                                    ? 'bg-brand-navy text-white shadow-lg shadow-brand-navy/20'
                                    : 'text-slate-400 hover:text-brand-navy'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Warning Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 flex-shrink-0">
                    <AlertCircle size={20} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-amber-900 mb-1">Manual Payout Policy</h4>
                    <p className="text-[13px] text-amber-800/80 leading-relaxed">
                        Verify the recipient's bank account number twice before performing the transfer. Mark as "Done" only after you receive a successful transaction receipt from your bank.
                    </p>
                </div>
            </div>

            {/* Search & Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search recipient or group..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-brand-primary/5 transition-all shadow-sm"
                    />
                </div>
                <button className="flex items-center gap-2 px-6 py-3.5 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-brand-navy hover:bg-slate-50 transition-all shadow-sm">
                    <Filter size={18} />
                    <span>Advanced Filters</span>
                </button>
            </div>

            {/* Payouts Table */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-50">
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Recipient Details</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Group & Context</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Settlement Amount</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Bank Account</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-right">Settlement Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-[13px]">
                            {filteredPayouts.map((payout, index) => (
                                <motion.tr
                                    key={payout.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="hover:bg-slate-50/50 transition-colors"
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-brand-navy text-white rounded-xl flex items-center justify-center font-bold">
                                                {payout.userName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-brand-navy">{payout.userName}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                                    <span className="text-[10px] font-bold text-slate-400">KYC Verified</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="font-bold text-brand-navy">{payout.groupName}</p>
                                        <p className="text-[11px] text-slate-400">Cycle #{payout.cycleNumber}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-lg font-black text-brand-navy">{payout.amount}</p>
                                        <p className="text-[10px] text-brand-emerald font-bold tracking-wider">FULL POT PAYOUT</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 group/bank">
                                            <div>
                                                <p className="font-mono font-bold text-brand-navy flex items-center gap-2">
                                                    {payout.bankAccount}
                                                    <button
                                                        onClick={() => copyToClipboard(payout.bankAccount, payout.id)}
                                                        className="opacity-0 group-hover/bank:opacity-100 p-1 hover:bg-slate-100 rounded transition-all text-slate-400"
                                                    >
                                                        {copiedId === payout.id ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                                    </button>
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">{payout.bankName}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        {payout.status === 'pending' ? (
                                            <button
                                                onClick={() => handleMarkAsDone(payout.id)}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-emerald hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-md shadow-brand-emerald/20 active:scale-95 group"
                                            >
                                                <Banknote size={16} />
                                                Confirm Transfer
                                                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                            </button>
                                        ) : (
                                            <div className="inline-flex items-center gap-2.5 text-emerald-500 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                                                <CheckCircle2 size={16} />
                                                <span className="font-bold text-[11px] uppercase tracking-wider">Settled</span>
                                            </div>
                                        )}
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredPayouts.length === 0 && (
                    <div className="p-20 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-200">
                            <Banknote size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-brand-navy mb-1">No payout requests found</h3>
                        <p className="text-sm text-brand-gray">Try adjusting your filters or search query.</p>
                    </div>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-between items-center text-[12px]">
                <p className="text-brand-gray font-medium">
                    Showing <span className="text-brand-navy font-bold">{filteredPayouts.length}</span> payout distributions
                </p>
                <div className="flex items-center gap-2">
                    <button className="px-4 py-2 border border-slate-200 rounded-lg font-bold hover:bg-white transition-all text-slate-400">Previous</button>
                    <button className="px-4 py-2 bg-brand-navy text-white rounded-lg font-bold shadow-sm">1</button>
                    <button className="px-4 py-2 border border-slate-200 rounded-lg font-bold hover:bg-white transition-all text-slate-400">Next</button>
                </div>
            </div>
        </div>
    );
}
