import { LegalPageShell } from '@/components/legal/LegalPageShell';

const sections = [
  {
    title: '1. What information we collect',
    body:
      'We collect information you provide when creating an account, joining a savings circle, making payments, or contacting support. This may include your full name, email address, phone number, date of birth, government-issued identification details, address, payment details, transaction history, device information, and usage data necessary to operate the service.',
  },
  {
    title: '2. How we use your information',
    body:
      'We use your information to create and maintain your account, verify your identity, process transactions, send notifications, improve the platform, prevent fraud, comply with legal obligations, and provide customer support. We may also use your information to personalize your experience and communicate important service updates.',
  },
  {
    title: '3. How we share information',
    body:
      'We may share your information with trusted service providers that help us operate the platform, including payment processors, identity verification providers, analytics vendors, cloud hosting providers, and customer support tools. We may also disclose information when required by law, court order, regulatory request, or to protect the rights, safety, or security of our users.',
  },
  {
    title: '4. Security of your information',
    body:
      'We use administrative, technical, and physical safeguards designed to protect your information from unauthorised access, loss, or misuse. However, no digital system can be guaranteed to be completely secure, and you should also protect your login credentials and devices.',
  },
  {
    title: '5. Cookies and analytics',
    body:
      'AjoFlow may use cookies, device identifiers, and analytics tools to understand how users interact with the platform, diagnose issues, and improve performance. You can generally disable cookies through your browser settings, although some features may not work as expected if cookies are disabled.',
  },
  {
    title: '6. Your choices and rights',
    body:
      'Depending on applicable law, you may be able to review, update, correct, or request deletion of some personal information. You may also opt out of non-essential marketing messages and manage notification preferences from your account settings or by contacting support.',
  },
  {
    title: '7. Retention',
    body:
      'We retain your personal information for as long as necessary to provide the service, comply with legal and regulatory obligations, resolve disputes, enforce agreements, and support legitimate business purposes. When data is no longer needed, we will delete or anonymise it where appropriate.',
  },
  {
    title: '8. International transfers and children',
    body:
      'Some of our service providers may process information outside Nigeria. We take reasonable steps to ensure that personal data is handled securely and in line with applicable laws. Our services are not intended for children under the age of 18, and we do not knowingly collect personal information from children without appropriate consent or legal basis.',
  },
  {
    title: '9. Updates to this policy',
    body:
      'We may update this Privacy Policy from time to time to reflect changes in the service, legal requirements, or operational practices. When material changes are made, we will notify you through the platform or by other appropriate means before the changes take effect.',
  },
];

export default function PrivacyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      intro="This Privacy Policy explains how AjoFlow collects, uses, stores, and protects your personal information when you use our platform. We are committed to being transparent about our practices and handling your information responsibly."
      lastUpdated="9 July 2026"
    >
      {sections.map((section) => (
        <section key={section.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-brand-navy">{section.title}</h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">{section.body}</p>
        </section>
      ))}

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-base font-semibold text-brand-navy">Contact us</h3>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          For privacy-related requests or questions, contact our support team through the app or the official support channel displayed in your account dashboard.
        </p>
      </section>
    </LegalPageShell>
  );
}
