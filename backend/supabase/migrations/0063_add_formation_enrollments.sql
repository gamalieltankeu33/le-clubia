-- =====================================================================
-- Le Club IA — Migration 0063 : Statistiques et inscriptions aux formations
--
-- Objectifs :
--   1. Ajouter un compteur d'apprenants de base (stats) pour chaque formation.
--   2. Créer une table d'inscription non rigoureuse (formation_enrollments).
--   3. Réécrire la RPC get_formations_with_progress() pour retourner :
--        - is_enrolled : si le membre s'est inscrit à la formation.
--        - participants_count : base_participants_count + inscriptions réelles.
-- =====================================================================

-- 1. Ajout de la colonne base_participants_count à formations
alter table public.formations
  add column if not exists base_participants_count integer default 0 not null;

comment on column public.formations.base_participants_count is
  'Nombre fictif d''apprenants de départ pour simuler des statistiques réalistes.';

-- 2. Initialisation des compteurs de départ sur les formations existantes
-- Excel : 154
update public.formations set base_participants_count = 154 where title ilike '%Excel%';
-- Facebook Ads : 454
update public.formations set base_participants_count = 454 where title ilike '%Facebook%';
-- Google Ads : 177
update public.formations set base_participants_count = 177 where title ilike '%Google%';
-- Outils IA / Foundations : 320
update public.formations set base_participants_count = 320 where title ilike '%Foundations%' or slug = 'ia-foundations';
-- Micro-SaaS Builder : 215
update public.formations set base_participants_count = 215 where slug = 'micro-saas-builder' or id = 'b0b4e9b0-390c-4d6c-a438-d749b2cbbc49';
-- Agents IA : 189
update public.formations set base_participants_count = 189 where title ilike '%Agent%' or slug = 'comment-creer-agents-ia';
-- IA Productivité : 245
update public.formations set base_participants_count = 245 where slug = 'ia-productivite' or id = '9d6f645d-5d2f-46a8-ae96-0d4c03e1bfea';
-- YouTube Faceless : 412
update public.formations set base_participants_count = 412 where slug = 'youtube-faceless-mastery';
-- Content sans visage : 387
update public.formations set base_participants_count = 387 where slug = 'content-sans-visage';
-- Smartcash Creators : 298
update public.formations set base_participants_count = 298 where slug = 'ia-smartcash-creators';
-- Product Maker / Vendre produit digital : 205
update public.formations set base_participants_count = 205 where slug = 'ia-product-maker' or id = '57e4f732-4307-482f-8394-08f0d680d544';
-- Closer : 156
update public.formations set base_participants_count = 156 where slug = 'ia-closer';
-- Créer site internet : 165
update public.formations set base_participants_count = 165 where slug = 'creer-un-site-ia';

-- Fallback pour les formations créées qui n'ont pas matché
update public.formations set base_participants_count = floor(random() * 150 + 100)::int
  where base_participants_count = 0;


-- 3. Création de la table formation_enrollments
create table if not exists public.formation_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  formation_id uuid not null references public.formations(id) on delete cascade,
  created_at timestamptz default now() not null,
  unique (user_id, formation_id)
);

create index if not exists idx_enrollments_user on public.formation_enrollments(user_id);
create index if not exists idx_enrollments_formation on public.formation_enrollments(formation_id);

-- 4. Activation de la RLS sur formation_enrollments
alter table public.formation_enrollments enable row level security;

-- RLS Policies
create policy select_enrollments_policy on public.formation_enrollments
  for select to authenticated using (true);

create policy insert_enrollments_policy on public.formation_enrollments
  for insert to authenticated with check (auth.uid() = user_id);

create policy delete_enrollments_policy on public.formation_enrollments
  for delete to authenticated using (auth.uid() = user_id);


-- 5. Recréation de la RPC get_formations_with_progress()
drop function if exists public.get_formations_with_progress();
create function public.get_formations_with_progress()
returns table (
  id                 uuid,
  slug               text,
  title              text,
  description        text,
  category           text,
  cover_image_url    text,
  level              public.formation_level,
  duration_minutes   integer,
  is_published       boolean,
  is_premium         boolean,
  created_at         timestamptz,
  updated_at         timestamptz,
  total_chapters     integer,
  completed_chapters integer,
  progress_percent   integer,
  has_started        boolean,
  is_enrolled        boolean,
  participants_count integer
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    f.id,
    f.slug,
    f.title,
    f.description,
    f.category,
    f.cover_image_url,
    f.level,
    f.duration_minutes,
    f.is_published,
    f.is_premium,
    f.created_at,
    f.updated_at,
    coalesce(c.total, 0)::integer       as total_chapters,
    coalesce(p.completed, 0)::integer   as completed_chapters,
    case
      when coalesce(c.total, 0) = 0 then 0
      else round(coalesce(p.sum_progress, 0)::numeric / c.total::numeric)::integer
    end                                 as progress_percent,
    coalesce(p.has_started, false)      as has_started,
    coalesce(e.is_enrolled, false)      as is_enrolled,
    (f.base_participants_count + coalesce(ec.enroll_count, 0))::integer as participants_count
  from public.formations f
  left join (
    select formation_id, count(*) as total
    from public.formation_chapters
    group by formation_id
  ) c on c.formation_id = f.id
  left join (
    select
      formation_id,
      sum(progress_percent)                    as sum_progress,
      count(*) filter (where completed = true) as completed,
      bool_or(progress_percent > 0)            as has_started
    from public.user_formation_progress
    where user_id = auth.uid()
    group by formation_id
  ) p on p.formation_id = f.id
  left join (
    select formation_id, true as is_enrolled
    from public.formation_enrollments
    where user_id = auth.uid()
  ) e on e.formation_id = f.id
  left join (
    select formation_id, count(*) as enroll_count
    from public.formation_enrollments
    group by formation_id
  ) ec on ec.formation_id = f.id
  where f.is_published = true
  order by f.created_at desc;
$$;

grant execute on function public.get_formations_with_progress() to authenticated;

comment on function public.get_formations_with_progress() is
  'Retourne le catalogue de formations enrichi de la progression du membre, de son etat d''inscription et des stats d''apprenants.';
