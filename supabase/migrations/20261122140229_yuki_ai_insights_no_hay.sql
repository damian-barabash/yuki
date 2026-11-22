-- AI coach memory: every generated insight (so tips rotate focus and never repeat),
-- plus a same-data cache. Service-role only — no anon policies.
create table if not exists public.ai_insights (
  id bigint generated always as identity primary key,
  scope text not null,
  day date not null,
  sig text not null,
  focus text,
  title text,
  body text,
  actions jsonb not null default '[]'::jsonb,
  source text not null default 'rules',
  created_at timestamptz not null default now()
);
create index if not exists ai_insights_lookup on public.ai_insights (scope, day, sig, created_at desc);
alter table public.ai_insights enable row level security;

-- Hay is always available 24/7 — it is a given, not something to log.
delete from public.foods where slug = 'hay';
