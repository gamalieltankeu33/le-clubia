-- =====================================================================
-- 0079: Community Polls
-- =====================================================================

-- Add post_type to posts
alter table public.posts add column if not exists post_type text default 'text' not null;

-- Create poll_options table
create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  option_text text not null,
  created_at timestamptz default now() not null
);

create index if not exists idx_poll_options_post on public.poll_options(post_id);

-- Create poll_votes table
create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz default now() not null,
  unique (post_id, user_id)
);

create index if not exists idx_poll_votes_option on public.poll_votes(poll_option_id);
create index if not exists idx_poll_votes_user on public.poll_votes(user_id);
create index if not exists idx_poll_votes_post on public.poll_votes(post_id);

-- Add RLS to poll_options
alter table public.poll_options enable row level security;

drop policy if exists "Poll options are viewable by everyone." on public.poll_options;
create policy "Poll options are viewable by everyone." 
  on public.poll_options for select 
  using (true);

drop policy if exists "Users can insert poll options for their own posts." on public.poll_options;
create policy "Users can insert poll options for their own posts." 
  on public.poll_options for insert 
  with check (
    exists (
      select 1 from public.posts 
      where id = poll_options.post_id and user_id = auth.uid()
    )
  );

-- Add RLS to poll_votes
alter table public.poll_votes enable row level security;

drop policy if exists "Poll votes are viewable by everyone." on public.poll_votes;
create policy "Poll votes are viewable by everyone." 
  on public.poll_votes for select 
  using (true);

drop policy if exists "Users can vote on polls." on public.poll_votes;
create policy "Users can vote on polls." 
  on public.poll_votes for insert 
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own votes." on public.poll_votes;
create policy "Users can delete their own votes." 
  on public.poll_votes for delete 
  using (auth.uid() = user_id);
