import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recordSettlement } from "@/lib/actions/settlement.actions";

/**
 * GET /api/admin/settlements
 * Get all settlements with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    
    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = searchParams.get("limit");
    
    let query = supabase
      .from("settlements")
      .select("*")
      .order("settlement_date", { ascending: false });
    
    if (status) {
      query = query.eq("status", status);
    }
    
    if (startDate) {
      query = query.gte("settlement_date", startDate);
    }
    
    if (endDate) {
      query = query.lte("settlement_date", endDate);
    }
    
    if (limit) {
      query = query.limit(parseInt(limit, 10));
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("[GET /api/admin/settlements] Error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[GET /api/admin/settlements] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settlements
 * Record a new settlement
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    
    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    
    const {
      settlement_reference,
      amount,
      settlement_date,
      bank_account_number,
      bank_account_name,
      bank_name,
      monicredit_batch_id,
      metadata,
      notes,
    } = body;
    
    if (!settlement_reference || !amount || !settlement_date) {
      return NextResponse.json(
        { error: "Missing required fields: settlement_reference, amount, settlement_date" },
        { status: 400 }
      );
    }
    
    const result = await recordSettlement({
      settlement_reference,
      amount: Math.round(Number(amount)),
      settlement_date,
      bank_account_number,
      bank_account_name,
      bank_name,
      monicredit_batch_id,
      metadata: metadata || {},
      notes,
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      settlementId: result.settlementId,
    });
  } catch (error) {
    console.error("[POST /api/admin/settlements] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
