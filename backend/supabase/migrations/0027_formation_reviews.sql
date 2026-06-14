-- =====================================================================
-- Le Club IA — Migration 0027 : Système d'avis sur les formations
-- =====================================================================

create table if not exists public.formation_reviews (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  formation_id  uuid not null references public.formations(id) on delete cascade,
  rating        integer not null check (rating >= 1 and rating <= 5),
  comment       text,
  created_at    timestamptz default now() not null,
  unique (user_id, formation_id)
);

create index if not exists idx_formation_reviews_formation on public.formation_reviews(formation_id);
create index if not exists idx_formation_reviews_user on public.formation_reviews(user_id);

-- RLS
alter table public.formation_reviews enable row level security;

-- Tout le monde (membres actifs) peut voir les avis
drop policy if exists "reviews select members" on public.formation_reviews;
create policy "reviews select members" on public.formation_reviews
  for select using (public.is_active_member(auth.uid()) or public.is_admin(auth.uid()));

-- Un utilisateur peut insérer son propre avis
drop policy if exists "reviews insert self" on public.formation_reviews;
create policy "reviews insert self" on public.formation_reviews
  for insert with check (auth.uid() = user_id and public.is_active_member(auth.uid()));

-- Un utilisateur peut modifier son propre avis
drop policy if exists "reviews update self" on public.formation_reviews;
create policy "reviews update self" on public.formation_reviews
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
