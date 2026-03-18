import { NextResponse } from "next/server";
import { badRequestResponse, requireAdmin, serverErrorResponse } from "@/lib/api/auth";

function toCsvCell(value: unknown) {
  const serialized = typeof value === "string" ? value : JSON.stringify(value ?? "");
  const escaped = serialized.replace(/"/g, '""');
  return `"${escaped}"`;
}

function parseDateFilter(value: string) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const url = new URL(request.url);
    const action = (url.searchParams.get("action") ?? "").trim();
    const targetType = (url.searchParams.get("targetType") ?? "").trim();
    const adminId = (url.searchParams.get("adminId") ?? "").trim();
    const targetId = (url.searchParams.get("targetId") ?? "").trim();
    const from = parseDateFilter((url.searchParams.get("from") ?? "").trim());
    const to = parseDateFilter((url.searchParams.get("to") ?? "").trim());
    const format = (url.searchParams.get("format") ?? "json").trim().toLowerCase();
    const page = Math.max(Number(url.searchParams.get("page") ?? 1), 1);
    const pageSize = Math.min(Math.max(Number(url.searchParams.get("pageSize") ?? 20), 1), 100);

    let query = auth.supabase
      .from("audit_log")
      .select("id, admin_id, action, target_type, target_id, before_val, after_val, metadata, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (action) query = query.eq("action", action);
    if (targetType) query = query.eq("target_type", targetType);
    if (adminId) query = query.eq("admin_id", adminId);
    if (targetId) query = query.ilike("target_id", `%${targetId}%`);
    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", to);

    const { data, error, count } = await query;
    if (error) return badRequestResponse(error.message);

    if (format === "csv") {
      const rows = data ?? [];
      const header = ["id", "created_at", "admin_id", "action", "target_type", "target_id", "metadata", "before_val", "after_val"];
      const lines = [
        header.join(","),
        ...rows.map((row) => [
          toCsvCell(row.id),
          toCsvCell(row.created_at),
          toCsvCell(row.admin_id),
          toCsvCell(row.action),
          toCsvCell(row.target_type),
          toCsvCell(row.target_id),
          toCsvCell(row.metadata),
          toCsvCell(row.before_val),
          toCsvCell(row.after_val),
        ].join(",")),
      ];

      return new NextResponse(lines.join("\n"), {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename=admin-audit-log-${new Date().toISOString().slice(0, 10)}.csv`,
        },
      });
    }

    return NextResponse.json({
      data: data ?? [],
      pagination: {
        page,
        pageSize,
        total: count ?? 0,
      },
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
