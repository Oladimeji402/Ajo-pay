import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 pt-28 pb-16 px-4">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">Privacy</p>
            <h1 className="mt-2 text-3xl font-bold text-brand-navy">Privacy Policy</h1>
            <p className="mt-3 text-sm leading-6 text-brand-gray">
              Ajopay handles account, payment, and savings-group data to operate the platform securely and
              support contribution and payout workflows.
            </p>
          </div>

          <div className="space-y-8 text-sm leading-7 text-slate-600">
            <section>
              <h2 className="text-lg font-semibold text-brand-navy">What we collect</h2>
              <p>We collect profile details, contact information, bank details, group activity, and payment references needed to run Ajopay.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-brand-navy">Why we use it</h2>
              <p>We use your data to authenticate your account, verify bank details, process contributions, coordinate payouts, prevent fraud, and support customer service.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-brand-navy">Payment providers and processors</h2>
              <p>Payments are processed through Paystack. Some reporting or operational data may also be synced to approved services such as Google Sheets for admin workflows.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-brand-navy">Your choices</h2>
              <p>You can update your profile and bank information from settings. If you need account help, data clarification, or support, contact us through the support page.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-brand-navy">Contact</h2>
              <p>
                Questions about privacy can be directed through{' '}
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
