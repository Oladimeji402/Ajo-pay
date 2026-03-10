'use client';

import { Container } from '../ui/Container';
import { motion } from 'motion/react';
import { Zap, Shield, Users, Smartphone, Clock, CreditCard, TrendingUp, CheckCircle2, ArrowUpRight, Lock, Fingerprint } from 'lucide-react';

export const Features = () => {
  return (
    <section id="features" className="py-24 lg:py-32 bg-[#F8FAFC] relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-emerald/[0.03] rounded-full blur-[80px] -ml-48 -mb-48 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-brand-primary/[0.03] rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />

      <Container className="relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-emerald/[0.08] border border-brand-emerald/15 mb-5">
              <span className="w-1.5 h-1.5 bg-brand-emerald rounded-full" />
              <span className="text-[11px] font-bold text-brand-emerald uppercase tracking-[0.1em]">Features</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-navy mb-4 tracking-tight">
              Everything you need to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-emerald">save smarter</span>
            </h2>
            <p className="text-brand-gray text-[15px] leading-relaxed">
              The most comprehensive digital Ajo platform — built for security, speed, and complete transparency.
            </p>
          </motion.div>
        </div>

        {/* ─── Bento Grid ─── */}
        <div className="grid lg:grid-cols-3 gap-4 lg:gap-5">

          {/* Card 1 — Wide, dark: Automated Savings */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="lg:col-span-2 rounded-3xl bg-brand-navy p-7 lg:p-8 relative overflow-hidden group hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand-navy/20 transition-all duration-300 min-h-[220px]"
          >
            {/* BG glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-emerald/[0.08] rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-primary/[0.12] rounded-full blur-[60px] -ml-12 -mb-12 pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row gap-8 items-start h-full">
              <div className="flex-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-emerald/15 border border-brand-emerald/20 mb-4">
                  <Zap size={10} className="text-brand-emerald" />
                  <span className="text-[10px] font-bold text-brand-emerald uppercase tracking-wider">Automation</span>
                </div>
                <h3 className="text-[1.4rem] lg:text-2xl font-extrabold text-white mb-2 leading-tight">
                  Automated Contributions
                </h3>
                <p className="text-slate-400 text-[13.5px] leading-relaxed max-w-xs">
                  Set your amount and schedule once. We deduct automatically — you never miss a contribution turn.
                </p>
              </div>
              {/* Visual: contribution schedule */}
              <div className="flex-shrink-0 w-full sm:w-44">
                <div className="bg-white/[0.06] border border-white/[0.08] rounded-2xl p-4 space-y-2">
                  {[
                    { label: 'Oct 1', status: 'done', amount: '₦50k' },
                    { label: 'Nov 1', status: 'done', amount: '₦50k' },
                    { label: 'Dec 1', status: 'active', amount: '₦50k' },
                    { label: 'Jan 1', status: 'upcoming', amount: '₦50k' },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${row.status === 'done' ? 'bg-brand-emerald/20' :
                            row.status === 'active' ? 'bg-amber-500/20' : 'bg-white/[0.06]'
                          }`}>
                          {row.status === 'done' && <CheckCircle2 size={11} className="text-brand-emerald" />}
                          {row.status === 'active' && <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                          {row.status === 'upcoming' && <div className="w-2 h-2 rounded-full bg-white/20" />}
                        </div>
                        <span className="text-[11px] text-slate-400">{row.label}</span>
                      </div>
                      <span className={`text-[11px] font-bold ${row.status === 'done' ? 'text-brand-emerald' : row.status === 'active' ? 'text-amber-400' : 'text-slate-600'}`}>
                        {row.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2 — Tall: Bank-Grade Security (row-span-2) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.10 }}
            className="lg:row-span-2 rounded-3xl bg-[#030d1f] p-7 relative overflow-hidden group hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40 transition-all duration-300 min-h-[220px]"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-brand-emerald/[0.07] rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10 h-full flex flex-col">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-emerald/15 border border-brand-emerald/20 mb-5 w-fit">
                <Shield size={10} className="text-brand-emerald" />
                <span className="text-[10px] font-bold text-brand-emerald uppercase tracking-wider">Security First</span>
              </div>

              {/* Shield icon centered */}
              <div className="flex justify-center mb-6">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <div className="absolute inset-0 bg-brand-emerald/10 rounded-full animate-ping opacity-30" />
                  <div className="absolute inset-2 bg-brand-emerald/15 rounded-full" />
                  <Shield size={36} className="text-brand-emerald relative z-10" />
                </div>
              </div>

              <h3 className="text-[1.35rem] font-extrabold text-white mb-2 leading-tight text-center">
                Bank-Grade Security
              </h3>
              <p className="text-slate-500 text-[13px] leading-relaxed mb-6 text-center">
                256-bit encryption, real-time fraud monitoring, and multi-layer authentication protect every transaction.
              </p>

              <div className="space-y-3 mt-auto">
                {[
                  { icon: <Lock size={13} />, label: '256-bit SSL Encryption' },
                  { icon: <Fingerprint size={13} />, label: 'Biometric Auth' },
                  { icon: <Shield size={13} />, label: 'AI Fraud Detection' },
                  { icon: <CheckCircle2 size={13} />, label: 'NDIC Insured Funds' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 p-2.5 bg-white/[0.04] rounded-xl border border-white/[0.06]">
                    <div className="text-brand-emerald flex-shrink-0">{item.icon}</div>
                    <span className="text-[12px] text-slate-300 font-medium">{item.label}</span>
                    <CheckCircle2 size={11} className="text-brand-emerald ml-auto flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Card 3 — Instant Payouts */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="rounded-3xl bg-gradient-to-br from-brand-emerald/[0.08] to-emerald-50 border border-brand-emerald/15 p-7 relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-emerald/10 transition-all duration-300 min-h-[200px]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-emerald/[0.08] rounded-full blur-[50px] -mr-8 -mt-8 pointer-events-none" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-brand-emerald/15 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Clock size={22} className="text-brand-emerald" />
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-[1.15rem] font-extrabold text-brand-navy leading-tight">Instant Payouts</h3>
                <ArrowUpRight size={16} className="text-brand-emerald opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-brand-gray text-[13px] leading-relaxed">
                Receive your rotation payout instantly — directly to your bank account. No delays, no friction.
              </p>
              {/* Payout visual */}
              <div className="mt-4 flex items-center gap-2 p-3 bg-white rounded-xl shadow-sm border border-brand-emerald/10">
                <div className="w-7 h-7 bg-brand-emerald/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <TrendingUp size={13} className="text-brand-emerald" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Just paid out</p>
                  <p className="text-[13px] font-extrabold text-brand-navy">+₦600,000</p>
                </div>
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse" />
              </div>
            </div>
          </motion.div>

          {/* Card 4 — Community Groups */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl bg-white border border-slate-100 p-7 relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/[0.07] transition-all duration-300 min-h-[200px]"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users size={22} className="text-brand-primary" />
              </div>
              <h3 className="text-[1.15rem] font-extrabold text-brand-navy mb-1.5 leading-tight">Trusted Communities</h3>
              <p className="text-brand-gray text-[13px] leading-relaxed">
                Join verified Ajo groups or build your own circle. Every group is vetted before going live.
              </p>
              {/* Avatar cluster */}
              <div className="mt-4 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[
                    { bg: '#1B2F6B', text: 'OJ' },
                    { bg: '#0F766E', text: 'CE' },
                    { bg: '#7c3aed', text: 'IK' },
                    { bg: '#b45309', text: 'AU' },
                  ].map((u, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-black text-white"
                      style={{ backgroundColor: u.bg }}
                    >
                      {u.text}
                    </div>
                  ))}
                  <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500">
                    +8
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">12 members · ₦100k/mo</span>
              </div>
            </div>
          </motion.div>

          {/* Card 5 — Wide bottom: Flexible Payments + Mobile First */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25 }}
            className="lg:col-span-3 rounded-3xl bg-white border border-slate-100 p-7 lg:p-8 relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/[0.07] transition-all duration-300"
          >
            <div className="flex flex-col md:flex-row gap-8 items-center">
              {/* Left content */}
              <div className="flex-1">
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Smartphone size={22} className="text-purple-600" />
                </div>
                <h3 className="text-[1.3rem] font-extrabold text-brand-navy mb-2 leading-tight">Mobile-First Experience</h3>
                <p className="text-brand-gray text-[13.5px] leading-relaxed max-w-sm">
                  Built from the ground up for your phone. Manage groups, track savings, and receive payouts — anytime, anywhere.
                </p>
              </div>
              {/* Right: payment methods grid */}
              <div className="flex-shrink-0 grid grid-cols-3 gap-3 w-full md:w-auto">
                {[
                  { label: 'Bank Transfer', color: 'text-brand-primary', bg: 'bg-brand-primary/[0.06]', icon: <CreditCard size={18} /> },
                  { label: 'Debit Card', color: 'text-purple-600', bg: 'bg-purple-50', icon: <CreditCard size={18} /> },
                  { label: 'USSD', color: 'text-brand-emerald', bg: 'bg-brand-emerald/[0.07]', icon: <Smartphone size={18} /> },
                ].map((method, i) => (
                  <div key={i} className={`${method.bg} rounded-2xl p-4 flex flex-col items-center gap-2 border border-slate-100`}>
                    <div className={`${method.color}`}>{method.icon}</div>
                    <span className="text-[11px] font-bold text-brand-navy text-center">{method.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </Container>
    </section>
  );
};
