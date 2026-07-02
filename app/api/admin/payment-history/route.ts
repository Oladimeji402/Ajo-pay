import { NextResponse } from "next/server";
import { requireAdmin, serverErrorResponse } from "@/lib/api/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/payment-history
 * 
 * Returns all completed payouts (users who have been paid)
 */
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const adminClient = createSupabaseAdminClient();

    // Get all payment records with type 'payout' and status 'success'
    const { data: paymentRecords, error: recordsError } = await adminClient
      .from('payment_records')
      .select('id, user_id, group_id, amount, reference, created_at, metadata, profiles:user_id(id, name, email, phone, bank_account, bank_name), groups:group_id(id, name)')
      .eq('type', 'payout')
      .eq('status', 'success')
      .order('created_at', { ascending: false });

    if (recordsError) {
      return NextResponse.json({ error: recordsError.message }, { status: 400 });
    }

    // Also get passbook payouts for a complete view
    const { data: passbookPayouts, error: payoutsError } = await adminClient
      .from('passbook_payouts')
      .select('id, user_id, scheme_id, amount, period_label, paid_at, created_at, profiles:user_id(id, name, email, phone, bank_account, bank_name), schemes:scheme_id(id, name)')
      .order('created_at', { ascending: false });

    if (payoutsError) {
      return NextResponse.json({ error: payoutsError.message }, { status: 400 });
    }

    // Combine and format the data
    const paymentHistory = (paymentRecords || []).map(record => ({
      id: record.id,
      type: record.metadata?.payout_type || (record.group_id ? 'group_payout' : 'savings_withdrawal'),
      user: {
        id: record.profiles?.id || record.user_id,
        name: record.profiles?.name || 'Unknown',
        email: record.profiles?.email || 'No email',
        phone: record.profiles?.phone || null,
        bank_account: record.profiles?.bank_account || null,
        bank_name: record.profiles?.bank_name || null,
      },
      group_or_scheme: record.groups?.name || record.metadata?.scheme_id || 'General Savings',
      amount: record.amount,
      reference: record.reference,
      period: record.metadata?.period_label || record.metadata?.cycle_number || null,
      paid_at: record.created_at,
      notes: record.metadata?.notes || null,
    }));

    // Get totals
    const totalPaidOut = paymentHistory.reduce((sum, p) => sum + Number(p.amount), 0);
    const uniqueUsers = new Set(paymentHistory.map(p => p.user.id)).size;
    const savingsPayouts = paymentHistory.filter(p => p.type === 'savings_withdrawal').length;
    const groupPayouts = paymentHistory.filter(p => p.type === 'group_payout').length;

    return NextResponse.json({
      data: {
        payments: paymentHistory,
        summary: {
          totalPaidOut,
          totalPayments: paymentHistory.length,
          uniqueUsers,
          savingsPayouts,
          groupPayouts,
        },
      },
    });

  } catch (error) {
    console.error('[payment-history] Unexpected error:', error);
    return serverErrorResponse(error);
  }
}
