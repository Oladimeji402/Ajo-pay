import { Mail, MessageSquareMore, ShieldCheck, Clock3 } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const supportCards = [
  {
    title: 'Account help',
    copy: 'Issues with login, onboarding, bank verification, or profile updates.',
    icon: Mail,
  },
  {
    title: 'Payment support',
    copy: 'Questions about contribution status, pending verification, or unexpected payment results.',
    icon: MessageSquareMore,
  },
  {
    title: 'Trust and safety',
    copy: 'Report suspicious activity, payout concerns, or account misuse.',
    icon: ShieldCheck,
  },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 pt-28 pb-16 px-4">
        <div className="mx-auto max-w-5xl space-y-8">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">Support</p>
            <h1 className="mt-2 text-3xl font-bold text-brand-navy">We’re here when something needs attention</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-brand-gray">
              Use this page as the main support touchpoint for membership questions, payment follow-up, and trust issues.
              You can adapt the contact details below to your team’s real support channels before launch.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <Clock3 size={14} />
              Typical response target: within 1 business day
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {supportCards.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-brand-primary">
                    <Icon size={20} />
                  </div>
                  <h2 className="text-lg font-semibold text-brand-navy">{card.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-brand-gray">{card.copy}</p>
                </article>
              );
            })}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold text-brand-navy">Contact details</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-brand-gray">Email</p>
                <p className="mt-2 text-sm font-semibold text-brand-navy">support@ajopay.com</p>
                <p className="mt-2 text-sm text-brand-gray">Use email for payment investigations, account corrections, and support follow-up.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-brand-gray">Working hours</p>
                <p className="mt-2 text-sm font-semibold text-brand-navy">Monday to Friday, 9:00 AM to 5:00 PM</p>
                <p className="mt-2 text-sm text-brand-gray">Adjust these hours to your actual support operations before production launch.</p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
