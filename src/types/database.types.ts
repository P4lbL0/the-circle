export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      application_forms: {
        Row: {
          community_id: string
          created_at: string
          fields: Json
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          community_id: string
          created_at?: string
          fields?: Json
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          community_id?: string
          created_at?: string
          fields?: Json
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_forms_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: true
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          answers: Json
          applicant_email: string | null
          applicant_id: string | null
          applicant_name: string | null
          community_id: string
          created_at: string
          id: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["application_status_enum"]
          updated_at: string
        }
        Insert: {
          answers?: Json
          applicant_email?: string | null
          applicant_id?: string | null
          applicant_name?: string | null
          community_id: string
          created_at?: string
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status_enum"]
          updated_at?: string
        }
        Update: {
          answers?: Json
          applicant_email?: string | null
          applicant_id?: string | null
          applicant_name?: string | null
          community_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bet_entries: {
        Row: {
          bet_id: string
          chosen_option_id: string
          community_id: string
          created_at: string
          id: string
          points_wagered: number
          profile_id: string
        }
        Insert: {
          bet_id: string
          chosen_option_id: string
          community_id: string
          created_at?: string
          id?: string
          points_wagered: number
          profile_id: string
        }
        Update: {
          bet_id?: string
          chosen_option_id?: string
          community_id?: string
          created_at?: string
          id?: string
          points_wagered?: number
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bet_entries_bet_id_fkey"
            columns: ["bet_id"]
            isOneToOne: false
            referencedRelation: "bets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bet_entries_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bet_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bets: {
        Row: {
          closes_at: string | null
          community_id: string
          created_at: string
          creator_id: string
          description: string | null
          id: string
          options: Json
          result_option_id: string | null
          status: Database["public"]["Enums"]["bet_status_enum"]
          title: string
          updated_at: string
        }
        Insert: {
          closes_at?: string | null
          community_id: string
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          options?: Json
          result_option_id?: string | null
          status?: Database["public"]["Enums"]["bet_status_enum"]
          title: string
          updated_at?: string
        }
        Update: {
          closes_at?: string | null
          community_id?: string
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          options?: Json
          result_option_id?: string | null
          status?: Database["public"]["Enums"]["bet_status_enum"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bets_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bets_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_groups: {
        Row: {
          community_id: string
          created_at: string
          id: string
          is_public: boolean
          name: string
        }
        Insert: {
          community_id: string
          created_at?: string
          id?: string
          is_public?: boolean
          name: string
        }
        Update: {
          community_id?: string
          created_at?: string
          id?: string
          is_public?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_groups_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          author_id: string
          community_id: string
          content: string
          created_at: string
          group_id: string
          id: string
        }
        Insert: {
          author_id: string
          community_id: string
          content: string
          created_at?: string
          group_id: string
          id?: string
        }
        Update: {
          author_id?: string
          community_id?: string
          content?: string
          created_at?: string
          group_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "chat_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          banner_url: string | null
          community_type: string
          created_at: string
          custom_domain: string | null
          description: string | null
          id: string
          invite_token: string
          logo_url: string | null
          name: string
          onboarding_completed: boolean
          owner_id: string
          privacy: Database["public"]["Enums"]["community_privacy_enum"]
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subdomain: string | null
          subscription_tier: Database["public"]["Enums"]["subscription_tier_enum"]
          theme_json: Json
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          community_type?: string
          created_at?: string
          custom_domain?: string | null
          description?: string | null
          id?: string
          invite_token?: string
          logo_url?: string | null
          name: string
          onboarding_completed?: boolean
          owner_id: string
          privacy?: Database["public"]["Enums"]["community_privacy_enum"]
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subdomain?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier_enum"]
          theme_json?: Json
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          community_type?: string
          created_at?: string
          custom_domain?: string | null
          description?: string | null
          id?: string
          invite_token?: string
          logo_url?: string | null
          name?: string
          onboarding_completed?: boolean
          owner_id?: string
          privacy?: Database["public"]["Enums"]["community_privacy_enum"]
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subdomain?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier_enum"]
          theme_json?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "communities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          badges: Json
          community_id: string
          custom_stats: Json
          id: string
          is_public: boolean
          joined_at: string
          points: number
          profile_id: string
          role: Database["public"]["Enums"]["member_role_enum"]
          updated_at: string
        }
        Insert: {
          badges?: Json
          community_id: string
          custom_stats?: Json
          id?: string
          is_public?: boolean
          joined_at?: string
          points?: number
          profile_id: string
          role?: Database["public"]["Enums"]["member_role_enum"]
          updated_at?: string
        }
        Update: {
          badges?: Json
          community_id?: string
          custom_stats?: Json
          id?: string
          is_public?: boolean
          joined_at?: string
          points?: number
          profile_id?: string
          role?: Database["public"]["Enums"]["member_role_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          profile_id: string
          status: Database["public"]["Enums"]["rsvp_status_enum"]
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          profile_id: string
          status?: Database["public"]["Enums"]["rsvp_status_enum"]
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          profile_id?: string
          status?: Database["public"]["Enums"]["rsvp_status_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rsvps_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          community_id: string
          created_at: string
          created_by: string
          description: string | null
          end_at: string | null
          ends_at: string | null
          event_type: string
          id: string
          is_online: boolean | null
          is_recurring: boolean | null
          location: string | null
          max_attendees: number | null
          recurrence_end_date: string | null
          recurrence_parent_id: string | null
          recurrence_type: string | null
          rsvp_enabled: boolean
          start_at: string
          starts_at: string | null
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["visibility_enum"]
        }
        Insert: {
          community_id: string
          created_at?: string
          created_by?: string
          description?: string | null
          end_at?: string | null
          ends_at?: string | null
          event_type?: string
          id?: string
          is_online?: boolean | null
          is_recurring?: boolean | null
          location?: string | null
          max_attendees?: number | null
          recurrence_end_date?: string | null
          recurrence_parent_id?: string | null
          recurrence_type?: string | null
          rsvp_enabled?: boolean
          start_at: string
          starts_at?: string | null
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_enum"]
        }
        Update: {
          community_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          end_at?: string | null
          ends_at?: string | null
          event_type?: string
          id?: string
          is_online?: boolean | null
          is_recurring?: boolean | null
          location?: string | null
          max_attendees?: number | null
          recurrence_end_date?: string | null
          recurrence_parent_id?: string | null
          recurrence_type?: string | null
          rsvp_enabled?: boolean
          start_at?: string
          starts_at?: string | null
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "events_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_recurrence_parent_id_fkey"
            columns: ["recurrence_parent_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      features: {
        Row: {
          community_id: string
          config: Json
          enabled: boolean
          id: string
          module: Database["public"]["Enums"]["module_enum"]
          updated_at: string
          visibility: Database["public"]["Enums"]["visibility_enum"]
        }
        Insert: {
          community_id: string
          config?: Json
          enabled?: boolean
          id?: string
          module: Database["public"]["Enums"]["module_enum"]
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_enum"]
        }
        Update: {
          community_id?: string
          config?: Json
          enabled?: boolean
          id?: string
          module?: Database["public"]["Enums"]["module_enum"]
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "features_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_categories: {
        Row: {
          community_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          position: number
          visibility: Database["public"]["Enums"]["visibility_enum"]
        }
        Insert: {
          community_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          position?: number
          visibility?: Database["public"]["Enums"]["visibility_enum"]
        }
        Update: {
          community_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          position?: number
          visibility?: Database["public"]["Enums"]["visibility_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "forum_categories_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          thread_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          thread_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          thread_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_threads: {
        Row: {
          author_id: string
          category_id: string
          community_id: string
          content: string
          created_at: string
          id: string
          locked: boolean
          pinned: boolean
          reply_count: number
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          category_id: string
          community_id: string
          content: string
          created_at?: string
          id?: string
          locked?: boolean
          pinned?: boolean
          reply_count?: number
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          category_id?: string
          community_id?: string
          content?: string
          created_at?: string
          id?: string
          locked?: boolean
          pinned?: boolean
          reply_count?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_threads_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_threads_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "forum_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_threads_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string
          global_role: Database["public"]["Enums"]["global_role_enum"]
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          global_role?: Database["public"]["Enums"]["global_role_enum"]
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          global_role?: Database["public"]["Enums"]["global_role_enum"]
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      shop_items: {
        Row: {
          community_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          metadata: Json
          name: string
          price_points: number
          stock: number | null
          type: Database["public"]["Enums"]["shop_item_type_enum"]
          updated_at: string
        }
        Insert: {
          community_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          metadata?: Json
          name: string
          price_points: number
          stock?: number | null
          type: Database["public"]["Enums"]["shop_item_type_enum"]
          updated_at?: string
        }
        Update: {
          community_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          metadata?: Json
          name?: string
          price_points?: number
          stock?: number | null
          type?: Database["public"]["Enums"]["shop_item_type_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_items_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_orders: {
        Row: {
          community_id: string
          created_at: string
          id: string
          item_id: string
          points_spent: number
          profile_id: string
          shipping_address: Json | null
          status: Database["public"]["Enums"]["order_status_enum"]
          updated_at: string
        }
        Insert: {
          community_id: string
          created_at?: string
          id?: string
          item_id: string
          points_spent: number
          profile_id: string
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["order_status_enum"]
          updated_at?: string
        }
        Update: {
          community_id?: string
          created_at?: string
          id?: string
          item_id?: string
          points_spent?: number
          profile_id?: string
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["order_status_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_orders_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_orders_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_orders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stat_schemas: {
        Row: {
          community_id: string
          created_at: string
          fields: Json
          formula_config: Json
          id: string
          updated_at: string
        }
        Insert: {
          community_id: string
          created_at?: string
          fields?: Json
          formula_config?: Json
          id?: string
          updated_at?: string
        }
        Update: {
          community_id?: string
          created_at?: string
          fields?: Json
          formula_config?: Json
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stat_schemas_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: true
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_participants: {
        Row: {
          id: string
          name: string | null
          profile_id: string | null
          rank: number | null
          registered_at: string
          score: number
          tournament_id: string
        }
        Insert: {
          id?: string
          name?: string | null
          profile_id?: string | null
          rank?: number | null
          registered_at?: string
          score?: number
          tournament_id: string
        }
        Update: {
          id?: string
          name?: string | null
          profile_id?: string | null
          rank?: number | null
          registered_at?: string
          score?: number
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          bracket_data: Json
          community_id: string
          config: Json
          created_at: string
          created_by: string
          description: string | null
          end_at: string | null
          id: string
          max_participants: number | null
          name: string
          start_at: string | null
          status: Database["public"]["Enums"]["tournament_status_enum"]
          type: Database["public"]["Enums"]["tournament_type_enum"]
          updated_at: string
        }
        Insert: {
          bracket_data?: Json
          community_id: string
          config?: Json
          created_at?: string
          created_by: string
          description?: string | null
          end_at?: string | null
          id?: string
          max_participants?: number | null
          name: string
          start_at?: string | null
          status?: Database["public"]["Enums"]["tournament_status_enum"]
          type?: Database["public"]["Enums"]["tournament_type_enum"]
          updated_at?: string
        }
        Update: {
          bracket_data?: Json
          community_id?: string
          config?: Json
          created_at?: string
          created_by?: string
          description?: string | null
          end_at?: string | null
          id?: string
          max_participants?: number | null
          name?: string
          start_at?: string | null
          status?: Database["public"]["Enums"]["tournament_status_enum"]
          type?: Database["public"]["Enums"]["tournament_type_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournaments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_member_points: {
        Args: { p_community_id: string; p_points: number; p_profile_id: string }
        Returns: undefined
      }
      is_member: { Args: { p_community_id: string }; Returns: boolean }
      is_moderator: { Args: { p_community_id: string }; Returns: boolean }
      is_owner: { Args: { p_community_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      application_status_enum:
        | "pending"
        | "accepted"
        | "rejected"
        | "waitlisted"
      bet_status_enum: "open" | "closed" | "resolved" | "cancelled"
      community_privacy_enum: "public" | "private"
      global_role_enum: "super_admin" | "user"
      member_role_enum: "owner" | "moderator" | "member" | "pending"
      module_enum:
        | "scores"
        | "tournaments"
        | "bets"
        | "shop"
        | "forum"
        | "calendar"
        | "applications"
      order_status_enum: "pending" | "completed" | "cancelled"
      rsvp_status_enum: "going" | "not_going" | "maybe"
      shop_item_type_enum: "badge" | "cosmetic" | "physical"
      subscription_tier_enum: "free" | "starter" | "pro"
      tournament_status_enum:
        | "draft"
        | "open"
        | "ongoing"
        | "completed"
        | "cancelled"
      tournament_type_enum:
        | "single_elimination"
        | "double_elimination"
        | "round_robin"
      visibility_enum: "public" | "members_only"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      application_status_enum: [
        "pending",
        "accepted",
        "rejected",
        "waitlisted",
      ],
      bet_status_enum: ["open", "closed", "resolved", "cancelled"],
      community_privacy_enum: ["public", "private"],
      global_role_enum: ["super_admin", "user"],
      member_role_enum: ["owner", "moderator", "member", "pending"],
      module_enum: [
        "scores",
        "tournaments",
        "bets",
        "shop",
        "forum",
        "calendar",
        "applications",
      ],
      order_status_enum: ["pending", "completed", "cancelled"],
      rsvp_status_enum: ["going", "not_going", "maybe"],
      shop_item_type_enum: ["badge", "cosmetic", "physical"],
      subscription_tier_enum: ["free", "starter", "pro"],
      tournament_status_enum: [
        "draft",
        "open",
        "ongoing",
        "completed",
        "cancelled",
      ],
      tournament_type_enum: [
        "single_elimination",
        "double_elimination",
        "round_robin",
      ],
      visibility_enum: ["public", "members_only"],
    },
  },
} as const
