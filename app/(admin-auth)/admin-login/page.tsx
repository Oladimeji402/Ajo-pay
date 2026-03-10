'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogin } from '@/lib/admin-auth';
import { ShieldAlert, Loader2, ArrowRight, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';

export default function AdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { showToast } = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const success = await adminLogin(email, password);
        if (success) {
            notifySuccess(showToast, 'Admin login successful.');
            router.push('/admin');
            return;
        }

        notifyError(showToast, null, 'Invalid administrative credentials. Access denied.');
        setIsLoading(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full"
        >
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-linear-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-500/30">
                    <span className="text-white font-bold text-3xl">A</span>
                </div>
                <h1 className="text-2xl font-black text-brand-navy mb-2 tracking-tight">Access Control</h1>
                <p className="text-[13px] text-brand-gray">Authenticate to enter the AjoPay Administrative Panel</p>
            </div>

            <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                {/* Visual accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-red-500 via-orange-500 to-red-500 opacity-80"></div>

                <form className="space-y-5" onSubmit={handleLogin}>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Admin Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4.5 h-4.5" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@ajopay.com"
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-500/30 focus:bg-white transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Master Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4.5 h-4.5" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-500/30 focus:bg-white transition-all"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((current) => !current)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-brand-navy transition-colors"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-brand-navy hover:bg-[#0a1120] text-white rounded-2xl font-bold text-sm tracking-wide transition-all shadow-lg shadow-brand-navy/20 flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <span>Authorize Entry</span>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>
            </div>

            <div className="mt-8 text-center">
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                    Authorized Personnel Only
                </p>
                <div className="flex justify-center gap-6 mt-4">
                    <span className="text-[10px] text-slate-400 hover:text-brand-navy cursor-help transition-colors underline underline-offset-4 decoration-slate-200">Security Protocol</span>
                    <span className="text-[10px] text-slate-400 hover:text-brand-navy cursor-help transition-colors underline underline-offset-4 decoration-slate-200">System Status</span>
                </div>
            </div>
        </motion.div>
    );
}
