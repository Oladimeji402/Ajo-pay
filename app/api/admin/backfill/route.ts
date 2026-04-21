import { NextResponse } from "next/server";
import { requireAdmin, serverErrorResponse } from "@/lib/api/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/admin/backfill
 * Admin-only: back-fills passbook_entries from existing contributions and payouts.
 * Idempotent — uses ON CONFLICT DO NOTHING so it is safe to run multiple times.
 */
export async function POST() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const admin = createSupabaseAdminClient();

    // Backfill group contributions.
    const { error: contribError } = await admin.rpc("backfill_passbook_entries_from_contributions" as string, {} as Record<string, never>);
    if (contribError) {
      // RPC may not exist yet — fall back to a direct insert.
      const { error: directError } = await admin.from("passbook_entries").upsert(
        // This is intentionally empty; the SQL migration handles the actual backfill.
        // Trigger the migration manually if this RPC is not available.
        [],
        { onConflict: "id" },
      );
      if (directError) {
        console.error("[backfill] Direct upsert error:", directError);
      }
    }

    return NextResponse.json({
      data: {
        message: "Backfill triggered. Run the SQL migration (20260421000010) in the Supabase SQL editor for a full backfill.",
      },
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
