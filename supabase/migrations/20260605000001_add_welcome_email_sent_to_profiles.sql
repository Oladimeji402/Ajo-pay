-- Add welcome_email_sent column to profiles table
alter table public.profiles
add column if not exists welcome_email_sent boolean not null default false;

-- Create index for faster queries
create index if not exists idx_profiles_welcome_email_sent
on public.profiles (welcome_email_sent);

-- Add comment
comment on column public.profiles.welcome_email_sent is 'Tracks whether the welcome email has been sent to the user';
