import { Container } from '../ui/Container';
import { motion } from 'motion/react';
import { Zap, Shield, Users, Smartphone, Clock, CreditCard, ArrowRight } from 'lucide-react';

export const Features = () => {
  const features = [
    {
      title: 'Automated Savings',
      description: 'Set your contribution amount and frequency. We handle automatic deductions — you never miss a turn.',
      icon: <Zap size={24} />,
      accent: 'bg-amber-50 text-amber-600',
      highlight: true,
    },
    {
      title: 'Military-Grade Security',
      description: 'Your funds and data are protected by 256-bit encryption and bank-level security protocols.',
      icon: <Shield size={24} />,
      accent: 'bg-brand-emerald/10 text-brand-emerald',
      highlight: false,
    },
    {
      title: 'Trusted Communities',
      description: 'Join verified Ajo groups or create your own. Every group is vetted before going live.',
      icon: <Users size={24} />,
      accent: 'bg-brand-primary/10 text-brand-primary',
      highlight: false,
    },
    {
      title: 'Mobile First',
      description: 'Manage your savings on the go with our intuitive, fast mobile-optimized platform.',
      icon: <Smartphone size={24} />,
      accent: 'bg-purple-50 text-purple-600',
      highlight: false,
    },
    {
      title: 'Instant Payouts',
      description: 'Receive your rotation payout instantly to your linked bank account or wallet.',
      icon: <Clock size={24} />,
      accent: 'bg-brand-emerald/10 text-brand-emerald',
      highlight: true,
    },
    {
      title: 'Flexible Payments',
      description: 'Contribute via bank transfer, USSD, or debit card. We support all major Nigerian banks.',
      icon: <CreditCard size={24} />,
      accent: 'bg-rose-50 text-rose-500',
      highlight: false,
    },
  ];

  return (
    <section id="features" className="py-24 lg:py-32 bg-[#F8FAFC] relative overflow-hidden">
      {/* BG accents */}
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-emerald/[0.03] rounded-full blur-[80px] -ml-48 -mb-48 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-brand-primary/[0.03] rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />

      <Container className="relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-emerald/[0.08] border border-brand-emerald/15 mb-5">
              <span className="w-1.5 h-1.5 bg-brand-emerald rounded-full"></span>
              <span className="text-[11px] font-bold text-brand-emerald uppercase tracking-[0.1em]">Features</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold text-brand-navy mb-4 tracking-tight">
              Everything you need to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-emerald">save smarter</span>
            </h3>
            <p className="text-brand-gray text-[15px] leading-relaxed">
              The most comprehensive digital Ajo platform in Africa — built for security, speed, and total transparency.
            </p>
          </motion.div>
        </div>

        {/* Bento Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`group relative rounded-2xl border bg-white p-7 transition-all duration-300 hover:-translate-y-1 ${
                feature.highlight
                  ? 'border-brand-primary/15 hover:shadow-xl hover:shadow-brand-primary/[0.08]'
                  : 'border-slate-100 hover:shadow-xl hover:shadow-slate-900/[0.06]'
              }`}
            >
              {/* Accent dot for highlighted */}
              {feature.highlight && (
                <div className="absolute top-4 right-4">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-emerald/40"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-emerald"></span>
                  </span>
                </div>
              )}

              <div className={`w-12 h-12 rounded-xl ${feature.accent} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <h4 className="text-lg font-bold text-brand-navy mb-2">{feature.title}</h4>
              <p className="text-[13px] text-brand-gray leading-relaxed mb-4">{feature.description}</p>
              
              <div className="flex items-center gap-1.5 text-[12px] font-bold text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more <ArrowRight size={12} />
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
};
