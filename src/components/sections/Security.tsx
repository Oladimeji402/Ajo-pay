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
                { title: 'Bank-Level Security', desc: 'Your funds are held with licensed financial institutions to the highest safety standards.', icon: <ShieldCheck size={18} /> },
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
                  <p className="text-[11px] text-brand-emerald">Bank-grade infrastructure & 256-bit SSL</p>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-1.5 h-1.5 bg-brand-emerald rounded-full animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                  ))}
                </div>
              </motion.div>

              {/* Trust Badges */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.75 }}
                className="mt-4 flex items-center gap-3 flex-wrap"
              >
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Payments by</span>
                {/* Paystack badge */}
                <div className="flex items-center gap-1.5 bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2">
                  <svg width="18" height="18" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="32" height="32" rx="6" fill="#00C3F7" />
                    <path d="M7 11.5h18M7 16h14M7 20.5h10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                  <span className="text-[12px] font-bold text-white tracking-tight">Paystack</span>
                </div>
                {/* Visa badge */}
                <div className="flex items-center justify-center bg-white rounded-lg px-3 py-2 h-9">
                  <svg width="38" height="13" viewBox="0 0 38 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14.739 0.504L9.816 12.496H6.508L4.081 2.953C3.936 2.376 3.812 2.163 3.362 1.918C2.632 1.519 1.426 1.145 0.363 0.908L0.435 0.504H5.654C6.333 0.504 6.943 0.956 7.102 1.74L8.383 8.558L11.449 0.504H14.739ZM27.367 8.469C27.381 5.244 22.989 5.063 23.018 3.617C23.027 3.175 23.448 2.705 24.367 2.581C24.822 2.519 26.08 2.47 27.508 3.142L28.073 0.766C27.311 0.489 26.326 0.222 25.099 0.222C22.001 0.222 19.808 1.875 19.79 4.264C19.771 6.024 21.354 7.002 22.547 7.583C23.774 8.178 24.183 8.561 24.178 9.094C24.169 9.911 23.2 10.27 22.293 10.285C20.683 10.311 19.72 9.843 18.953 9.489L18.37 11.945C19.14 12.296 20.569 12.601 22.049 12.619C25.341 12.619 27.357 10.986 27.367 8.469ZM35.675 12.496H38.563L36.038 0.504H33.357C32.755 0.504 32.245 0.851 32.021 1.387L27.36 12.496H30.65L31.319 10.629H35.327L35.675 12.496ZM32.218 8.281L33.848 3.664L34.773 8.281H32.218ZM19.166 0.504L16.572 12.496H13.438L16.033 0.504H19.166Z" fill="#1434CB" />
                  </svg>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="24" height="24" rx="12" fill="#22c55e" fillOpacity="0.15" />
                    <path d="M7 12.5l3.5 3.5L17 9" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[10px] text-brand-emerald font-semibold">SSL Secured</span>
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
