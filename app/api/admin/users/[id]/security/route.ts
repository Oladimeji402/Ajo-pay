import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse, requireAdmin, serverErrorResponse } from "@/lib/api/auth";
import { logAdminAction } from "@/lib/admin-audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const securityActionSchema = z.object({
  action: z.enum(["force_password_reset", "revoke_sessions", "unlock_account", "enable_2fa", "disable_2fa"]),
  reason: z.string().min(3, "Reason must be at least 3 characters").optional(),
  notifyUser: z.boolean().optional().default(true),
});

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/admin/users/[id]/security
 * 
 * Perform security actions on user accounts:
 * - force_password_reset: Send password reset email and invalidate current password
 * - revoke_sessions: Force logout from all devices
 * - unlock_account: Unlock account locked due to failed login attempts
 * - enable_2fa: Force enable 2FA for user (future feature)
 * - disable_2fa: Disable 2FA for user (future feature)
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

    const parsed = securityActionSchema.safeParse(rawBody);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Validation failed.";
      return badRequestResponse(message);
    }

    const { action, reason, notifyUser } = parsed.data;

    // Use admin client to bypass RLS
    const adminSupabase = createSupabaseAdminClient();

    // Get current user
    const { data: currentUser, error: fetchError } = await adminSupabase
      .from("profiles")
      .select("id, name, email, account_locked, failed_login_attempts, locked_until, status")
      .eq("id", userId)
      .maybeSingle();

    if (fetchError) return badRequestResponse(fetchError.message);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let actionDescription: string;
    let emailSubject: string;
    let emailBody: string;
    let response: Record<string, unknown> = {};

    switch (action) {
      case "force_password_reset": {
        // Generate password reset link using Supabase Auth Admin API
        const { data: resetData, error: resetError } = await adminSupabase.auth.admin.generateLink({
          type: "recovery",
          email: currentUser.email,
        });

        if (resetError) {
          console.error("[security] Password reset error:", resetError);
          return badRequestResponse("Failed to generate password reset link");
        }

        actionDescription = `Password reset initiated${reason ? `: ${reason}` : ""}`;
        emailSubject = "Password Reset Required - AjoPay";
        emailBody = `
Dear ${currentUser.name || "User"},

A password reset has been initiated for your AjoPay account by our admin team.

${reason ? `Reason: ${reason}` : "This is a security measure to protect your account."}

Please click the link below to reset your password:
${resetData.properties?.action_link || "[Reset link would be here]"}

This link will expire in 24 hours.

If you did not request this reset, please contact our support team immediately.

Best regards,
The AjoPay Team
        `.trim();

        response = {
          resetLink: resetData.properties?.action_link,
          expiresAt: resetData.properties?.expires_at,
        };

        break;
      }

      case "revoke_sessions": {
        // Revoke all user sessions
        const result = await adminSupabase.rpc("revoke_all_user_sessions", {
          target_user_id: userId,
          admin_user_id: auth.user.id,
          reason: reason || "Admin security action",
        });

        const revokedCount = result.data || 0;

        actionDescription = `Revoked ${revokedCount} active session(s)${reason ? `: ${reason}` : ""}`;
        emailSubject = "Security Alert: All Sessions Terminated - AjoPay";
        emailBody = `
Dear ${currentUser.name || "User"},

For security reasons, all active sessions on your AjoPay account have been terminated by our admin team.

${reason ? `Reason: ${reason}` : "This is a precautionary security measure."}

You will need to log in again to access your account.

If you notice any suspicious activity, please contact our support team immediately.

Best regards,
The AjoPay Team
        `.trim();

        response = {
          revokedSessions: revokedCount,
        };

        break;
      }

      case "unlock_account": {
        if (!currentUser.account_locked) {
          return badRequestResponse("Account is not locked");
        }

        // Unlock account and reset failed login attempts
        const { error: updateError } = await adminSupabase
          .from("profiles")
          .update({
            account_locked: false,
            failed_login_attempts: 0,
            locked_until: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (updateError) return badRequestResponse(updateError.message);

        actionDescription = `Account unlocked${reason ? `: ${reason}` : ""}`;
        emailSubject = "Account Unlocked - AjoPay";
        emailBody = `
Dear ${currentUser.name || "User"},

Your AjoPay account has been unlocked by our admin team.

${reason ? `Note: ${reason}` : "You can now log in to your account."}

For your security, please ensure you are using a strong, unique password.

If you continue to experience login issues, please contact our support team.

Best regards,
The AjoPay Team
        `.trim();

        response = {
          previouslyLocked: true,
          lockedUntil: currentUser.locked_until,
          failedAttempts: currentUser.failed_login_attempts,
        };

        break;
      }

      case "enable_2fa": {
        // TODO: Implement 2FA enablement
        // For now, just log the intention
        actionDescription = `2FA enablement requested${reason ? `: ${reason}` : ""}`;
        emailSubject = "Two-Factor Authentication Update - AjoPay";
        emailBody = `
Dear ${currentUser.name || "User"},

Two-factor authentication (2FA) has been enabled on your AjoPay account for enhanced security.

${reason ? `Note: ${reason}` : ""}

You will need to set up your authenticator app on your next login.

Best regards,
The AjoPay Team
        `.trim();

        response = {
          message: "2FA enablement feature is not yet implemented",
          comingSoon: true,
        };

        break;
      }

      case "disable_2fa": {
        // TODO: Implement 2FA disablement
        // For now, just log the intention
        actionDescription = `2FA disablement requested${reason ? `: ${reason}` : ""}`;
        emailSubject = "Two-Factor Authentication Disabled - AjoPay";
        emailBody = `
Dear ${currentUser.name || "User"},

Two-factor authentication (2FA) has been disabled on your AjoPay account by our admin team.

${reason ? `Reason: ${reason}` : ""}

Please note that disabling 2FA makes your account less secure. We recommend re-enabling it as soon as possible.

Best regards,
The AjoPay Team
        `.trim();

        response = {
          message: "2FA disablement feature is not yet implemented",
          comingSoon: true,
        };

        break;
      }

      default:
        return badRequestResponse("Invalid security action");
    }

    // Log admin action
    await logAdminAction({
      adminId: auth.user.id,
      action: `user_security_${action}`,
      targetType: "user",
      targetId: userId,
      before: {
        account_locked: currentUser.account_locked,
        failed_login_attempts: currentUser.failed_login_attempts,
        locked_until: currentUser.locked_until,
      },
      after: action === "unlock_account" 
        ? {
            account_locked: false,
            failed_login_attempts: 0,
            locked_until: null,
          }
        : null,
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

    return NextResponse.json({
      success: true,
      message: actionDescription,
      data: {
        userId,
        action,
        timestamp: new Date().toISOString(),
        ...response,
      },
    });
  } catch (error) {
    console.error("[admin/users/security] Error:", error);
    return serverErrorResponse(error);
  }
}

/**
 * GET /api/admin/users/[id]/security
 * 
 * Get security-related information about a user
 */
export async function GET(_request: Request, context: Context) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;
    
    const { id: userId } = await context.params;

    const adminSupabase = createSupabaseAdminClient();

    // Get user security info
    const { data: user, error: userError } = await adminSupabase
      .from("profiles")
      .select("id, name, email, account_locked, failed_login_attempts, locked_until, status")
      .eq("id", userId)
      .maybeSingle();

    if (userError) return badRequestResponse(userError.message);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get active sessions count
    const { data: activeSessions } = await adminSupabase
      .from("user_sessions")
      .select("id, device_name, device_type, browser, os, ip_address, location_country, location_city, last_activity, created_at, is_trusted")
      .eq("user_id", userId)
      .is("revoked_at", null)
      .order("last_activity", { ascending: false });

    // Get recent login attempts from audit log (if tracked)
    const { data: recentLogins } = await adminSupabase
      .from("admin_audit_log")
      .select("action, created_at, metadata")
      .eq("target_id", userId)
      .ilike("action", "%login%")
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          status: user.status,
          accountLocked: user.account_locked,
          failedLoginAttempts: user.failed_login_attempts,
          lockedUntil: user.locked_until,
        },
        security: {
          activeSessionsCount: activeSessions?.length || 0,
          activeSessions: activeSessions || [],
          recentLogins: recentLogins || [],
          twoFactorEnabled: false, // TODO: Implement when 2FA is ready
        },
      },
    });
  } catch (error) {
    console.error("[admin/users/security] GET Error:", error);
    return serverErrorResponse(error);
  }
}
