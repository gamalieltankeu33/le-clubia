-- =====================================================================
-- Le Club IA — Migration 0069 : Statistiques et Participants des Challenges
--
-- Objectifs :
--   1. Créer une fonction get_challenge_tracks_with_stats() pour compter les participants par parcours.
--   2. Créer une vue admin_challenge_participants pour lister les membres engagés et leur avancement.
-- =====================================================================

-- 1. Fonction get_challenge_tracks_with_stats
create or replace function public.get_challenge_tracks_with_stats()
returns table (
  id uuid,
  key text,
  title text,
  description text,
  participant_count bigint
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return query
  select
    t.id,
    t.key,
    t.title,
    t.description,
    count(distinct coalesce(p.id, sub.user_id)) as participant_count
  from public.challenge_tracks t
  left join public.profiles p on p.active_challenge_track_id = t.id
  left join public.challenge_weeks w on w.track_id = t.id
  left join public.challenge_submissions sub on sub.challenge_week_id = w.id
  group by t.id, t.key, t.title, t.description, t.created_at
  order by t.created_at asc;
end;
$$;

-- Rendre la fonction accessible aux membres connectés
grant execute on function public.get_challenge_tracks_with_stats() to authenticated;

-- 2. Vue admin_challenge_participants
create or replace view public.admin_challenge_participants as
select distinct on (p.id)
  p.id as user_id,
  p.first_name,
  p.last_name,
  p.email,
  p.avatar_url,
  p.active_challenge_track_id,
  t.title as active_track_title,
  (
    select count(distinct sub.challenge_week_id)
    from public.challenge_submissions sub
    join public.challenge_weeks w on w.id = sub.challenge_week_id
    where sub.user_id = p.id and w.track_id = coalesce(p.active_challenge_track_id, w.track_id)
  ) as validated_weeks_count,
  (
    select max(sub.created_at)
    from public.challenge_submissions sub
    where sub.user_id = p.id
  ) as last_activity_at
from public.profiles p
left join public.challenge_tracks t on t.id = p.active_challenge_track_id
left join public.challenge_submissions s on s.user_id = p.id
where p.active_challenge_track_id is not null or s.id is not null;

-- Rendre la vue accessible
grant select on public.admin_challenge_participants to authenticated;
