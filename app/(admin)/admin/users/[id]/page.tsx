'use client';

import React, { use } from 'react';
import {
    User,
    Mail,
    Phone,
    ShieldCheck,
    CreditCard,
    ChevronLeft,
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    UsersRound,
    AlertTriangle,
    CheckCircle2,
    Calendar,
    Globe,
    Lock
} from 'lucide-react';
import { motion } from 'motion/react';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { dummyUsers, dummyTransactions, dummyGroups, dummyGroupMembers } from '@/lib/dummy-data';
import { useRouter } from 'next/navigation';

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    // Find user
    const user = dummyUsers.find(u => u.id === id) || dummyUsers[0];

    // Find user's transactions
    const userTransactions = dummyTransactions.filter(t => t.userId === user.id);

    // Find user's groups
    const membershipData = dummyGroupMembers.filter(m => m.userId === user.id);
    const userGroups = membershipData.map(m => ({
        ...m,
        groupDetails: dummyGroups.find(g => g.id === m.groupId) || dummyGroups[0]
    }));

    return (
        <div className="space-y-8 pb-12">
            {/* Breadcrumbs & Header */}
            <div className="space-y-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-[12px] font-bold text-slate-400 hover:text-brand-navy transition-colors"
                >
                    <ChevronLeft size={16} />
                    Back to Member Directory
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-[32px] flex items-center justify-center text-brand-navy font-black text-3xl shadow-xl shadow-slate-200/50">
                            {user.name.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-black text-brand-navy tracking-tight">{user.name}</h1>
                                <StatusBadge status={user.status} />
                            </div>
                            <div className="flex items-center gap-4 text-brand-gray">
                                <span className="text-sm font-bold flex items-center gap-1.5 uppercase tracking-widest text-slate-400">
                                    <ShieldCheck size={14} className="text-brand-primary" />
                                    Account {user.id.padStart(4, '0')}
                                </span>
                                <span className="text-[10px] font-bold text-slate-200">•</span>
                                <span className="text-sm font-bold flex items-center gap-1.5 uppercase tracking-widest text-slate-400">
                                    Registered {new Date(user.joinedAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="px-6 py-3.5 bg-white border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-500 hover:text-brand-navy transition-all shadow-sm">
                            Reset Access
                        </button>
                        <button className={`px-6 py-3.5 rounded-2xl text-[13px] font-bold shadow-lg transition-all active:scale-95 ${user.status === 'Active'
                                ? 'bg-red-50 text-red-500 shadow-red-500/10 hover:bg-red-500 hover:text-white'
                                : 'bg-emerald-500 text-white shadow-emerald-500/20'
                            }`}>
                            {user.status === 'Active' ? 'Suspend Account' : 'Reactivate Member'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Top Financial Stat Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Wallet Balance', value: user.walletBalance, icon: <CreditCard size={20} />, color: 'text-brand-navy', bg: 'bg-slate-50' },
                    { label: 'Total Contributions', value: user.totalContributed, icon: <ArrowUpRight size={20} />, color: 'text-brand-primary', bg: 'bg-blue-50/50' },
                    { label: 'Total Received', value: user.totalReceived, icon: <ArrowDownLeft size={20} />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Savings Streak', value: `${user.savingsStreak} Months`, icon: <CheckCircle2 size={20} />, color: 'text-amber-500', bg: 'bg-amber-50' },
                ].map((s, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-6 rounded-[32px] border border-slate-50 shadow-sm"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center`}>
                                {s.icon}
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                        </div>
                        <h3 className="text-2xl font-black text-brand-navy">{s.value}</h3>
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Profile Details Column */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Security & KYC Card */}
                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8 space-y-8">
                        <div>
                            <h3 className="text-lg font-black text-brand-navy mb-6 flex items-center gap-2">
                                <Lock size={20} className="text-brand-primary" />
                                Security & Trust
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="text-[12px] font-bold text-slate-500 uppercase">KYC Status</span>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-emerald-100/50">
                                        <ShieldCheck size={12} />
                                        Verified
                                    </div>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="text-[12px] font-bold text-slate-500 uppercase">Auth Method</span>
                                    <span className="text-[12px] font-bold text-brand-navy">2FA Assisted</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-black text-brand-navy mb-6 flex items-center gap-2">
                                <CreditCard size={20} className="text-brand-emerald" />
                                Settlement Target
                            </h3>
                            <div className="p-6 bg-brand-navy rounded-[32px] text-white space-y-4 shadow-xl shadow-brand-navy/20 relative overflow-hidden">
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                                <div>
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Bank Institution</p>
                                    <p className="text-[15px] font-black">{user.bankName}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Account Identifier</p>
                                    <p className="text-xl font-black tracking-widest uppercase">{user.bankAccount}</p>
                                </div>
                                <div className="pt-2">
                                    <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all">
                                        Update Bank Method
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-black text-brand-navy mb-6 flex items-center gap-2">
                                <Globe size={20} className="text-slate-400" />
                                Contact Profile
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 group cursor-pointer">
                                    <div className="w-10 h-10 bg-slate-50 group-hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-brand-navy transition-all">
                                        <Mail size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Email Address</p>
                                        <p className="text-sm font-bold text-brand-navy truncate">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group cursor-pointer">
                                    <div className="w-10 h-10 bg-slate-50 group-hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-brand-navy transition-all">
                                        <Phone size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Phone Link</p>
                                        <p className="text-sm font-bold text-brand-navy">{user.phone}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activity & Groups Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Active Ajo Participation */}
                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8">
                        <h3 className="text-lg font-black text-brand-navy mb-8 flex items-center gap-2">
                            <UsersRound size={20} className="text-brand-primary" />
                            Community Participation
                        </h3>

                        <div className="grid sm:grid-cols-2 gap-4">
                            {userGroups.map((group, idx) => (
                                <div
                                    key={group.groupId}
                                    className="p-6 bg-slate-50/50 hover:bg-slate-50 rounded-[32px] border border-slate-100 transition-all cursor-pointer group"
                                    onClick={() => router.push(`/admin/groups/${group.groupId}`)}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{ backgroundColor: group.groupDetails.color }}>
                                            {group.groupDetails.name.charAt(0)}
                                        </div>
                                        <StatusBadge status={group.contributionStatus} />
                                    </div>
                                    <h4 className="font-black text-brand-navy mb-1 group-hover:text-brand-primary transition-colors">{group.groupDetails.name}</h4>
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4">Position #{group.position} in cycle</p>

                                    <div className="flex justify-between items-end border-t border-slate-100 pt-4">
                                        <div>
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Pot Share</p>
                                            <p className="text-sm font-black text-brand-navy">{group.groupDetails.contributionAmount}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Payout</p>
                                            <p className={`text-sm font-black ${group.payoutStatus === 'Received' ? 'text-emerald-500' : 'text-slate-300'}`}>
                                                {group.payoutStatus}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {userGroups.length === 0 && (
                            <div className="p-12 text-center text-slate-300 italic text-sm">
                                This user has not joined any community groups yet.
                            </div>
                        )}
                    </div>

                    {/* Transaction Audit Ledger for User */}
                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-8 pb-4 flex items-center justify-between">
                            <h3 className="text-lg font-black text-brand-navy flex items-center gap-2">
                                <Clock size={20} className="text-slate-400" />
                                Transaction Audit Ledger
                            </h3>
                            <button className="text-[11px] font-black text-brand-primary uppercase tracking-widest hover:underline">Full Statement</button>
                        </div>

                        <div className="px-4 pb-4">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-separate border-spacing-y-2">
                                    <thead>
                                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                                            <th className="px-4 py-3 font-black">Timeline</th>
                                            <th className="px-4 py-3 font-black">Event Context</th>
                                            <th className="px-4 py-3 font-black">Movement</th>
                                            <th className="px-4 py-3 font-black text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {userTransactions.map((tx) => (
                                            <tr key={tx.id} className="group/row hover:bg-slate-50/50 transition-all rounded-2xl">
                                                <td className="px-4 py-5 bg-white ring-1 ring-slate-100/50 rounded-l-2xl">
                                                    <p className="text-[11px] font-black text-brand-navy">{tx.date}</p>
                                                    <p className="text-[10px] font-bold text-slate-400">REF: {tx.reference}</p>
                                                </td>
                                                <td className="px-4 py-5 bg-white ring-1 ring-slate-100/50">
                                                    <p className="text-[12px] font-black text-brand-navy truncate max-w-[150px]">{tx.groupName}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{tx.method}</p>
                                                </td>
                                                <td className="px-4 py-5 bg-white ring-1 ring-slate-100/50">
                                                    <div className="flex items-center gap-2">
                                                        <div className={tx.type === 'contribution' ? 'text-brand-navy' : 'text-emerald-500'}>
                                                            {tx.type === 'contribution' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                                                        </div>
                                                        <span className={`text-[13px] font-black ${tx.type === 'contribution' ? 'text-brand-navy' : 'text-emerald-500'}`}>
                                                            {tx.type === 'contribution' ? '-' : '+'}{tx.amount}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-5 bg-white ring-1 ring-slate-100/50 rounded-r-2xl text-right">
                                                    <StatusBadge status={tx.status} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {userTransactions.length === 0 && (
                            <div className="p-12 text-center text-slate-300 italic text-sm">
                                No financial events recorded for this member.
                            </div>
                        )}

                        <div className="p-4 border-t border-slate-50 mt-auto">
                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                                <AlertTriangle className="text-amber-600 mt-1" size={16} />
                                <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                                    Financial records are immutable. Manual corrections require administrative overriding of ledger entries.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
