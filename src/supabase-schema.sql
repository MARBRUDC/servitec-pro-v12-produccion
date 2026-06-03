-- SERVITEC PRO V13.17.1 - PARCHE QUIRURGICO DE NUBE
-- Mantiene la programacion funcional de V13/V13.17 y solo asegura persistencia del estado completo.

create table if not exists public.app_state (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table public.app_state disable row level security;

insert into public.app_state (id,payload,updated_at)
values ('global','{}'::jsonb,now())
on conflict (id) do nothing;

NOTIFY pgrst, 'reload schema';
