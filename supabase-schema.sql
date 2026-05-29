create table if not exists public.app_state (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz default now()
);
alter table public.app_state enable row level security;
drop policy if exists "app_state_select" on public.app_state;
drop policy if exists "app_state_insert" on public.app_state;
drop policy if exists "app_state_update" on public.app_state;
create policy "app_state_select" on public.app_state for select using (true);
create policy "app_state_insert" on public.app_state for insert with check (true);
create policy "app_state_update" on public.app_state for update using (true);
insert into public.app_state (id,payload) values ('global','{}'::jsonb) on conflict (id) do nothing;
