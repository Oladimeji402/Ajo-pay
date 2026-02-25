import { Container } from '../ui/Container';
import { motion } from 'motion/react';
import { Star, Quote } from 'lucide-react';

export const SocialProof = () => {
  const testimonials = [
    {
      name: 'Olawale J.',
      role: 'Software Engineer',
      content: 'Ajopay has completely changed how I save. The automated contributions mean I never forget my turn, and the transparency is unmatched.',
      avatar: 'https://i.pravatar.cc/150?u=olawale'
    },
    {
      name: 'Chidinma E.',
      role: 'Business Owner',
      content: 'I was skeptical about digital Ajo at first, but Ajopay security and NDIC insurance gave me the peace of mind I needed. Highly recommended!',
      avatar: 'https://i.pravatar.cc/150?u=chidinma'
    },
    {
      name: 'Ibrahim K.',
      role: 'Civil Servant',
      content: 'The best part about Ajopay is the community. I joined a group of fellow techies and we have been saving consistently for over a year now.',
      avatar: 'https://i.pravatar.cc/150?u=ibrahim'
    }
  ];

  return (
    <section className="py-24 bg-white">
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-brand-primary font-bold text-sm uppercase tracking-widest mb-4">Testimonials</h2>
          <h3 className="text-4xl font-bold text-brand-navy mb-6 tracking-tight">
            Loved by thousands of <span className="text-brand-primary">happy savers.</span>
          </h3>
          <div className="flex items-center justify-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={20} className="fill-brand-emerald text-brand-emerald" />
            ))}
          </div>
          <p className="text-brand-gray font-bold">4.9/5 Rating on App Store & Play Store</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-[2.5rem] bg-brand-light border border-brand-border relative group hover:bg-white hover:shadow-2xl hover:shadow-brand-primary/5 transition-all duration-300"
            >
              <Quote className="absolute top-8 right-8 text-brand-primary/10 w-12 h-12" />
              <p className="text-brand-navy leading-relaxed mb-8 relative z-10">
                "{t.content}"
              </p>
              <div className="flex items-center gap-4">
                <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                <div>
                  <h4 className="font-bold text-brand-navy">{t.name}</h4>
                  <p className="text-xs text-brand-gray">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Partner Logos */}
        <div className="mt-24 pt-12 border-t border-brand-border">
          <p className="text-center text-xs font-bold text-brand-gray uppercase tracking-widest mb-10">Our Trusted Partners</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
            <span className="text-2xl font-black text-brand-navy">PAYSTACK</span>
            <span className="text-2xl font-black text-brand-navy">FLUTTERWAVE</span>
            <span className="text-2xl font-black text-brand-navy">NDIC</span>
            <span className="text-2xl font-black text-brand-navy">CBN</span>
            <span className="text-2xl font-black text-brand-navy">VISA</span>
          </div>
        </div>
      </Container>
    </section>
  );
};
