import { NextResponse } from "next/server";
import { requireAdmin, serverErrorResponse } from "@/lib/api/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/savings-overview
 * 
 * Returns a comprehensive overview of all savings plans, users, and wallet balances
 */
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const adminClient = createSupabaseAdminClient();

    // 1. Get all active savings schemes
    const { data: schemes, error: schemesError } = await adminClient
      .from('savings_schemes')
      .select('id, name, frequency, minimum_amount, user_id, status')
      .neq('status', 'cancelled')
      .order('name', { ascending: true });

    if (schemesError) {
      return NextResponse.json({ error: schemesError.message }, { status: 400 });
    }

    // 2. Get all savings payments (deposits)
    const { data: savingsPayments, error: paymentsError } = await adminClient
      .from('payment_records')
      .select('user_id, amount, metadata')
      .in('type', ['individual_savings', 'bulk_contribution'])
      .eq('status', 'success');

    if (paymentsError) {
      return NextResponse.json({ error: paymentsError.message }, { status: 400 });
    }

    // 3. Get all payouts
    const { data: payouts, error: payoutsError } = await adminClient
      .from('passbook_payouts')
      .select('user_id, scheme_id, amount');

    if (payoutsError) {
      return NextResponse.json({ error: payoutsError.message }, { status: 400 });
    }

    // 4. Get all user profiles with wallet balances
    const { data: profiles, error: profilesError } = await adminClient
      .from('profiles')
      .select('id, name, email, wallet_balance');

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 400 });
    }

    // Build maps for quick lookup
    const schemeMap = new Map(schemes?.map(s => [s.id, s]) || []);
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Calculate savings per user per scheme
    type UserSchemeBalance = {
      user_id: string;
      scheme_id: string;
      total_saved: number;
      total_paid_out: number;
      current_balance: number;
    };

    const userSchemeBalances = new Map<string, UserSchemeBalance>(); // key: "userId-schemeId"

    // Process savings payments
    for (const payment of savingsPayments || []) {
      const schemeId = payment.metadata?.scheme_id || payment.metadata?.schemeId;
      if (!schemeId) continue;

      const key = `${payment.user_id}-${schemeId}`;
      const existing = userSchemeBalances.get(key);

      if (existing) {
        existing.total_saved += Number(payment.amount);
        existing.current_balance += Number(payment.amount);
      } else {
        userSchemeBalances.set(key, {
          user_id: payment.user_id,
          scheme_id: schemeId,
          total_saved: Number(payment.amount),
          total_paid_out: 0,
          current_balance: Number(payment.amount),
        });
      }
    }

    // Process payouts
    for (const payout of payouts || []) {
      const key = `${payout.user_id}-${payout.scheme_id}`;
      const existing = userSchemeBalances.get(key);

      if (existing) {
        existing.total_paid_out += Number(payout.amount);
        existing.current_balance -= Number(payout.amount);
      } else {
        // Payout without savings? This shouldn't happen but let's handle it
        userSchemeBalances.set(key, {
          user_id: payout.user_id,
          scheme_id: payout.scheme_id,
          total_saved: 0,
          total_paid_out: Number(payout.amount),
          current_balance: -Number(payout.amount),
        });
      }
    }

    // Group by scheme
    const planDataMap = new Map<string, {
      plan_id: string;
      plan_name: string;
      frequency: string;
      minimum_amount: number;
      total_users: number;
      total_saved: number;
      total_paid_out: number;
      current_balance: number;
      users: Array<{
        user_id: string;
        user_name: string;
        user_email: string;
        total_saved: number;
        total_paid_out: number;
        current_balance: number;
      }>;
    }>();

    for (const [key, balance] of userSchemeBalances.entries()) {
      const scheme = schemeMap.get(balance.scheme_id);
      if (!scheme) continue;

      const profile = profileMap.get(balance.user_id);
      if (!profile) continue;

      let planData = planDataMap.get(scheme.id);
      if (!planData) {
        planData = {
          plan_id: scheme.id,
          plan_name: scheme.name,
          frequency: scheme.frequency,
          minimum_amount: scheme.minimum_amount,
          total_users: 0,
          total_saved: 0,
          total_paid_out: 0,
          current_balance: 0,
          users: [],
        };
        planDataMap.set(scheme.id, planData);
      }

      planData.total_users += 1;
      planData.total_saved += balance.total_saved;
      planData.total_paid_out += balance.total_paid_out;
      planData.current_balance += balance.current_balance;

      planData.users.push({
        user_id: profile.id,
        user_name: profile.name || 'Unknown',
        user_email: profile.email || 'No email',
        total_saved: balance.total_saved,
        total_paid_out: balance.total_paid_out,
        current_balance: balance.current_balance,
      });
    }

    // Calculate totals
    const savingsPlans = Array.from(planDataMap.values())
      .sort((a, b) => b.current_balance - a.current_balance); // Sort by current balance descending

    const totalInSavings = savingsPlans.reduce((sum, plan) => sum + plan.current_balance, 0);
    const totalPaidOut = savingsPlans.reduce((sum, plan) => sum + plan.total_paid_out, 0);
    
    // Total wallet balance across all users
    const totalWalletBalance = profiles?.reduce((sum, p) => sum + Number(p.wallet_balance || 0), 0) || 0;
    
    // Count unique users with savings
    const uniqueUsers = new Set(Array.from(userSchemeBalances.values()).map(b => b.user_id));
    const totalUsers = profiles?.length || 0;

    return NextResponse.json({
      data: {
        savingsPlans,
        totalWalletBalance,
        totalInSavings,
        totalPaidOut,
        totalUsers,
      },
    });

  } catch (error) {
    console.error('[savings-overview] Unexpected error:', error);
    return serverErrorResponse(error);
  }
}
