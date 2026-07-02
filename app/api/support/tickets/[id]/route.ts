import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const cookieStore = cookies();
        const supabase = createSupabaseServerClient(cookieStore);
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Please log in to view this ticket.' },
                { status: 401 }
            );
        }

        const { id: ticketId } = await params;

        // Get ticket
        const { data: ticket, error: ticketError } = await supabase
            .from('support_cases')
            .select('*')
            .eq('id', ticketId)
            .eq('user_id', user.id) // Ensure user owns this ticket
            .single();

        if (ticketError) {
            if (ticketError.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Ticket not found' },
                    { status: 404 }
                );
            }
            throw new Error(ticketError.message);
        }

        // Get events
        const { data: events, error: eventsError } = await supabase
            .from('support_case_events')
            .select(`
                *,
                admin:actor_id(name)
            `)
            .eq('case_id', ticketId)
            .order('created_at', { ascending: true });

        if (eventsError) {
            console.error('Failed to load events:', eventsError);
        }

        // Format events with admin names
        const formattedEvents = (events || []).map(event => ({
            ...event,
            admin_name: event.actor_type === 'admin' && event.admin ? (event.admin as { name: string }).name : null,
        }));

        return NextResponse.json({
            data: {
                ...ticket,
                events: formattedEvents,
            },
        });
    } catch (error) {
        console.error('GET /api/support/tickets/[id] error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to load ticket' },
            { status: 500 }
        );
    }
}
