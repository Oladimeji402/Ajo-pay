alter table public.groups
  add column if not exists whatsapp_group_phone text;

create index if not exists idx_groups_whatsapp_group_phone on public.groups (whatsapp_group_phone);
