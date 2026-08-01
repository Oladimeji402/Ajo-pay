import {
  DEFAULT_TASK_TIMEZONE,
  getPeriodKey,
  isRecurringFrequency,
} from "@/lib/marketer-task-periods";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * When a referred user activates passbook and is attributed to a marketer,
 * mark all active recurring tasks complete for the current period.
 * Idempotent via unique (task_id, period_key).
 */
export async function autoCompleteRecurringTasksOnPassbookAttribution(
  marketerId: string,
): Promise<{ completed: number }> {
  const adminSupabase = createSupabaseAdminClient();
  const now = new Date();

  const { data: tasks, error } = await adminSupabase
    .from("marketer_tasks")
    .select("id, status, frequency, timezone, ends_at")
    .eq("marketer_id", marketerId)
    .in("frequency", ["daily", "weekly", "monthly"])
    .neq("status", "cancelled");

  if (error) {
    console.error("[marketer-tasks/auto-complete] task lookup failed:", error.message);
    return { completed: 0 };
  }

  let completed = 0;

  for (const task of tasks ?? []) {
    if (!isRecurringFrequency(task.frequency)) continue;
    if (task.ends_at && new Date(task.ends_at).getTime() < now.getTime()) continue;

    const periodKey = getPeriodKey(
      task.frequency,
      now,
      task.timezone || DEFAULT_TASK_TIMEZONE,
    );
    if (!periodKey) continue;

    const { error: upsertError } = await adminSupabase
      .from("marketer_task_completions")
      .upsert(
        {
          task_id: task.id,
          marketer_id: marketerId,
          period_key: periodKey,
          completed_at: now.toISOString(),
        },
        { onConflict: "task_id,period_key", ignoreDuplicates: true },
      );

    if (upsertError) {
      console.error(
        "[marketer-tasks/auto-complete] completion upsert failed:",
        upsertError.message,
      );
      continue;
    }

    completed += 1;

    if (task.status === "open") {
      await adminSupabase
        .from("marketer_tasks")
        .update({ status: "in_progress" })
        .eq("id", task.id)
        .eq("status", "open");
    }
  }

  return { completed };
}
