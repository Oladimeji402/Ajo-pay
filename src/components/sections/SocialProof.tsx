import { Container } from '../ui/Container';
import { motion } from 'motion/react';
import { Star, Quote } from 'lucide-react';

export const SocialProof = () => {
  const testimonials = [
    {
      name: 'Olawale J.',
      role: 'Software Engineer, Lagos',
      content: 'Ajopay has completely changed how I save. The automated contributions mean I never forget my turn, and the transparency is unmatched.',
      avatar: 'https://i.pravatar.cc/150?u=olawale',
      rating: 5,
      accent: 'from-brand-primary/10 to-blue-50',
    },
    {
      name: 'Chidinma E.',
      role: 'Business Owner, Abuja',
      content: 'I was skeptical about digital Ajo at first, but Ajopay\'s security and NDIC insurance gave me the peace of mind I needed. Highly recommended!',
      avatar: 'https://i.pravatar.cc/150?u=chidinma',
      rating: 5,
      accent: 'from-brand-emerald/10 to-emerald-50',
    },
    {
      name: 'Ibrahim K.',
      role: 'Civil Servant, Kano',
      content: 'The best part about Ajopay is the community. I joined a group of fellow professionals and we\'ve been saving consistently for over a year now.',
      avatar: 'https://i.pravatar.cc/150?u=ibrahim',
      rating: 5,
      accent: 'from-purple-500/10 to-purple-50',
    },
  ];

  return (
    <section id="testimonials" className="py-24 lg:py-32 bg-white relative overflow-hidden">
      {/* BG */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-brand-primary/[0.02] rounded-full blur-[100px] pointer-events-none" />

      <Container className="relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/[0.08] border border-amber-500/15 mb-5">
              <Star size={12} className="text-amber-500 fill-amber-500" />
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-[0.1em]">Testimonials</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold text-brand-navy mb-4 tracking-tight">
              Loved by{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">thousands of savers</span>
            </h3>

            {/* Rating */}
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <div className="h-4 w-px bg-slate-200" />
              <span className="text-[13px] font-bold text-brand-navy">4.9/5</span>
              <span className="text-[13px] text-brand-gray">on App Store & Play Store</span>
            </div>
          </motion.div>
        </div>

        {/* Testimonial Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative group"
            >
              <div className={`rounded-2xl border border-slate-100 bg-gradient-to-b ${t.accent} p-7 h-full flex flex-col hover:shadow-xl hover:shadow-slate-900/[0.06] hover:-translate-y-1 transition-all duration-300`}>
                {/* Quote icon */}
                <div className="mb-5">
                  <Quote size={24} className="text-brand-primary/20" />
                </div>

                {/* Content */}
                <p className="text-[14px] text-brand-navy leading-relaxed mb-6 flex-1">
                  "{t.content}"
                </p>

                {/* Stars */}
                <div className="flex items-center gap-0.5 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100/80">
                  <img 
                    src={t.avatar} 
                    alt={t.name} 
                    className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" 
                  />
                  <div>
                    <h4 className="text-[13px] font-bold text-brand-navy">{t.name}</h4>
                    <p className="text-[11px] text-brand-gray">{t.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Partners */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <p className="text-center text-[11px] font-bold text-brand-gray/60 uppercase tracking-[0.15em] mb-8">Our Trusted Partners</p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6">
            {['PAYSTACK', 'FLUTTERWAVE', 'NDIC', 'CBN', 'VISA'].map((partner) => (
              <span
                key={partner}
                className="text-xl font-black text-brand-navy/15 hover:text-brand-navy/30 transition-colors duration-300 cursor-default"
              >
                {partner}
              </span>
            ))}
          </div>
        </motion.div>
      </Container>
    </section>
  );
};
