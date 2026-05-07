-- =====================================================================
-- Le Club IA — Migration initiale (V1)
-- Crée toutes les tables, types enum, indexes et politiques RLS.
-- Idempotente : utilise CREATE ... IF NOT EXISTS / CREATE OR REPLACE.
-- =====================================================================

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";

-- ---------- Types enum ----------
do $$ begin
  create type user_role as enum ('member', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscription_plan as enum ('member', 'free_trial');
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscription_status as enum ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'unpaid');
exception when duplicate_object then null; end $$;

do $$ begin
  create type formation_level as enum ('debutant', 'intermediaire', 'avance');
exception when duplicate_object then null; end $$;

do $$ begin
  create type resource_type as enum ('prompt', 'template', 'guide_pdf', 'tool_link');
exception when duplicate_object then null; end $$;

-- =====================================================================
-- Helper : trigger updated_at
-- =====================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
-- Helper : un membre est-il "actif" (abonnement valide)
-- =====================================================================
create or replace function public.is_active_member(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = uid
      and s.status in ('active', 'trialing')
      and (s.current_period_end is null or s.current_period_end > now())
  );
$$;

-- =====================================================================
-- Helper : l'utilisateur est-il admin
-- =====================================================================
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.role = 'admin'
  );
$$;

-- =====================================================================
-- 1. profiles
-- =====================================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text unique not null,
  first_name    text,
  last_name     text,
  avatar_url    text,
  bio           text,
  interests     text[] default '{}'::text[] not null,
  onboarding_completed boolean default false not null,
  role          user_role default 'member' not null,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-création du profil quand un utilisateur s'inscrit
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- 2. subscriptions
-- =====================================================================
create table if not exists public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references public.profiles(id) on delete cascade,
  stripe_customer_id      text,
  stripe_subscription_id  text unique,
  plan                    subscription_plan default 'member' not null,
  status                  subscription_status not null,
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  created_at              timestamptz default now() not null,
  updated_at              timestamptz default now() not null
);

create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_stripe_customer on public.subscriptions(stripe_customer_id);

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 3. formations
-- =====================================================================
create table if not exists public.formations (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  title           text not null,
  description     text,
  category        text not null,
  cover_image_url text,
  level           formation_level default 'debutant' not null,
  duration_minutes integer default 0 not null,
  is_published    boolean default false not null,
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null
);

create index if not exists idx_formations_category on public.formations(category);
create index if not exists idx_formations_published on public.formations(is_published);

drop trigger if exists trg_formations_updated_at on public.formations;
create trigger trg_formations_updated_at
  before update on public.formations
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 4. formation_chapters
-- =====================================================================
create table if not exists public.formation_chapters (
  id               uuid primary key default gen_random_uuid(),
  formation_id     uuid not null references public.formations(id) on delete cascade,
  order_index      integer not null,
  title            text not null,
  description      text,
  video_url        text,
  resources        jsonb default '[]'::jsonb not null,
  duration_minutes integer default 0 not null,
  created_at       timestamptz default now() not null,
  updated_at       timestamptz default now() not null,
  unique (formation_id, order_index)
);

create index if not exists idx_chapters_formation on public.formation_chapters(formation_id);

drop trigger if exists trg_chapters_updated_at on public.formation_chapters;
create trigger trg_chapters_updated_at
  before update on public.formation_chapters
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 5. user_formation_progress
-- =====================================================================
create table if not exists public.user_formation_progress (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.profiles(id) on delete cascade,
  formation_id          uuid not null references public.formations(id) on delete cascade,
  chapter_id            uuid not null references public.formation_chapters(id) on delete cascade,
  completed             boolean default false not null,
  completed_at          timestamptz,
  last_position_seconds integer default 0 not null,
  created_at            timestamptz default now() not null,
  updated_at            timestamptz default now() not null,
  unique (user_id, chapter_id)
);

create index if not exists idx_progress_user on public.user_formation_progress(user_id);
create index if not exists idx_progress_formation on public.user_formation_progress(user_id, formation_id);

drop trigger if exists trg_progress_updated_at on public.user_formation_progress;
create trigger trg_progress_updated_at
  before update on public.user_formation_progress
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 6. posts
-- =====================================================================
create table if not exists public.posts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  content         text not null,
  image_url       text,
  link_url        text,
  hashtags        text[] default '{}'::text[] not null,
  likes_count     integer default 0 not null,
  comments_count  integer default 0 not null,
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null
);

create index if not exists idx_posts_user on public.posts(user_id);
create index if not exists idx_posts_created on public.posts(created_at desc);
create index if not exists idx_posts_hashtags on public.posts using gin(hashtags);

