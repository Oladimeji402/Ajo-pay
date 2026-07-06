import { Resend } from 'resend';

// Initialize Resend with API key from environment
const resend = process.env.RESEND_API_KEY 
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

export async function sendEmail({
    to,
    subject,
    body,
    from = 'Ajo Pay <noreply@ajopay.com>',
}: {
    to: string;
    subject: string;
    body: string;
    from?: string;
}) {
    if (!resend) {
        console.warn('Resend not configured. Email not sent.');
        return { success: false, error: 'Email service not configured' };
    }

    try {
        const { data, error } = await resend.emails.send({
            from,
            to,
            subject,
            html: body.replace(/\n/g, '<br>'), // Convert line breaks to HTML
        });

        if (error) {
            console.error('Resend error:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Email sending error:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
        };
    }
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(email: string, name: string) {
    if (!resend) {
        console.warn('Resend not configured. Welcome email skipped.');
        return { 
            sent: false, 
            skipped: true, 
            reason: 'Email service not configured' 
        };
    }

    const userName = name || 'there';
    const subject = 'Welcome to Ajo Pay! 🎉';
    const body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1e3a8a;">Welcome to Ajo Pay, ${userName}!</h1>
            <p style="font-size: 16px; line-height: 1.6;">
                We're excited to have you join our community savings platform. 
                Ajo Pay makes it easy to save with friends, family, and trusted groups.
            </p>
            <h2 style="color: #1e3a8a; margin-top: 30px;">Getting Started</h2>
            <ul style="font-size: 16px; line-height: 1.8;">
                <li>Activate your Passbook to unlock personal savings features</li>
                <li>Join or create savings groups with your community</li>
                <li>Set up festive goals for Detty December, Sallah, and more</li>
                <li>Track all your contributions in one place</li>
            </ul>
            <div style="margin: 40px 0; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://ajopay.com'}/dashboard" 
                   style="background-color: #1e3a8a; color: white; padding: 14px 28px; 
                          text-decoration: none; border-radius: 8px; font-weight: bold; 
                          display: inline-block;">
                    Go to Dashboard
                </a>
            </div>
            <p style="font-size: 14px; color: #64748b; margin-top: 40px;">
                Need help? Reply to this email or visit our support center.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            <p style="font-size: 12px; color: #94a3b8; text-align: center;">
                © ${new Date().getFullYear()} Ajo Pay. All rights reserved.
            </p>
        </div>
    `;

    try {
        const { data, error } = await resend.emails.send({
            from: 'Ajo Pay <onboarding@ajopay.com>',
            to: email,
            subject,
            html: body,
        });

        if (error) {
            console.error('Welcome email error:', error);
            return { 
                sent: false, 
                skipped: false, 
                reason: error.message 
            };
        }

        return { 
            sent: true, 
            skipped: false, 
            emailId: data?.id 
        };
    } catch (error) {
        console.error('Welcome email sending error:', error);
        return { 
            sent: false, 
            skipped: false, 
            reason: error instanceof Error ? error.message : 'Unknown error' 
        };
    }
}
