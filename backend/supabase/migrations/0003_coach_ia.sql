-- =====================================================================
-- Le Club IA — Migration 0003 : Coach IA conversationnel
-- Tables : coach_conversations, coach_messages
-- Idempotente. Dépend de 0001_init.sql (helper set_updated_at).
-- =====================================================================

-- ---------- Type enum ----------
do $$ begin
  create type coach_message_role as enum ('user', 'assistant');
exception when duplicate_object then null; end $$;

-- =====================================================================
-- coach_conversations
-- =====================================================================
create table if not exists public.coach_conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null default 'Nouvelle conversation',
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

create index if not exists idx_coach_conv_user_recent
  on public.coach_conversations(user_id, updated_at desc);

drop trigger if exists trg_coach_conv_updated_at on public.coach_conversations;
create trigger trg_coach_conv_updated_at
  before update on public.coach_conversations
  for each row execute function public.set_updated_at();

-- =====================================================================
-- coach_messages
-- =====================================================================
create table if not exists public.coach_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.coach_conversations(id) on delete cascade,
  role            coach_message_role not null,
  content         text not null,
  tokens_used     integer,
  created_at      timestamptz default now() not null
);

create index if not exists idx_coach_messages_conversation
  on public.coach_messages(conversation_id, created_at);

create index if not exists idx_coach_messages_role_created
  on public.coach_messages(role, created_at);

-- À chaque insert d'un message, on bump `updated_at` de la conversation parente.
create or replace function public.bump_coach_conversation_updated_at()
returns trigger
language plpgsql
as $$
begin
  update public.coach_conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists trg_coach_msg_bump_conv on public.coach_messages;
create trigger trg_coach_msg_bump_conv
  after insert on public.coach_messages
  for each row execute function public.bump_coach_conversation_updated_at();

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

-- ----- coach_conversations -----
alter table public.coach_conversations enable row level security;

drop policy if exists "coach_conv select self" on public.coach_conversations;
create policy "coach_conv select self" on public.coach_conversations
  for select using (auth.uid() = user_id);

drop policy if exists "coach_conv insert self" on public.coach_conversations;
create policy "coach_conv insert self" on public.coach_conversations
  for insert with check (auth.uid() = user_id);

drop policy if exists "coach_conv update self" on public.coach_conversations;
create policy "coach_conv update self" on public.coach_conversations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "coach_conv delete self" on public.coach_conversations;
create policy "coach_conv delete self" on public.coach_conversations
  for delete using (auth.uid() = user_id);

-- ----- coach_messages -----
alter table public.coach_messages enable row level security;

drop policy if exists "coach_msg select via conversation" on public.coach_messages;
create policy "coach_msg select via conversation" on public.coach_messages
  for select using (
    exists (
      select 1 from public.coach_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "coach_msg insert via conversation" on public.coach_messages;
create policy "coach_msg insert via conversation" on public.coach_messages
  for insert with check (
    exists (
      select 1 from public.coach_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "coach_msg delete via conversation" on public.coach_messages;
create policy "coach_msg delete via conversation" on public.coach_messages
  for delete using (
    exists (
      select 1 from public.coach_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );
