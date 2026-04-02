import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/admin-audit";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "application/pdf"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const BUCKET_NAME = "payout-proofs";

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error || !auth.user) {
      return auth.error ?? NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
    }

    const file = formData.get("file");
    const payoutIdRaw = formData.get("payoutId");
    const proofNoteRaw = formData.get("proofNote");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (!payoutIdRaw || typeof payoutIdRaw !== "string" || !payoutIdRaw.trim()) {
      return NextResponse.json({ error: "payoutId is required." }, { status: 400 });
    }

    const payoutId = payoutIdRaw.trim();

    // Validate MIME type against allowlist — no polyglot or executable files accepted
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and PDF are allowed." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds the 5 MB limit." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    // Verify the payout exists before accepting the upload
    const { data: payout, error: payoutError } = await supabase
      .from("payouts")
      .select("id, status")
      .eq("id", payoutId)
      .maybeSingle();

    if (payoutError || !payout) {
      return NextResponse.json({ error: "Payout not found." }, { status: 404 });
    }

    // Build a safe storage path: no user-controlled data in the filename
    const extMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "application/pdf": "pdf",
    };
    const ext = extMap[file.type] ?? "bin";
    const safeFilename = `${payoutId}/${crypto.randomUUID()}.${ext}`;

    // Ensure the bucket exists — PRIVATE so files cannot be accessed via browser directly
    const { error: bucketError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: false,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: [...ALLOWED_MIME_TYPES],
    });
    // Ignore "already exists" errors
    if (bucketError && !bucketError.message.includes("already exists")) {
      return NextResponse.json({ error: "Storage unavailable." }, { status: 500 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(safeFilename, arrayBuffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Store the storage path — NOT a public URL. Signed URLs are generated on-demand via /api/admin/payouts/proof-url
    const noteStr =
      typeof proofNoteRaw === "string" ? proofNoteRaw.trim().slice(0, 500) : null;

    const { error: updateError } = await supabase
      .from("payouts")
      .update({
        proof_url: safeFilename,
        proof_note: noteStr || null,
        proof_uploaded_at: new Date().toISOString(),
        proof_uploaded_by: auth.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payoutId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await logAdminAction({
      adminId: auth.user.id,
      action: "payout_updated",
      targetType: "payout",
      targetId: payoutId,
      before: {},
      after: { proof_path: safeFilename, proof_note: noteStr },
    });

    return NextResponse.json({ data: { storagePath: safeFilename } });
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
