"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  Settlement,
  SettlementSummary,
  LiquidityStatus,
  RecordSettlementParams,
  CompleteSettlementParams,
} from "@/lib/types/settlement";

// ============================================================================
// AUTHORIZATION HELPERS
// ============================================================================

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { error: "Unauthorized", user: null, supabase: null };
  }
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  
  if (profile?.role !== "admin") {
    return { error: "Admin access required", user: null, supabase: null };
  }
  
  return { error: null, user, supabase };
}

// ============================================================================
// SETTLEMENT QUERIES
// ============================================================================

/**
 * Get all settlements with optional filtering
 */
export async function getSettlements(params?: {
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<{ data: Settlement[] | null; error: string | null }> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { data: null, error: auth.error };
  }
  
  let query = auth.supabase
    .from("settlements")
    .select("*")
    .order("settlement_date", { ascending: false });
  
  if (params?.status) {
    query = query.eq("status", params.status);
  }
  
  if (params?.startDate) {
    query = query.gte("settlement_date", params.startDate);
  }
  
  if (params?.endDate) {
    query = query.lte("settlement_date", params.endDate);
  }
  
  if (params?.limit) {
    query = query.limit(params.limit);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error("[getSettlements] Error:", error);
    return { data: null, error: error.message };
  }
  
  return { data: data as Settlement[], error: null };
}

/**
 * Get a single settlement by ID
 */
export async function getSettlement(
  settlementId: string
): Promise<{ data: Settlement | null; error: string | null }> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { data: null, error: auth.error };
  }
  
  const { data, error } = await auth.supabase
    .from("settlements")
    .select("*")
    .eq("id", settlementId)
    .single();
  
  if (error) {
    console.error("[getSettlement] Error:", error);
    return { data: null, error: error.message };
  }
  
  return { data: data as Settlement, error: null };
}

/**
 * Get settlement summary and liquidity status
 */
export async function getSettlementSummary(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<{ data: SettlementSummary | null; error: string | null }> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { data: null, error: auth.error };
  }
  
  const { data, error } = await auth.supabase.rpc("get_settlement_summary", {
    p_start_date: params?.startDate || null,
    p_end_date: params?.endDate || null,
  });
  
  if (error) {
    console.error("[getSettlementSummary] Error:", error);
    return { data: null, error: error.message };
  }
  
  return { data: data as SettlementSummary, error: null };
}

/**
 * Get current liquidity status
 */
export async function getLiquidityStatus(): Promise<{
  data: LiquidityStatus | null;
  error: string | null;
}> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { data: null, error: auth.error };
  }
  
  const { data, error } = await auth.supabase.rpc("calculate_available_balance");
  
  if (error) {
    console.error("[getLiquidityStatus] Error:", error);
    return { data: null, error: error.message };
  }
  
  return { data: data as LiquidityStatus, error: null };
}

// ============================================================================
// SETTLEMENT MUTATIONS
// ============================================================================

/**
 * Record a new settlement from MoniCredit
 */
export async function recordSettlement(
  params: RecordSettlementParams
): Promise<{ success: boolean; error: string | null; settlementId?: string }> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { success: false, error: auth.error };
  }
  
  // Validate amount
  if (params.amount <= 0) {
    return { success: false, error: "Amount must be greater than 0" };
  }
  
  // Validate reference
  if (!params.settlement_reference?.trim()) {
    return { success: false, error: "Settlement reference is required" };
  }
  
  const supabaseAdmin = createSupabaseAdminClient();
  
  const { data, error } = await supabaseAdmin.rpc("record_settlement", {
    p_settlement_reference: params.settlement_reference,
    p_amount: params.amount,
    p_settlement_date: params.settlement_date,
    p_bank_account_number: params.bank_account_number || null,
    p_bank_account_name: params.bank_account_name || null,
    p_bank_name: params.bank_name || null,
    p_monicredit_batch_id: params.monicredit_batch_id || null,
    p_metadata: params.metadata || {},
    p_notes: params.notes || null,
  });
  
  if (error) {
    console.error("[recordSettlement] Error:", error);
    return { success: false, error: error.message };
  }
  
  const result = data as { ok: boolean; code: string; settlement_id?: string; message?: string };
  
  if (!result.ok) {
    return { success: false, error: result.message || result.code };
  }
  
  return { success: true, error: null, settlementId: result.settlement_id };
}

/**
 * Mark a settlement as completed (money received)
 */
export async function completeSettlement(
  params: CompleteSettlementParams
): Promise<{ success: boolean; error: string | null }> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase || !auth.user) {
    return { success: false, error: auth.error };
  }
  
  const supabaseAdmin = createSupabaseAdminClient();
  
  const { data, error } = await supabaseAdmin.rpc("complete_settlement", {
    p_settlement_id: params.settlement_id,
    p_admin_user_id: auth.user.id,
  });
  
  if (error) {
    console.error("[completeSettlement] Error:", error);
    return { success: false, error: error.message };
  }
  
  const result = data as { ok: boolean; code: string; message?: string };
  
  if (!result.ok) {
    return { success: false, error: result.message || result.code };
  }
  
  return { success: true, error: null };
}

/**
 * Update settlement status manually
 */
export async function updateSettlementStatus(
  settlementId: string,
  status: "pending" | "completed" | "failed" | "reversed",
  notes?: string
): Promise<{ success: boolean; error: string | null }> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { success: false, error: auth.error };
  }
  
  const supabaseAdmin = createSupabaseAdminClient();
  
  const updateData: {
    status: string;
    notes?: string;
    reconciled?: boolean;
    reconciled_at?: string;
    reconciled_by?: string;
  } = { status };
  
  if (notes) {
    updateData.notes = notes;
  }
  
  if (status === "completed") {
    updateData.reconciled = true;
    updateData.reconciled_at = new Date().toISOString();
    updateData.reconciled_by = auth.user?.id;
  }
  
  const { error } = await supabaseAdmin
    .from("settlements")
    .update(updateData)
    .eq("id", settlementId);
  
  if (error) {
    console.error("[updateSettlementStatus] Error:", error);
    return { success: false, error: error.message };
  }
  
  return { success: true, error: null };
}

/**
 * Delete a settlement (only if pending)
 */
export async function deleteSettlement(
  settlementId: string
): Promise<{ success: boolean; error: string | null }> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supabase) {
    return { success: false, error: auth.error };
  }
  
  const supabaseAdmin = createSupabaseAdminClient();
  
  // Check if settlement is pending
  const { data: settlement } = await supabaseAdmin
    .from("settlements")
    .select("status")
    .eq("id", settlementId)
    .single();
  
  if (!settlement) {
    return { success: false, error: "Settlement not found" };
  }
  
  if (settlement.status !== "pending") {
    return { success: false, error: "Can only delete pending settlements" };
  }
  
  const { error } = await supabaseAdmin
    .from("settlements")
    .delete()
    .eq("id", settlementId);
  
  if (error) {
    console.error("[deleteSettlement] Error:", error);
    return { success: false, error: error.message };
  }
  
  return { success: true, error: null };
}
