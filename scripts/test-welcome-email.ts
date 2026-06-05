/**
 * Test script for welcome email
 * 
 * Usage:
 *   npx tsx scripts/test-welcome-email.ts <email> <name>
 * 
 * Example:
 *   npx tsx scripts/test-welcome-email.ts john@example.com "John Doe"
 */

import 'dotenv/config';
import { sendWelcomeEmail } from '../lib/email';

async function main() {
  const email = process.argv[2];
  const name = process.argv[3] || 'Test User';

  if (!email) {
    console.error('❌ Error: Email address is required');
    console.log('\nUsage:');
    console.log('  npx tsx scripts/test-welcome-email.ts <email> <name>');
    console.log('\nExample:');
    console.log('  npx tsx scripts/test-welcome-email.ts john@example.com "John Doe"');
    process.exit(1);
  }

  console.log('📧 Testing welcome email...');
  console.log(`   To: ${email}`);
  console.log(`   Name: ${name}`);
  console.log('');

  try {
    const result = await sendWelcomeEmail(email, name);

    if (result.sent) {
      console.log('✅ Welcome email sent successfully!');
      console.log(`   Email ID: ${result.emailId}`);
      console.log('');
      console.log('Check your inbox (and spam folder) for the welcome email.');
    } else if (result.skipped) {
      console.log('⚠️  Email sending skipped');
      console.log(`   Reason: ${result.reason}`);
      console.log('');
      console.log('Make sure you have set RESEND_API_KEY in your .env file.');
    } else {
      console.log('❌ Failed to send email');
      console.log(`   Reason: ${result.reason}`);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
