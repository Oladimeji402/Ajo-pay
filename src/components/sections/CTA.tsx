import { Container } from '../ui/Container';
import { Button } from '../ui/Button';
import { motion } from 'motion/react';
import { ArrowRight, ShieldCheck, Smartphone, Sparkles, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CTA = () => {
  return (
    <section className="py-24 lg:py-32 bg-[#F8FAFC] overflow-hidden">
      <Container>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden"
        >
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-navy via-[#162550] to-brand-primary" />

          {/* Decorative */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/[0.04] rounded-full -mr-48 -mt-48 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-emerald/10 rounded-full -ml-48 -mb-48 blur-3xl pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: 'radial-gradient(circle, white 0.5px, transparent 0.5px)',
            backgroundSize: '24px 24px'
          }} />

          {/* Content */}
          <div className="relative z-10 px-8 py-16 md:px-16 lg:px-20 lg:py-24">
            <div className="max-w-3xl mx-auto text-center">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.08] border border-white/10 mb-6"
              >
                <Sparkles size={12} className="text-brand-emerald" />
                <span className="text-[11px] font-bold text-white/70 uppercase tracking-[0.1em]">Join 50,000+ Savers</span>
              </motion.div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5 tracking-tight leading-tight">
                Ready to reach your{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-emerald to-emerald-400">savings goals?</span>
              </h2>

              <p className="text-white/50 text-[15px] sm:text-base mb-10 leading-relaxed max-w-xl mx-auto">
                It takes less than 2 minutes to create your account and join your first Ajo group. Start building your financial future today.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link to="/signup">
                  <Button 
                    variant="white" 
                    size="lg" 
                    className="text-[15px] px-8 py-4 rounded-2xl flex items-center gap-2 shadow-xl shadow-black/20 group"
                  >
                    Create Free Account
                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button 
                    size="lg" 
                    className="text-[15px] px-8 py-4 rounded-2xl bg-white/10 text-white hover:bg-white/20 border border-white/10 focus:ring-white/20"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>

              {/* Avatars + Social Proof */}
              <div className="flex items-center justify-center gap-4 mb-12">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <img
                      key={i}
                      src={`https://i.pravatar.cc/80?u=cta${i}`}
                      alt="User"
                      className="w-9 h-9 rounded-full border-2 border-brand-navy object-cover"
                    />
                  ))}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-0.5 mb-0.5">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-3 h-3 text-amber-400">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      </div>
                    ))}
                  </div>
                  <p className="text-[12px] font-bold text-white/60">Rated 4.9/5 by 50k+ users</p>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
                {[
                  { icon: <ShieldCheck size={16} />, text: 'NDIC Insured' },
                  { icon: <CheckCircle2 size={16} />, text: 'No Hidden Fees' },
                  { icon: <Smartphone size={16} />, text: 'iOS & Android' },
                ].map((badge, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-brand-emerald">{badge.icon}</span>
                    <span className="text-[12px] font-bold text-white/60">{badge.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
};
