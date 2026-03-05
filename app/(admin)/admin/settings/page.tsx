'use client';

import React from 'react';
import {
    Settings,
    Shield,
    Bell,
    CreditCard,
    Lock,
    User,
    Server,
    Globe,
    Save,
    RotateCcw
} from 'lucide-react';
import { motion } from 'motion/react';
import { ADMIN_EMAIL } from '@/lib/admin-auth';

export default function AdminSettingsPage() {
    return (
        <div className="space-y-10">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-brand-navy tracking-tight mb-2">System Configuration</h1>
                <p className="text-brand-gray text-[15px]">Maintain administrative protocols and platform-wide parameters.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Navigation Sidebar (Inner) */}
                <div className="lg:col-span-1 space-y-2">
                    {[
                        { name: 'Admin Profile', icon: <User size={18} />, active: true },
                        { name: 'Security Protocols', icon: <Shield size={18} />, active: false },
                        { name: 'System Notifications', icon: <Bell size={18} />, active: false },
                        { name: 'Platform Parameters', icon: <Server size={18} />, active: false },
                        { name: 'Financial Rules', icon: <CreditCard size={18} />, active: false },
                        { name: 'Localization', icon: <Globe size={18} />, active: false },
                    ].map((item) => (
                        <button
                            key={item.name}
                            className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-[13px] font-bold transition-all ${item.active
                                    ? 'bg-white text-brand-navy shadow-sm border border-slate-100'
                                    : 'text-slate-400 hover:text-brand-navy hover:bg-white/50'
                                }`}
                        >
                            <span className={item.active ? 'text-brand-primary' : ''}>{item.icon}</span>
                            {item.name}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8"
                    >
                        <h3 className="text-lg font-black text-brand-navy mb-6">Administrator Identity</h3>

                        <div className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Identifier</label>
                                    <input
                                        type="email"
                                        value={ADMIN_EMAIL}
                                        readOnly
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-400 cursor-not-allowed"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Level</label>
                                    <input
                                        type="text"
                                        value="Super Administrator"
                                        readOnly
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-400 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="p-6 bg-brand-navy rounded-[24px] text-white flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                                        <Lock size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">Authentication Security</p>
                                        <p className="text-[11px] text-white/60">Multi-factor authentication is currently enabled.</p>
                                    </div>
                                </div>
                                <button className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all">
                                    Manage
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8"
                    >
                        <h3 className="text-lg font-black text-brand-navy mb-6">Platform Liquidity Rules</h3>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                <div>
                                    <p className="text-[13px] font-bold text-brand-navy">Transaction Fee (Standard Contributions)</p>
                                    <p className="text-[11px] text-slate-400">The platform cut for each Ajo cycle payment.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="text" value="0.0%" className="w-16 px-2 py-2 bg-white border border-slate-200 rounded-lg text-center font-bold text-brand-navy" readOnly />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                <div>
                                    <p className="text-[13px] font-bold text-brand-navy">Maximum Group Pot Size (₦)</p>
                                    <p className="text-[11px] text-slate-400">Upper limit for unverified community groups.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="text" value="1,000,000" className="w-28 px-2 py-2 bg-white border border-slate-200 rounded-lg text-center font-bold text-brand-navy" readOnly />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Form Actions */}
                    <div className="flex gap-4">
                        <button className="flex-1 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-400 rounded-2xl text-[13px] font-bold transition-all flex items-center justify-center gap-2">
                            <RotateCcw size={18} />
                            Reset Defaults
                        </button>
                        <button className="flex-2 py-4 bg-brand-navy hover:bg-[#0a1120] text-white rounded-2xl text-[13px] font-bold transition-all px-12 shadow-xl shadow-brand-navy/20 flex items-center justify-center gap-2">
                            <Save size={18} />
                            Commit Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
