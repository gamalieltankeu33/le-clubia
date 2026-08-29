-- =====================================================================
-- Le Club IA — Migration 0077 : Auto-post dans la communauté lors 
-- d'une nouvelle actualité.
--
-- Objectif : dès qu'un article d'actualité est publié, créer
-- automatiquement un post dans l'espace communautaire (table posts)
-- au nom du premier administrateur (Gamaliel).
-- =====================================================================

create or replace function public.trg_fn_news_community_autopost()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_admin_id uuid;
  v_post_content text;
begin
  -- Seulement lors du passage à "publié"
  if new.is_published = true 
     and coalesce(new.category, '') <> 'weekly-recap'
     and (tg_op = 'INSERT' or coalesce(old.is_published, false) = false)
  then
    
    -- Récupère l'ID du premier administrateur (Gamaliel)
    select id into v_admin_id 
    from public.profiles 
    where role = 'admin' 
    order by created_at asc 
    limit 1;
    
    if v_admin_id is not null then
      -- Construit le contenu du post
      v_post_content := '📰 **Nouvelle actualité IA disponible !**' || E'\n\n' ||
                      '**' || new.title || '**' || E'\n\n' ||
                      coalesce(left(new.content, 200), '') || '...' || E'\n\n' ||
                      '👉 Allez lire l''article complet dans la section Actualités et pensez à consulter vos emails !';
                      
      -- Insère le post dans la communauté
      insert into public.posts (user_id, content, link_url)
      values (v_admin_id, v_post_content, '/app/actualites/' || new.slug);
    end if;
    
  end if;
  return new;
end;
$$;

drop trigger if exists trg_news_community_autopost on public.news_articles;
create trigger trg_news_community_autopost
  after insert or update on public.news_articles
  for each row execute function public.trg_fn_news_community_autopost();
