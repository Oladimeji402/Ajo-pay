-- External marketer partners with referral codes for signup attribution.

create table if not exists public.marketers (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	email text,
	phone text,
	referral_code text not null unique,
	status text not null default 'active' check (status in ('active', 'inactive')),
	notes text,
	created_by uuid references public.profiles (id) on delete set null,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_marketers_referral_code on public.marketers (referral_code);
create index if not exists idx_marketers_status on public.marketers (status);

alter table public.profiles
	add column if not exists marketer_id uuid references public.marketers (id) on delete set null,
	add column if not exists referral_code_used text;

create index if not exists idx_profiles_marketer_id on public.profiles (marketer_id);

comment on table public.marketers is
'External marketing partners managed in admin; each has a unique referral code for signup attribution.';

comment on column public.profiles.marketer_id is
'Marketer who referred this user at signup, if any.';

comment on column public.profiles.referral_code_used is
'Raw referral code entered at signup time (audit trail).';

create or replace function public.generate_marketer_referral_code()
returns text
language plpgsql
as $$
declare
	new_code text;
begin
	loop
		new_code := 'MK-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
		exit when not exists (
			select 1 from public.marketers m where m.referral_code = new_code
		);
	end loop;
	return new_code;
end;
$$;

drop trigger if exists set_marketers_updated_at on public.marketers;
create trigger set_marketers_updated_at
before update on public.marketers
for each row
execute function public.update_updated_at_column();

alter table public.marketers enable row level security;

drop policy if exists marketers_admin_all on public.marketers;
create policy marketers_admin_all
on public.marketers
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));
