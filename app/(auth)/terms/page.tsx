import { LegalPageShell } from '@/components/legal/LegalPageShell';

const sections = [
  {
    title: '1. Acceptance of terms',
    body:
      'By creating an account or using AjoFlow, you confirm that you are at least 18 years old, are legally able to enter into a binding agreement, and agree to these Terms of Service. If you are using the service on behalf of a business or group, you represent that you have authority to bind that entity to these terms.',
  },
  {
    title: '2. About the service',
    body:
      'AjoFlow is a digital platform that helps users join savings circles, contribute funds, track payments, receive payouts, and manage group commitments. The service is intended for lawful personal and group savings activity and may include digital wallet features, payment verification, reminders, and account management tools.',
  },
  {
    title: '3. Your account responsibilities',
    body:
      'You must provide accurate information, maintain the security of your password and devices, and notify us immediately if you suspect unauthorised access. You are responsible for all activity under your account, including contributions made by you or anyone using your device or login credentials.',
  },
  {
    title: '4. Contributions, payouts and payments',
    body:
      'By joining a savings circle, you agree to make the scheduled contributions and comply with the rules of the circle and the platform. Payments may be processed through approved payment providers and are subject to the provider’s terms, fees, processing windows, and availability. AjoFlow is not liable for delays caused by banks, payment gateways, telecommunications failures, or third-party service interruptions.',
  },
  {
    title: '5. Prohibited conduct',
    body:
      'You may not use the service for fraud, money laundering, identity theft, abusive activity, harassment, spam, or any unlawful purpose. You may not attempt to reverse engineer, exploit, or interfere with the service’s security, integrity, or availability. We may suspend or terminate accounts that violate these terms or create risk for other users or the platform.',
  },
  {
    title: '6. Verification and compliance',
    body:
      'To help prevent fraud and comply with applicable laws, we may request identity verification, contact details, source-of-funds information, or other documents. Failure to complete verification may restrict access to certain features or result in account limitations.',
  },
  {
    title: '7. Privacy and data',
    body:
      'Your use of the service is also governed by our Privacy Policy. By using AjoFlow, you consent to the collection, use, storage, and disclosure of your information as described in that policy, including sharing information with service providers who assist us in operating the platform.',
  },
  {
    title: '8. Limitation of liability',
    body:
      'To the extent permitted by law, AjoFlow and its affiliates shall not be liable for indirect, incidental, punitive, or consequential damages, including loss of savings, business interruption, loss of data, or reputational harm arising from the use of the service. Our aggregate liability shall not exceed the fees paid to us, if any, for the particular service giving rise to the claim.',
  },
  {
    title: '9. Governing law and disputes',
    body:
      'These terms are governed by the laws of the Federal Republic of Nigeria. Any dispute arising from or relating to the service shall first be addressed through good-faith negotiation, and where necessary, through the competent courts of Nigeria.',
  },
];

export default function TermsPage() {
  return (
    <LegalPageShell
      title="Terms of Service"
      intro="These Terms of Service govern your use of AjoFlow and explain the rights, responsibilities, and expectations for both you and the platform. They are designed to be clear, practical, and aligned with standard fintech and digital services practices."
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
          If you have questions about these terms, please contact our support team through the app or the official support channel listed in your account dashboard.
        </p>
      </section>
    </LegalPageShell>
  );
}
