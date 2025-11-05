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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_configuration: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      ai_models: {
        Row: {
          api_endpoint: string | null
          auth_type: string | null
          context_window: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_output_tokens: number | null
          model_id: string
          model_name: string
          provider: string
          secret_name: string | null
          supports_vision: boolean | null
          updated_at: string | null
        }
        Insert: {
          api_endpoint?: string | null
          auth_type?: string | null
          context_window?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_output_tokens?: number | null
          model_id: string
          model_name: string
          provider: string
          secret_name?: string | null
          supports_vision?: boolean | null
          updated_at?: string | null
        }
        Update: {
          api_endpoint?: string | null
          auth_type?: string | null
          context_window?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_output_tokens?: number | null
          model_id?: string
          model_name?: string
          provider?: string
          secret_name?: string | null
          supports_vision?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      analytics_views: {
        Row: {
          device: string | null
          id: string
          location: string | null
          source: string | null
          user_id: string
          viewed_at: string | null
          visitor_id: string | null
        }
        Insert: {
          device?: string | null
          id?: string
          location?: string | null
          source?: string | null
          user_id: string
          viewed_at?: string | null
          visitor_id?: string | null
        }
        Update: {
          device?: string | null
          id?: string
          location?: string | null
          source?: string | null
          user_id?: string
          viewed_at?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      article_comments: {
        Row: {
          article_id: string
          content: string
          created_at: string | null
          id: string
          is_approved: boolean | null
          parent_comment_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          article_id: string
          content: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          parent_comment_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          article_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          parent_comment_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "article_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      article_webhooks: {
        Row: {
          created_at: string | null
          event_type: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          user_id: string
          webhook_url: string
        }
        Insert: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
          webhook_url: string
        }
        Update: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
          webhook_url?: string
        }
        Relationships: []
      }
      articles: {
        Row: {
          author_id: string | null
          category: string | null
          content: string
          created_at: string | null
          excerpt: string | null
          featured_image_url: string | null
          generated_from_suggestion_id: string | null
          id: string
          keyword_id: string | null
          published_at: string | null
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          slug: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content: string
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          generated_from_suggestion_id?: string | null
          id?: string
          keyword_id?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          generated_from_suggestion_id?: string | null
          id?: string
          keyword_id?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_generated_from_suggestion_id_fkey"
            columns: ["generated_from_suggestion_id"]
            isOneToOne: false
            referencedRelation: "content_suggestions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      content_suggestions: {
        Row: {
          category: string | null
          created_at: string | null
          generated_article_id: string | null
          id: string
          keywords: string[] | null
          priority: number | null
          status: string | null
          suggested_by: string | null
          topic: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          generated_article_id?: string | null
          id?: string
          keywords?: string[] | null
          priority?: number | null
          status?: string | null
          suggested_by?: string | null
          topic: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          generated_article_id?: string | null
          id?: string
          keywords?: string[] | null
          priority?: number | null
          status?: string | null
          suggested_by?: string | null
          topic?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_suggestions_generated_article_id_fkey"
            columns: ["generated_article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_pages: {
        Row: {
          blocks: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          published: boolean
          published_at: string | null
          seo: Json
          slug: string
          theme: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          blocks?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          published?: boolean
          published_at?: string | null
          seo?: Json
          slug: string
          theme?: Json
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          blocks?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          published?: boolean
          published_at?: string | null
          seo?: Json
          slug?: string
          theme?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gsc_keyword_performance: {
        Row: {
          clicks: number | null
          clicks_change: number | null
          country: string | null
          created_at: string | null
          ctr: number | null
          ctr_change: number | null
          date: string
          device: string | null
          id: string
          impressions: number | null
          impressions_change: number | null
          position: number | null
          position_change: number | null
          property_id: string
          query: string
          search_type: string | null
          url: string | null
        }
        Insert: {
          clicks?: number | null
          clicks_change?: number | null
          country?: string | null
          created_at?: string | null
          ctr?: number | null
          ctr_change?: number | null
          date: string
          device?: string | null
          id?: string
          impressions?: number | null
          impressions_change?: number | null
          position?: number | null
          position_change?: number | null
          property_id: string
          query: string
          search_type?: string | null
          url?: string | null
        }
        Update: {
          clicks?: number | null
          clicks_change?: number | null
          country?: string | null
          created_at?: string | null
          ctr?: number | null
          ctr_change?: number | null
          date?: string
          device?: string | null
          id?: string
          impressions?: number | null
          impressions_change?: number | null
          position?: number | null
          position_change?: number | null
          property_id?: string
          query?: string
          search_type?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gsc_keyword_performance_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "gsc_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      gsc_oauth_credentials: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: string
          id: string
          is_active: boolean | null
          last_refreshed_at: string | null
          refresh_token: string
          scope: string
          token_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at: string
          id?: string
          is_active?: boolean | null
          last_refreshed_at?: string | null
          refresh_token: string
          scope: string
          token_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          last_refreshed_at?: string | null
          refresh_token?: string
          scope?: string
          token_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      gsc_page_performance: {
        Row: {
          clicks: number | null
          clicks_change: number | null
          country: string | null
          created_at: string | null
          ctr: number | null
          ctr_change: number | null
          date: string
          device: string | null
          id: string
          impressions: number | null
          impressions_change: number | null
          page_description: string | null
          page_title: string | null
          position: number | null
          position_change: number | null
          property_id: string
          search_type: string | null
          top_queries: Json | null
          url: string
        }
        Insert: {
          clicks?: number | null
          clicks_change?: number | null
          country?: string | null
          created_at?: string | null
          ctr?: number | null
          ctr_change?: number | null
          date: string
          device?: string | null
          id?: string
          impressions?: number | null
          impressions_change?: number | null
          page_description?: string | null
          page_title?: string | null
          position?: number | null
          position_change?: number | null
          property_id: string
          search_type?: string | null
          top_queries?: Json | null
          url: string
        }
        Update: {
          clicks?: number | null
          clicks_change?: number | null
          country?: string | null
          created_at?: string | null
          ctr?: number | null
          ctr_change?: number | null
          date?: string
          device?: string | null
          id?: string
          impressions?: number | null
          impressions_change?: number | null
          page_description?: string | null
          page_title?: string | null
          position?: number | null
          position_change?: number | null
          property_id?: string
          search_type?: string | null
          top_queries?: Json | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "gsc_page_performance_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "gsc_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      gsc_properties: {
        Row: {
          auto_sync_enabled: boolean | null
          created_at: string | null
          credential_id: string | null
          id: string
          is_primary: boolean | null
          is_verified: boolean | null
          last_synced_at: string | null
          permission_level: string | null
          property_name: string | null
          property_type: string | null
          property_url: string
          sync_error: string | null
          sync_frequency: string | null
          sync_status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_sync_enabled?: boolean | null
          created_at?: string | null
          credential_id?: string | null
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          last_synced_at?: string | null
          permission_level?: string | null
          property_name?: string | null
          property_type?: string | null
          property_url: string
          sync_error?: string | null
          sync_frequency?: string | null
          sync_status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_sync_enabled?: boolean | null
          created_at?: string | null
          credential_id?: string | null
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          last_synced_at?: string | null
          permission_level?: string | null
          property_name?: string | null
          property_type?: string | null
          property_url?: string
          sync_error?: string | null
          sync_frequency?: string | null
          sync_status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gsc_properties_credential_id_fkey"
            columns: ["credential_id"]
            isOneToOne: false
            referencedRelation: "gsc_oauth_credentials"
            referencedColumns: ["id"]
          },
        ]
      }
      keywords: {
        Row: {
          category: string | null
          created_at: string | null
          difficulty: string | null
          id: string
          is_active: boolean | null
          keyword: string
          last_used_at: string | null
          notes: string | null
          search_volume: number | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          difficulty?: string | null
          id?: string
          is_active?: boolean | null
          keyword: string
          last_used_at?: string | null
          notes?: string | null
          search_volume?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          difficulty?: string | null
          id?: string
          is_active?: boolean | null
          keyword?: string
          last_used_at?: string | null
          notes?: string | null
          search_volume?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string | null
          email: string
          form_data: Json | null
          id: string
          lead_type: string
          message: string | null
          name: string
          phone: string | null
          source: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          form_data?: Json | null
          id?: string
          lead_type: string
          message?: string | null
          name: string
          phone?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          form_data?: Json | null
          id?: string
          lead_type?: string
          message?: string | null
          name?: string
          phone?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      links: {
        Row: {
          click_count: number | null
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          position: number
          title: string
          updated_at: string | null
          url: string
          user_id: string
        }
        Insert: {
          click_count?: number | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          position?: number
          title: string
          updated_at?: string | null
          url: string
          user_id: string
        }
        Update: {
          click_count?: number | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          position?: number
          title?: string
          updated_at?: string | null
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          address: string
          bathrooms: number | null
          baths: number
          bedrooms: number | null
          beds: number
          city: string
          created_at: string | null
          days_on_market: number | null
          description: string | null
          id: string
          image: string | null
          is_featured: boolean | null
          listed_date: string | null
          lot_size_acres: number | null
          mls_number: string | null
          photos: Json | null
          price: string
          property_type: string | null
          sold_date: string | null
          sort_order: number | null
          sqft: number | null
          square_feet: number | null
          status: string | null
          updated_at: string | null
          user_id: string
          virtual_tour_url: string | null
        }
        Insert: {
          address: string
          bathrooms?: number | null
          baths: number
          bedrooms?: number | null
          beds: number
          city: string
          created_at?: string | null
          days_on_market?: number | null
          description?: string | null
          id?: string
          image?: string | null
          is_featured?: boolean | null
          listed_date?: string | null
          lot_size_acres?: number | null
          mls_number?: string | null
          photos?: Json | null
          price: string
          property_type?: string | null
          sold_date?: string | null
          sort_order?: number | null
          sqft?: number | null
          square_feet?: number | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          virtual_tour_url?: string | null
        }
        Update: {
          address?: string
          bathrooms?: number | null
          baths?: number
          bedrooms?: number | null
          beds?: number
          city?: string
          created_at?: string | null
          days_on_market?: number | null
          description?: string | null
          id?: string
          image?: string | null
          is_featured?: boolean | null
          listed_date?: string | null
          lot_size_acres?: number | null
          mls_number?: string | null
          photos?: Json | null
          price?: string
          property_type?: string | null
          sold_date?: string | null
          sort_order?: number | null
          sqft?: number | null
          square_feet?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          virtual_tour_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          brokerage_logo: string | null
          brokerage_name: string | null
          certifications: Json | null
          created_at: string | null
          custom_css: string | null
          custom_domain: string | null
          email_display: string | null
          facebook_url: string | null
          full_name: string | null
          id: string
          instagram_url: string | null
          is_published: boolean | null
          lead_count: number | null
          license_number: string | null
          license_state: string | null
          link_click_count: number | null
          linkedin_url: string | null
          og_image: string | null
          phone: string | null
          realtor_com_url: string | null
          seo_description: string | null
          seo_title: string | null
          service_cities: Json | null
          service_zip_codes: Json | null
          sms_enabled: boolean | null
          specialties: Json | null
          theme: string | null
          tiktok_url: string | null
          title: string | null
          updated_at: string | null
          username: string
          view_count: number | null
          website_url: string | null
          years_experience: number | null
          youtube_url: string | null
          zillow_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          brokerage_logo?: string | null
          brokerage_name?: string | null
          certifications?: Json | null
          created_at?: string | null
          custom_css?: string | null
          custom_domain?: string | null
          email_display?: string | null
          facebook_url?: string | null
          full_name?: string | null
          id: string
          instagram_url?: string | null
          is_published?: boolean | null
          lead_count?: number | null
          license_number?: string | null
          license_state?: string | null
          link_click_count?: number | null
          linkedin_url?: string | null
          og_image?: string | null
          phone?: string | null
          realtor_com_url?: string | null
          seo_description?: string | null
          seo_title?: string | null
          service_cities?: Json | null
          service_zip_codes?: Json | null
          sms_enabled?: boolean | null
          specialties?: Json | null
          theme?: string | null
          tiktok_url?: string | null
          title?: string | null
          updated_at?: string | null
          username: string
          view_count?: number | null
          website_url?: string | null
          years_experience?: number | null
          youtube_url?: string | null
          zillow_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          brokerage_logo?: string | null
          brokerage_name?: string | null
          certifications?: Json | null
          created_at?: string | null
          custom_css?: string | null
          custom_domain?: string | null
          email_display?: string | null
          facebook_url?: string | null
          full_name?: string | null
          id?: string
          instagram_url?: string | null
          is_published?: boolean | null
          lead_count?: number | null
          license_number?: string | null
          license_state?: string | null
          link_click_count?: number | null
          linkedin_url?: string | null
          og_image?: string | null
          phone?: string | null
          realtor_com_url?: string | null
          seo_description?: string | null
          seo_title?: string | null
          service_cities?: Json | null
          service_zip_codes?: Json | null
          sms_enabled?: boolean | null
          specialties?: Json | null
          theme?: string | null
          tiktok_url?: string | null
          title?: string | null
          updated_at?: string | null
          username?: string
          view_count?: number | null
          website_url?: string | null
          years_experience?: number | null
          youtube_url?: string | null
          zillow_url?: string | null
        }
        Relationships: []
      }
      seo_alert_rules: {
        Row: {
          conditions: Json
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          name: string
          rule_type: string
          severity: string | null
          updated_at: string | null
        }
        Insert: {
          conditions?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name: string
          rule_type: string
          severity?: string | null
          updated_at?: string | null
        }
        Update: {
          conditions?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string
          rule_type?: string
          severity?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      seo_alerts: {
        Row: {
          affected_url: string | null
          alert_rule_id: string | null
          alert_type: string
          created_at: string | null
          id: string
          message: string
          severity: string
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          affected_url?: string | null
          alert_rule_id?: string | null
          alert_type: string
          created_at?: string | null
          id?: string
          message: string
          severity: string
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          affected_url?: string | null
          alert_rule_id?: string | null
          alert_type?: string
          created_at?: string | null
          id?: string
          message?: string
          severity?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_alerts_alert_rule_id_fkey"
            columns: ["alert_rule_id"]
            isOneToOne: false
            referencedRelation: "seo_alert_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_audit_history: {
        Row: {
          accessibility_score: number | null
          audit_duration_ms: number | null
          audit_type: string | null
          best_practices_score: number | null
          broken_links_count: number | null
          created_at: string | null
          critical_issues: Json | null
          description_length: number | null
          external_links_count: number | null
          has_canonical: boolean | null
          has_description: boolean | null
          has_favicon: boolean | null
          has_keywords: boolean | null
          has_og_tags: boolean | null
          has_robots_txt: boolean | null
          has_sitemap: boolean | null
          has_ssl: boolean | null
          has_title: boolean | null
          has_twitter_cards: boolean | null
          heading_structure: Json | null
          id: string
          images_count: number | null
          images_with_alt_count: number | null
          internal_links_count: number | null
          mobile_friendly: boolean | null
          overall_score: number | null
          page_load_time: number | null
          performance_score: number | null
          performed_by: string | null
          raw_audit_data: Json | null
          recommendations: Json | null
          seo_score: number | null
          title_length: number | null
          url: string
          warnings: Json | null
          word_count: number | null
        }
        Insert: {
          accessibility_score?: number | null
          audit_duration_ms?: number | null
          audit_type?: string | null
          best_practices_score?: number | null
          broken_links_count?: number | null
          created_at?: string | null
          critical_issues?: Json | null
          description_length?: number | null
          external_links_count?: number | null
          has_canonical?: boolean | null
          has_description?: boolean | null
          has_favicon?: boolean | null
          has_keywords?: boolean | null
          has_og_tags?: boolean | null
          has_robots_txt?: boolean | null
          has_sitemap?: boolean | null
          has_ssl?: boolean | null
          has_title?: boolean | null
          has_twitter_cards?: boolean | null
          heading_structure?: Json | null
          id?: string
          images_count?: number | null
          images_with_alt_count?: number | null
          internal_links_count?: number | null
          mobile_friendly?: boolean | null
          overall_score?: number | null
          page_load_time?: number | null
          performance_score?: number | null
          performed_by?: string | null
          raw_audit_data?: Json | null
          recommendations?: Json | null
          seo_score?: number | null
          title_length?: number | null
          url: string
          warnings?: Json | null
          word_count?: number | null
        }
        Update: {
          accessibility_score?: number | null
          audit_duration_ms?: number | null
          audit_type?: string | null
          best_practices_score?: number | null
          broken_links_count?: number | null
          created_at?: string | null
          critical_issues?: Json | null
          description_length?: number | null
          external_links_count?: number | null
          has_canonical?: boolean | null
          has_description?: boolean | null
          has_favicon?: boolean | null
          has_keywords?: boolean | null
          has_og_tags?: boolean | null
          has_robots_txt?: boolean | null
          has_sitemap?: boolean | null
          has_ssl?: boolean | null
          has_title?: boolean | null
          has_twitter_cards?: boolean | null
          heading_structure?: Json | null
          id?: string
          images_count?: number | null
          images_with_alt_count?: number | null
          internal_links_count?: number | null
          mobile_friendly?: boolean | null
          overall_score?: number | null
          page_load_time?: number | null
          performance_score?: number | null
          performed_by?: string | null
          raw_audit_data?: Json | null
          recommendations?: Json | null
          seo_score?: number | null
          title_length?: number | null
          url?: string
          warnings?: Json | null
          word_count?: number | null
        }
        Relationships: []
      }
      seo_fixes_applied: {
        Row: {
          after_value: string | null
          applied_at: string | null
          applied_by: string | null
          audit_id: string | null
          before_value: string | null
          created_at: string | null
          fix_category: string | null
          fix_description: string
          fix_impact: string | null
          fix_type: string
          id: string
          issue_description: string
          reverted_at: string | null
          status: string | null
          updated_at: string | null
          url: string
          verification_notes: string | null
          verification_status: string | null
        }
        Insert: {
          after_value?: string | null
          applied_at?: string | null
          applied_by?: string | null
          audit_id?: string | null
          before_value?: string | null
          created_at?: string | null
          fix_category?: string | null
          fix_description: string
          fix_impact?: string | null
          fix_type: string
          id?: string
          issue_description: string
          reverted_at?: string | null
          status?: string | null
          updated_at?: string | null
          url: string
          verification_notes?: string | null
          verification_status?: string | null
        }
        Update: {
          after_value?: string | null
          applied_at?: string | null
          applied_by?: string | null
          audit_id?: string | null
          before_value?: string | null
          created_at?: string | null
          fix_category?: string | null
          fix_description?: string
          fix_impact?: string | null
          fix_type?: string
          id?: string
          issue_description?: string
          reverted_at?: string | null
          status?: string | null
          updated_at?: string | null
          url?: string
          verification_notes?: string | null
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_fixes_applied_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "seo_audit_history"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_keyword_history: {
        Row: {
          checked_at: string | null
          clicks: number | null
          created_at: string | null
          ctr: number | null
          data_source: string | null
          device: string | null
          id: string
          impressions: number | null
          keyword: string
          keyword_id: string
          location: string | null
          position: number | null
          recorded_at: string | null
          search_engine: string | null
          search_volume: number | null
          url: string | null
          visibility_score: number | null
        }
        Insert: {
          checked_at?: string | null
          clicks?: number | null
          created_at?: string | null
          ctr?: number | null
          data_source?: string | null
          device?: string | null
          id?: string
          impressions?: number | null
          keyword: string
          keyword_id: string
          location?: string | null
          position?: number | null
          recorded_at?: string | null
          search_engine?: string | null
          search_volume?: number | null
          url?: string | null
          visibility_score?: number | null
        }
        Update: {
          checked_at?: string | null
          clicks?: number | null
          created_at?: string | null
          ctr?: number | null
          data_source?: string | null
          device?: string | null
          id?: string
          impressions?: number | null
          keyword?: string
          keyword_id?: string
          location?: string | null
          position?: number | null
          recorded_at?: string | null
          search_engine?: string | null
          search_volume?: number | null
          url?: string | null
          visibility_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_keyword_history_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "seo_keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_keywords: {
        Row: {
          avg_position: number | null
          best_position: number | null
          category: string | null
          clicks: number | null
          competition: string | null
          created_at: string | null
          created_by: string | null
          ctr: number | null
          current_position: number | null
          difficulty_score: number | null
          first_ranked_at: string | null
          id: string
          impressions: number | null
          intent: string | null
          is_active: boolean | null
          is_ranking: boolean | null
          keyword: string
          keyword_type: string | null
          last_checked_at: string | null
          last_position_change_at: string | null
          monthly_searches: number | null
          notes: string | null
          position_change: number | null
          previous_position: number | null
          priority: number | null
          search_volume: number | null
          tags: string[] | null
          target_position: number | null
          target_url: string | null
          updated_at: string | null
          user_id: string | null
          visibility_score: number | null
        }
        Insert: {
          avg_position?: number | null
          best_position?: number | null
          category?: string | null
          clicks?: number | null
          competition?: string | null
          created_at?: string | null
          created_by?: string | null
          ctr?: number | null
          current_position?: number | null
          difficulty_score?: number | null
          first_ranked_at?: string | null
          id?: string
          impressions?: number | null
          intent?: string | null
          is_active?: boolean | null
          is_ranking?: boolean | null
          keyword: string
          keyword_type?: string | null
          last_checked_at?: string | null
          last_position_change_at?: string | null
          monthly_searches?: number | null
          notes?: string | null
          position_change?: number | null
          previous_position?: number | null
          priority?: number | null
          search_volume?: number | null
          tags?: string[] | null
          target_position?: number | null
          target_url?: string | null
          updated_at?: string | null
          user_id?: string | null
          visibility_score?: number | null
        }
        Update: {
          avg_position?: number | null
          best_position?: number | null
          category?: string | null
          clicks?: number | null
          competition?: string | null
          created_at?: string | null
          created_by?: string | null
          ctr?: number | null
          current_position?: number | null
          difficulty_score?: number | null
          first_ranked_at?: string | null
          id?: string
          impressions?: number | null
          intent?: string | null
          is_active?: boolean | null
          is_ranking?: boolean | null
          keyword?: string
          keyword_type?: string | null
          last_checked_at?: string | null
          last_position_change_at?: string | null
          monthly_searches?: number | null
          notes?: string | null
          position_change?: number | null
          previous_position?: number | null
          priority?: number | null
          search_volume?: number | null
          tags?: string[] | null
          target_position?: number | null
          target_url?: string | null
          updated_at?: string | null
          user_id?: string | null
          visibility_score?: number | null
        }
        Relationships: []
      }
      seo_monitoring_log: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          results_summary: Json | null
          schedule_id: string | null
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          results_summary?: Json | null
          schedule_id?: string | null
          started_at?: string | null
          status: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          results_summary?: Json | null
          schedule_id?: string | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_monitoring_log_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "seo_monitoring_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_monitoring_schedules: {
        Row: {
          created_at: string | null
          frequency: string
          id: string
          is_active: boolean | null
          last_run_at: string | null
          name: string
          next_run_at: string | null
          schedule_type: string
          target_url: string
        }
        Insert: {
          created_at?: string | null
          frequency: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          schedule_type: string
          target_url: string
        }
        Update: {
          created_at?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          schedule_type?: string
          target_url?: string
        }
        Relationships: []
      }
      seo_notification_preferences: {
        Row: {
          broken_links: boolean | null
          created_at: string | null
          critical_alerts: boolean | null
          email_address: string | null
          email_enabled: boolean | null
          id: string
          in_app_enabled: boolean | null
          performance_alerts: boolean | null
          ranking_changes: boolean | null
          security_alerts: boolean | null
          slack_enabled: boolean | null
          slack_webhook_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          broken_links?: boolean | null
          created_at?: string | null
          critical_alerts?: boolean | null
          email_address?: string | null
          email_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          performance_alerts?: boolean | null
          ranking_changes?: boolean | null
          security_alerts?: boolean | null
          slack_enabled?: boolean | null
          slack_webhook_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          broken_links?: boolean | null
          created_at?: string | null
          critical_alerts?: boolean | null
          email_address?: string | null
          email_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          performance_alerts?: boolean | null
          ranking_changes?: boolean | null
          security_alerts?: boolean | null
          slack_enabled?: boolean | null
          slack_webhook_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      seo_settings: {
        Row: {
          additional_meta_tags: Json | null
          apple_touch_icon_url: string | null
          bing_site_verification: string | null
          canonical_url_override: string | null
          created_at: string | null
          default_author: string | null
          default_description: string | null
          default_keywords: string[] | null
          default_og_image: string | null
          default_title: string | null
          favicon_url: string | null
          google_analytics_id: string | null
          google_site_verification: string | null
          google_tag_manager_id: string | null
          id: string
          language: string | null
          llms_txt: string | null
          manifest_url: string | null
          region: string | null
          robots_txt: string | null
          schema_org_data: Json | null
          site_name: string | null
          site_url: string
          sitemap_enabled: boolean | null
          sitemap_frequency: string | null
          sitemap_priority: number | null
          social_profiles: Json | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          additional_meta_tags?: Json | null
          apple_touch_icon_url?: string | null
          bing_site_verification?: string | null
          canonical_url_override?: string | null
          created_at?: string | null
          default_author?: string | null
          default_description?: string | null
          default_keywords?: string[] | null
          default_og_image?: string | null
          default_title?: string | null
          favicon_url?: string | null
          google_analytics_id?: string | null
          google_site_verification?: string | null
          google_tag_manager_id?: string | null
          id?: string
          language?: string | null
          llms_txt?: string | null
          manifest_url?: string | null
          region?: string | null
          robots_txt?: string | null
          schema_org_data?: Json | null
          site_name?: string | null
          site_url: string
          sitemap_enabled?: boolean | null
          sitemap_frequency?: string | null
          sitemap_priority?: number | null
          social_profiles?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          additional_meta_tags?: Json | null
          apple_touch_icon_url?: string | null
          bing_site_verification?: string | null
          canonical_url_override?: string | null
          created_at?: string | null
          default_author?: string | null
          default_description?: string | null
          default_keywords?: string[] | null
          default_og_image?: string | null
          default_title?: string | null
          favicon_url?: string | null
          google_analytics_id?: string | null
          google_site_verification?: string | null
          google_tag_manager_id?: string | null
          id?: string
          language?: string | null
          llms_txt?: string | null
          manifest_url?: string | null
          region?: string | null
          robots_txt?: string | null
          schema_org_data?: Json | null
          site_name?: string | null
          site_url?: string
          sitemap_enabled?: boolean | null
          sitemap_frequency?: string | null
          sitemap_priority?: number | null
          social_profiles?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      social_media_posts: {
        Row: {
          ai_prompt_used: string | null
          content_type: string
          created_at: string | null
          created_by: string | null
          id: string
          listing_id: string | null
          metadata: Json | null
          platform_type: string
          post_content: Json
          post_title: string | null
          posted_at: string | null
          property_address: string | null
          scheduled_for: string | null
          status: string | null
          subject_type: string
          webhook_urls: string[] | null
        }
        Insert: {
          ai_prompt_used?: string | null
          content_type: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          listing_id?: string | null
          metadata?: Json | null
          platform_type: string
          post_content: Json
          post_title?: string | null
          posted_at?: string | null
          property_address?: string | null
          scheduled_for?: string | null
          status?: string | null
          subject_type: string
          webhook_urls?: string[] | null
        }
        Update: {
          ai_prompt_used?: string | null
          content_type?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          listing_id?: string | null
          metadata?: Json | null
          platform_type?: string
          post_content?: Json
          post_title?: string | null
          posted_at?: string | null
          property_address?: string | null
          scheduled_for?: string | null
          status?: string | null
          subject_type?: string
          webhook_urls?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "social_media_posts_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_webhooks: {
        Row: {
          created_at: string | null
          headers: Json | null
          id: string
          is_active: boolean | null
          name: string
          platform: string
          updated_at: string | null
          webhook_url: string
        }
        Insert: {
          created_at?: string | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          platform: string
          updated_at?: string | null
          webhook_url: string
        }
        Update: {
          created_at?: string | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          platform?: string
          updated_at?: string | null
          webhook_url?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          features: Json
          id: string
          is_active: boolean | null
          limits: Json
          name: string
          price_monthly: number
          price_yearly: number | null
          sort_order: number | null
          stripe_price_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          features?: Json
          id?: string
          is_active?: boolean | null
          limits?: Json
          name: string
          price_monthly: number
          price_yearly?: number | null
          sort_order?: number | null
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          features?: Json
          id?: string
          is_active?: boolean | null
          limits?: Json
          name?: string
          price_monthly?: number
          price_yearly?: number | null
          sort_order?: number | null
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number | null
          analytics_history_days: number | null
          cancel_at: string | null
          canceled_at: string | null
          created_at: string | null
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          custom_domain_enabled: boolean | null
          id: string
          interval: string | null
          max_links: number | null
          max_listings: number | null
          max_testimonials: number | null
          plan_name: string
          priority_support: boolean | null
          remove_branding: boolean | null
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          analytics_history_days?: number | null
          cancel_at?: string | null
          canceled_at?: string | null
          created_at?: string | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          custom_domain_enabled?: boolean | null
          id?: string
          interval?: string | null
          max_links?: number | null
          max_listings?: number | null
          max_testimonials?: number | null
          plan_name?: string
          priority_support?: boolean | null
          remove_branding?: boolean | null
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          analytics_history_days?: number | null
          cancel_at?: string | null
          canceled_at?: string | null
          created_at?: string | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          custom_domain_enabled?: boolean | null
          id?: string
          interval?: string | null
          max_links?: number | null
          max_listings?: number | null
          max_testimonials?: number | null
          plan_name?: string
          priority_support?: boolean | null
          remove_branding?: boolean | null
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          client_name: string
          client_photo: string | null
          client_title: string | null
          created_at: string | null
          date: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          listing_id: string | null
          property_type: string | null
          rating: number
          review: string
          sort_order: number | null
          transaction_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_name: string
          client_photo?: string | null
          client_title?: string | null
          created_at?: string | null
          date?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          listing_id?: string | null
          property_type?: string | null
          rating: number
          review: string
          sort_order?: number | null
          transaction_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_name?: string
          client_photo?: string | null
          client_title?: string | null
          created_at?: string | null
          date?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          listing_id?: string | null
          property_type?: string | null
          rating?: number
          review?: string
          sort_order?: number | null
          transaction_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_tracking: {
        Row: {
          count: number | null
          created_at: string | null
          id: string
          last_reset_at: string | null
          resource_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          count?: number | null
          created_at?: string | null
          id?: string
          last_reset_at?: string | null
          resource_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          count?: number | null
          created_at?: string | null
          id?: string
          last_reset_at?: string | null
          resource_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string | null
          email_leads: boolean | null
          id: string
          marketing_emails: boolean | null
          show_contact_buttons: boolean | null
          show_listings: boolean | null
          show_social_proof: boolean | null
          show_sold_properties: boolean | null
          show_testimonials: boolean | null
          sms_leads: boolean | null
          updated_at: string | null
          user_id: string
          weekly_report: boolean | null
        }
        Insert: {
          created_at?: string | null
          email_leads?: boolean | null
          id?: string
          marketing_emails?: boolean | null
          show_contact_buttons?: boolean | null
          show_listings?: boolean | null
          show_social_proof?: boolean | null
          show_sold_properties?: boolean | null
          show_testimonials?: boolean | null
          sms_leads?: boolean | null
          updated_at?: string | null
          user_id: string
          weekly_report?: boolean | null
        }
        Update: {
          created_at?: string | null
          email_leads?: boolean | null
          id?: string
          marketing_emails?: boolean | null
          show_contact_buttons?: boolean | null
          show_listings?: boolean | null
          show_social_proof?: boolean | null
          show_sold_properties?: boolean | null
          show_testimonials?: boolean | null
          sms_leads?: boolean | null
          updated_at?: string | null
          user_id?: string
          weekly_report?: boolean | null
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_subscription_limit: {
        Args: { _limit_type: string; _user_id: string }
        Returns: boolean
      }
      check_usage_limit: {
        Args: { _limit: number; _resource_type: string; _user_id: string }
        Returns: boolean
      }
      check_username_available: {
        Args: { _current_user_id: string; _username: string }
        Returns: boolean
      }
      get_user_plan: { Args: { _user_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_link_clicks: { Args: { link_id: string }; Returns: undefined }
      increment_profile_leads: {
        Args: { _profile_id: string }
        Returns: undefined
      }
      increment_profile_views: {
        Args: { _profile_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      subscription_status:
        | "active"
        | "canceled"
        | "past_due"
        | "incomplete"
        | "trialing"
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
      app_role: ["admin", "user"],
      subscription_status: [
        "active",
        "canceled",
        "past_due",
        "incomplete",
        "trialing",
      ],
    },
  },
} as const
