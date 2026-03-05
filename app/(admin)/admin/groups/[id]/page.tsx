'use client';

import React, { useState, use } from 'react';
import {
    UsersRound,
    Calendar,
    Coins,
    ChevronLeft,
    CheckCircle2,
    Clock,
    ShieldCheck,
    Banknote,
    User,
    ArrowUpRight,
    ArrowDownLeft
} from 'lucide-react';
import { motion } from 'motion/react';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { dummyGroups, dummyUsers, dummyGroupMembers, AjoGroup, User as UserType, GroupMember } from '@/lib/dummy-data';
import { useRouter } from 'next/navigation';

export default function AdminGroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    // Find group
    const group = dummyGroups.find(g => g.id === id) || dummyGroups[0];

    // Find members and their user details
    const [members, setMembers] = useState<any[]>(
        dummyGroupMembers
            .filter(m => m.groupId === group.id)
            .map(m => ({
                ...m,
                userDetails: dummyUsers.find(u => u.id === m.userId) || dummyUsers[0]
            }))
            .sort((a, b) => a.position - b.position)
    );

    const toggleContribution = (userId: string) => {
        setMembers(prev => prev.map(m =>
            m.userId === userId
                ? { ...m, contributionStatus: m.contributionStatus === 'Paid' ? 'Pending' : 'Paid' }
                : m
        ));
    };

    const confirmPayout = (userId: string) => {
        setMembers(prev => prev.map(m =>
            m.userId === userId
                ? { ...m, payoutStatus: 'Received', payoutConfirmedAt: new Date().toISOString() }
                : m
        ));
    };

    return (
        <div className="space-y-8">
            {/* Breadcrumbs & Header */}
            <div className="space-y-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-[12px] font-bold text-slate-400 hover:text-brand-navy transition-colors mb-4"
                >
                    <ChevronLeft size={16} />
                    Back to Groups list
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-slate-200" style={{ backgroundColor: group.color }}>
                            {group.name.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-black text-brand-navy tracking-tight">{group.name}</h1>
                                <StatusBadge status={group.status} />
                            </div>
                            <div className="flex items-center gap-6 text-brand-gray">
                                <div className="flex items-center gap-2">
                                    <div className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-black uppercase tracking-widest text-slate-500">ID: {group.inviteCode}</div>
                                </div>
                                <div className="flex items-center gap-2 text-sm font-bold">
                                    <Calendar size={16} className="text-slate-300" />
                                    Started {new Date(group.startDate).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[32px] border border-slate-50 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                            <Coins size={20} />
                        </div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Collective Pot</p>
                    </div>
                    <h3 className="text-2xl font-black text-brand-navy">₦600,000.00</h3>
                    <p className="text-[12px] text-brand-gray mt-1">Total cycle distribution (12 members)</p>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-slate-50 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 bg-blue-50 text-brand-primary rounded-xl flex items-center justify-center">
                            <Clock size={20} />
                        </div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Active Cycle</p>
                    </div>
                    <h3 className="text-2xl font-black text-brand-navy">Cycle #{group.currentCycle}</h3>
                    <p className="text-[12px] text-brand-gray mt-1">of {group.totalCycles} total rotation cycles</p>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-slate-50 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center">
                            <ShieldCheck size={20} />
                        </div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Trust Index</p>
                    </div>
                    <h3 className="text-2xl font-black text-brand-navy">98.5%</h3>
                    <p className="text-[12px] text-brand-gray mt-1">Combined member contribution reliability</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Member Ledger */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-8 pb-4 flex items-center justify-between">
                            <h3 className="text-lg font-black text-brand-navy flex items-center gap-2">
                                <UsersRound size={20} className="text-brand-primary" />
                                Distribution Roster
                            </h3>
                            <button className="text-[11px] font-black text-brand-primary uppercase tracking-widest hover:underline">Download Roster</button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 border-y border-slate-50">
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pos</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Member</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contribution</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payout Status</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {members.map((member) => (
                                        <tr key={member.userId} className={`hover:bg-slate-50/50 transition-colors ${member.payoutStatus === 'Your Turn' ? 'bg-amber-50/30' : ''}`}>
                                            <td className="px-8 py-5">
                                                <span className="font-mono font-black text-slate-300">#{member.position.toString().padStart(2, '0')}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-brand-navy font-bold text-xs ring-2 ring-white">
                                                        {member.userDetails.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-brand-navy">{member.userDetails.name}</p>
                                                        <p className="text-[10px] text-slate-400">@{member.userDetails.email.split('@')[0]}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <button
                                                    onClick={() => toggleContribution(member.userId)}
                                                    className="group"
                                                >
                                                    <StatusBadge status={member.contributionStatus} />
                                                </button>
                                            </td>
                                            <td className="px-8 py-5">
                                                <StatusBadge status={member.payoutStatus} />
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                {member.payoutStatus === 'Your Turn' ? (
                                                    <button
                                                        onClick={() => confirmPayout(member.userId)}
                                                        className="px-4 py-2 bg-brand-navy text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-brand-navy/20 active:scale-95 transition-all"
                                                    >
                                                        Settle Pot
                                                    </button>
                                                ) : (
                                                    <button className="p-2 text-slate-300 hover:text-brand-navy transition-colors">
                                                        <Clock size={18} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Pot Cycle Breakdown */}
                <div className="space-y-6">
                    <div className="bg-brand-navy rounded-[40px] p-8 text-white shadow-xl shadow-brand-navy/30 relative overflow-hidden">
                        {/* Decorative Circle */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>

                        <div className="relative">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                    <Banknote size={24} className="text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Upcoming Distribution</p>
                                    <h3 className="text-xl font-black">Current Pot Holder</h3>
                                </div>
                            </div>

                            {/* Holder Detail */}
                            {(() => {
                                const activeRecipient = members.find(m => m.payoutStatus === 'Your Turn' || (m.contributionStatus === 'Pending' && m.payoutStatus === 'Upcoming' && m.position === group.currentCycle));
                                if (!activeRecipient) return <p className="text-white/40 italic text-sm">No active recipient for this cycle.</p>;

                                return (
                                    <div className="space-y-6">
                                        <div className="p-5 bg-white/5 rounded-3xl border border-white/10">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center font-black text-brand-emerald">
                                                    {activeRecipient.userDetails.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm">{activeRecipient.userDetails.name}</p>
                                                    <p className="text-[10px] text-white/40 font-bold uppercase">{activeRecipient.userDetails.bankName} • {activeRecipient.userDetails.bankAccount}</p>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">Release Date</p>
                                                    <p className="text-sm font-bold">October 28, 2023</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">Payout Total</p>
                                                    <p className="text-xl font-black text-brand-emerald">{group.contributionAmount.replace('₦', '₦550,')}.00</p>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => router.push('/admin/payouts')}
                                            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-brand-navy font-black text-[13px] uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            <ArrowUpRight size={18} />
                                            Go to Settlement Flow
                                        </button>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm">
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Cycle Insights</h4>
                        <div className="space-y-4">
                            {[
                                { label: 'Settlement Efficiency', value: '92%', icon: <TrendingUp size={16} className="text-emerald-500" /> },
                                { label: 'Average Contribution Delay', value: '1.2 Days', icon: <Clock size={16} className="text-amber-500" /> },
                                { label: 'Dispute Rate', value: '0.0%', icon: <ShieldCheck size={16} className="text-brand-primary" /> },
                            ].map((stat, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-50">
                                    <div className="flex items-center gap-3">
                                        {stat.icon}
                                        <p className="text-[12px] font-bold text-slate-500">{stat.label}</p>
                                    </div>
                                    <p className="text-[13px] font-black text-brand-navy">{stat.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TrendingUp(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
        </svg>
    )
}
