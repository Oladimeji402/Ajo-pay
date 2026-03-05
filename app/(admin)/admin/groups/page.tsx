'use client';

import React, { useState } from 'react';
import {
    UsersRound,
    Plus,
    Search,
    Filter,
    Calendar,
    Users,
    TrendingUp,
    ChevronRight,
    Search as SearchIcon,
    AlertCircle,
    Copy,
    CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { dummyGroups as initialGroups, AjoGroup } from '@/lib/dummy-data';
import { useRouter } from 'next/navigation';

export default function AdminGroupsPage() {
    const [groups, setGroups] = useState<AjoGroup[]>(initialGroups);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const router = useRouter();

    const filteredGroups = groups.filter(g =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.inviteCode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-brand-navy tracking-tight mb-2">Savings Groups</h1>
                    <p className="text-brand-gray text-[15px]">Lifecycle management of rotating community contributions.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-4 bg-brand-emerald hover:bg-emerald-600 text-white rounded-2xl text-[13px] font-bold shadow-lg shadow-brand-emerald/20 active:scale-95 transition-all"
                >
                    <Plus size={20} />
                    New Ajo Group
                </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Active Pots', value: '48', icon: <TrendingUp size={16} />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Total Value', value: '₦12.5M', icon: <TrendingUp size={16} />, color: 'text-brand-primary', bg: 'bg-blue-50' },
                    { label: 'Avg Members', value: '10.2', icon: <Users size={16} />, color: 'text-purple-500', bg: 'bg-purple-50' },
                    { label: 'Pending Start', value: '5', icon: <Calendar size={16} />, color: 'text-amber-500', bg: 'bg-amber-50' },
                ].map((s, i) => (
                    <div key={i} className="bg-white p-5 rounded-[28px] border border-slate-50 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                            <p className="text-xl font-black text-brand-navy">{s.value}</p>
                        </div>
                        <div className={`w-10 h-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center`}>
                            {s.icon}
                        </div>
                    </div>
                ))}
            </div>

            {/* Search & Tabs */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow max-w-lg">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search group name or code..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-brand-primary/5 transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filteredGroups.map((group, index) => (
                        <motion.div
                            key={group.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden group/card hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col"
                        >
                            <div className="p-8 pb-6 relative overflow-hidden">
                                {/* Visual Accent */}
                                <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-slate-50 rounded-full opacity-50 group-hover/card:scale-110 transition-transform duration-500"></div>

                                <div className="relative mb-6 flex justify-between items-start">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg transition-transform group-hover/card:rotate-6" style={{ backgroundColor: group.color }}>
                                        {group.name.charAt(0)}
                                    </div>
                                    <StatusBadge status={group.status} />
                                </div>

                                <div className="relative space-y-2">
                                    <h3 className="text-xl font-black text-brand-navy group-hover/card:text-brand-primary transition-colors truncate">{group.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-100 text-[10px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                                            Code: {group.inviteCode}
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-300">•</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{group.category}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="px-8 pb-6 grid grid-cols-2 gap-6 relative">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                        Per Cycle
                                    </p>
                                    <p className="text-lg font-black text-brand-navy">{group.contributionAmount}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Frequency</p>
                                    <p className="text-sm font-bold text-brand-navy">{group.frequency}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Completion</p>
                                    <p className="text-sm font-bold text-brand-navy">{group.currentCycle} of {group.totalCycles} Cycles</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Slots Fill</p>
                                    <p className="text-sm font-bold text-brand-navy">12 / {group.maxMembers}</p>
                                </div>
                            </div>

                            <div className="px-8 pb-8 pt-2 mt-auto">
                                <button
                                    onClick={() => router.push(`/admin/groups/${group.id}`)}
                                    className="w-full py-4 bg-slate-50 hover:bg-brand-navy hover:text-white rounded-2xl text-[13px] font-bold text-brand-navy transition-all flex items-center justify-center gap-2 group/btn"
                                >
                                    Manage Group
                                    <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Empty State */}
            {filteredGroups.length === 0 && (
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-32 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                        <UsersRound size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-brand-navy mb-2">No Groups Found</h3>
                    <p className="text-brand-gray max-w-sm mx-auto">Try a different search query or create a new savings group to get started.</p>
                </div>
            )}

            {/* Create Group Modal Overlay Placeholder */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="w-full max-w-2xl bg-white rounded-[40px] shadow-2xl relative overflow-hidden"
                    >
                        {/* Modal Header */}
                        <div className="p-10 pb-0 flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-black text-brand-navy tracking-tight mb-2">Initialize Savings Group</h3>
                                <p className="text-brand-gray text-sm">Configure parameters for a new rotating Ajo pool.</p>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="w-10 h-10 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center transition-colors text-slate-400"
                            >
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-10 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Group Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Abuja Traders Circle"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-brand-emerald/5 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                                    <select className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-brand-emerald/5 transition-all">
                                        <option>Business Professionals</option>
                                        <option>Market Associations</option>
                                        <option>Family & Friends</option>
                                        <option>Tech & Gamers</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Contribution Amount (₦)</label>
                                    <input
                                        type="number"
                                        placeholder="50000"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-brand-emerald/5 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Frequency</label>
                                    <select className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-brand-emerald/5 transition-all">
                                        <option>Weekly</option>
                                        <option>Bi-weekly</option>
                                        <option>Monthly</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Members (Slots)</label>
                                    <input
                                        type="number"
                                        placeholder="12"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-brand-emerald/5 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-brand-emerald/5 transition-all text-slate-400"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-10 pt-0 flex gap-4">
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-2xl text-[13px] font-bold transition-all"
                            >
                                Cancel
                            </button>
                            <button className="flex-2 py-4 bg-brand-navy hover:bg-[#0a1120] text-white rounded-2xl text-[13px] font-bold transition-all px-12 shadow-xl shadow-brand-navy/20">
                                Launch Group
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
