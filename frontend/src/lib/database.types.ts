// Types alignés sur backend/migrations/0001_init.sql.
// Format compatible avec ce que produit `supabase gen types typescript`.

export type UserRole = 'member' | 'admin'
export type SubscriptionPlan = 'member' | 'free_trial'
export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'trialing'
  | 'incomplete'
  | 'unpaid'
export type FormationLevel = 'debutant' | 'intermediaire' | 'avance'
export type ResourceType = 'prompt' | 'template' | 'guide_pdf' | 'tool_link'
export type CoachMessageRole = 'user' | 'assistant'
export type EventType = 'coaching' | 'masterclass' | 'qa' | 'other'
// Aligné sur la CHECK constraint cumulée des migrations 0011 + 0017 + 0019.
// Toute extension côté DB doit aussi être ajoutée ici ET dans TYPE_META
// de notification-item.tsx (qui contient un fallback de sécurité au cas où).
export type NotificationType =
  | 'new_post'
  | 'new_resource'
  | 'new_formation'
  | 'new_article'
  | 'comment_on_post'
  | 'like_on_post'
  | 'reply_to_comment'
  | 'mention'
  | 'weekly_recap'
  | 'event_announcement'
  | 'event_reminder_1day'
  | 'event_reminder_today'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  link_url: string | null
  related_id: string | null
  actor_id: string | null
  is_read: boolean
  created_at: string
}

