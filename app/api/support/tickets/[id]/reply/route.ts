import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const replySchema = z.object({
    message: z.string().min(1).max(1000),
});

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createSupabaseBrowserClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Please log in to reply to this ticket.' },
                { status: 401 }
            );
        }

        const ticketId = params.id;

        // Verify user owns this ticket
        const { data: ticket, error: ticketError } = await supabase
            .from('support_cases')
            .select('id, status, user_id')
            .eq('id', ticketId)
            .eq('user_id', user.id)
            .single();

        if (ticketError) {
            return NextResponse.json(
                { error: 'Ticket not found' },
                { status: 404 }
            );
        }

        if (ticket.status === 'closed') {
            return NextResponse.json(
                { error: 'Cannot reply to a closed ticket' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const parsed = replySchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || 'Invalid message' },
                { status: 400 }
            );
        }

        // Create reply event
        const { data: event, error: eventError } = await supabase
            .from('support_case_events')
            .insert({
                case_id: ticketId,
                event_type: 'message',
                actor_type: 'user',
                actor_id: user.id,
                message: parsed.data.message,
            })
            .select('*')
            .single();

        if (eventError) {
            throw new Error(eventError.message);
        }

        // Update ticket status to 'open' if it was 'resolved'
        if (ticket.status === 'resolved') {
            await supabase
                .from('support_cases')
                .update({
                    status: 'open',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', ticketId);
        }

        return NextResponse.json({
            data: event,
            message: 'Reply sent successfully',
        });
    } catch (error) {
        console.error('POST /api/support/tickets/[id]/reply error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to send reply' },
            { status: 500 }
        );
    }
}
