'use client';

import { Container } from '../ui/Container';
import { motion } from 'motion/react';
import { CheckCircle2, TrendingUp, Users, ArrowDownLeft } from 'lucide-react';

// ─── Feature 1 visual: Contribution schedule ─────────────────────────────────
const ScheduleVisual = () => (
    <div className="w-full max-w-[280px] mx-auto">
        <div className="bg-white/[0.05] border border-white/[0.07] rounded-2xl p-5 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/30 mb-4">Contribution Schedule</p>
            {[
                { month: 'October', amount: '₦50,000', status: 'done' },
                { month: 'November', amount: '₦50,000', status: 'done' },
                { month: 'December', amount: '₦50,000', status: 'active' },
                { month: 'January', amount: '₦50,000', status: 'upcoming' },
                { month: 'February', amount: '₦50,000', status: 'upcoming' },
            ].map((row, i) => (
                <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                            row.status === 'done' ? 'bg-brand-primary/20' :
                            row.status === 'active' ? 'bg-brand-accent/20' : 'bg-white/[0.04]'
                        }`}>
                            {row.status === 'done' && <CheckCircle2 size={11} className="text-brand-electric" />}
                            {row.status === 'active' && <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />}
                            {row.status === 'upcoming' && <div className="w-1.5 h-1.5 rounded-full bg-white/15" />}
                        </div>
                        <span className="text-[12px] text-white/50">{row.month}</span>
                    </div>
                    <span className={`text-[12px] font-bold ${
                        row.status === 'done' ? 'text-brand-electric' :
                        row.status === 'active' ? 'text-brand-accent' : 'text-white/20'
                    }`}>{row.amount}</span>
                </div>
            ))}
        </div>
    </div>
);

// ─── Feature 2 visual: Savings visibility panel ───────────────────────────────
const GroupVisual = () => {
    const members = [
        { initials: 'OJ', color: '#1E3A6E', paid: true },
        { initials: 'CE', color: '#2563EB', paid: true },
        { initials: 'IK', color: '#F59E0B', paid: true, current: true },
        { initials: 'AU', color: '#334155', paid: false },
        { initials: 'BT', color: '#334155', paid: false },
        { initials: 'ED', color: '#334155', paid: false },
    ];

    return (
        <div className="w-full max-w-[280px] mx-auto">
            <div className="bg-white/[0.05] border border-white/[0.07] rounded-2xl p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/30 mb-4">Savings health · Month 3</p>
                <div className="space-y-2.5">
                    {members.map((m, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
                                    style={{ backgroundColor: m.color }}
                                >
                                    {m.initials}
                                </div>
                                <div className="h-1.5 w-20 rounded-full bg-white/[0.06] overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{
                                            width: m.paid ? '100%' : '0%',
                                            backgroundColor: m.current ? '#F59E0B' : '#2563EB',
                                        }}
                                    />
                                </div>
                            </div>
                            <span className={`text-[10px] font-bold ${
                                m.current ? 'text-brand-accent' :
                                m.paid ? 'text-brand-electric' : 'text-white/20'
                            }`}>
                                {m.current ? 'Due now' : m.paid ? '✓ Paid' : 'Pending'}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="mt-4 pt-4 border-t border-white/[0.06] flex justify-between text-[10px]">
                    <span className="text-white/30">5 / 6 periods paid</span>
                    <span className="text-brand-accent font-bold">₦500,000 saved</span>
                </div>
            </div>
        </div>
    );
};

// ─── Feature 3 visual: Payout notification ────────────────────────────────────
const PayoutVisual = () => (
    <div className="w-full max-w-[280px] mx-auto space-y-3">
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-white/[0.08] border border-white/[0.10] rounded-2xl p-4 flex items-center gap-3"
        >
            <div className="w-10 h-10 rounded-xl bg-brand-accent/15 flex items-center justify-center flex-shrink-0">
                <TrendingUp size={18} className="text-brand-accent" />
            </div>
            <div>
                <p className="text-[11px] font-bold text-white leading-tight">Withdrawal Recorded</p>
                <p className="text-[10px] text-white/40 mt-0.5">General Savings · Just now</p>
            </div>
            <p className="text-[15px] font-black text-brand-accent ml-auto">+₦450K</p>
        </motion.div>

        <motion.div
            initial={{ opacity: 0, y: -8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3.5 flex items-center gap-3"
        >
            <div className="w-8 h-8 rounded-lg bg-brand-primary/20 flex items-center justify-center flex-shrink-0">
                <ArrowDownLeft size={14} className="text-brand-electric" />
            </div>
            <div className="flex-1">
                <p className="text-[11px] font-bold text-white">Target Savings Plan</p>
                <p className="text-[10px] text-white/30">Bank transfer · 2 min ago</p>
            </div>
            <p className="text-[13px] font-bold text-brand-electric">+₦600,000</p>
        </motion.div>

        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border border-white/[0.05] rounded-xl"
        >
            <span className="text-[10px] text-white/30 uppercase tracking-widest">New Balance</span>
            <span className="text-[14px] font-black text-white">₦1,050,000</span>
        </motion.div>
    </div>
);

// ─── Feature row ──────────────────────────────────────────────────────────────
interface FeatureRowProps {
    number: string;
    tag: string;
    title: string;
    description: string;
    visual: React.ReactNode;
    reverse?: boolean;
    index: number;
}

const FeatureRow = ({ number, tag, title, description, visual, reverse = false, index }: FeatureRowProps) => (
    <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ delay: index * 0.08, duration: 0.55 }}
        className={`grid lg:grid-cols-2 gap-10 lg:gap-20 items-center py-14 lg:py-20 border-b border-white/[0.05] last:border-0 ${reverse ? 'lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1' : ''}`}
    >
        {/* Text side */}
        <div>
            <div className="flex items-baseline gap-3 mb-5">
                <span
                    className="text-[3.5rem] font-black leading-none tracking-[-0.04em] opacity-10 select-none"
                    style={{ fontFamily: 'var(--font-display)', color: '#F59E0B' }}
                >
                    {number}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-accent/60">
                    {tag}
                </span>
            </div>
            <h3
                className="text-white leading-[1.1] mb-4"
                style={{ fontSize: 'clamp(1.6rem, 3vw, 2rem)' }}
            >
                <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400 }}>
                    {title.split(' ')[0]}{' '}
                </span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.025em' }}>
                    {title.split(' ').slice(1).join(' ')}
                </span>
            </h3>
            <p className="text-white/45 text-[15px] leading-relaxed max-w-sm">
                {description}
            </p>
        </div>

        {/* Visual side */}
        <div className="flex justify-center lg:justify-end">
            {visual}
        </div>
    </motion.div>
);

// ─── Features section ─────────────────────────────────────────────────────────
export const Features = () => {
    return (
        <section id="features" className="bg-[#060F20] relative overflow-hidden">

            <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-brand-primary/[0.04] rounded-full blur-[120px] -ml-40 -mt-40 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-brand-accent/[0.03] rounded-full blur-[120px] -mr-40 -mb-40 pointer-events-none" />

            <Container className="relative z-10">

                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="pt-20 lg:pt-28 pb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
                >
                    <div>
                        <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-brand-accent mb-4">
                            Features
                        </p>
                        <h2
                            className="text-white leading-[1.06]"
                            style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}
                        >
                            <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400 }}>Built </span>
                            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.03em' }}>around how<br />you actually save.</span>
                        </h2>
                    </div>
                    <p className="text-white/35 text-[14px] leading-relaxed max-w-xs sm:text-right">
                        Every feature exists because a Nigerian saver asked for it.
                    </p>
                </motion.div>

                {/* Feature rows */}
                <FeatureRow
                    index={0}
                    number="01"
                    tag="Automation"
                    title="Never miss a contribution again."
                    description="Set your amount and schedule once. Automatic deductions happen on time, every time — you stay focused on your goal, not the admin."
                    visual={<ScheduleVisual />}
                />

                <FeatureRow
                    index={1}
                    number="02"
                    tag="Visibility"
                    title="Your savings, fully transparent."
                    description="See plan status, paid periods, missed periods, and total saved in real time for both target and general plans."
                    visual={<GroupVisual />}
                    reverse
                />

                <FeatureRow
                    index={2}
                    number="03"
                    tag="Payouts"
                    title="Your money lands instantly."
                    description="When payout is due, admins can process it with verified account details and clear payment records."
                    visual={<PayoutVisual />}
                />

            </Container>
        </section>
    );
};
