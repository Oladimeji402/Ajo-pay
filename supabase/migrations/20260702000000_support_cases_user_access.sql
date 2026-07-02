-- Allow users to create their own support cases
drop policy if exists support_cases_insert_own on public.support_cases;
create policy support_cases_insert_own
on public.support_cases
for insert
to authenticated
with check (user_id = auth.uid());

-- Allow users to view their own support cases
drop policy if exists support_cases_select_own on public.support_cases;
create policy support_cases_select_own
on public.support_cases
for select
to authenticated
using (user_id = auth.uid());

-- Allow users to insert events on their own support cases
drop policy if exists support_case_events_insert_own on public.support_case_events;
create policy support_case_events_insert_own
on public.support_case_events
for insert
to authenticated
with check (
    exists (
        select 1 from public.support_cases
        where id = case_id
        and user_id = auth.uid()
    )
);

-- Allow users to view events on their own support cases
drop policy if exists support_case_events_select_own on public.support_case_events;
create policy support_case_events_select_own
on public.support_case_events
for select
to authenticated
using (
    exists (
        select 1 from public.support_cases
        where id = case_id
        and user_id = auth.uid()
    )
);

-- Allow admins to insert events on any support case
drop policy if exists support_case_events_insert_admin on public.support_case_events;
create policy support_case_events_insert_admin
on public.support_case_events
for insert
to authenticated
with check (public.is_admin(auth.uid()));

-- Allow admins to view all support case events
drop policy if exists support_case_events_select_admin on public.support_case_events;
create policy support_case_events_select_admin
on public.support_case_events
for select
to authenticated
using (public.is_admin(auth.uid()));

-- Add message column to support_case_events if it doesn't exist
do $$
begin
    if not exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
        and table_name = 'support_case_events'
        and column_name = 'message'
    ) then
        alter table public.support_case_events add column message text;
    end if;
end $$;

-- Update status constraint to match what we're using in the app
alter table public.support_cases drop constraint if exists support_cases_status_check;
alter table public.support_cases add constraint support_cases_status_check
  check (status in ('open', 'in-progress', 'resolved', 'closed'));
