-- Recurring marketer tasks: frequency on assignments + per-period completion log.
-- Additive only; existing one-off tasks default to frequency = 'once'.

alter table public.marketer_tasks
	add column if not exists frequency text not null default 'once',
	add column if not exists timezone text not null default 'Africa/Lagos',
	add column if not exists starts_at timestamptz not null default timezone('utc', now()),
	add column if not exists ends_at timestamptz,
	add column if not exists completed_at timestamptz;

alter table public.marketer_tasks
	drop constraint if exists marketer_tasks_frequency_check;

alter table public.marketer_tasks
	add constraint marketer_tasks_frequency_check
	check (frequency in ('once', 'daily', 'weekly', 'monthly'));

comment on column public.marketer_tasks.frequency is
'once = one-off; daily/weekly/monthly = lasting assignment with period completions.';

comment on column public.marketer_tasks.completed_at is
'Set when a one-off task is marked done. Recurring tasks use marketer_task_completions.';

-- Backfill starts_at from created_at for any rows created before this migration.
update public.marketer_tasks
set starts_at = created_at
where starts_at is distinct from created_at
	and created_at is not null;

create table if not exists public.marketer_task_completions (
	id uuid primary key default gen_random_uuid(),
	task_id uuid not null references public.marketer_tasks (id) on delete cascade,
	marketer_id uuid not null references public.marketers (id) on delete cascade,
	period_key text not null,
	completed_at timestamptz not null default timezone('utc', now()),
	unique (task_id, period_key)
);

create index if not exists idx_marketer_task_completions_task_id
	on public.marketer_task_completions (task_id);

create index if not exists idx_marketer_task_completions_marketer_id
	on public.marketer_task_completions (marketer_id);

create index if not exists idx_marketer_task_completions_period_key
	on public.marketer_task_completions (period_key);

comment on table public.marketer_task_completions is
'Per-period completion log for recurring marketer tasks. period_key is daily YYYY-MM-DD, weekly YYYY-Www, or monthly YYYY-MM.';

alter table public.marketer_task_completions enable row level security;

drop policy if exists marketer_task_completions_admin_all on public.marketer_task_completions;
create policy marketer_task_completions_admin_all
on public.marketer_task_completions
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists marketer_task_completions_own_select on public.marketer_task_completions;
create policy marketer_task_completions_own_select
on public.marketer_task_completions
for select
to authenticated
using (
	exists (
		select 1
		from public.marketers m
		where m.id = marketer_id
			and m.user_id = auth.uid()
			and m.status = 'active'
	)
);

drop policy if exists marketer_task_completions_own_insert on public.marketer_task_completions;
create policy marketer_task_completions_own_insert
on public.marketer_task_completions
for insert
to authenticated
with check (
	exists (
		select 1
		from public.marketers m
		where m.id = marketer_id
			and m.user_id = auth.uid()
			and m.status = 'active'
	)
);
