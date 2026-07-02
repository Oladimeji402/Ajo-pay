import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Check payout and payment record status
 * Usage: GET /api/admin/check-payouts
 */
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const adminClient = createSupabaseAdminClient();

    // 1. Get all payouts with status breakdown
    const { data: payouts, error: payoutsError } = await adminClient
      .from('payouts')
      .select('id, status, amount, cycle_number, created_at, marked_done_at, groups:group_id(name)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (payoutsError) {
      return NextResponse.json({ error: payoutsError.message }, { status: 400 });
    }

    // 2. Get payment records with type: payout
    const { data: paymentRecords, error: recordsError } = await adminClient
      .from('payment_records')
      .select('id, amount, reference, created_at, metadata')
      .eq('type', 'payout')
      .order('created_at', { ascending: false })
      .limit(50);

    if (recordsError) {
      return NextResponse.json({ error: recordsError.message }, { status: 400 });
    }

    // 3. Count by status
    const statusCounts: Record<string, number> = {};
    for (const payout of payouts || []) {
      const status = payout.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    }

    return NextResponse.json({
      summary: {
        totalPayouts: payouts?.length || 0,
        statusBreakdown: statusCounts,
        paymentRecordsWithTypePayout: paymentRecords?.length || 0,
      },
      recentPayouts: payouts?.slice(0, 10).map(p => ({
        id: p.id,
        status: p.status,
        amount: p.amount,
        group: p.groups?.name || 'Unknown',
        cycle: p.cycle_number,
        created: p.created_at,
        markedDone: p.marked_done_at,
      })),
      recentPaymentRecords: paymentRecords?.slice(0, 10).map(r => ({
        id: r.id,
        amount: r.amount,
        reference: r.reference,
        created: r.created_at,
        payoutId: r.metadata?.payout_id || null,
      })),
    });

  } catch (error) {
    console.error('[check-payouts] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to check payouts' },
      { status: 500 }
    );
  }
}
