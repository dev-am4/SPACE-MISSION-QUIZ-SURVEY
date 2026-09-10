create table if not exists public.quiz_sessions (
  id text primary key,
  certificate_id text not null unique,
  participant_name text not null,
  knowledge_score integer not null default 0,
  knowledge_total integer not null default 20,
  started_at timestamptz,
  confirmed_at timestamptz,
  finished_at timestamptz not null,
  answers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists quiz_sessions_finished_at_idx
  on public.quiz_sessions (finished_at desc);

create index if not exists quiz_sessions_certificate_id_idx
  on public.quiz_sessions (certificate_id);

alter table public.quiz_sessions enable row level security;

-- No public INSERT/SELECT policies are created intentionally.
-- The kiosk writes and reads certificate records through Vercel serverless API routes
-- using SUPABASE_SERVICE_ROLE_KEY on the server only.
