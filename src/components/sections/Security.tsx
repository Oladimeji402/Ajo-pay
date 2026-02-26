import { Container } from '../ui/Container';
import { motion } from 'motion/react';
import { ShieldCheck, Lock, CheckCircle2, Eye, Fingerprint, KeyRound } from 'lucide-react';

export const Security = () => {
  return (
    <section id="security" className="py-24 lg:py-32 bg-brand-navy text-white overflow-hidden relative">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-brand-primary/15 rounded-full blur-[150px]" />
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: 'radial-gradient(circle, white 0.5px, transparent 0.5px)',
          backgroundSize: '32px 32px'
        }} />
      </div>

      <Container className="relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-emerald/15 border border-brand-emerald/20 mb-6">
              <ShieldCheck size={12} className="text-brand-emerald" />
              <span className="text-[11px] font-bold text-brand-emerald uppercase tracking-[0.1em]">Security First</span>
            </div>

            <h3 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold mb-6 tracking-tight leading-tight">
              Your trust is our{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-emerald to-emerald-400">greatest asset.</span>
            </h3>
            <p className="text-slate-400 text-[15px] mb-10 leading-relaxed max-w-lg">
              We use the same encryption standards as major global banks. Your money and data are protected by multiple layers of security.
            </p>

            <div className="space-y-5">
              {[
                { title: 'NDIC Insured', desc: 'Your deposits are insured by the NDIC through our licensed partner banks.', icon: <ShieldCheck size={18} /> },
                { title: '256-bit Encryption', desc: 'All data transmitted is encrypted using the highest industry standards.', icon: <Lock size={18} /> },
                { title: 'AI Fraud Protection', desc: 'Advanced systems monitor every transaction for suspicious activity in real-time.', icon: <Eye size={18} /> },
                { title: 'Verified Groups', desc: 'Every Ajo group undergoes rigorous verification before going live.', icon: <CheckCircle2 size={18} /> },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4 group"
                >
                  <div className="w-10 h-10 bg-brand-emerald/10 rounded-xl flex items-center justify-center flex-shrink-0 text-brand-emerald group-hover:bg-brand-emerald/20 transition-colors">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-0.5 text-[15px]">{item.title}</h4>
                    <p className="text-[13px] text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right — Security Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-3xl p-6 lg:p-8">
              {/* Top Row Cards */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {[
                  { icon: <ShieldCheck size={22} />, title: 'Secure Vault', sub: 'Isolated storage', color: 'bg-brand-emerald/15 text-brand-emerald' },
                  { icon: <Lock size={22} />, title: 'SSL Certified', sub: 'Encrypted traffic', color: 'bg-brand-primary/20 text-blue-300' },
                  { icon: <Fingerprint size={22} />, title: 'Biometric Auth', sub: 'Fingerprint & Face ID', color: 'bg-purple-500/15 text-purple-300' },
                  { icon: <KeyRound size={22} />, title: '2FA Protected', sub: 'Multi-factor auth', color: 'bg-amber-500/15 text-amber-300' },
                ].map((card, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="p-5 bg-white/[0.04] rounded-2xl border border-white/[0.06] hover:bg-white/[0.08] transition-colors group"
                  >
                    <div className={`w-11 h-11 ${card.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      {card.icon}
                    </div>
                    <h5 className="font-bold text-[13px] text-white mb-0.5">{card.title}</h5>
                    <p className="text-[11px] text-slate-500">{card.sub}</p>
                  </motion.div>
                ))}
              </div>
              
              {/* Bottom Banner */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                className="p-5 bg-gradient-to-r from-brand-emerald/15 to-brand-emerald/5 rounded-2xl border border-brand-emerald/15 flex items-center gap-4"
              >
                <div className="w-11 h-11 bg-brand-emerald rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-emerald/25">
                  <ShieldCheck size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-white">Verified Secure Platform</p>
                  <p className="text-[11px] text-brand-emerald">Certified by Global Security Standards</p>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-1.5 h-1.5 bg-brand-emerald rounded-full animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Floating orb decorations */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-brand-emerald/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />
          </motion.div>
        </div>
      </Container>
    </section>
  );
};
