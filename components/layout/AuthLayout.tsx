'use client';

import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Public_Sans, Space_Grotesk } from 'next/font/google';
import { BrandLogo } from '../ui/BrandLogo';

interface AuthLayoutProps {
    children: ReactNode;
}

const headingFont = Space_Grotesk({
    subsets: ['latin'],
    variable: '--font-auth-heading',
    weight: ['500', '600', '700'],
});

const bodyFont = Public_Sans({
    subsets: ['latin'],
    variable: '--font-auth-body',
    weight: ['400', '500', '600', '700'],
});

export const AuthLayout = ({ children }: AuthLayoutProps) => {
    return (
        <div className={`${headingFont.variable} ${bodyFont.variable} min-h-screen bg-[#F0F4F8]`} style={{ fontFamily: 'var(--font-auth-body)' }}>
            <a href="#auth-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-navy">
                Skip to authentication form
            </a>

            <div className="flex min-h-screen">
                {/* Left brand panel */}
                <aside className="relative hidden w-[42%] min-w-95 overflow-hidden lg:flex lg:flex-col" aria-hidden="true">
                    {/* Deep navy base */}
                    <div className="absolute inset-0 bg-[#0B1F3A]" />
                    {/* Subtle warm accent — bottom right only */}
                    <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-[#C5843A]/20 blur-3xl" />
                    {/* Faint circle motif — abstract ajo ring */}
                    <svg className="absolute inset-0 h-full w-full opacity-[0.07]" viewBox="0 0 480 640" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="240" cy="320" r="210" stroke="white" strokeWidth="1.5" />
                        <circle cx="240" cy="320" r="155" stroke="white" strokeWidth="1" />
                        <circle cx="240" cy="320" r="100" stroke="white" strokeWidth="0.75" />
                        <circle cx="240" cy="110" r="6" fill="white" />
                        <circle cx="408" cy="215" r="5" fill="white" />
                        <circle cx="408" cy="425" r="5" fill="white" />
                        <circle cx="240" cy="530" r="6" fill="white" />
                        <circle cx="72" cy="425" r="5" fill="white" />
                        <circle cx="72" cy="215" r="5" fill="white" />
                        <line x1="240" y1="110" x2="408" y2="215" stroke="white" strokeWidth="0.5" />
                        <line x1="408" y1="215" x2="408" y2="425" stroke="white" strokeWidth="0.5" />
                        <line x1="408" y1="425" x2="240" y2="530" stroke="white" strokeWidth="0.5" />
                        <line x1="240" y1="530" x2="72" y2="425" stroke="white" strokeWidth="0.5" />
                        <line x1="72" y1="425" x2="72" y2="215" stroke="white" strokeWidth="0.5" />
                        <line x1="72" y1="215" x2="240" y2="110" stroke="white" strokeWidth="0.5" />
                    </svg>

                    <div className="relative z-10 flex h-full flex-col px-10 py-10">
                        {/* Logo */}
                        <BrandLogo className="self-start" size="sm" />

                        {/* Central statement */}
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            className="mt-auto"
                        >
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0f766e]">
                                Ajo — the way it should be
                            </p>
                            <h1 className="mt-4 text-[2.6rem] font-semibold leading-[1.08] tracking-[-0.02em] text-white" style={{ fontFamily: 'var(--font-auth-heading)' }}>
                                Your circle<br />saves together.
                            </h1>
                            <p className="mt-4 max-w-70 leading-relaxed text-white/55" style={{ fontSize: '15px' }}>
                                The traditional Ajo savings system — now digital, verified, and always on time.
                            </p>
                        </motion.div>

                        {/* Social proof strip */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                            className="mt-auto pt-12"
                        >
                            <div className="border-t border-white/10 pt-6">
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { value: '₦0', label: 'Missed payouts' },
                                        { value: '100%', label: 'Verified accounts' },
                                        { value: 'Live', label: 'Real-time tracking' },
                                    ].map((stat) => (
                                        <div key={stat.label}>
                                            <p className="text-xl font-semibold text-white" style={{ fontFamily: 'var(--font-auth-heading)' }}>{stat.value}</p>
                                            <p className="mt-0.5 text-xs text-white/40">{stat.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </aside>

                {/* Right form panel */}
                <main id="auth-main" className="flex flex-1 flex-col bg-[#F0F4F8]">
                    <div className="mx-auto flex w-full max-w-130 flex-1 flex-col justify-center px-5 py-10 sm:px-8">
                        {/* Mobile logo */}
                        <div className="mb-8 flex items-center justify-between lg:hidden">
                            <BrandLogo size="sm" dark />
                        </div>

                        {/* Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            className="rounded-2xl border border-slate-200/70 bg-white p-7 shadow-[0_2px_24px_rgba(15,23,42,0.07)] sm:p-8"
                        >
                            {children}
                        </motion.div>

                        <p className="mt-6 text-center text-[11px] text-slate-400">
                            &copy; 2026 Subtech Ajo Solution &middot; All rights reserved
                        </p>
                    </div>
                </main>
            </div>
        </div>
    );
};
