create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = timezone('utc', now());
	return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.update_updated_at_column();

drop trigger if exists set_groups_updated_at on public.groups;
create trigger set_groups_updated_at
before update on public.groups
for each row
execute function public.update_updated_at_column();

drop trigger if exists set_contributions_updated_at on public.contributions;
create trigger set_contributions_updated_at
before update on public.contributions
for each row
execute function public.update_updated_at_column();

drop trigger if exists set_payment_records_updated_at on public.payment_records;
create trigger set_payment_records_updated_at
before update on public.payment_records
for each row
execute function public.update_updated_at_column();

drop trigger if exists set_payouts_updated_at on public.payouts;
create trigger set_payouts_updated_at
before update on public.payouts
for each row
execute function public.update_updated_at_column();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	insert into public.profiles (id, name, email, phone)
	values (
		new.id,
		coalesce(new.raw_user_meta_data ->> 'name', ''),
		coalesce(new.email, ''),
		new.phone
	)
	on conflict (id) do update
	set email = excluded.email;

	return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create or replace function public.generate_invite_code()
returns text
language plpgsql
as $$
declare
	new_code text;
begin
	loop
		new_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10));
		exit when not exists (
			select 1 from public.groups g where g.invite_code = new_code
		);
	end loop;

	return new_code;
end;
$$;

alter table public.groups
	alter column invite_code set default public.generate_invite_code();

create or replace function public.refresh_user_contribution_totals(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
	update public.profiles p
	set total_contributed = coalesce((
			select sum(c.amount)
			from public.contributions c
			where c.user_id = target_user_id
				and c.status = 'success'
		), 0),
		wallet_balance = coalesce((
			select sum(c.amount)
			from public.contributions c
			where c.user_id = target_user_id
				and c.status = 'success'
		), 0),
		updated_at = timezone('utc', now())
	where p.id = target_user_id;
end;
$$;

create or replace function public.handle_contribution_totals_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	if tg_op = 'INSERT' then
		perform public.refresh_user_contribution_totals(new.user_id);
		return new;
	elsif tg_op = 'UPDATE' then
		perform public.refresh_user_contribution_totals(new.user_id);
		if old.user_id is distinct from new.user_id then
			perform public.refresh_user_contribution_totals(old.user_id);
		end if;
		return new;
	elsif tg_op = 'DELETE' then
		perform public.refresh_user_contribution_totals(old.user_id);
		return old;
	end if;

	return null;
end;
$$;

drop trigger if exists sync_contribution_totals on public.contributions;
create trigger sync_contribution_totals
after insert or update or delete on public.contributions
for each row
execute function public.handle_contribution_totals_sync();

