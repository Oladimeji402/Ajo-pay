import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse, requireAdmin, serverErrorResponse } from "@/lib/api/auth";
import { logAdminAction } from "@/lib/admin-audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const updateStatusSchema = z.object({
  action: z.enum(["suspend", "unsuspend", "close"]),
  reason: z.string().min(5, "Reason must be at least 5 characters").optional(),
  notifyUser: z.boolean().optional().default(true),
});

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/admin/users/[id]/status
 * 
 * Update user account status (suspend, unsuspend, or close account)
 * Requires admin authentication and logs all actions to audit trail
 */
export async function POST(request: Request, context: Context) {
  try {
    const auth = await requireAdmin();
    if (auth.error || !auth.user) return auth.error;
    
    const { id: userId } = await context.params;

    // Parse request body
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return badRequestResponse("Invalid JSON body.");
    }

    const parsed = updateStatusSchema.safeParse(rawBody);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Validation failed.";
      return badRequestResponse(message);
    }

    const { action, reason, notifyUser } = parsed.data;

    // Use admin client to bypass RLS
    const adminSupabase = createSupabaseAdminClient();

    // Get current user state
    const { data: currentUser, error: fetchError } = await adminSupabase
      .from("profiles")
      .select("id, name, email, status, suspension_reason, suspended_at, suspended_by")
      .eq("id", userId)
      .maybeSingle();

    if (fetchError) return badRequestResponse(fetchError.message);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent admins from suspending themselves
    if (action === "suspend" && userId === auth.user.id) {
      return badRequestResponse("You cannot suspend your own account");
    }

    // Prevent closing admin accounts
    if (action === "close") {
      const { data: profile } = await adminSupabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (profile?.role === "admin") {
        return badRequestResponse("Cannot close admin accounts. Change role to 'user' first.");
      }
    }

    let updates: Record<string, unknown>;
    let actionDescription: string;
    let emailSubject: string;
    let emailBody: string;

    switch (action) {
      case "suspend":
        if (currentUser.status === "suspended") {
          return badRequestResponse("User is already suspended");
        }

        if (!reason || reason.trim().length < 5) {
          return badRequestResponse("Suspension reason is required and must be at least 5 characters");
        }

        updates = {
          status: "suspended",
          suspension_reason: reason.trim(),
          suspended_at: new Date().toISOString(),
          suspended_by: auth.user.id,
          updated_at: new Date().toISOString(),
        };

        actionDescription = `Account suspended: ${reason}`;
        emailSubject = "Account Suspended - AjoPay";
        emailBody = `
Dear ${currentUser.name || "User"},

Your AjoPay account has been suspended by our admin team.

Reason: ${reason}

While your account is suspended, you will not be able to:
- Make deposits or contributions
- Access savings plans
- Initiate withdrawals
- Perform any transactions

If you believe this is an error or would like to appeal, please contact our support team.

Best regards,
The AjoPay Team
        `.trim();
        break;

      case "unsuspend":
        if (currentUser.status !== "suspended") {
          return badRequestResponse("User is not suspended");
        }

        updates = {
          status: "active",
          suspension_reason: null,
          suspended_at: null,
          suspended_by: null,
          account_locked: false,
          failed_login_attempts: 0,
          locked_until: null,
          updated_at: new Date().toISOString(),
        };

        actionDescription = `Account reactivated${reason ? `: ${reason}` : ""}`;
        emailSubject = "Account Reactivated - AjoPay";
        emailBody = `
Dear ${currentUser.name || "User"},

Good news! Your AjoPay account has been reactivated.

You can now:
- Make deposits and contributions
- Access your savings plans
- Initiate withdrawals
- Resume all normal transactions

${reason ? `Note: ${reason}` : ""}

Welcome back!

Best regards,
The AjoPay Team
        `.trim();
        break;

      case "close":
        // Check if user has active savings or pending transactions
        const { data: activeSavings } = await adminSupabase
          .from("individual_savings_goals")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "active")
          .limit(1);

        if (activeSavings && activeSavings.length > 0) {
          return badRequestResponse(
            "Cannot close account with active savings goals. Complete or cancel them first."
          );
        }

        const { data: pendingPayments } = await adminSupabase
          .from("payment_records")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "pending")
          .limit(1);

        if (pendingPayments && pendingPayments.length > 0) {
          return badRequestResponse(
            "Cannot close account with pending payments. Resolve them first."
          );
        }

        // Check wallet balance
        const { data: walletCheck } = await adminSupabase
          .from("profiles")
          .select("wallet_balance")
          .eq("id", userId)
          .single();

        if (walletCheck && Number(walletCheck.wallet_balance) > 0) {
          return badRequestResponse(
            "Cannot close account with non-zero wallet balance. Process final withdrawal first."
          );
        }

        updates = {
          status: "suspended",
          suspension_reason: `Account closed by admin${reason ? `: ${reason}` : ""}`,
          suspended_at: new Date().toISOString(),
          suspended_by: auth.user.id,
          updated_at: new Date().toISOString(),
        };

        actionDescription = `Account permanently closed${reason ? `: ${reason}` : ""}`;
        emailSubject = "Account Closed - AjoPay";
        emailBody = `
Dear ${currentUser.name || "User"},

Your AjoPay account has been permanently closed.

${reason ? `Reason: ${reason}` : ""}

Your account data will be retained as per our data retention policy for legal and compliance purposes.

If you have any questions, please contact our support team.

Best regards,
The AjoPay Team
        `.trim();
        break;

      default:
        return badRequestResponse("Invalid action");
    }

    // Update user status
    const { error: updateError } = await adminSupabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);

    if (updateError) return badRequestResponse(updateError.message);

    // Log admin action
    await logAdminAction({
      adminId: auth.user.id,
      action: `user_status_${action}`,
      targetType: "user",
      targetId: userId,
      before: {
        status: currentUser.status,
        suspension_reason: currentUser.suspension_reason,
        suspended_at: currentUser.suspended_at,
        suspended_by: currentUser.suspended_by,
      },
      after: updates,
      metadata: {
        action,
        reason: reason || null,
        notifyUser,
        description: actionDescription,
      },
    });

    // TODO: Send email notification to user if notifyUser is true
    // For now, we'll just log it
    if (notifyUser) {
      console.log(`[email-notification] Would send to ${currentUser.email}:`);
      console.log(`Subject: ${emailSubject}`);
      console.log(`Body: ${emailBody}`);
    }

    // Revoke all sessions if suspending or closing
    if (action === "suspend" || action === "close") {
      await adminSupabase.rpc("revoke_all_user_sessions", {
        target_user_id: userId,
        admin_user_id: auth.user.id,
        reason: `Account ${action === "suspend" ? "suspended" : "closed"} by admin`,
      });
    }

    return NextResponse.json({
      success: true,
      message: actionDescription,
      data: {
        userId,
        action,
        status: updates.status,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[admin/users/status] Error:", error);
    return serverErrorResponse(error);
  }
}
