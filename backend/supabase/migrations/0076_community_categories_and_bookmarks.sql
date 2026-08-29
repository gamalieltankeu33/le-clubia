-- 1. Ajout de la colonne category à public.posts
alter table public.posts
add column category text default 'general' not null;

create index idx_posts_category on public.posts(category);

-- 2. Création de la table saved_posts (Enregistrements/Signets)
create table if not exists public.saved_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz default now() not null,
  -- Un user ne peut enregistrer un post qu'une seule fois
  unique (user_id, post_id)
);

-- Index pour accélérer les requêtes
create index idx_saved_posts_user_id on public.saved_posts(user_id);
create index idx_saved_posts_post_id on public.saved_posts(post_id);

-- Activation du RLS sur saved_posts
alter table public.saved_posts enable row level security;

-- Policies pour saved_posts
create policy "Users can view their own saved posts"
  on public.saved_posts
  for select
  using (auth.uid() = user_id);

create policy "Users can save posts"
  on public.saved_posts
  for insert
  with check (auth.uid() = user_id);

create policy "Users can unsave posts"
  on public.saved_posts
  for delete
  using (auth.uid() = user_id);

-- 3. Fonction RPC : récupérer les IDs des posts sauvegardés par l'utilisateur courant
create or replace function public.get_my_saved_post_ids(p_post_ids uuid[])
returns table(post_id uuid) as $$
begin
  return query
  select sp.post_id
  from public.saved_posts sp
  where sp.user_id = auth.uid()
    and sp.post_id = any(p_post_ids);
end;
$$ language plpgsql security definer set search_path = public;
