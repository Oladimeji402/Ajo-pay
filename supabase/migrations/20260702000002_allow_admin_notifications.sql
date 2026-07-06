-- Allow admins to create notifications for users (for in-app broadcasts)
-- Created: 2026-07-02

-- Update the insert policy to allow admins to create notifications for any user
DROP POLICY IF EXISTS notifications_insert_own ON public.notifications;

CREATE POLICY notifications_insert_own
	ON public.notifications
	FOR INSERT
	TO authenticated
	WITH CHECK (
		user_id = auth.uid() 
		OR 
		EXISTS (
			SELECT 1 FROM profiles 
			WHERE profiles.id = auth.uid() 
			AND profiles.role = 'admin'
		)
	);

COMMENT ON POLICY notifications_insert_own ON public.notifications IS 'Users can create their own notifications, admins can create notifications for any user';
