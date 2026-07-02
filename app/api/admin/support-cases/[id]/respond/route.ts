import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/api/auth';
import { logAdminAction } from '@/lib/admin-audit';

const respondSchema = z.object({
    message: z.string().min(1).max(2000),
    status: z.enum(['open', 'in-progress', 'resolved', 'closed']).optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireAdmin();
        if (auth.error || !auth.user) return auth.error;

        const { id: caseId } = await params;
        const body = await request.json();
        const parsed = respondSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || 'Invalid request data' },
                { status: 400 }
            );
        }

        // Get the case to find the user
        const { data: supportCase, error: caseError } = await auth.supabase
            .from('support_cases')
            .select('id, user_id, status, severity, case_number')
            .eq('id', caseId)
            .single();

        if (caseError) {
            return NextResponse.json(
                { error: 'Support case not found' },
                { status: 404 }
            );
        }

        // Create message event
        const { error: messageError } = await auth.supabase
            .from('support_case_events')
            .insert({
                case_id: caseId,
                event_type: 'message',
                actor_type: 'admin',
                actor_id: auth.user.id,
                message: parsed.data.message,
            });

        if (messageError) {
            throw new Error(messageError.message);
        }

        // Update status and/or severity if provided
        const updates: { status?: string; severity?: string; updated_at: string } = {
            updated_at: new Date().toISOString(),
        };

        if (parsed.data.status && parsed.data.status !== supportCase.status) {
            updates.status = parsed.data.status;

            // Create status change event
            await auth.supabase.from('support_case_events').insert({
                case_id: caseId,
                event_type: 'status_changed',
                actor_type: 'admin',
                actor_id: auth.user.id,
                details_json: {
                    from: supportCase.status,
                    to: parsed.data.status,
                },
            });
        }

        if (parsed.data.severity && parsed.data.severity !== supportCase.severity) {
            updates.severity = parsed.data.severity;

            // Create severity change event
            await auth.supabase.from('support_case_events').insert({
                case_id: caseId,
                event_type: 'severity_changed',
                actor_type: 'admin',
                actor_id: auth.user.id,
                details_json: {
                    from: supportCase.severity,
                    to: parsed.data.severity,
                },
            });
        }

        if (updates.status || updates.severity) {
            const { error: updateError } = await auth.supabase
                .from('support_cases')
                .update(updates)
                .eq('id', caseId);

            if (updateError) {
                console.error('Failed to update case:', updateError);
            }
        }

        // Send notification to user
        await auth.supabase.from('notifications').insert({
            user_id: supportCase.user_id,
            type: 'support_response',
            title: `Response to ${supportCase.case_number}`,
            body: parsed.data.message.substring(0, 200),
            metadata: {
                caseId,
                caseNumber: supportCase.case_number,
                respondedBy: auth.user.id,
            },
        });

        // Log admin action
        await logAdminAction({
            adminId: auth.user.id,
            action: 'support_case_responded',
            targetType: 'support_case',
            targetId: caseId,
            metadata: {
                caseNumber: supportCase.case_number,
                statusChanged: updates.status ? { from: supportCase.status, to: updates.status } : null,
                severityChanged: updates.severity ? { from: supportCase.severity, to: updates.severity } : null,
            },
        });

        return NextResponse.json({
            message: 'Response sent successfully',
        });
    } catch (error) {
        console.error('POST /api/admin/support-cases/[id]/respond error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to send response' },
            { status: 500 }
        );
    }
}
