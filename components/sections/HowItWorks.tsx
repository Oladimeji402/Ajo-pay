'use client';

import { Container } from '../ui/Container';
import { motion } from 'motion/react';
import { UserPlus, Search, CreditCard, Wallet, CheckCircle2 } from 'lucide-react';

export const HowItWorks = () => {
  const steps = [
    {
      number: '01',
      title: 'Create Your Account',
      description: 'Sign up in under 2 minutes with your phone number and email. Fast KYC verification secures your identity.',
      icon: <UserPlus size={20} />,
      gradient: 'from-brand-primary to-blue-500',
      accentLight: 'bg-brand-primary/10',
      accentText: 'text-brand-primary',
      tag: 'Onboarding',
    },
    {
      number: '02',
      title: 'Join or Create a Group',
      description: 'Browse verified Ajo groups or create your own and invite friends, family, or colleagues.',
      icon: <Search size={20} />,
      gradient: 'from-brand-emerald to-emerald-400',
      accentLight: 'bg-brand-emerald/10',
      accentText: 'text-brand-emerald',
      tag: 'Community',
    },
    {
      number: '03',
      title: 'Automate Contributions',
      description: 'Link your bank account or card. Set a schedule and we handle automatic deductions — you never miss a turn.',
      icon: <CreditCard size={20} />,
      gradient: 'from-purple-500 to-violet-600',
      accentLight: 'bg-purple-500/10',
      accentText: 'text-purple-600',
      tag: 'Automation',
    },
    {
      number: '04',
      title: 'Receive Your Payout',
      description: 'When it\'s your rotation, receive the full pot instantly — direct to your bank account or wallet.',
      icon: <Wallet size={20} />,
      gradient: 'from-amber-500 to-orange-500',
      accentLight: 'bg-amber-500/10',
      accentText: 'text-amber-600',
      tag: 'Payout',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 lg:py-36 bg-white relative overflow-hidden">
      {/* Subtle background accent */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-primary/[0.02] rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-emerald/[0.025] rounded-full blur-[100px] -ml-48 -mb-48 pointer-events-none" />

      <Container className="relative z-10">
        <div className="grid lg:grid-cols-[1fr_1.35fr] gap-16 lg:gap-24 items-start">

          {/* ─── Left — Sticky title block ─── */}
          <div className="lg:sticky lg:top-28">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-primary/[0.06] border border-brand-primary/10 mb-6">
                <span className="w-1.5 h-1.5 bg-brand-primary rounded-full" />
                <span className="text-[11px] font-bold text-brand-primary uppercase tracking-[0.1em]">How it Works</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-brand-navy leading-[1.1] tracking-tight mb-5">
                Start saving in{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-emerald">
                  4 simple steps
                </span>
              </h2>
              <p className="text-brand-gray text-[15px] leading-relaxed mb-10 max-w-sm">
                We&apos;ve digitised the traditional Ajo system — more secure, fully transparent, and always on time.
              </p>

              {/* Trust row */}
              <div className="space-y-3">
                {[
                  'No hidden fees, ever',
                  'Instant bank-to-bank transfers',
                  'Fully automated — zero manual work',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <CheckCircle2 size={15} className="text-brand-emerald flex-shrink-0" />
                    <span className="text-[13.5px] text-brand-gray font-medium">{item}</span>
                  </div>
                ))}
              </div>

              {/* Stats pills */}
              <div className="flex items-center gap-3 mt-10">
                <div className="px-4 py-2.5 bg-brand-primary/[0.06] rounded-xl border border-brand-primary/10">
                  <p className="text-[13px] font-extrabold text-brand-navy">50K+</p>
                  <p className="text-[10px] text-brand-gray">Active Savers</p>
                </div>
                <div className="px-4 py-2.5 bg-brand-emerald/[0.06] rounded-xl border border-brand-emerald/10">
                  <p className="text-[13px] font-extrabold text-brand-navy">₦2B+</p>
                  <p className="text-[10px] text-brand-gray">Total Saved</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ─── Right — Steps timeline ─── */}
          <div className="relative">
            {/* Connecting vertical line */}
            <div className="absolute top-5 bottom-5 left-[23px] w-px bg-gradient-to-b from-brand-primary/30 via-brand-emerald/20 to-transparent" />

            <div className="space-y-4">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 28 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="relative flex gap-5 group"
                >
                  {/* Step circle */}
                  <div className={`relative w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br ${step.gradient} shadow-lg z-10 group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-white text-[11px] font-black tracking-wider">{step.number}</span>
                  </div>

                  {/* Card */}
                  <div className="flex-1 bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-xl hover:shadow-slate-900/[0.07] hover:-translate-y-0.5 transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl ${step.accentLight} ${step.accentText} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                        {step.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h4 className="font-bold text-brand-navy text-[15px]">{step.title}</h4>
                          <span className={`hidden sm:inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${step.accentLight} ${step.accentText} uppercase tracking-wider`}>
                            {step.tag}
                          </span>
                        </div>
                        <p className="text-[13px] text-brand-gray leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
