'use client';

import React, { useState } from 'react';
import {
    Users,
    Search,
    Filter,
    MoreVertical,
    UserX,
    UserCheck,
    Eye,
    ShieldCheck,
    Mail,
    Phone,
    Download,
    ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { dummyUsers as initialUsers, User } from '@/lib/dummy-data';
import { useRouter } from 'next/navigation';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleStatus = (id: string) => {
        setUsers(prev => prev.map(u =>
            u.id === id ? { ...u, status: u.status === 'Active' ? 'Suspended' : 'Active' } : u
        ));
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-brand-navy tracking-tight mb-2">Member Directory</h1>
                    <p className="text-brand-gray text-[15px]">Manage AjoPay participants, security status, and account verification.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-500 hover:text-brand-navy transition-all shadow-sm">
                        <Download size={18} />
                        Export CSV
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-brand-navy text-white rounded-2xl text-[13px] font-bold shadow-lg shadow-brand-navy/20 active:scale-95 transition-all">
                        <Users size={18} />
                        Bulk Messaging
                    </button>
                </div>
            </div>

            {/* View Stats Mini */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Members', value: '1,250', color: 'text-brand-navy' },
                    { label: 'KYC Verified', value: '982', color: 'text-emerald-600' },
                    { label: 'Suspended', value: '14', color: 'text-red-500' },
                    { label: 'Premium', value: '312', color: 'text-brand-primary' },
                ].map((s, i) => (
                    <div key={i} className="bg-white p-5 rounded-3xl border border-slate-50 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                        <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow max-w-lg">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or telephone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-brand-primary/5 transition-all shadow-sm"
                    />
                </div>
                <div className="flex gap-2">
                    <button className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-brand-navy transition-all shadow-sm">
                        <Filter size={20} />
                    </button>
                    <button className="px-6 py-4 bg-white border border-slate-100 rounded-2xl text-[13px] font-bold text-brand-navy hover:bg-slate-50 transition-all shadow-sm">
                        Active Only
                    </button>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-50">
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Participant</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Contact</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Verification</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Financials</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-[13px]">
                            {filteredUsers.map((user, index) => (
                                <motion.tr
                                    key={user.id}
                                    initial={{ opacity: 0, scale: 0.99 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="hover:bg-slate-50/50 transition-colors group/row"
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center text-brand-navy font-black text-sm group-hover/row:scale-110 transition-transform shadow-sm">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-brand-navy">{user.name}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">Joined {new Date(user.joinedAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Mail size={12} className="text-slate-300" />
                                                <span className="text-[12px]">{user.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Phone size={12} className="text-slate-300" />
                                                <span className="text-[12px]">{user.phone}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl w-fit border border-slate-100">
                                            <ShieldCheck size={14} className="text-brand-primary" />
                                            <span className="text-[11px] font-bold text-brand-navy italic">{user.kycLevel}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="font-black text-brand-navy">{user.walletBalance}</p>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{user.savingsStreak} STREAK</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <StatusBadge status={user.status} />
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => router.push(`/admin/users/${user.id}`)}
                                                className="p-2.5 text-slate-400 hover:text-brand-navy hover:bg-slate-100 rounded-xl transition-all"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => toggleStatus(user.id)}
                                                className={`p-2.5 rounded-xl transition-all ${user.status === 'Active'
                                                        ? 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                                                        : 'text-emerald-500 bg-emerald-50'
                                                    }`}
                                                title={user.status === 'Active' ? 'Suspend' : 'Activate'}
                                            >
                                                {user.status === 'Active' ? <UserX size={18} /> : <UserCheck size={18} />}
                                            </button>
                                            <button className="p-2.5 text-slate-400 hover:text-brand-navy hover:bg-slate-100 rounded-xl transition-all">
                                                <MoreVertical size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination */}
                <div className="p-6 border-t border-slate-50 flex items-center justify-between">
                    <p className="text-[12px] text-slate-400 font-medium">
                        Showing <span className="text-brand-navy font-bold">{filteredUsers.length}</span> of 1,250 registered members
                    </p>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 border border-slate-200 rounded-xl text-[12px] font-bold text-slate-400 hover:bg-slate-50 transition-all">Previous</button>
                        <button className="px-4 py-2 bg-brand-navy text-white rounded-xl text-[12px] font-bold shadow-lg shadow-brand-navy/20">1</button>
                        <button className="px-4 py-2 border border-slate-200 rounded-xl text-[12px] font-bold text-slate-400 hover:bg-slate-50 transition-all">2</button>
                        <button className="px-4 py-2 border border-slate-200 rounded-xl text-[12px] font-bold text-slate-400 hover:bg-slate-50 transition-all">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
