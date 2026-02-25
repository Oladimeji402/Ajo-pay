import { Container } from '../ui/Container';
import { motion } from 'motion/react';
import { UserPlus, Search, CreditCard, Wallet } from 'lucide-react';

export const HowItWorks = () => {
  const steps = [
    {
      title: 'Create Account',
      description: 'Sign up in seconds with just your phone number and email.',
      icon: <UserPlus size={24} />,
      color: 'bg-brand-soft-blue text-brand-primary'
    },
    {
      title: 'Join a Group',
      description: 'Browse verified Ajo groups or join one via an invite link.',
      icon: <Search size={24} />,
      color: 'bg-brand-soft-blue text-brand-primary'
    },
    {
      title: 'Automate Savings',
      description: 'Link your card or bank account for seamless contributions.',
      icon: <CreditCard size={24} />,
      color: 'bg-brand-soft-blue text-brand-primary'
    },
    {
      title: 'Get Paid',
      description: 'Receive your total pot payout directly to your wallet on your turn.',
      icon: <Wallet size={24} />,
      color: 'bg-brand-emerald/10 text-brand-emerald'
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-brand-light">
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-brand-primary font-bold text-sm uppercase tracking-widest mb-4">How it Works</h2>
          <h3 className="text-4xl font-bold text-brand-navy mb-6 tracking-tight">
            Start your savings journey in <span className="text-brand-primary">4 easy steps.</span>
          </h3>
          <p className="text-brand-gray text-lg">
            We've simplified the traditional Ajo system for the digital age, making it more secure and accessible than ever.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-brand-border -translate-y-1/2 z-0" />
          
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative z-10 flex flex-col items-center text-center group"
            >
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-lg transition-transform group-hover:scale-110 duration-300 ${step.color}`}>
                {step.icon}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-brand-navy text-white rounded-full flex items-center justify-center text-xs font-bold border-4 border-brand-light">
                  {i + 1}
                </div>
              </div>
              <h4 className="text-xl font-bold text-brand-navy mb-3">{step.title}</h4>
              <p className="text-brand-gray text-sm leading-relaxed px-4">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
};
