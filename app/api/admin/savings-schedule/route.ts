import { NextResponse } from "next/server";
import { requireAdmin, serverErrorResponse } from "@/lib/api/auth";

/** Next fixed payout date for each frequency. */
function nextPayoutDate(frequency: string): string {
  const now = new Date();
  const y = now.getFullYear();

  if (frequency === "daily") {
    // Last day of current month
    const last = new Date(y, now.getMonth() + 1, 0);
    return last.toISOString().slice(0, 10);
  }

  if (frequency === "weekly") {
    // Last day of current quarter
    const m = now.getMonth() + 1; // 1-12
    const qEnd = m <= 3 ? new Date(y, 2, 31)
      : m <= 6 ? new Date(y, 5, 30)
      : m <= 9 ? new Date(y, 8, 30)
      : new Date(y, 11, 31);
    return qEnd.toISOString().slice(0, 10);
  }

  // monthly → Dec 31
  return `${y}-12-31`;
}

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    // All non-cancelled schemes with user profile + bank details
    const { data: schemes, error } = await auth.supabase
      .from("savings_schemes")
      .select(`
        id,
        name,
        frequency,
        minimum_amount,
        status,
        created_at,
        profiles:user_id (
          id,
          name,
          email,
          phone,
          bank_account,
          bank_name,
          bank_account_name
        )
      `)
      .neq("status", "cancelled")
      .order("frequency", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

    const schemeIds = (schemes ?? []).map((s) => s.id);

    // Total deposits per scheme
    const { data: depositTotals } = await auth.supabase
      .from("savings_deposits")
      .select("scheme_id, amount")
      .in("scheme_id", schemeIds.length ? schemeIds : ["00000000-0000-0000-0000-000000000000"])
      .eq("status", "success");

    // Total payouts already recorded per scheme
    const { data: payoutTotals } = await auth.supabase
      .from("passbook_payouts")
      .select("scheme_id, amount")
      .in("scheme_id", schemeIds.length ? schemeIds : ["00000000-0000-0000-0000-000000000000"]);

    const depositByScheme = new Map<string, number>();
    for (const d of depositTotals ?? []) {
      depositByScheme.set(d.scheme_id, (depositByScheme.get(d.scheme_id) ?? 0) + Number(d.amount));
    }

    const payoutByScheme = new Map<string, number>();
    for (const p of payoutTotals ?? []) {
      payoutByScheme.set(p.scheme_id, (payoutByScheme.get(p.scheme_id) ?? 0) + Number(p.amount));
    }

    const rows = (schemes ?? []).map((s) => {
      const totalSaved   = depositByScheme.get(s.id) ?? 0;
      const totalPaidOut = payoutByScheme.get(s.id)  ?? 0;
      const amountOwed   = Math.max(0, totalSaved - totalPaidOut);
      return {
        scheme_id:      s.id,
        scheme_name:    s.name,
        frequency:      s.frequency,
        minimum_amount: Number(s.minimum_amount),
        status:         s.status,
        next_payout:    nextPayoutDate(s.frequency),
        total_saved:    totalSaved,
        total_paid_out: totalPaidOut,
        amount_owed:    amountOwed,
        profile:        s.profiles,
      };
    });

    return NextResponse.json({ data: rows });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
