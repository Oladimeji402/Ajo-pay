-- Add NIN and BVN fields to profiles table for virtual account creation
begin;

alter table if exists public.profiles
  add column if not exists nin text,
  add column if not exists bvn text;

-- Add indexes for potential lookups
create index if not exists idx_profiles_nin
  on public.profiles (nin) where nin is not null;

create index if not exists idx_profiles_bvn
  on public.profiles (bvn) where bvn is not null;

-- Add comments for documentation
comment on column public.profiles.nin is 
'National Identification Number - required for virtual account creation';

comment on column public.profiles.bvn is 
'Bank Verification Number - required for virtual account creation';

commit;
