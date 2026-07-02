import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, badRequestResponse, serverErrorResponse } from '@/lib/api/auth';

const updateSchema = z.object({
    status: z.enum(['open', 'in-progress', 'resolved', 'closed']).optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const auth = await requireAdmin();
        if (auth.error) return auth.error;

        const caseId = params.id;

        // Get case details
        const { data: supportCase, error: caseError } = await auth.supabase
            .from('support_cases')
            .select('*, profiles:user_id(id, name, email, phone)')
            .eq('id', caseId)
            .single();

        if (caseError) {
            if (caseError.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Support case not found' },
                    { status: 404 }
                );
            }
            throw new Error(caseError.message);
        }

        // Get events
        const { data: events, error: eventsError } = await auth.supabase
            .from('support_case_events')
            .select(`
                *,
                profiles:actor_id(name)
            `)
            .eq('case_id', caseId)
            .order('created_at', { ascending: true });

        if (eventsError) {
            console.error('Failed to load events:', eventsError);
        }

        return NextResponse.json({
            data: {
                ...supportCase,
                events: events || [],
            },
        });
    } catch (error) {
        return serverErrorResponse(error);
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const auth = await requireAdmin();
        if (auth.error || !auth.user) return auth.error;

        const caseId = params.id;
        const body = await request.json();
        const parsed = updateSchema.safeParse(body);

        if (!parsed.success) {
            return badRequestResponse(parsed.error.issues[0]?.message || 'Invalid request data');
        }

        const updates: { status?: string; severity?: string; updated_at: string } = {
            updated_at: new Date().toISOString(),
        };

        if (parsed.data.status) updates.status = parsed.data.status;
        if (parsed.data.severity) updates.severity = parsed.data.severity;

        const { error: updateError } = await auth.supabase
            .from('support_cases')
            .update(updates)
            .eq('id', caseId);

        if (updateError) {
            throw new Error(updateError.message);
        }

        return NextResponse.json({
            message: 'Support case updated successfully',
        });
    } catch (error) {
        return serverErrorResponse(error);
    }
}
