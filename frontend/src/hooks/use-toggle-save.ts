import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { FeedPost } from '@/components/community/post-card'

export function useToggleSave(post: FeedPost, currentUserId: string | null) {
  const queryClient = useQueryClient()
  const [saved, setSaved] = useState(post.saved_by_me)

  const toggleMutation = useMutation({
    mutationFn: async (currentlySaved: boolean) => {
      if (!currentUserId) throw new Error('Non connecté')

      if (currentlySaved) {
        // Enlever des favoris
        const { error } = await supabase
          .from('saved_posts')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', currentUserId)
        if (error) throw error
      } else {
        // Ajouter aux favoris
        const { error } = await supabase
          .from('saved_posts')
          .insert({ post_id: post.id, user_id: currentUserId })
        if (error && error.code !== '23505') { // ignorer l'erreur d'unicité s'il existe déjà
          throw error
        }
      }
    },
    onMutate: async (currentlySaved) => {
      setSaved(!currentlySaved)
      
      // Mettre à jour le cache query
      const keys = [
        ['community-feed'],
        ['user-posts'],
        ['recent-posts']
      ]
      
      for (const key of keys) {
        await queryClient.cancelQueries({ queryKey: key })
        queryClient.setQueriesData({ queryKey: key }, (oldData: any) => {
          if (!oldData?.pages) return oldData
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              posts: page.posts.map((p: FeedPost) => 
                p.id === post.id ? { ...p, saved_by_me: !currentlySaved } : p
              )
            }))
          }
        })
      }
    },
    onError: () => {
      // Rollback
      setSaved(post.saved_by_me)
      toast.error('Impossible de modifier l\'enregistrement.')
    },
  })

  function toggle() {
    if (!currentUserId) {
      toast.error('Connecte-toi pour enregistrer ce post.')
      return
    }
    toggleMutation.mutate(saved)
  }

  return {
    saved,
    toggle,
    isPending: toggleMutation.isPending,
  }
}
