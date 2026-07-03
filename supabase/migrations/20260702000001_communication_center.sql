-- Communication Center: Bulk Email/SMS System
-- Created: 2026-07-02

-- ============================================================================
-- 1. Communication Templates Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS communication_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'in_app', 'email_sms', 'email_in_app', 'sms_in_app', 'all')),
    
    -- Email fields
    subject TEXT,
    email_body TEXT,
    
    -- SMS fields
    sms_body TEXT,
    
    -- In-app notification fields
    in_app_body TEXT,
    
    -- Template variables (e.g., {{name}}, {{group_name}}, {{amount}})
    variables JSONB DEFAULT '[]'::JSONB,
    
    -- Metadata
    category TEXT, -- e.g., 'payment_reminder', 'announcement', 'payout_notification'
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_communication_templates_channel ON communication_templates(channel);
CREATE INDEX idx_communication_templates_category ON communication_templates(category);
CREATE INDEX idx_communication_templates_active ON communication_templates(is_active);

-- ============================================================================
-- 2. Communication Messages Table (Campaign/Broadcast records)
-- ============================================================================
CREATE TABLE IF NOT EXISTS communication_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_name TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'in_app', 'email_sms', 'email_in_app', 'sms_in_app', 'all')),
    
    -- Message content
    subject TEXT, -- For email and in-app notification title
    email_body TEXT,
    sms_body TEXT,
    in_app_body TEXT, -- For in-app notifications
    
    -- Audience targeting
    audience_type TEXT NOT NULL CHECK (audience_type IN ('all', 'group_members', 'custom_filter')),
    audience_filter JSONB, -- Store filter criteria for custom audiences
    group_ids UUID[], -- Array of group IDs if audience_type = 'group_members'
    
    -- Scheduling
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled')),
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    
    -- Statistics
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    
    -- Metadata
    template_id UUID REFERENCES communication_templates(id) ON DELETE SET NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_communication_messages_status ON communication_messages(status);
CREATE INDEX idx_communication_messages_channel ON communication_messages(channel);
CREATE INDEX idx_communication_messages_scheduled ON communication_messages(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_communication_messages_created_by ON communication_messages(created_by);

-- ============================================================================
-- 3. Communication Delivery Logs Table (Per-recipient tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS communication_delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES communication_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Delivery details
    channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'in_app')),
    recipient_address TEXT NOT NULL, -- Email address or phone number
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
    
    -- Error tracking
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Provider details (for future integration with email/SMS providers)
    provider_reference TEXT,
    provider_response JSONB,
    
    -- Timestamps
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_delivery_logs_message ON communication_delivery_logs(message_id);
CREATE INDEX idx_delivery_logs_user ON communication_delivery_logs(user_id);
CREATE INDEX idx_delivery_logs_status ON communication_delivery_logs(status);
CREATE INDEX idx_delivery_logs_channel ON communication_delivery_logs(channel);

-- ============================================================================
-- 4. Row-Level Security Policies
-- ============================================================================

-- Communication Templates: Admin-only access
ALTER TABLE communication_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all templates"
    ON communication_templates FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can create templates"
    ON communication_templates FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update templates"
    ON communication_templates FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Communication Messages: Admin-only access
ALTER TABLE communication_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all messages"
    ON communication_messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can create messages"
    ON communication_messages FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update messages"
    ON communication_messages FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Delivery Logs: Admin-only access
ALTER TABLE communication_delivery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all delivery logs"
    ON communication_delivery_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can create delivery logs"
    ON communication_delivery_logs FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update delivery logs"
    ON communication_delivery_logs FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================================================
-- 5. Helper Functions
-- ============================================================================

-- Function to update template usage count
CREATE OR REPLACE FUNCTION increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.template_id IS NOT NULL THEN
        UPDATE communication_templates
        SET usage_count = usage_count + 1
        WHERE id = NEW.template_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_template_usage
    AFTER INSERT ON communication_messages
    FOR EACH ROW
    EXECUTE FUNCTION increment_template_usage();

