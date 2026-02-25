import { Container } from '../ui/Container';
import { motion } from 'motion/react';
import { Zap, Shield, Users, Smartphone, Clock, CreditCard } from 'lucide-react';

export const Features = () => {
  const features = [
    {
      title: 'Automated Savings',
      description: 'Set your contribution amount and frequency once, and we handle the rest automatically.',
      icon: <Zap size={24} />,
      color: 'bg-brand-soft-blue text-brand-primary'
    },
    {
      title: 'Military-Grade Security',
      description: 'Your funds and data are protected by industry-leading encryption and security protocols.',
      icon: <Shield size={24} />,
      color: 'bg-brand-emerald/10 text-brand-emerald'
    },
    {
      title: 'Trusted Communities',
      description: 'Join verified Ajo groups or create your own with friends and family you trust.',
      icon: <Users size={24} />,
      color: 'bg-brand-soft-blue text-brand-primary'
    },
    {
      title: 'Mobile First',
      description: 'Manage your savings on the go with our intuitive and fast mobile-optimized dashboard.',
      icon: <Smartphone size={24} />,
      color: 'bg-brand-soft-blue text-brand-primary'
    },
    {
      title: 'Instant Payouts',
      description: 'Receive your rotation payout instantly to your linked bank account or wallet.',
      icon: <Clock size={24} />,
      color: 'bg-brand-emerald/10 text-brand-emerald'
    },
    {
      title: 'Flexible Payments',
      description: 'Contribute via bank transfer, USSD, or debit card. We support all major Nigerian banks.',
      icon: <CreditCard size={24} />,
      color: 'bg-brand-soft-blue text-brand-primary'
    }
  ];

  return (
    <section id="features" className="py-24 bg-white">
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-brand-primary font-bold text-sm uppercase tracking-widest mb-4">Features</h2>
          <h3 className="text-4xl font-bold text-brand-navy mb-6 tracking-tight">
            Everything you need to <span className="text-brand-primary">save smarter.</span>
          </h3>
          <p className="text-brand-gray text-lg">
            We've built the most comprehensive digital Ajo platform in Africa, designed for security, speed, and transparency.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-[2rem] border border-brand-border bg-brand-light hover:bg-white hover:shadow-xl hover:shadow-brand-primary/5 transition-all duration-300 group"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300 ${feature.color}`}>
                {feature.icon}
              </div>
              <h4 className="text-xl font-bold text-brand-navy mb-3">{feature.title}</h4>
              <p className="text-brand-gray leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
};
