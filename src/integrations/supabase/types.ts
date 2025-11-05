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
          id: string
          priority: number | null
          status: string | null
          suggested_by: string | null
          topic: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          priority?: number | null
          status?: string | null
          suggested_by?: string | null
          topic: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          priority?: number | null
          status?: string | null
          suggested_by?: string | null
          topic?: string
          updated_at?: string | null
        }
        Relationships: []
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