drop trigger if exists trg_posts_updated_at on public.posts;
create trigger trg_posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 7. post_likes
-- =====================================================================
create table if not exists public.post_likes (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz default now() not null,
  unique (post_id, user_id)
);

create index if not exists idx_post_likes_post on public.post_likes(post_id);

-- Triggers de comptage
create or replace function public.bump_post_likes_count()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts set likes_count = likes_count + 1 where id = new.post_id;
    return new;
  elsif TG_OP = 'DELETE' then
    update public.posts set likes_count = greatest(0, likes_count - 1) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_post_likes_count on public.post_likes;
create trigger trg_post_likes_count
  after insert or delete on public.post_likes
  for each row execute function public.bump_post_likes_count();

-- =====================================================================
-- 8. post_comments
-- =====================================================================
create table if not exists public.post_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  content     text not null,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

create index if not exists idx_post_comments_post on public.post_comments(post_id);

drop trigger if exists trg_post_comments_updated_at on public.post_comments;
create trigger trg_post_comments_updated_at
  before update on public.post_comments
  for each row execute function public.set_updated_at();

create or replace function public.bump_post_comments_count()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts set comments_count = comments_count + 1 where id = new.post_id;
    return new;
  elsif TG_OP = 'DELETE' then
    update public.posts set comments_count = greatest(0, comments_count - 1) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_post_comments_count on public.post_comments;
create trigger trg_post_comments_count
  after insert or delete on public.post_comments
  for each row execute function public.bump_post_comments_count();

-- =====================================================================
-- 9. news_articles
-- =====================================================================
create table if not exists public.news_articles (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  title            text not null,
  content          text not null,
  cover_image_url  text,
  category         text not null,
  source_url       text,
  author           text,
  is_published     boolean default false not null,
  published_at     timestamptz,
  created_at       timestamptz default now() not null,
  updated_at       timestamptz default now() not null
);

create index if not exists idx_news_published on public.news_articles(is_published, published_at desc);
create index if not exists idx_news_category on public.news_articles(category);

drop trigger if exists trg_news_updated_at on public.news_articles;
create trigger trg_news_updated_at
  before update on public.news_articles
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 10. news_comments
-- =====================================================================
create table if not exists public.news_comments (
  id                uuid primary key default gen_random_uuid(),
  news_article_id   uuid not null references public.news_articles(id) on delete cascade,
  user_id           uuid not null references public.profiles(id) on delete cascade,
  content           text not null,
  created_at        timestamptz default now() not null,
  updated_at        timestamptz default now() not null
);

create index if not exists idx_news_comments_article on public.news_comments(news_article_id);

drop trigger if exists trg_news_comments_updated_at on public.news_comments;
create trigger trg_news_comments_updated_at
  before update on public.news_comments
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 11. resources
-- =====================================================================
create table if not exists public.resources (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  description    text,
  category       text not null,
  thumbnail_url  text,
  resource_type  resource_type not null,
  download_url   text,
  external_url   text,
  is_published   boolean default false not null,
  created_at     timestamptz default now() not null,
  updated_at     timestamptz default now() not null,
  check (download_url is not null or external_url is not null)
);

create index if not exists idx_resources_category on public.resources(category);
create index if not exists idx_resources_published on public.resources(is_published);
create index if not exists idx_resources_type on public.resources(resource_type);

drop trigger if exists trg_resources_updated_at on public.resources;
create trigger trg_resources_updated_at
  before update on public.resources
  for each row execute function public.set_updated_at();

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

-- ----- profiles -----
alter table public.profiles enable row level security;

drop policy if exists "profiles select self or admin" on public.profiles;
create policy "profiles select self or admin" on public.profiles
  for select using (
    auth.uid() = id or public.is_admin(auth.uid())
  );

drop policy if exists "profiles update self" on public.profiles;
create policy "profiles update self" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles admin all" on public.profiles;
create policy "profiles admin all" on public.profiles
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ----- subscriptions -----
alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions select self" on public.subscriptions;
create policy "subscriptions select self" on public.subscriptions
  for select using (auth.uid() = user_id or public.is_admin(auth.uid()));

-- inserts/updates uniquement via Edge Functions (service role) ; aucune policy write côté client.

-- ----- formations -----
alter table public.formations enable row level security;

drop policy if exists "formations select published members" on public.formations;
create policy "formations select published members" on public.formations
  for select using (
    (is_published and public.is_active_member(auth.uid())) or public.is_admin(auth.uid())
  );

drop policy if exists "formations admin all" on public.formations;
create policy "formations admin all" on public.formations
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ----- formation_chapters -----
alter table public.formation_chapters enable row level security;