-- Function to update message statistics when delivery logs change
CREATE OR REPLACE FUNCTION update_message_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update sent count
    UPDATE communication_messages
    SET 
        sent_count = (
            SELECT COUNT(*) 
            FROM communication_delivery_logs 
            WHERE message_id = NEW.message_id 
            AND status IN ('sent', 'delivered')
        ),
        failed_count = (
            SELECT COUNT(*) 
            FROM communication_delivery_logs 
            WHERE message_id = NEW.message_id 
            AND status IN ('failed', 'bounced')
        ),
        delivered_count = (
            SELECT COUNT(*) 
            FROM communication_delivery_logs 
            WHERE message_id = NEW.message_id 
            AND status = 'delivered'
        )
    WHERE id = NEW.message_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_message_statistics
    AFTER INSERT OR UPDATE ON communication_delivery_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_message_statistics();

-- ============================================================================
-- 6. Default Templates
-- ============================================================================

-- Insert default payment reminder template
INSERT INTO communication_templates (name, description, channel, subject, email_body, sms_body, in_app_body, category, variables)
VALUES (
    'Payment Reminder',
    'Remind users about upcoming payment deadlines',
    'all',
    'Payment Reminder: {{group_name}}',
    'Hi {{name}},

This is a friendly reminder that your contribution of {{amount}} for {{group_name}} is due on {{due_date}}.

Please ensure you make the payment before the deadline to avoid missing your spot.

Thank you!
Ajo Pay Team',
    'Hi {{name}}, reminder: Your contribution of {{amount}} for {{group_name}} is due on {{due_date}}. Pay now to stay on track!',
    'Your contribution of {{amount}} for {{group_name}} is due on {{due_date}}. Please make payment to stay on track.',
    'payment_reminder',
    '["name", "group_name", "amount", "due_date"]'::JSONB
);

-- Insert default payout notification template
INSERT INTO communication_templates (name, description, channel, subject, email_body, sms_body, in_app_body, category, variables)
VALUES (
    'Payout Notification',
    'Notify users about successful payouts',
    'all',
    'Payout Received: {{amount}}',
    'Hi {{name}},

Great news! Your payout of {{amount}} for {{group_name}} has been processed successfully.

The funds should reflect in your bank account within 24-48 hours.

Transaction Reference: {{reference}}

Thank you for using Ajo Pay!',
    'Hi {{name}}, your payout of {{amount}} for {{group_name}} has been processed. Ref: {{reference}}',
    'Your payout of {{amount}} for {{group_name}} has been processed successfully. Transaction Reference: {{reference}}',
    'payout_notification',
    '["name", "group_name", "amount", "reference"]'::JSONB
);

-- Insert default announcement template
INSERT INTO communication_templates (name, description, channel, subject, email_body, sms_body, in_app_body, category, variables)
VALUES (
    'Platform Announcement',
    'General platform updates and announcements',
    'all',
    '{{title}}',
    'Hi {{name}},

{{message}}

Best regards,
Ajo Pay Team',
    'Hi {{name}}, {{message}}',
    '{{message}}',
    'announcement',
    '["name", "title", "message"]'::JSONB
);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE communication_templates IS 'Reusable message templates for bulk communications';
COMMENT ON TABLE communication_messages IS 'Campaign/broadcast messages sent to users';
COMMENT ON TABLE communication_delivery_logs IS 'Per-recipient delivery tracking for each message';

COMMENT ON COLUMN communication_messages.audience_type IS 'Defines target audience: all users, specific groups, or custom filter';
COMMENT ON COLUMN communication_messages.audience_filter IS 'JSON criteria for custom audience (e.g., {"wallet_balance_gt": 1000, "status": "active"})';
COMMENT ON COLUMN communication_delivery_logs.provider_reference IS 'External provider message ID for tracking';
