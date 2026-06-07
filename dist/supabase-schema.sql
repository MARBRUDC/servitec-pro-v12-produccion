create table if not exists app_state (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz default now()
);
