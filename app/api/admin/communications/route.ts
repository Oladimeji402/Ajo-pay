import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';

// ============================================================================
// GET /api/admin/communications - List all communication campaigns
// ============================================================================

export async function GET(request: NextRequest) {
    try {
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

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'all';
        const channel = searchParams.get('channel') || 'all';
        const page = parseInt(searchParams.get('page') || '1', 10);
        const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

        // Build query
        let query = supabase
            .from('communication_messages')
            .select(`
                *,
                template:communication_templates(id, name),
                creator:created_by(id, name, email)
            `, { count: 'exact' })
            .order('created_at', { ascending: false });

        if (status !== 'all') {
            query = query.eq('status', status);
        }

        if (channel !== 'all') {
            query = query.eq('channel', channel);
        }

        // Pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching communications:', error);
            
            // Check if table doesn't exist
            if (error.message?.includes('relation "communication_messages" does not exist')) {
                return NextResponse.json(
                    { 
                        error: 'Communication tables not found. Please run the database migration first.',
                        data: [],
                        pagination: { total: 0, page: 1, pageSize, totalPages: 0 }
                    },
                    { status: 200 } // Return 200 so UI doesn't break
                );
            }
            
            return NextResponse.json(
                { error: 'Failed to fetch communications' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            data: data || [],
            pagination: {
                total: count || 0,
                page,
                pageSize,
                totalPages: Math.ceil((count || 0) / pageSize),
            },
        });
    } catch (error) {
        console.error('GET /api/admin/communications error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// ============================================================================
// POST /api/admin/communications - Create and optionally send a message
// ============================================================================

const createMessageSchema = z.object({
    campaign_name: z.string().min(1, 'Campaign name is required'),
    channel: z.enum(['email', 'sms', 'in_app', 'email_sms', 'email_in_app', 'sms_in_app', 'all']),
    subject: z.string().optional(),
    email_body: z.string().optional(),
    sms_body: z.string().optional(),
    in_app_body: z.string().optional(),
    audience_type: z.enum(['all', 'group_members', 'custom_filter']),
    audience_filter: z.record(z.string(), z.any()).optional(),
    group_ids: z.array(z.string().uuid()).optional(),
    template_id: z.string().uuid().optional(),
    scheduled_for: z.string().datetime().optional().or(z.literal('')),
    send_now: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
    try {
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

        // Parse and validate request body
        const body = await request.json();
        const parsed = createMessageSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid request data', details: parsed.error.issues },
                { status: 400 }
            );
        }

        const {
            campaign_name,
            channel,
            subject,
            email_body,
            sms_body,
            in_app_body,
            audience_type,
            audience_filter,
            group_ids,
            template_id,
            scheduled_for,
            send_now,
        } = parsed.data;

        // Validate channel-specific content
        if ((channel === 'email' || channel === 'email_sms' || channel === 'email_in_app' || channel === 'all') && !email_body) {
            return NextResponse.json(
                { error: 'Email body is required for email messages' },
                { status: 400 }
            );
        }

        // SMS validation - optional for now
        // if ((channel === 'sms' || channel === 'email_sms' || channel === 'sms_in_app' || channel === 'all') && !sms_body) {
        //     return NextResponse.json(
        //         { error: 'SMS body is required for SMS messages' },
        //         { status: 400 }
        //     );
        // }

        if ((channel === 'in_app' || channel === 'email_in_app' || channel === 'sms_in_app' || channel === 'all') && !in_app_body) {
            return NextResponse.json(
                { error: 'In-app message body is required for in-app notifications' },
                { status: 400 }
            );
        }

        // Build recipient list based on audience type
        let recipientQuery = supabase.from('profiles').select('id, name, email, phone');

        if (audience_type === 'group_members' && group_ids && group_ids.length > 0) {
            // Get users who are members of specified groups
            const { data: members } = await supabase
                .from('group_members')
                .select('user_id')
                .in('group_id', group_ids);

            if (!members || members.length === 0) {
                return NextResponse.json(
                    { error: 'No members found in selected groups' },
                    { status: 400 }
                );
            }

            const userIds = members.map(m => m.user_id);
            recipientQuery = recipientQuery.in('id', userIds);
        } else if (audience_type === 'custom_filter' && audience_filter) {
            // Apply custom filters
            if (audience_filter.status) {
                recipientQuery = recipientQuery.eq('status', audience_filter.status);
            }
            if (audience_filter.role) {
                recipientQuery = recipientQuery.eq('role', audience_filter.role);
            }
            if (audience_filter.wallet_balance_gt) {
                recipientQuery = recipientQuery.gte('wallet_balance', audience_filter.wallet_balance_gt);
            }
            if (audience_filter.wallet_balance_lt) {
                recipientQuery = recipientQuery.lte('wallet_balance', audience_filter.wallet_balance_lt);
            }
        } else {
            // For 'all' users, exclude admins
            recipientQuery = recipientQuery.neq('role', 'admin');
        }

        // Fetch recipients
        const { data: recipients, error: recipientsError } = await recipientQuery;

        if (recipientsError) {
            console.error('Error fetching recipients:', recipientsError);
            return NextResponse.json(
                { error: 'Failed to fetch recipients', details: recipientsError.message },
                { status: 500 }
            );
        }

        if (!recipients || recipients.length === 0) {
            return NextResponse.json(
                { error: 'No recipients found matching criteria' },
                { status: 400 }
            );
        }

        // Determine message status
        let status = 'draft';
        if (send_now) {
            status = 'sending';
        } else if (scheduled_for) {
            status = 'scheduled';
        }

        // Create message record
        const { data: message, error: messageError } = await supabase
            .from('communication_messages')
            .insert({
                campaign_name,
                channel,
                subject,
                email_body,
                sms_body,
                in_app_body,
                audience_type,
                audience_filter,
                group_ids,
                template_id,
                scheduled_for,
                status,
                total_recipients: recipients.length,
                created_by: user.id,
            })
            .select()
            .single();

        if (messageError) {
            console.error('Error creating message:', messageError);
            return NextResponse.json(
                { error: 'Failed to create message' },
                { status: 500 }
            );
        }

        // Create delivery logs for each recipient
        const deliveryLogs = [];

        for (const recipient of recipients) {
            // Create logs based on channel
            if (channel === 'email' || channel === 'email_sms' || channel === 'email_in_app' || channel === 'all') {
                if (recipient.email) {
                    deliveryLogs.push({
                        message_id: message.id,
                        user_id: recipient.id,
                        channel: 'email',
                        recipient_address: recipient.email,
                        status: send_now ? 'pending' : 'pending',
                    });
                }
            }

            if (channel === 'sms' || channel === 'email_sms' || channel === 'sms_in_app' || channel === 'all') {
                if (recipient.phone) {
                    deliveryLogs.push({
                        message_id: message.id,
                        user_id: recipient.id,
                        channel: 'sms',
                        recipient_address: recipient.phone,
                        status: send_now ? 'pending' : 'pending',
                    });
                }
            }

            if (channel === 'in_app' || channel === 'email_in_app' || channel === 'sms_in_app' || channel === 'all') {
                // In-app notifications always have recipient (user ID)
                deliveryLogs.push({
                    message_id: message.id,
                    user_id: recipient.id,
                    channel: 'in_app',
                    recipient_address: recipient.id, // User ID as "address" for in-app
                    status: send_now ? 'pending' : 'pending',
                });
            }
        }

        const { error: logsError } = await supabase
            .from('communication_delivery_logs')
            .insert(deliveryLogs);

        if (logsError) {
            console.error('Error creating delivery logs:', logsError);
            // Don't fail the request, just log the error
        }

        // If send_now, trigger actual sending
        if (send_now) {
            // Send emails via Resend
            if (channel === 'email' || channel === 'email_sms' || channel === 'email_in_app' || channel === 'all') {
                const emailPromises = recipients
                    .filter(r => r.email)
                    .map(async (recipient) => {
                        try {
                            // Replace template variables
                            let finalBody = email_body || '';
                            finalBody = finalBody.replace(/\{\{name\}\}/g, recipient.name || 'User');
                            finalBody = finalBody.replace(/\{\{email\}\}/g, recipient.email || '');
                            
                            const result = await sendEmail({
                                to: recipient.email!,
                                subject: subject || campaign_name,
                                body: finalBody,
                                from: process.env.RESEND_FROM_EMAIL,
                            });

                            // Update delivery log for this recipient
                            if (result.success) {
                                await supabase
                                    .from('communication_delivery_logs')
                                    .update({ 
                                        status: 'sent', 
                                        sent_at: new Date().toISOString(),
                                        provider_response: { resend_id: result.data?.id }
                                    })
                                    .eq('message_id', message.id)
                                    .eq('user_id', recipient.id)
                                    .eq('channel', 'email');
                            } else {
                                await supabase
                                    .from('communication_delivery_logs')
                                    .update({ 
                                        status: 'failed', 
                                        failed_at: new Date().toISOString(),
                                        error_message: result.error
                                    })
                                    .eq('message_id', message.id)
                                    .eq('user_id', recipient.id)
                                    .eq('channel', 'email');
                            }
                        } catch (error) {
                            console.error('Error sending email to', recipient.email, error);
                        }
                    });

                // Wait for all emails to send (max 30 seconds)
                await Promise.allSettled(emailPromises);
            }
            
            // For in-app notifications, create entries in the notifications table
            if (channel === 'in_app' || channel === 'email_in_app' || channel === 'sms_in_app' || channel === 'all') {
                const notificationsToInsert = recipients.map(recipient => {
                    // Replace template variables in in-app message
                    let finalBody = in_app_body || '';
                    finalBody = finalBody.replace(/\{\{name\}\}/g, recipient.name || 'User');
                    
                    return {
                        user_id: recipient.id,
                        type: 'admin_broadcast',
                        title: subject || campaign_name,
                        body: finalBody,
                        read: false,
                        metadata: {
                            campaign_id: message.id,
                            campaign_name,
                        },
                    };
                });

                const { error: notifError } = await supabase
                    .from('notifications')
                    .insert(notificationsToInsert);

                if (notifError) {
                    console.error('Error creating in-app notifications:', notifError);
                } else {
                    // Update in-app delivery logs to sent
                    await supabase
                        .from('communication_delivery_logs')
                        .update({ 
                            status: 'sent', 
                            sent_at: new Date().toISOString() 
                        })
                        .eq('message_id', message.id)
                        .eq('channel', 'in_app');
                }
            }
            
            // Update message status to sent
            await supabase
                .from('communication_messages')
                .update({ status: 'sent', sent_at: new Date().toISOString() })
                .eq('id', message.id);
        }

        return NextResponse.json({
            data: message,
            recipients_count: recipients.length,
            delivery_logs_created: deliveryLogs.length,
        });
    } catch (error) {
        console.error('POST /api/admin/communications error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
