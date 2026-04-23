'use client';

import { Container } from '../ui/Container';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const CTA = () => {
    return (
        <section
            className="py-24 lg:py-32 relative overflow-hidden"
            style={{ backgroundColor: '#F59E0B' }}
        >
            {/* Texture — subtle dark dot grid */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.07]"
                style={{
                    backgroundImage: 'radial-gradient(rgba(15,23,42,1) 0.5px, transparent 0.5px)',
                    backgroundSize: '28px 28px',
                }}
            />

            {/* Ambient shape — top right */}
            <div
                className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none"
                style={{ backgroundColor: 'rgba(15,23,42,0.06)', filter: 'blur(60px)' }}
            />
            <div
                className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full pointer-events-none"
                style={{ backgroundColor: 'rgba(15,23,42,0.08)', filter: 'blur(60px)' }}
            />

            <Container className="relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55 }}
                    className="grid lg:grid-cols-[1fr_auto] gap-10 lg:gap-20 items-center"
                >
                    {/* Left — headline */}
                    <div>
                        <h2
                            className="leading-[1.0] mb-5"
                            style={{
                                fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
                                color: '#0F172A',
                            }}
                        >
                            <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400 }}>Ready</span>
                            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.03em' }}> to start</span>
                            <br />
                            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.03em' }}>your plan?</span>
                        </h2>
                        <p
                            className="text-[15.5px] leading-relaxed mb-8 max-w-sm"
                            style={{ color: 'rgba(15,23,42,0.55)' }}
                        >
                            Create your free account, set up target or general savings, and track payouts with full clarity.
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link href="/signup">
                                <button
                                    className="inline-flex items-center justify-center gap-2 text-[15px] font-bold px-8 py-4 rounded-2xl group transition-all"
                                    style={{
                                        backgroundColor: '#0F172A',
                                        color: '#F59E0B',
                                        boxShadow: '0 8px 24px rgba(15,23,42,0.20)',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1E293B')}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0F172A')}
                                >
                                    Join Free
                                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            </Link>
                            <Link href="/login">
                                <button
                                    className="inline-flex items-center justify-center text-[15px] font-semibold px-8 py-4 rounded-2xl transition-all"
                                    style={{
                                        color: 'rgba(15,23,42,0.55)',
                                        border: '1.5px solid rgba(15,23,42,0.15)',
                                        backgroundColor: 'transparent',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.color = '#0F172A';
                                        e.currentTarget.style.borderColor = 'rgba(15,23,42,0.35)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.color = 'rgba(15,23,42,0.55)';
                                        e.currentTarget.style.borderColor = 'rgba(15,23,42,0.15)';
                                    }}
                                >
                                    Sign In
                                </button>
                            </Link>
                        </div>
                    </div>

                    {/* Right — the 3 proof stats */}
                    <div className="flex flex-row lg:flex-col gap-6 lg:gap-8">
                        {[
                            { value: '₦0', label: 'Missed payouts, ever' },
                            { value: '2 Types', label: 'Target and general savings' },
                            { value: 'Free', label: 'No hidden fees, ever' },
                        ].map((stat, i) => (
                            <div
                                key={i}
                                className={`${i > 0 ? 'border-l lg:border-l-0 lg:border-t pl-6 lg:pl-0 lg:pt-6' : ''}`}
                                style={{ borderColor: 'rgba(15,23,42,0.12)' }}
                            >
                                <p
                                    className="text-[2rem] font-black leading-none tracking-tight"
                                    style={{
                                        fontFamily: 'var(--font-display)',
                                        color: '#0F172A',
                                    }}
                                >
                                    {stat.value}
                                </p>
                                <p
                                    className="text-[12px] mt-1.5 font-medium"
                                    style={{ color: 'rgba(15,23,42,0.45)' }}
                                >
                                    {stat.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </Container>
        </section>
    );
};
