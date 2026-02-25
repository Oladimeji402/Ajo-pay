import { Container } from '../ui/Container';
import { motion } from 'motion/react';
import { ShieldCheck, Lock, CheckCircle2, Eye } from 'lucide-react';

export const Security = () => {
  return (
    <section id="security" className="py-24 bg-brand-navy text-white overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <Container className="relative z-10">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-brand-emerald font-bold text-sm uppercase tracking-widest mb-4">Security First</h2>
            <h3 className="text-4xl lg:text-5xl font-bold mb-8 tracking-tight leading-tight">
              Your trust is our <span className="text-brand-emerald">greatest asset.</span>
            </h3>
            <p className="text-slate-400 text-lg mb-10 leading-relaxed">
              We take security seriously. Ajopay uses the same encryption standards as major global banks to ensure your money and data are always safe.
            </p>

            <div className="space-y-6">
              {[
                { title: 'NDIC Insured', desc: 'Your deposits are insured by the NDIC through our partner banks.' },
                { title: '256-bit Encryption', desc: 'All data transmitted is encrypted using the highest industry standards.' },
                { title: 'Fraud Protection', desc: 'Advanced AI-driven systems monitor every transaction for suspicious activity.' },
                { title: 'Verified Groups', desc: 'Every Ajo group undergoes a rigorous verification process before going live.' }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="mt-1 text-brand-emerald">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">{item.title}</h4>
                    <p className="text-sm text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-[2.5rem] p-8 lg:p-12">
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-brand-emerald/20 text-brand-emerald rounded-xl flex items-center justify-center mb-4">
                    <ShieldCheck size={24} />
                  </div>
                  <h5 className="font-bold text-sm mb-1">Secure Vault</h5>
                  <p className="text-[10px] text-slate-400">Isolated storage</p>
                </div>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-brand-primary/20 text-brand-soft-blue rounded-xl flex items-center justify-center mb-4">
                    <Lock size={24} />
                  </div>
                  <h5 className="font-bold text-sm mb-1">SSL Certified</h5>
                  <p className="text-[10px] text-slate-400">Encrypted traffic</p>
                </div>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-brand-primary/20 text-brand-soft-blue rounded-xl flex items-center justify-center mb-4">
                    <Eye size={24} />
                  </div>
                  <h5 className="font-bold text-sm mb-1">Privacy First</h5>
                  <p className="text-[10px] text-slate-400">GDPR Compliant</p>
                </div>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-brand-emerald/20 text-brand-emerald rounded-xl flex items-center justify-center mb-4">
                    <ShieldCheck size={24} />
                  </div>
                  <h5 className="font-bold text-sm mb-1">2FA Ready</h5>
                  <p className="text-[10px] text-slate-400">Multi-factor auth</p>
                </div>
              </div>
              
              <div className="mt-8 p-6 bg-brand-emerald/10 rounded-2xl border border-brand-emerald/20 flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-emerald text-white rounded-full flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Verified Secure Platform</p>
                  <p className="text-[10px] text-brand-emerald">Certified by Global Security Standards</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
};
