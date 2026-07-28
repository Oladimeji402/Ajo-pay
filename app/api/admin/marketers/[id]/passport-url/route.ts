import { NextResponse } from "next/server";
import { requireAdmin, serverErrorResponse } from "@/lib/api/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { id } = await context.params;
    const adminSupabase = createSupabaseAdminClient();

    const { data: marketer, error } = await adminSupabase
      .from("marketers")
      .select("id, passport_path")
      .eq("id", id)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!marketer) return NextResponse.json({ error: "Marketer not found." }, { status: 404 });
    if (!marketer.passport_path) {
      return NextResponse.json({ error: "No passport on file." }, { status: 404 });
    }

    const { data, error: signedError } = await adminSupabase.storage
      .from("marketer-passports")
      .createSignedUrl(marketer.passport_path, 60 * 10);

    if (signedError || !data?.signedUrl) {
      return NextResponse.json({ error: signedError?.message ?? "Could not create signed URL." }, { status: 500 });
    }

    return NextResponse.json({ data: { url: data.signedUrl } });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
