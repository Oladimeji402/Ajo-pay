create or replace function public.mark_contribution_payment_success(
	p_payment_record_id uuid,
	p_contribution_id uuid,
	p_paid_at timestamptz,
	p_paystack_reference text,
	p_metadata jsonb,
	p_channel text,
	p_provider_reference text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
	current_status text;
begin
	select pr.status
	into current_status
	from public.payment_records pr
	where pr.id = p_payment_record_id
	for update;

	if current_status is null then
		return 'not_found';
	end if;

	if current_status = 'success' then
		return 'already_success';
	end if;

	update public.payment_records
	set
		status = 'success',
		paid_at = p_paid_at,
		metadata = coalesce(p_metadata, '{}'::jsonb),
		channel = p_channel,
		provider_reference = p_provider_reference
	where id = p_payment_record_id;

	if p_contribution_id is not null then
		update public.contributions
		set
			status = 'success',
			paid_at = p_paid_at,
			paystack_reference = p_paystack_reference
		where id = p_contribution_id;
	end if;

	return 'updated';
end;
$$;
