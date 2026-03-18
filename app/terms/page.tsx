import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 pt-28 pb-16 px-4">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">Legal</p>
            <h1 className="mt-2 text-3xl font-bold text-brand-navy">Terms of Service</h1>
            <p className="mt-3 text-sm leading-6 text-brand-gray">
              These terms describe how Ajopay members and admins use the platform to join groups, make contributions,
              and manage payout-related account information.
            </p>
          </div>

          <div className="space-y-8 text-sm leading-7 text-slate-600">
            <section>
              <h2 className="text-lg font-semibold text-brand-navy">Account responsibility</h2>
              <p>You are responsible for accurate profile details, valid bank account information, and protecting access to your login credentials.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-brand-navy">Group participation</h2>
              <p>Joining a group means you agree to that group’s contribution amount, cycle order, and participation rules as presented in the product.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-brand-navy">Payments and payouts</h2>
              <p>Contribution processing depends on third-party payment providers. Ajopay may delay or restrict certain actions when payment verification, operational review, or compliance checks are still in progress.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-brand-navy">Acceptable use</h2>
              <p>Accounts may not be used for fraud, abuse, impersonation, or any activity that disrupts groups, payments, or platform operations.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-brand-navy">Support</h2>
              <p>
                If something looks wrong with your membership or payments, contact{' '}
                <Link href="/support" className="font-semibold text-brand-primary hover:text-brand-primary-hover">
                  Support
                </Link>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
