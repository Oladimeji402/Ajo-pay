import { NextResponse } from 'next/server';
import { requireUser, serverErrorResponse } from '@/lib/api/auth';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    // Get user profile to check if welcome email was already sent
    const { data: profile, error: profileError } = await auth.supabase
      .from('profiles')
      .select('id, name, email, welcome_email_sent')
      .eq('id', auth.user.id)
      .single();

    if (profileError) {
      return serverErrorResponse(profileError);
    }

    // Skip if welcome email was already sent
    if (profile.welcome_email_sent) {
      return NextResponse.json({ 
        success: true, 
        alreadySent: true,
        message: 'Welcome email was already sent' 
      });
    }

    // Send welcome email
    const result = await sendWelcomeEmail(
      profile.email || auth.user.email || '',
      profile.name || ''
    );

    // Mark welcome email as sent in the database
    if (result.sent) {
      await auth.supabase
        .from('profiles')
        .update({ welcome_email_sent: true })
        .eq('id', auth.user.id);

      // Also create a welcome notification in the app
      await auth.supabase.from('notifications').insert({
        user_id: auth.user.id,
        type: 'welcome',
        title: 'Welcome to AjoFlow! 🎉',
        body: 'Your account is ready. Start saving with your community today!',
        metadata: { email_sent: true, email_id: result.emailId },
      });
    }

    return NextResponse.json({ 
      success: result.sent,
      skipped: result.skipped,
      reason: result.reason,
      emailId: result.emailId
    });
  } catch (error) {
    console.error('Error in send-welcome-email:', error);
    return serverErrorResponse(error);
  }
}