drop policy if exists "chapters select members" on public.formation_chapters;
create policy "chapters select members" on public.formation_chapters
  for select using (
    public.is_admin(auth.uid()) or (
      public.is_active_member(auth.uid())
      and exists (
        select 1 from public.formations f
        where f.id = formation_id and f.is_published
      )
    )
  );

drop policy if exists "chapters admin all" on public.formation_chapters;
create policy "chapters admin all" on public.formation_chapters
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ----- user_formation_progress -----
alter table public.user_formation_progress enable row level security;

drop policy if exists "progress select self" on public.user_formation_progress;
create policy "progress select self" on public.user_formation_progress
  for select using (auth.uid() = user_id);

drop policy if exists "progress insert self" on public.user_formation_progress;
create policy "progress insert self" on public.user_formation_progress
  for insert with check (auth.uid() = user_id and public.is_active_member(auth.uid()));

drop policy if exists "progress update self" on public.user_formation_progress;
create policy "progress update self" on public.user_formation_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "progress delete self" on public.user_formation_progress;
create policy "progress delete self" on public.user_formation_progress
  for delete using (auth.uid() = user_id);

-- ----- posts -----
alter table public.posts enable row level security;

drop policy if exists "posts select members" on public.posts;
create policy "posts select members" on public.posts
  for select using (public.is_active_member(auth.uid()) or public.is_admin(auth.uid()));

drop policy if exists "posts insert self" on public.posts;
create policy "posts insert self" on public.posts
  for insert with check (auth.uid() = user_id and public.is_active_member(auth.uid()));

drop policy if exists "posts update self" on public.posts;
create policy "posts update self" on public.posts
  for update using (auth.uid() = user_id or public.is_admin(auth.uid()))
  with check (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "posts delete self or admin" on public.posts;
create policy "posts delete self or admin" on public.posts
  for delete using (auth.uid() = user_id or public.is_admin(auth.uid()));

-- ----- post_likes -----
alter table public.post_likes enable row level security;

drop policy if exists "likes select members" on public.post_likes;
create policy "likes select members" on public.post_likes
  for select using (public.is_active_member(auth.uid()) or public.is_admin(auth.uid()));

drop policy if exists "likes insert self" on public.post_likes;
create policy "likes insert self" on public.post_likes
  for insert with check (auth.uid() = user_id and public.is_active_member(auth.uid()));

drop policy if exists "likes delete self" on public.post_likes;
create policy "likes delete self" on public.post_likes
  for delete using (auth.uid() = user_id);

-- ----- post_comments -----
alter table public.post_comments enable row level security;

drop policy if exists "post_comments select members" on public.post_comments;
create policy "post_comments select members" on public.post_comments
  for select using (public.is_active_member(auth.uid()) or public.is_admin(auth.uid()));

drop policy if exists "post_comments insert self" on public.post_comments;
create policy "post_comments insert self" on public.post_comments
  for insert with check (auth.uid() = user_id and public.is_active_member(auth.uid()));

drop policy if exists "post_comments update self" on public.post_comments;
create policy "post_comments update self" on public.post_comments
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "post_comments delete self or admin" on public.post_comments;
create policy "post_comments delete self or admin" on public.post_comments
  for delete using (auth.uid() = user_id or public.is_admin(auth.uid()));

-- ----- news_articles -----
alter table public.news_articles enable row level security;

drop policy if exists "news select published members" on public.news_articles;
create policy "news select published members" on public.news_articles
  for select using (
    (is_published and public.is_active_member(auth.uid())) or public.is_admin(auth.uid())
  );

drop policy if exists "news admin all" on public.news_articles;
create policy "news admin all" on public.news_articles
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ----- news_comments -----
alter table public.news_comments enable row level security;

drop policy if exists "news_comments select members" on public.news_comments;
create policy "news_comments select members" on public.news_comments
  for select using (public.is_active_member(auth.uid()) or public.is_admin(auth.uid()));

drop policy if exists "news_comments insert self" on public.news_comments;
create policy "news_comments insert self" on public.news_comments
  for insert with check (auth.uid() = user_id and public.is_active_member(auth.uid()));

drop policy if exists "news_comments update self" on public.news_comments;
create policy "news_comments update self" on public.news_comments
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "news_comments delete self or admin" on public.news_comments;
create policy "news_comments delete self or admin" on public.news_comments
  for delete using (auth.uid() = user_id or public.is_admin(auth.uid()));

-- ----- resources -----
alter table public.resources enable row level security;

drop policy if exists "resources select published members" on public.resources;
create policy "resources select published members" on public.resources
  for select using (
    (is_published and public.is_active_member(auth.uid())) or public.is_admin(auth.uid())
  );

drop policy if exists "resources admin all" on public.resources;
create policy "resources admin all" on public.resources
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
