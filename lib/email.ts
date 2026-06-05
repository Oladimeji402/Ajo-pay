import { Resend } from 'resend';

// Initialize Resend with API key or undefined (will be checked before use)
const resend = new Resend(process.env.RESEND_API_KEY || undefined);

type EmailResult = {
  sent: boolean;
  skipped: boolean;
  reason?: string;
  emailId?: string;
};

function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendWelcomeEmail(
  userEmail: string,
  userName: string
): Promise<EmailResult> {
  if (!isEmailConfigured()) {
    return {
      sent: false,
      skipped: true,
      reason: 'Resend API key not configured',
    };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'AjoFlow <onboarding@ajopay.com>',
      to: userEmail,
      subject: '🎉 Welcome to AjoFlow - Your Savings Journey Starts Here!',
      html: getWelcomeEmailHtml(userName),
    });

    if (error) {
      console.error('Failed to send welcome email:', error);
      return {
        sent: false,
        skipped: false,
        reason: error.message,
      };
    }

    return {
      sent: true,
      skipped: false,
      emailId: data?.id,
    };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return {
      sent: false,
      skipped: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function getWelcomeEmailHtml(userName: string): string {
  const displayName = userName || 'there';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to AjoFlow</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px;">
          
          <!-- Logo/Brand -->
          <tr>
            <td style="padding: 0 0 32px 0;">
              <h1 style="margin: 0; color: #0f172a; font-size: 24px; font-weight: 700; letter-spacing: -0.01em;">
                AjoFlow
              </h1>
            </td>
          </tr>

          <!-- Main Message -->
          <tr>
            <td style="padding: 0 0 24px 0;">
              <p style="margin: 0; color: #0f172a; font-size: 16px; line-height: 1.5;">
                Hi ${displayName},
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 0 32px 0;">
              <p style="margin: 0 0 16px; color: #475569; font-size: 15px; line-height: 1.6;">
                Your AjoFlow account is ready. You can now activate your passbook, join savings plans, and start building your financial future.
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 0 40px 0;">
              <a href="https://ajoflow.com/dashboard" 
                 style="display: inline-block; background-color: #F59E0B; color: #0f172a; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                Get Started
              </a>
            </td>
          </tr>

          <!-- Simple Steps -->
          <tr>
            <td style="padding: 0 0 12px 0;">
              <p style="margin: 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                Quick Start
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 0 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 0 0 8px 0;">
                    <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.5;">
                      <span style="color: #0f172a; font-weight: 600;">1.</span> Activate your passbook
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 0 8px 0;">
                    <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.5;">
                      <span style="color: #0f172a; font-weight: 600;">2.</span> Join a savings plan
                    </p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.5;">
                      <span style="color: #0f172a; font-weight: 600;">3.</span> Start saving
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Help -->
          <tr>
            <td style="padding: 32px 0 0 0; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                Need help? Just reply to this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 0 0 0;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                AjoFlow · Community Savings
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
