/**
 * Backfill payment_records for historical payouts
 * 
 * This script creates payment_records entries for all payouts
 * that don't yet have a corresponding payment record.
 * 
 * Usage: npx tsx scripts/backfill-payout-payment-records.ts
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, '../.env') });

import { createSupabaseAdminClient } from '../lib/supabase/admin';

async function backfillPayoutPaymentRecords() {
  console.log('Starting backfill of payout payment records...\n');
  
  const adminClient = createSupabaseAdminClient();

  // 1. Fetch all passbook payouts (savings withdrawals)
  const { data: passbookPayouts, error: passbookError } = await adminClient
    .from('passbook_payouts')
    .select('*')
    .order('created_at', { ascending: true });

  if (passbookError) {
    console.error('Error fetching passbook payouts:', passbookError);
    process.exit(1);
  }

  // 2. Fetch all group payouts that are "done"
  const { data: groupPayouts, error: groupError } = await adminClient
    .from('payouts')
    .select('*')
    .eq('status', 'done')
    .order('created_at', { ascending: true });

  if (groupError) {
    console.error('Error fetching group payouts:', groupError);
    process.exit(1);
  }

  const totalPayouts = (passbookPayouts?.length || 0) + (groupPayouts?.length || 0);

  if (totalPayouts === 0) {
    console.log('No payouts found. Nothing to backfill.');
    process.exit(0);
  }

  console.log(`Found ${passbookPayouts?.length || 0} passbook payout(s) and ${groupPayouts?.length || 0} group payout(s) to process.\n`);

  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // Process passbook payouts (savings withdrawals)
  console.log('Processing passbook payouts (savings withdrawals)...');
  for (const payout of passbookPayouts || []) {
    try {
      // Check if payment record already exists
      const { data: existingRecord } = await adminClient
        .from('payment_records')
        .select('id')
        .eq('type', 'payout')
        .contains('metadata', { passbook_payout_id: payout.id })
        .maybeSingle();

      if (existingRecord) {
        console.log(`⏭️  Passbook payout ${payout.id} already has payment record. Skipping.`);
        skippedCount++;
        continue;
      }

      // Create payment record
      const payoutReference = `SAVINGS-PAYOUT-${payout.id}-BACKFILL`;
      const { error: insertError } = await adminClient
        .from('payment_records')
        .insert({
          user_id: payout.user_id,
          provider: 'monicredit',
          type: 'payout',
          amount: payout.amount,
          currency: 'NGN',
          status: 'success',
          reference: payoutReference,
          created_at: payout.paid_at || payout.created_at,
          metadata: {
            passbook_payout_id: payout.id,
            scheme_id: payout.scheme_id,
            period_label: payout.period_label,
            recorded_by: payout.recorded_by,
            payout_type: 'savings_withdrawal',
            backfilled: true,
            backfilled_at: new Date().toISOString(),
          },
        });

      if (insertError) {
        console.error(`❌ Failed to create payment record for passbook payout ${payout.id}:`, insertError.message);
        console.error('   Full error:', insertError);
        errorCount++;
        continue;
      }

      console.log(`✅ Created payment record for passbook payout ${payout.id} (${payout.amount} NGN - ${payout.period_label})`);
      createdCount++;

    } catch (err) {
      console.error(`❌ Unexpected error processing passbook payout ${payout.id}:`, err);
      errorCount++;
    }
  }

  // Process group payouts
  console.log('\nProcessing group payouts...');
  for (const payout of groupPayouts || []) {
    try {
      // Check if payment record already exists
      const { data: existingRecord } = await adminClient
        .from('payment_records')
        .select('id')
        .eq('type', 'payout')
        .contains('metadata', { payout_id: payout.id })
        .maybeSingle();

      if (existingRecord) {
        console.log(`⏭️  Group payout ${payout.id} already has payment record. Skipping.`);
        skippedCount++;
        continue;
      }

      // Create payment record
      const payoutReference = `PAYOUT-${payout.id}-BACKFILL`;
      const { error: insertError } = await adminClient
        .from('payment_records')
        .insert({
          user_id: payout.user_id,
          group_id: payout.group_id,
          provider: 'monicredit',
          type: 'payout',
          amount: payout.amount,
          currency: 'NGN',
          status: 'success',
          reference: payoutReference,
          provider_reference: payout.proof_url || null,
          created_at: payout.marked_done_at || payout.updated_at,
          metadata: {
            payout_id: payout.id,
            cycle_number: payout.cycle_number,
            bank_account: payout.bank_account,
            bank_name: payout.bank_name,
            marked_done_by: payout.marked_done_by,
            marked_done_at: payout.marked_done_at,
            payout_type: 'group_payout',
            backfilled: true,
            backfilled_at: new Date().toISOString(),
          },
        });

      if (insertError) {
        console.error(`❌ Failed to create payment record for group payout ${payout.id}:`, insertError.message);
        console.error('   Full error:', insertError);
        errorCount++;
        continue;
      }

      console.log(`✅ Created payment record for group payout ${payout.id} (${payout.amount} NGN)`);
      createdCount++;

    } catch (err) {
      console.error(`❌ Unexpected error processing group payout ${payout.id}:`, err);
      errorCount++;
    }
  }

  console.log('\n=== Backfill Complete ===');
  console.log(`✅ Created: ${createdCount}`);
  console.log(`⏭️  Skipped: ${skippedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📊 Total processed: ${totalPayouts}`);
}

backfillPayoutPaymentRecords()
  .then(() => {
    console.log('\nBackfill script completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\nBackfill script failed:', err);
    process.exit(1);
  });
