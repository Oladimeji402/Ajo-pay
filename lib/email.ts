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
