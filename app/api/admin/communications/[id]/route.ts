import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type RouteContext = {
    params: Promise<{ id: string }>;
};

// ============================================================================
// GET /api/admin/communications/[id] - Get message details with stats
// ============================================================================

export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;
        const supabase = await createSupabaseServerClient();

        // Verify admin access
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Fetch message with related data
        const { data: message, error: messageError } = await supabase
            .from('communication_messages')
            .select(`
                *,
                template:communication_templates(id, name),
                creator:created_by(id, name, email)
            `)
            .eq('id', id)
            .single();

        if (messageError || !message) {
            return NextResponse.json(
                { error: 'Message not found' },
                { status: 404 }
            );
        }

        // Fetch delivery logs with user details
        const { data: deliveryLogs, error: logsError } = await supabase
            .from('communication_delivery_logs')
            .select(`
                *,
                user:profiles(id, name, email, phone)
            `)
            .eq('message_id', id)
            .order('created_at', { ascending: false });

        if (logsError) {
            console.error('Error fetching delivery logs:', logsError);
            return NextResponse.json(
                { error: 'Failed to fetch delivery logs' },
                { status: 500 }
            );
        }

        // Calculate statistics
        const stats = {
            total: deliveryLogs?.length || 0,
            pending: deliveryLogs?.filter(log => log.status === 'pending').length || 0,
            sent: deliveryLogs?.filter(log => log.status === 'sent').length || 0,
            delivered: deliveryLogs?.filter(log => log.status === 'delivered').length || 0,
            failed: deliveryLogs?.filter(log => log.status === 'failed').length || 0,
            bounced: deliveryLogs?.filter(log => log.status === 'bounced').length || 0,
            email: deliveryLogs?.filter(log => log.channel === 'email').length || 0,
            sms: deliveryLogs?.filter(log => log.channel === 'sms').length || 0,
        };

        return NextResponse.json({
            data: {
                message,
                delivery_logs: deliveryLogs || [],
                stats,
            },
        });
    } catch (error) {
        console.error('GET /api/admin/communications/[id] error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// ============================================================================
// PATCH /api/admin/communications/[id] - Update message status
// ============================================================================

export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;
        const supabase = await createSupabaseServerClient();

        // Verify admin access
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Parse request body
        const body = await request.json();
        const { action } = body;

        if (!action || !['cancel', 'send_now'].includes(action)) {
            return NextResponse.json(
                { error: 'Invalid action. Use "cancel" or "send_now"' },
                { status: 400 }
            );
        }

        // Fetch current message
        const { data: message } = await supabase
            .from('communication_messages')
            .select('status')
            .eq('id', id)
            .single();

        if (!message) {
            return NextResponse.json(
                { error: 'Message not found' },
                { status: 404 }
            );
        }

        if (action === 'cancel') {
            if (message.status === 'sent') {
                return NextResponse.json(
                    { error: 'Cannot cancel a sent message' },
                    { status: 400 }
                );
            }

            const { error } = await supabase
                .from('communication_messages')
                .update({ status: 'cancelled' })
                .eq('id', id);

            if (error) {
                return NextResponse.json(
                    { error: 'Failed to cancel message' },
                    { status: 500 }
                );
            }

            return NextResponse.json({ data: { status: 'cancelled' } });
        }

        if (action === 'send_now') {
            if (message.status !== 'draft' && message.status !== 'scheduled') {
                return NextResponse.json(
                    { error: 'Can only send draft or scheduled messages' },
                    { status: 400 }
                );
            }

            // Update message status
            const { error: updateError } = await supabase
                .from('communication_messages')
                .update({ 
                    status: 'sent', 
                    sent_at: new Date().toISOString() 
                })
                .eq('id', id);

            if (updateError) {
                return NextResponse.json(
                    { error: 'Failed to update message status' },
                    { status: 500 }
                );
            }

            // Update delivery logs to 'sent' status
            const { error: logsError } = await supabase
                .from('communication_delivery_logs')
                .update({ 
                    status: 'sent', 
                    sent_at: new Date().toISOString() 
                })
                .eq('message_id', id)
                .eq('status', 'pending');

            if (logsError) {
                console.error('Error updating delivery logs:', logsError);
            }

            // TODO: Integrate with actual email/SMS providers here

            return NextResponse.json({ data: { status: 'sent' } });
        }

        return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
        );
    } catch (error) {
        console.error('PATCH /api/admin/communications/[id] error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
