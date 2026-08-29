import { supabase } from './supabase'

export interface DirectoryMember {
  id: string
  full_name: string | null
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  bio: string | null
  role: string
  is_verified: boolean
  member_number: number | null
  created_at: string
}

export async function fetchDirectoryMembers(
  query: string = '',
  role: string | null = null,
  limit: number = 50,
  offset: number = 0
): Promise<DirectoryMember[]> {
  const { data, error } = await supabase.rpc('search_directory_members', {
    p_query: query,
    p_role: role,
    p_limit: limit,
    p_offset: offset,
  })

  if (error) {
    console.error('Error fetching directory members:', error)
    throw error
  }

  return data as DirectoryMember[]
}
