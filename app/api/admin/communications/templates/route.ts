import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// ============================================================================
// GET /api/admin/communications/templates - List all templates
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
        const channel = searchParams.get('channel') || 'all';
        const category = searchParams.get('category') || 'all';
        const active_only = searchParams.get('active_only') === 'true';

        // Build query
        let query = supabase
            .from('communication_templates')
            .select('*')
            .order('created_at', { ascending: false });

        if (channel !== 'all') {
            query = query.eq('channel', channel);
        }

        if (category !== 'all') {
            query = query.eq('category', category);
        }

        if (active_only) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching templates:', error);
            
            // Check if table doesn't exist
            if (error.message?.includes('relation "communication_templates" does not exist')) {
                return NextResponse.json({ 
                    error: 'Communication tables not found. Please run the database migration first.',
                    data: []
                });
            }
            
            return NextResponse.json(
                { error: 'Failed to fetch templates' },
                { status: 500 }
            );
        }

        return NextResponse.json({ data: data || [] });
    } catch (error) {
        console.error('GET /api/admin/communications/templates error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// ============================================================================
// POST /api/admin/communications/templates - Create a new template
// ============================================================================

const createTemplateSchema = z.object({
    name: z.string().min(1, 'Template name is required'),
    description: z.string().optional(),
    channel: z.enum(['email', 'sms', 'in_app', 'email_sms', 'email_in_app', 'sms_in_app', 'all']),
    subject: z.string().optional(),
    email_body: z.string().optional(),
    sms_body: z.string().optional(),
    in_app_body: z.string().optional(),
    category: z.string().optional(),
    variables: z.array(z.string()).default([]),
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
        const parsed = createTemplateSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid request data', details: parsed.error.issues },
                { status: 400 }
            );
        }

        const {
            name,
            description,
            channel,
            subject,
            email_body,
            sms_body,
            in_app_body,
            category,
            variables,
        } = parsed.data;

        // Validate channel-specific content
        if ((channel === 'email' || channel === 'email_sms' || channel === 'email_in_app' || channel === 'all') && !email_body) {
            return NextResponse.json(
                { error: 'Email body is required for email templates' },
                { status: 400 }
            );
        }

        if ((channel === 'sms' || channel === 'email_sms' || channel === 'sms_in_app' || channel === 'all') && !sms_body) {
            return NextResponse.json(
                { error: 'SMS body is required for SMS templates' },
                { status: 400 }
            );
        }

        if ((channel === 'in_app' || channel === 'email_in_app' || channel === 'sms_in_app' || channel === 'all') && !in_app_body) {
            return NextResponse.json(
                { error: 'In-app body is required for in-app templates' },
                { status: 400 }
            );
        }

        // Create template
        const { data: template, error } = await supabase
            .from('communication_templates')
            .insert({
                name,
                description,
                channel,
                subject,
                email_body,
                sms_body,
                in_app_body,
                category,
                variables,
                created_by: user.id,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating template:', error);
            return NextResponse.json(
                { error: 'Failed to create template' },
                { status: 500 }
            );
        }

        return NextResponse.json({ data: template });
    } catch (error) {
        console.error('POST /api/admin/communications/templates error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
