create table if not exists public.group_members (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles (id) on delete cascade,
	group_id uuid not null references public.groups (id) on delete cascade,
	position integer not null check (position > 0),
	contribution_status text not null default 'upcoming' check (contribution_status in ('paid', 'pending', 'upcoming')),
	payout_status text not null default 'upcoming' check (payout_status in ('received', 'upcoming', 'your_turn')),
	payout_confirmed_at timestamptz,
	joined_at timestamptz not null default timezone('utc', now()),
	unique (user_id, group_id),
	unique (group_id, position)
);

create index if not exists idx_group_members_group on public.group_members (group_id);
create index if not exists idx_group_members_user on public.group_members (user_id);