/** Format JSONB stocké dans formation_chapters.resources */
export interface ChapterResource {
  label: string
  /**
   * Lien d'accès. Pour une ressource uploadée (path présent), c'est une URL
   * signée valide 24h qu'on régénère côté lecture ; on la stocke quand même
   * pour ne pas casser les anciennes lignes qui n'ont pas de path.
   */
  url: string
  /**
   * Path dans le bucket `resource-files` si le fichier a été uploadé via
   * le formulaire. Absent pour les ressources qui sont juste une URL externe
   * (Google Doc, Notion, Figma, etc.).
   */
  path?: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          bio: string | null
          interests: string[]
          onboarding_completed: boolean
          role: UserRole
          is_verified: boolean
          last_active_at: string | null
          email_pref_weekly_recap: boolean
          email_pref_event_announce: boolean
          email_pref_event_reminders: boolean
          desired_plan_id: string | null
          points: number
          guides_seen: string[]
          member_number: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          interests?: string[]
          onboarding_completed?: boolean
          role?: UserRole
          is_verified?: boolean
          last_active_at?: string | null
          email_pref_weekly_recap?: boolean
          email_pref_event_announce?: boolean
          email_pref_event_reminders?: boolean
          desired_plan_id?: string | null
          points?: number
          guides_seen?: string[]
          member_number?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          interests?: string[]
          onboarding_completed?: boolean
          role?: UserRole
          is_verified?: boolean
          last_active_at?: string | null
          email_pref_weekly_recap?: boolean
          email_pref_event_announce?: boolean
          email_pref_event_reminders?: boolean
          desired_plan_id?: string | null
          points?: number
          guides_seen?: string[]
          member_number?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      pricing_plans: {
        Row: {
          id: string
          display_name: string
          price_xof: number
          duration_months: number
          is_active: boolean
          is_recommended: boolean
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name: string
          price_xof: number
          duration_months: number
          is_active?: boolean
          is_recommended?: boolean
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          price_xof?: number
          duration_months?: number
          is_active?: boolean
          is_recommended?: boolean
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          plan: SubscriptionPlan
          plan_id: string | null
          status: SubscriptionStatus
          current_period_start: string | null
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan?: SubscriptionPlan
          plan_id?: string | null
          status: SubscriptionStatus
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan?: SubscriptionPlan
          plan_id?: string | null
          status?: SubscriptionStatus
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      coach_conversations: {
        Row: {
          id: string
          user_id: string
          title: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      formations: {
        Row: {
          id: string
          slug: string
          title: string
          description: string | null
          category: string
          cover_image_url: string | null
          level: FormationLevel
          duration_minutes: number
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          description?: string | null
          category: string
          cover_image_url?: string | null
          level?: FormationLevel
          duration_minutes?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          description?: string | null
          category?: string
          cover_image_url?: string | null
          level?: FormationLevel
          duration_minutes?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      formation_chapters: {
        Row: {
          id: string
          formation_id: string
          order_index: number
          title: string
          description: string | null
          video_url: string | null
          resources: ChapterResource[]
          duration_minutes: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          formation_id: string
          order_index: number
          title: string
          description?: string | null
          video_url?: string | null
          resources?: ChapterResource[]
          duration_minutes?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          formation_id?: string
          order_index?: number
          title?: string
          description?: string | null
          video_url?: string | null
          resources?: ChapterResource[]
          duration_minutes?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      formation_reviews: {
        Row: {
          id: string
          user_id: string
          formation_id: string
          chapter_id: string | null
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          formation_id: string
          chapter_id?: string | null
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          formation_id?: string
          chapter_id?: string | null
          rating?: number
          comment?: string | null
          created_at?: string
        }
        Relationships: []
      }
      user_formation_progress: {
        Row: {
          id: string
          user_id: string
          formation_id: string
          chapter_id: string
          completed: boolean
          completed_at: string | null
          last_position_seconds: number
          progress_percent: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          formation_id: string
          chapter_id: string
          completed?: boolean
          completed_at?: string | null
          last_position_seconds?: number
          progress_percent?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          formation_id?: string
          chapter_id?: string
          completed?: boolean
          completed_at?: string | null
          last_position_seconds?: number
          progress_percent?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          id: string
          user_id: string
          content: string
          image_url: string | null
          link_url: string | null
          hashtags: string[]
          likes_count: number
          comments_count: number
          is_pinned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          image_url?: string | null
          link_url?: string | null
          hashtags?: string[]
          likes_count?: number
          comments_count?: number
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          image_url?: string | null
          link_url?: string | null
          hashtags?: string[]
          likes_count?: number
          comments_count?: number
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          parent_comment_id: string | null
          replies_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          parent_comment_id?: string | null
          replies_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          parent_comment_id?: string | null
          replies_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      comment_mentions: {
        Row: {
          id: string
          comment_id: string
          mentioned_user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          comment_id: string
          mentioned_user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          comment_id?: string
          mentioned_user_id?: string
          created_at?: string
        }
        Relationships: []
      }
      coach_messages: {
        Row: {
          id: string
          conversation_id: string
          role: CoachMessageRole
          content: string
          tokens_used: number | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: CoachMessageRole
          content: string
          tokens_used?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: CoachMessageRole
          content?: string
          tokens_used?: number | null
          created_at?: string
        }
        Relationships: []
      }
      news_articles: {
        Row: {
          id: string
          slug: string
          title: string
          content: string
          cover_image_url: string | null
          category: string
          source_url: string | null
          author: string | null
          is_published: boolean
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          content: string
          cover_image_url?: string | null
          category: string
          source_url?: string | null
          author?: string | null
          is_published?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          content?: string
          cover_image_url?: string | null
          category?: string
          source_url?: string | null
          author?: string | null
          is_published?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      news_comments: {
        Row: {
          id: string
          news_article_id: string
          user_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          news_article_id: string
          user_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          news_article_id?: string
          user_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          id: string
          title: string
          description: string | null
          category: string
          thumbnail_url: string | null
          resource_type: ResourceType
          download_url: string | null
          external_url: string | null
          content: string | null
          file_url: string | null
          file_size_kb: number | null
          file_name: string | null
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          category: string
          thumbnail_url?: string | null
          resource_type: ResourceType
          download_url?: string | null
          external_url?: string | null
          content?: string | null
          file_url?: string | null
          file_size_kb?: number | null
          file_name?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          category?: string
          thumbnail_url?: string | null
          resource_type?: ResourceType
          download_url?: string | null
          external_url?: string | null
          content?: string | null
          file_url?: string | null
          file_size_kb?: number | null
          file_name?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: NotificationType
          title: string
          message: string
          link_url: string | null
          related_id: string | null
          actor_id: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: NotificationType
          title: string
          message: string
          link_url?: string | null
          related_id?: string | null
          actor_id?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: NotificationType
          title?: string
          message?: string
          link_url?: string | null
          related_id?: string | null
          actor_id?: string | null
          is_read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      member_points: {
        Row: {
          id: string
          user_id: string
          points: number
          reason: string
          reference_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          points: number
          reason: string
          reference_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          points?: number
          reason?: string
          reference_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      monthly_winners: {
        Row: {
          id: string
          user_id: string
          month_year: string
          prize_amount: number
          prize_currency: string
          notes: string | null
          selected_by: string | null
          selected_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month_year: string
          prize_amount?: number
          prize_currency?: string
          notes?: string | null
          selected_by?: string | null
          selected_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          month_year?: string
          prize_amount?: number
          prize_currency?: string
          notes?: string | null
          selected_by?: string | null
          selected_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          type: EventType
          speaker_name: string | null
          speaker_bio: string | null
          starts_at: string
          duration_minutes: number
          meet_url: string | null
          cover_image_url: string | null
          is_published: boolean
          notify_on_publish: boolean
          notify_1_day_before: boolean
          notify_on_day: boolean
          announcement_sent_at: string | null
          reminder_1day_sent_at: string | null
          reminder_today_sent_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          type?: EventType
          speaker_name?: string | null
          speaker_bio?: string | null
          starts_at: string
          duration_minutes?: number
          meet_url?: string | null
          cover_image_url?: string | null
          is_published?: boolean
          notify_on_publish?: boolean
          notify_1_day_before?: boolean
          notify_on_day?: boolean
          announcement_sent_at?: string | null
          reminder_1day_sent_at?: string | null
          reminder_today_sent_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          type?: EventType
          speaker_name?: string | null
          speaker_bio?: string | null
          starts_at?: string
          duration_minutes?: number
          meet_url?: string | null
          cover_image_url?: string | null
          is_published?: boolean
          notify_on_publish?: boolean
          notify_1_day_before?: boolean
          notify_on_day?: boolean
          announcement_sent_at?: string | null
          reminder_1day_sent_at?: string | null
          reminder_today_sent_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: {
      user_role: UserRole
      subscription_plan: SubscriptionPlan
      subscription_status: SubscriptionStatus
      formation_level: FormationLevel
      resource_type: ResourceType
      coach_message_role: CoachMessageRole
    }
    CompositeTypes: { [_ in never]: never }
  }
}

// Helpers exportés pour le reste de l'app
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type CoachConversation =
  Database['public']['Tables']['coach_conversations']['Row']
export type CoachMessageRow =
  Database['public']['Tables']['coach_messages']['Row']
export type Formation = Database['public']['Tables']['formations']['Row']
export type FormationChapter =
  Database['public']['Tables']['formation_chapters']['Row']
export type UserFormationProgress =
  Database['public']['Tables']['user_formation_progress']['Row']
export type Resource = Database['public']['Tables']['resources']['Row']
export type NewsArticle =
  Database['public']['Tables']['news_articles']['Row']
export type NewsComment =
  Database['public']['Tables']['news_comments']['Row']
export type PricingPlan = Database['public']['Tables']['pricing_plans']['Row']

/** Plan public exposé par la RPC get_active_pricing_plans (avec
 *  monthly_price_xof calculé côté DB). */
export interface PublicPricingPlan {
  id: string
  display_name: string
  price_xof: number
  duration_months: number
  is_recommended: boolean
  description: string | null
  monthly_price_xof: number
}
