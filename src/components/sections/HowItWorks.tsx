import { Container } from '../ui/Container';
import { motion } from 'motion/react';
import { UserPlus, Search, CreditCard, Wallet, ArrowRight } from 'lucide-react';

export const HowItWorks = () => {
  const steps = [
    {
      title: 'Create Your Account',
      description: 'Sign up in seconds with your phone number and email. KYC verification is fast and secure.',
      icon: <UserPlus size={24} />,
      accent: 'from-brand-primary to-blue-600',
      accentLight: 'bg-brand-primary/10',
      accentText: 'text-brand-primary',
    },
    {
      title: 'Join or Create a Group',
      description: 'Browse verified Ajo groups or create your own and invite friends, family, or colleagues.',
      icon: <Search size={24} />,
      accent: 'from-brand-emerald to-emerald-500',
      accentLight: 'bg-brand-emerald/10',
      accentText: 'text-brand-emerald',
    },
    {
      title: 'Automate Contributions',
      description: 'Link your bank account or card. We handle automatic deductions on your schedule.',
      icon: <CreditCard size={24} />,
      accent: 'from-purple-500 to-violet-600',
      accentLight: 'bg-purple-500/10',
      accentText: 'text-purple-600',
    },
    {
      title: 'Receive Your Payout',
      description: 'When it\'s your turn, get the full pot paid directly to your wallet or bank — instantly.',
      icon: <Wallet size={24} />,
      accent: 'from-amber-500 to-orange-500',
      accentLight: 'bg-amber-500/10',
      accentText: 'text-amber-600',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 lg:py-32 bg-white relative overflow-hidden">
      {/* Subtle bg */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-primary/[0.02] rounded-full blur-[100px] -mr-64 -mt-64 pointer-events-none" />

      <Container className="relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-primary/[0.06] border border-brand-primary/10 mb-5">
              <span className="w-1.5 h-1.5 bg-brand-primary rounded-full"></span>
              <span className="text-[11px] font-bold text-brand-primary uppercase tracking-[0.1em]">How it Works</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold text-brand-navy mb-4 tracking-tight">
              Start saving in <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-emerald">4 simple steps</span>
            </h3>
            <p className="text-brand-gray text-[15px] leading-relaxed">
              We've simplified the traditional Ajo system for the digital age — more secure, more transparent, and always on time.
            </p>
          </motion.div>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-[60px] left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent z-0" />

          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative z-10 group"
            >
              <div className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-xl hover:shadow-slate-900/[0.06] hover:-translate-y-1 transition-all duration-300">
                {/* Step Number + Icon */}
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-12 h-12 rounded-xl ${step.accentLight} ${step.accentText} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    {step.icon}
                  </div>
                  <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center">
                    <span className="text-[11px] font-bold text-brand-navy">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                </div>

                <h4 className="text-lg font-bold text-brand-navy mb-2">{step.title}</h4>
                <p className="text-[13px] text-brand-gray leading-relaxed">{step.description}</p>

                {/* Arrow indicator */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:flex absolute -right-3 top-[60px] w-6 h-6 bg-white border border-slate-100 rounded-full items-center justify-center z-20 shadow-sm">
                    <ArrowRight size={10} className="text-slate-400" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
};
