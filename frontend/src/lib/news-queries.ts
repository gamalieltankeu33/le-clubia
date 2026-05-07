import { supabase } from './supabase'
import type { NewsArticle } from './database.types'

/** Articles publiés, ordonnés par published_at desc (puis created_at). */
export async function fetchPublishedNews(): Promise<NewsArticle[]> {
  const { data, error } = await supabase
    .from('news_articles')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw error
  return (data ?? []) as NewsArticle[]
}

/** Tous les articles (admin). */
export async function fetchAllNews(): Promise<NewsArticle[]> {
  const { data, error } = await supabase
    .from('news_articles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) throw error
  return (data ?? []) as NewsArticle[]
}

export async function fetchNewsBySlug(
  slug: string,
): Promise<NewsArticle | null> {
  const { data, error } = await supabase
    .from('news_articles')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  return (data ?? null) as NewsArticle | null
}

export async function fetchNewsById(
  id: string,
): Promise<NewsArticle | null> {
  const { data, error } = await supabase
    .from('news_articles')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data ?? null) as NewsArticle | null
}
