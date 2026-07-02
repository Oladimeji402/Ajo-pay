/**
 * Check the status of all payouts in the system
 * 
 * Usage: npx tsx scripts/check-payout-status.ts
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, '../.env') });

import { createSupabaseAdminClient } from '../lib/supabase/admin';

async function checkPayoutStatus() {
  console.log('Checking payout status in the system...\n');
  
  const adminClient = createSupabaseAdminClient();

  // Fetch all payouts
  const { data: payouts, error: payoutsError } = await adminClient
    .from('payouts')
    .select('id, status, amount, created_at')
    .order('created_at', { ascending: false });

  if (payoutsError) {
    console.error('Error fetching payouts:', payoutsError);
    process.exit(1);
  }

  if (!payouts || payouts.length === 0) {
    console.log('No payouts found in the system.');
    process.exit(0);
  }

  console.log(`Found ${payouts.length} payout(s) in the system.\n`);

  // Group by status
  const statusGroups: Record<string, number> = {};
  for (const payout of payouts) {
    const status = payout.status || 'unknown';
    statusGroups[status] = (statusGroups[status] || 0) + 1;
  }

  console.log('=== Payout Status Summary ===');
  for (const [status, count] of Object.entries(statusGroups)) {
    console.log(`${status}: ${count}`);
  }

  console.log('\n=== All Payouts ===');
  for (const payout of payouts) {
    console.log(`ID: ${payout.id} | Status: ${payout.status} | Amount: ${payout.amount} | Created: ${payout.created_at}`);
  }

  // Check payment records for type: payout
  console.log('\n\n=== Payment Records (type: payout) ===');
  const { data: paymentRecords, error: recordsError } = await adminClient
    .from('payment_records')
    .select('id, amount, reference, created_at, metadata')
    .eq('type', 'payout')
    .order('created_at', { ascending: false });

  if (recordsError) {
    console.error('Error fetching payment records:', recordsError);
  } else if (!paymentRecords || paymentRecords.length === 0) {
    console.log('No payment records with type "payout" found.');
  } else {
    console.log(`Found ${paymentRecords.length} payment record(s) with type "payout".\n`);
    for (const record of paymentRecords) {
      console.log(`ID: ${record.id} | Amount: ${record.amount} | Reference: ${record.reference} | Created: ${record.created_at}`);
      console.log(`Metadata:`, JSON.stringify(record.metadata, null, 2));
    }
  }
}

checkPayoutStatus()
  .then(() => {
    console.log('\nCheck completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\nCheck failed:', err);
    process.exit(1);
  });
