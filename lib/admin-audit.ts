import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AuditLogParams = {
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
};

export async function logAdminAction(params: AuditLogParams) {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("audit_log").insert({
    admin_id: params.adminId,
    action: params.action,
    target_type: params.targetType,
    target_id: params.targetId,
    before_val: params.before ?? {},
    after_val: params.after ?? {},
    metadata: params.metadata ?? {},
  });

  if (error) {
    // Audit logging should not block primary actions, but it should be visible in logs.
    console.error("[audit-log] Failed to insert audit event:", error.message);
  }
}
