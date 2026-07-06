import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequestResponse, requireAdmin, serverErrorResponse } from "@/lib/api/auth";
import { logAdminAction } from "@/lib/admin-audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const walletAdjustmentSchema = z.object({
  action: z.enum(["credit", "debit", "freeze", "unfreeze"]),
  amount: z.number().positive("Amount must be positive").optional(),
  reason: z.string().min(10, "Justification must be at least 10 characters"),
  notifyUser: z.boolean().optional().default(true),
});

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/admin/users/[id]/wallet
 * 
 * Perform wallet adjustments:
 * - credit: Add funds to user wallet (refund, compensation, etc.)
 * - debit: Remove funds from user wallet (correction, chargeback, etc.)
 * - freeze: Prevent wallet usage (under investigation)
 * - unfreeze: Allow wallet usage again
 * 
 * All adjustments require detailed justification and are logged to audit trail
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

    const parsed = walletAdjustmentSchema.safeParse(rawBody);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Validation failed.";
      return badRequestResponse(message);
    }

    const { action, amount, reason, notifyUser } = parsed.data;

    // Validate amount is provided for credit/debit
    if ((action === "credit" || action === "debit") && !amount) {
      return badRequestResponse("Amount is required for credit/debit operations");
    }

    // Use admin client to bypass RLS
    const adminSupabase = createSupabaseAdminClient();

    // Get current user and wallet state
    const { data: currentUser, error: fetchError } = await adminSupabase
      .from("profiles")
      .select("id, name, email, wallet_balance, status")
      .eq("id", userId)
      .maybeSingle();

    if (fetchError) return badRequestResponse(fetchError.message);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Convert wallet_balance to number (it's stored as numeric in DB)
    const currentBalance = Number(currentUser.wallet_balance || 0);
    let newBalance = currentBalance;
    let actionDescription: string;
    let emailSubject: string;
    let emailBody: string;

    // Generate unique reference for this adjustment
    const adjustmentRef = `ADJ-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    switch (action) {
      case "credit": {
        if (!amount || amount <= 0) {
          return badRequestResponse("Credit amount must be positive");
        }

        newBalance = currentBalance + amount;

        // Update wallet balance
        const { error: updateError } = await adminSupabase
          .from("profiles")
          .update({
            wallet_balance: newBalance,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (updateError) return badRequestResponse(updateError.message);

        // Create wallet ledger entry
        await adminSupabase.from("wallet_ledger").insert({
          user_id: userId,
          direction: "credit",
          amount,
          balance_before: currentBalance,
          balance_after: newBalance,
          reason: `Admin adjustment: ${reason}`,
          reference: adjustmentRef,
          actor_type: "admin",
          actor_id: auth.user.id,
          metadata: {
            admin_action: "manual_credit",
            admin_id: auth.user.id,
            justification: reason,
          },
        });

        actionDescription = `Wallet credited with ₦${amount.toLocaleString()}: ${reason}`;
        emailSubject = "Wallet Credit - AjoPay";
        emailBody = `
Dear ${currentUser.name || "User"},

Your AjoPay wallet has been credited by our admin team.

Amount: ₦${amount.toLocaleString("en-NG")}
Previous Balance: ₦${currentBalance.toLocaleString("en-NG")}
New Balance: ₦${newBalance.toLocaleString("en-NG")}

Reason: ${reason}

Reference: ${adjustmentRef}

This credit is now available for use in your account.

Best regards,
The AjoPay Team
        `.trim();
        break;
      }

      case "debit": {
        if (!amount || amount <= 0) {
          return badRequestResponse("Debit amount must be positive");
        }

        if (currentBalance < amount) {
          return badRequestResponse(
            `Insufficient balance. User has ₦${currentBalance.toLocaleString()}, cannot debit ₦${amount.toLocaleString()}`
          );
        }

        newBalance = currentBalance - amount;

        // Update wallet balance
        const { error: updateError } = await adminSupabase
          .from("profiles")
          .update({
            wallet_balance: newBalance,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (updateError) return badRequestResponse(updateError.message);

        // Create wallet ledger entry
        await adminSupabase.from("wallet_ledger").insert({
          user_id: userId,
          direction: "debit",
          amount,
          balance_before: currentBalance,
          balance_after: newBalance,
          reason: `Admin adjustment: ${reason}`,
          reference: adjustmentRef,
          actor_type: "admin",
          actor_id: auth.user.id,
          metadata: {
            admin_action: "manual_debit",
            admin_id: auth.user.id,
            justification: reason,
          },
        });

        actionDescription = `Wallet debited ₦${amount.toLocaleString()}: ${reason}`;
        emailSubject = "Wallet Debit - AjoPay";
        emailBody = `
Dear ${currentUser.name || "User"},

Your AjoPay wallet has been debited by our admin team.

Amount: ₦${amount.toLocaleString("en-NG")}
Previous Balance: ₦${currentBalance.toLocaleString("en-NG")}
New Balance: ₦${newBalance.toLocaleString("en-NG")}

Reason: ${reason}

Reference: ${adjustmentRef}

If you have any questions about this debit, please contact our support team.

Best regards,
The AjoPay Team
        `.trim();
        break;
      }

      case "freeze": {
        // TODO: Implement wallet freeze functionality
        // This would require adding a wallet_frozen column to profiles table
        // For now, we'll just log the intention
        
        actionDescription = `Wallet freeze requested: ${reason}`;
        emailSubject = "Wallet Temporarily Frozen - AjoPay";
        emailBody = `
Dear ${currentUser.name || "User"},

Your AjoPay wallet has been temporarily frozen by our admin team.

Reason: ${reason}

While your wallet is frozen, you will not be able to:
- Fund your wallet
- Make contributions to savings plans
- Initiate any transactions

Your current balance (₦${currentBalance.toLocaleString("en-NG")}) is safe and will remain in your account.

If you have any questions, please contact our support team.

Best regards,
The AjoPay Team
        `.trim();

        // For now, return a message indicating this feature is pending
        return NextResponse.json({
          success: false,
          message: "Wallet freeze feature is not yet implemented. Use account suspension instead.",
          data: {
            userId,
            action,
            currentBalance,
            alternativeAction: "suspend",
            note: "Account suspension will prevent all transactions including wallet usage",
          },
        });
      }

      case "unfreeze": {
        // TODO: Implement wallet unfreeze functionality
        
        actionDescription = `Wallet unfreeze requested: ${reason}`;
        emailSubject = "Wallet Unfrozen - AjoPay";
        emailBody = `
Dear ${currentUser.name || "User"},

Your AjoPay wallet has been unfrozen by our admin team.

Note: ${reason}

You can now:
- Fund your wallet
- Make contributions to savings plans
- Perform transactions normally

Your balance: ₦${currentBalance.toLocaleString("en-NG")}

Welcome back!

Best regards,
The AjoPay Team
        `.trim();

        // For now, return a message indicating this feature is pending
        return NextResponse.json({
          success: false,
          message: "Wallet unfreeze feature is not yet implemented. Use account unsuspend instead.",
          data: {
            userId,
            action,
            currentBalance,
            alternativeAction: "unsuspend",
            note: "Account unsuspension will restore all account functionality",
          },
        });
      }

      default:
        return badRequestResponse("Invalid wallet action");
    }

    // Log admin action
    await logAdminAction({
      adminId: auth.user.id,
      action: `wallet_${action}`,
      targetType: "user",
      targetId: userId,
      before: {
        wallet_balance: currentBalance,
      },
      after: {
        wallet_balance: newBalance,
      },
      metadata: {
        action,
        amount: amount || null,
        reason,
        reference: adjustmentRef,
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
        amount: amount || null,
        previousBalance: currentBalance,
        newBalance,
        reference: adjustmentRef,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[admin/users/wallet] Error:", error);
    return serverErrorResponse(error);
  }
}

/**
 * GET /api/admin/users/[id]/wallet
 * 
 * Get detailed wallet information for a user
 */
export async function GET(_request: Request, context: Context) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;
    
    const { id: userId } = await context.params;

    const adminSupabase = createSupabaseAdminClient();

    // Get user wallet info
    const { data: user, error: userError } = await adminSupabase
      .from("profiles")
      .select("id, name, email, wallet_balance, total_contributed, total_received")
      .eq("id", userId)
      .maybeSingle();

    if (userError) return badRequestResponse(userError.message);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get recent wallet ledger entries
    const { data: ledgerEntries } = await adminSupabase
      .from("wallet_ledger")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    // Calculate wallet statistics
    const credits = ledgerEntries?.filter(e => e.direction === "credit") || [];
    const debits = ledgerEntries?.filter(e => e.direction === "debit") || [];
    
    const totalCredits = credits.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    const totalDebits = debits.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

    // Get admin adjustments
    const adminAdjustments = ledgerEntries?.filter(e => e.actor_type === "admin") || [];

    return NextResponse.json({
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        wallet: {
          currentBalance: Number(user.wallet_balance || 0),
          totalContributed: Number(user.total_contributed || 0),
          totalReceived: Number(user.total_received || 0),
          totalCredits,
          totalDebits,
          netFlow: totalCredits - totalDebits,
        },
        statistics: {
          totalTransactions: ledgerEntries?.length || 0,
          creditTransactions: credits.length,
          debitTransactions: debits.length,
          adminAdjustments: adminAdjustments.length,
        },
        recentActivity: ledgerEntries?.slice(0, 20).map(entry => ({
          id: entry.id,
          direction: entry.direction,
          amount: Number(entry.amount),
          balanceBefore: Number(entry.balance_before),
          balanceAfter: Number(entry.balance_after),
          reason: entry.reason,
          reference: entry.reference,
          actorType: entry.actor_type,
          createdAt: entry.created_at,
        })) || [],
      },
    });
  } catch (error) {
    console.error("[admin/users/wallet] GET Error:", error);
    return serverErrorResponse(error);
  }
}
