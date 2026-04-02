import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const BUCKET_NAME = "payout-proofs";
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60; // 1 hour

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.error || !auth.user) {
    return auth.error ?? NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const payoutId = searchParams.get("payoutId")?.trim();

  if (!payoutId) {
    return NextResponse.json({ error: "payoutId is required." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  // Fetch the storage path stored in proof_url
  const { data: payout, error: payoutError } = await supabase
    .from("payouts")
    .select("proof_url")
    .eq("id", payoutId)
    .maybeSingle();

  if (payoutError || !payout) {
    return NextResponse.json({ error: "Payout not found." }, { status: 404 });
  }

  if (!payout.proof_url) {
    return NextResponse.json({ error: "No proof uploaded for this payout." }, { status: 404 });
  }

  // Generate a short-lived signed URL — the file is never directly accessible via browser
  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(payout.proof_url, SIGNED_URL_EXPIRY_SECONDS);

  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: "Failed to generate proof URL." }, { status: 500 });
  }

  return NextResponse.json({ signedUrl: signed.signedUrl });
}
