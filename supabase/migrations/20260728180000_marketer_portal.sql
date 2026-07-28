-- Marketer self-signup: application status, linked auth user, passport, tasks.

-- Expand marketers status for application lifecycle.
alter table public.marketers
	drop constraint if exists marketers_status_check;

alter table public.marketers
	add constraint marketers_status_check
	check (status in ('pending', 'active', 'rejected', 'inactive'));

alter table public.marketers
	add column if not exists user_id uuid unique references public.profiles (id) on delete set null,
	add column if not exists passport_path text,
	add column if not exists rejection_reason text,
	add column if not exists reviewed_at timestamptz,
	add column if not exists reviewed_by uuid references public.profiles (id) on delete set null;

create index if not exists idx_marketers_user_id on public.marketers (user_id);
create index if not exists idx_marketers_status on public.marketers (status);

comment on column public.marketers.user_id is
'Linked auth profile for self-serve marketers; null for admin-created partners without login.';

comment on column public.marketers.passport_path is
'Private storage path in marketer-passports bucket.';

-- Marketer tasks assigned by admins.
create table if not exists public.marketer_tasks (
	id uuid primary key default gen_random_uuid(),
	marketer_id uuid not null references public.marketers (id) on delete cascade,
	title text not null,
	description text not null default '',
	status text not null default 'open'
		check (status in ('open', 'in_progress', 'done', 'cancelled')),
	due_at timestamptz,
	created_by uuid references public.profiles (id) on delete set null,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_marketer_tasks_marketer_id on public.marketer_tasks (marketer_id);
create index if not exists idx_marketer_tasks_status on public.marketer_tasks (status);

drop trigger if exists set_marketer_tasks_updated_at on public.marketer_tasks;
create trigger set_marketer_tasks_updated_at
before update on public.marketer_tasks
for each row
execute function public.update_updated_at_column();

alter table public.marketer_tasks enable row level security;

drop policy if exists marketer_tasks_admin_all on public.marketer_tasks;
create policy marketer_tasks_admin_all
on public.marketer_tasks
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Active marketers can read/update their own tasks.
drop policy if exists marketer_tasks_own_select on public.marketer_tasks;
create policy marketer_tasks_own_select
on public.marketer_tasks
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

drop policy if exists marketer_tasks_own_update on public.marketer_tasks;
create policy marketer_tasks_own_update
on public.marketer_tasks
for update
to authenticated
using (
	exists (
		select 1
		from public.marketers m
		where m.id = marketer_id
			and m.user_id = auth.uid()
			and m.status = 'active'
	)
)
with check (
	exists (
		select 1
		from public.marketers m
		where m.id = marketer_id
			and m.user_id = auth.uid()
			and m.status = 'active'
	)
);

-- Marketers can read their own marketer row (any application status).
drop policy if exists marketers_select_own on public.marketers;
create policy marketers_select_own
on public.marketers
for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

-- Private passport storage bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
	'marketer-passports',
	'marketer-passports',
	false,
	5242880,
	'{image/jpeg,image/png}'
)
on conflict (id) do update
	set public = false,
		file_size_limit = 5242880,
		allowed_mime_types = '{image/jpeg,image/png}';

drop policy if exists "Admins can view marketer passports" on storage.objects;
create policy "Admins can view marketer passports"
	on storage.objects
	for select
	to authenticated
	using (
		bucket_id = 'marketer-passports'
		and exists (
			select 1 from public.profiles
			where id = auth.uid()
				and role = 'admin'
				and status = 'active'
		)
	);

drop policy if exists "Marketers can view own passport" on storage.objects;
create policy "Marketers can view own passport"
	on storage.objects
	for select
	to authenticated
	using (
		bucket_id = 'marketer-passports'
		and (storage.foldername(name))[1] = auth.uid()::text
	);
