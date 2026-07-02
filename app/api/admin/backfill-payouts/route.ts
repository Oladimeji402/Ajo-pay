import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Backfill payment_records for historical passbook payouts
 * Usage: POST to /api/admin/backfill-payouts
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const adminClient = createSupabaseAdminClient();

    // 1. Fetch all passbook payouts (savings withdrawals)
    const { data: passbookPayouts, error: passbookError } = await adminClient
      .from('passbook_payouts')
      .select('*')
      .order('created_at', { ascending: true });

    if (passbookError) {
      return NextResponse.json({ error: passbookError.message }, { status: 400 });
    }

    // 2. Fetch all group payouts that are "done"
    const { data: groupPayouts, error: groupError } = await adminClient
      .from('payouts')
      .select('*')
      .eq('status', 'done')
      .order('created_at', { ascending: true });

    if (groupError) {
      return NextResponse.json({ error: groupError.message }, { status: 400 });
    }

    const totalToProcess = (passbookPayouts?.length || 0) + (groupPayouts?.length || 0);

    if (totalToProcess === 0) {
      return NextResponse.json({ 
        message: 'No payouts found. Nothing to backfill.',
        created: 0,
        skipped: 0,
        errors: 0,
      });
    }

    let createdCount = 0;
    let skippedCount = 0;
    const errors: Array<{ payoutId: string; type: string; error: string }> = [];

    // Process passbook payouts (savings withdrawals)
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
          errors.push({ payoutId: payout.id, type: 'passbook', error: insertError.message });
          continue;
        }

        createdCount++;
      } catch (err) {
        errors.push({ 
          payoutId: payout.id,
          type: 'passbook',
          error: err instanceof Error ? err.message : 'Unknown error' 
        });
      }
    }

    // Process group payouts
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
          errors.push({ payoutId: payout.id, type: 'group', error: insertError.message });
          continue;
        }

        createdCount++;
      } catch (err) {
        errors.push({ 
          payoutId: payout.id,
          type: 'group',
          error: err instanceof Error ? err.message : 'Unknown error' 
        });
      }
    }

    return NextResponse.json({
      message: 'Backfill completed',
      total: totalToProcess,
      created: createdCount,
      skipped: skippedCount,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('[backfill-payouts] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to backfill payouts' },
      { status: 500 }
    );
  }
}
