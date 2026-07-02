import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const createTicketSchema = z.object({
    category: z.enum(['payment', 'payout', 'account', 'savings', 'technical', 'other']),
    subject: z.string().min(3).max(100),
    description: z.string().min(10).max(1000),
    transactionRef: z.string().optional().nullable(),
    attachments: z.array(z.string()).optional(),
});

function generateCaseNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `CASE-${timestamp}-${random}`;
}

export async function GET(request: Request) {
    try {
        const supabase = createSupabaseBrowserClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Please log in to view your tickets.' },
                { status: 401 }
            );
        }

        const url = new URL(request.url);
        const status = url.searchParams.get('status');

        let query = supabase
            .from('support_cases')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(error.message);
        }

        return NextResponse.json({ data: data || [] });
    } catch (error) {
        console.error('GET /api/support/tickets error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to load tickets' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const supabase = createSupabaseBrowserClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Please log in to submit a ticket.' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const parsed = createTicketSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || 'Invalid request data' },
                { status: 400 }
            );
        }

        const caseNumber = generateCaseNumber();

        // Create support case
        const { data: supportCase, error: caseError } = await supabase
            .from('support_cases')
            .insert({
                case_number: caseNumber,
                user_id: user.id,
                status: 'open',
                severity: 'medium', // Default severity
                complaint_type: parsed.data.category,
                summary: parsed.data.subject,
            })
            .select('*')
            .single();

        if (caseError) {
            throw new Error(caseError.message);
        }

        // Create initial event with description
        const { error: eventError } = await supabase
            .from('support_case_events')
            .insert({
                case_id: supportCase.id,
                event_type: 'case_opened',
                reference: parsed.data.transactionRef || null,
                actor_type: 'user',
                actor_id: user.id,
                message: parsed.data.description,
                details_json: {
                    summary: parsed.data.subject,
                    category: parsed.data.category,
                    attachments: parsed.data.attachments || [],
                },
            });

        if (eventError) {
            // Log error but don't fail the request
            console.error('Failed to create case event:', eventError);
        }

        // Create in-app notification
        await supabase.from('notifications').insert({
            user_id: user.id,
            type: 'support_ticket_created',
            title: 'Support ticket submitted',
            body: `Your ticket ${caseNumber} has been submitted. We'll get back to you within 24 hours.`,
            metadata: {
                caseId: supportCase.id,
                caseNumber,
            },
        });

        return NextResponse.json(
            {
                data: supportCase,
                message: 'Support ticket submitted successfully',
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('POST /api/support/tickets error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to submit ticket' },
            { status: 500 }
        );
    }
}
