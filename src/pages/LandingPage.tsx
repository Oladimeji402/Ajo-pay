import { Navbar } from '../components/layout/Navbar';
import { Hero } from '../components/sections/Hero';
import { HowItWorks } from '../components/sections/HowItWorks';
import { Features } from '../components/sections/Features';
import { Security } from '../components/sections/Security';
import { SocialProof } from '../components/sections/SocialProof';
import { CTA } from '../components/sections/CTA';
import { Footer } from '../components/layout/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col scroll-smooth">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <HowItWorks />
        <Features />
        <Security />
        <SocialProof />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
