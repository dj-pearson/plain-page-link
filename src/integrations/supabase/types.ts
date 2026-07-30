export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5';
  };
  public: {
    Tables: {
      ab_test_results: {
        Row: {
          analysis: Json;
          confidence: number | null;
          created_at: string;
          duration_days: number | null;
          ended_at: string | null;
          id: string;
          ml_conversion_rate: number | null;
          ml_conversions: number | null;
          ml_count: number | null;
          rules_conversion_rate: number | null;
          rules_conversions: number | null;
          rules_count: number | null;
          started_at: string | null;
          test_id: string;
          user_id: string;
          winner: string | null;
        };
        Insert: {
          analysis?: Json;
          confidence?: number | null;
          created_at?: string;
          duration_days?: number | null;
          ended_at?: string | null;
          id?: string;
          ml_conversion_rate?: number | null;
          ml_conversions?: number | null;
          ml_count?: number | null;
          rules_conversion_rate?: number | null;
          rules_conversions?: number | null;
          rules_count?: number | null;
          started_at?: string | null;
          test_id: string;
          user_id: string;
          winner?: string | null;
        };
        Update: {
          analysis?: Json;
          confidence?: number | null;
          created_at?: string;
          duration_days?: number | null;
          ended_at?: string | null;
          id?: string;
          ml_conversion_rate?: number | null;
          ml_conversions?: number | null;
          ml_count?: number | null;
          rules_conversion_rate?: number | null;
          rules_conversions?: number | null;
          rules_count?: number | null;
          started_at?: string | null;
          test_id?: string;
          user_id?: string;
          winner?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ab_test_results_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      account_deletion_log: {
        Row: {
          deleted_at: string;
          error_detail: string | null;
          gdpr_request_id: string | null;
          id: string;
          requested_at: string | null;
          scheduled_for: string | null;
          status: string;
          user_id: string;
        };
        Insert: {
          deleted_at?: string;
          error_detail?: string | null;
          gdpr_request_id?: string | null;
          id?: string;
          requested_at?: string | null;
          scheduled_for?: string | null;
          status?: string;
          user_id: string;
        };
        Update: {
          deleted_at?: string;
          error_detail?: string | null;
          gdpr_request_id?: string | null;
          id?: string;
          requested_at?: string | null;
          scheduled_for?: string | null;
          status?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      account_deletion_scheduled: {
        Row: {
          anonymization_completed: boolean | null;
          cancelled: boolean | null;
          cancelled_at: string | null;
          cancelled_reason: string | null;
          created_at: string | null;
          data_backup_url: string | null;
          executed: boolean | null;
          executed_at: string | null;
          gdpr_request_id: string | null;
          id: string;
          ip_address: string | null;
          reason: string | null;
          scheduled_for: string;
          user_id: string;
        };
        Insert: {
          anonymization_completed?: boolean | null;
          cancelled?: boolean | null;
          cancelled_at?: string | null;
          cancelled_reason?: string | null;
          created_at?: string | null;
          data_backup_url?: string | null;
          executed?: boolean | null;
          executed_at?: string | null;
          gdpr_request_id?: string | null;
          id?: string;
          ip_address?: string | null;
          reason?: string | null;
          scheduled_for: string;
          user_id: string;
        };
        Update: {
          anonymization_completed?: boolean | null;
          cancelled?: boolean | null;
          cancelled_at?: string | null;
          cancelled_reason?: string | null;
          created_at?: string | null;
          data_backup_url?: string | null;
          executed?: boolean | null;
          executed_at?: string | null;
          gdpr_request_id?: string | null;
          id?: string;
          ip_address?: string | null;
          reason?: string | null;
          scheduled_for?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'account_deletion_scheduled_gdpr_request_id_fkey';
            columns: ['gdpr_request_id'];
            isOneToOne: false;
            referencedRelation: 'gdpr_data_requests';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'account_deletion_scheduled_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      admin_audit_log: {
        Row: {
          action: string;
          admin_id: string | null;
          created_at: string | null;
          details: Json | null;
          id: string;
          ip_address: string | null;
          target_id: string | null;
          target_type: string | null;
          user_agent: string | null;
        };
        Insert: {
          action: string;
          admin_id?: string | null;
          created_at?: string | null;
          details?: Json | null;
          id?: string;
          ip_address?: string | null;
          target_id?: string | null;
          target_type?: string | null;
          user_agent?: string | null;
        };
        Update: {
          action?: string;
          admin_id?: string | null;
          created_at?: string | null;
          details?: Json | null;
          id?: string;
          ip_address?: string | null;
          target_id?: string | null;
          target_type?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'admin_audit_log_admin_id_fkey';
            columns: ['admin_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      ai_configuration: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          setting_key: string;
          setting_value: Json;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          setting_key: string;
          setting_value: Json;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          setting_key?: string;
          setting_value?: Json;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_configuration_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      ai_models: {
        Row: {
          api_endpoint: string | null;
          auth_type: string | null;
          context_window: number | null;
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          max_output_tokens: number | null;
          model_id: string;
          model_name: string;
          provider: string;
          secret_name: string | null;
          supports_vision: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          api_endpoint?: string | null;
          auth_type?: string | null;
          context_window?: number | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          max_output_tokens?: number | null;
          model_id: string;
          model_name: string;
          provider: string;
          secret_name?: string | null;
          supports_vision?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          api_endpoint?: string | null;
          auth_type?: string | null;
          context_window?: number | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          max_output_tokens?: number | null;
          model_id?: string;
          model_name?: string;
          provider?: string;
          secret_name?: string | null;
          supports_vision?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      analytics_views: {
        Row: {
          device: string | null;
          id: string;
          location: string | null;
          source: string | null;
          user_id: string;
          viewed_at: string | null;
          visitor_id: string | null;
        };
        Insert: {
          device?: string | null;
          id?: string;
          location?: string | null;
          source?: string | null;
          user_id: string;
          viewed_at?: string | null;
          visitor_id?: string | null;
        };
        Update: {
          device?: string | null;
          id?: string;
          location?: string | null;
          source?: string | null;
          user_id?: string;
          viewed_at?: string | null;
          visitor_id?: string | null;
        };
        Relationships: [];
      };
      api_keys: {
        Row: {
          created_at: string;
          description: string | null;
          expires_at: string | null;
          id: string;
          is_active: boolean;
          key_hash: string;
          key_prefix: string | null;
          last_used_at: string | null;
          name: string;
          permissions: Json;
          revoked_at: string | null;
          scopes: string[] | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean;
          key_hash: string;
          key_prefix?: string | null;
          last_used_at?: string | null;
          name: string;
          permissions?: Json;
          revoked_at?: string | null;
          scopes?: string[] | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean;
          key_hash?: string;
          key_prefix?: string | null;
          last_used_at?: string | null;
          name?: string;
          permissions?: Json;
          revoked_at?: string | null;
          scopes?: string[] | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'api_keys_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      article_comments: {
        Row: {
          article_id: string;
          content: string;
          created_at: string | null;
          id: string;
          is_approved: boolean | null;
          parent_comment_id: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          article_id: string;
          content: string;
          created_at?: string | null;
          id?: string;
          is_approved?: boolean | null;
          parent_comment_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          article_id?: string;
          content?: string;
          created_at?: string | null;
          id?: string;
          is_approved?: boolean | null;
          parent_comment_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'article_comments_article_id_fkey';
            columns: ['article_id'];
            isOneToOne: false;
            referencedRelation: 'articles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'article_comments_parent_comment_id_fkey';
            columns: ['parent_comment_id'];
            isOneToOne: false;
            referencedRelation: 'article_comments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'article_comments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      article_webhooks: {
        Row: {
          created_at: string | null;
          event_type: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          updated_at: string | null;
          user_id: string;
          webhook_url: string;
        };
        Insert: {
          created_at?: string | null;
          event_type?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          updated_at?: string | null;
          user_id?: string;
          webhook_url: string;
        };
        Update: {
          created_at?: string | null;
          event_type?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          updated_at?: string | null;
          user_id?: string;
          webhook_url?: string;
        };
        Relationships: [];
      };
      articles: {
        Row: {
          author_id: string | null;
          category: string | null;
          content: string;
          created_at: string | null;
          excerpt: string | null;
          featured_image_url: string | null;
          generated_from_suggestion_id: string | null;
          id: string;
          keyword_id: string | null;
          published_at: string | null;
          seo_description: string | null;
          seo_keywords: string[] | null;
          seo_title: string | null;
          slug: string;
          status: string | null;
          tags: string[] | null;
          title: string;
          updated_at: string | null;
          view_count: number | null;
        };
        Insert: {
          author_id?: string | null;
          category?: string | null;
          content: string;
          created_at?: string | null;
          excerpt?: string | null;
          featured_image_url?: string | null;
          generated_from_suggestion_id?: string | null;
          id?: string;
          keyword_id?: string | null;
          published_at?: string | null;
          seo_description?: string | null;
          seo_keywords?: string[] | null;
          seo_title?: string | null;
          slug: string;
          status?: string | null;
          tags?: string[] | null;
          title: string;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Update: {
          author_id?: string | null;
          category?: string | null;
          content?: string;
          created_at?: string | null;
          excerpt?: string | null;
          featured_image_url?: string | null;
          generated_from_suggestion_id?: string | null;
          id?: string;
          keyword_id?: string | null;
          published_at?: string | null;
          seo_description?: string | null;
          seo_keywords?: string[] | null;
          seo_title?: string | null;
          slug?: string;
          status?: string | null;
          tags?: string[] | null;
          title?: string;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'articles_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'articles_generated_from_suggestion_id_fkey';
            columns: ['generated_from_suggestion_id'];
            isOneToOne: false;
            referencedRelation: 'content_suggestions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'articles_keyword_id_fkey';
            columns: ['keyword_id'];
            isOneToOne: false;
            referencedRelation: 'keywords';
            referencedColumns: ['id'];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string | null;
          details: Json | null;
          id: string;
          ip_address: string | null;
          resource_id: string | null;
          resource_type: string | null;
          risk_level: string | null;
          status: string;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string | null;
          details?: Json | null;
          id?: string;
          ip_address?: string | null;
          resource_id?: string | null;
          resource_type?: string | null;
          risk_level?: string | null;
          status: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string | null;
          details?: Json | null;
          id?: string;
          ip_address?: string | null;
          resource_id?: string | null;
          resource_type?: string | null;
          risk_level?: string | null;
          status?: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_logs_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'audit_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      bing_webmaster_oauth_credentials: {
        Row: {
          access_token: string;
          created_at: string | null;
          expires_at: string;
          id: string;
          is_active: boolean | null;
          last_refreshed_at: string | null;
          refresh_token: string;
          scope: string;
          token_type: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          access_token: string;
          created_at?: string | null;
          expires_at: string;
          id?: string;
          is_active?: boolean | null;
          last_refreshed_at?: string | null;
          refresh_token: string;
          scope: string;
          token_type?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          access_token?: string;
          created_at?: string | null;
          expires_at?: string;
          id?: string;
          is_active?: boolean | null;
          last_refreshed_at?: string | null;
          refresh_token?: string;
          scope?: string;
          token_type?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bing_webmaster_oauth_credentials_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      bing_webmaster_search_data: {
        Row: {
          average_position: number | null;
          clicks: number | null;
          clicks_change: number | null;
          country: string | null;
          created_at: string | null;
          ctr: number | null;
          ctr_change: number | null;
          date: string;
          device: string | null;
          id: string;
          impressions: number | null;
          impressions_change: number | null;
          page_url: string | null;
          position_change: number | null;
          query: string | null;
          site_id: string;
        };
        Insert: {
          average_position?: number | null;
          clicks?: number | null;
          clicks_change?: number | null;
          country?: string | null;
          created_at?: string | null;
          ctr?: number | null;
          ctr_change?: number | null;
          date: string;
          device?: string | null;
          id?: string;
          impressions?: number | null;
          impressions_change?: number | null;
          page_url?: string | null;
          position_change?: number | null;
          query?: string | null;
          site_id: string;
        };
        Update: {
          average_position?: number | null;
          clicks?: number | null;
          clicks_change?: number | null;
          country?: string | null;
          created_at?: string | null;
          ctr?: number | null;
          ctr_change?: number | null;
          date?: string;
          device?: string | null;
          id?: string;
          impressions?: number | null;
          impressions_change?: number | null;
          page_url?: string | null;
          position_change?: number | null;
          query?: string | null;
          site_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bing_webmaster_search_data_site_id_fkey';
            columns: ['site_id'];
            isOneToOne: false;
            referencedRelation: 'bing_webmaster_sites';
            referencedColumns: ['id'];
          },
        ];
      };
      bing_webmaster_sites: {
        Row: {
          auto_sync_enabled: boolean | null;
          created_at: string | null;
          credential_id: string | null;
          id: string;
          is_primary: boolean | null;
          is_verified: boolean | null;
          last_synced_at: string | null;
          site_name: string | null;
          site_url: string;
          sync_error: string | null;
          sync_frequency: string | null;
          sync_status: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          auto_sync_enabled?: boolean | null;
          created_at?: string | null;
          credential_id?: string | null;
          id?: string;
          is_primary?: boolean | null;
          is_verified?: boolean | null;
          last_synced_at?: string | null;
          site_name?: string | null;
          site_url: string;
          sync_error?: string | null;
          sync_frequency?: string | null;
          sync_status?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          auto_sync_enabled?: boolean | null;
          created_at?: string | null;
          credential_id?: string | null;
          id?: string;
          is_primary?: boolean | null;
          is_verified?: boolean | null;
          last_synced_at?: string | null;
          site_name?: string | null;
          site_url?: string;
          sync_error?: string | null;
          sync_frequency?: string | null;
          sync_status?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bing_webmaster_sites_credential_id_fkey';
            columns: ['credential_id'];
            isOneToOne: false;
            referencedRelation: 'bing_webmaster_oauth_credentials';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bing_webmaster_sites_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      content_suggestions: {
        Row: {
          category: string | null;
          created_at: string | null;
          generated_article_id: string | null;
          id: string;
          keywords: string[] | null;
          priority: number | null;
          status: string | null;
          suggested_by: string | null;
          topic: string;
          updated_at: string | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          generated_article_id?: string | null;
          id?: string;
          keywords?: string[] | null;
          priority?: number | null;
          status?: string | null;
          suggested_by?: string | null;
          topic: string;
          updated_at?: string | null;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          generated_article_id?: string | null;
          id?: string;
          keywords?: string[] | null;
          priority?: number | null;
          status?: string | null;
          suggested_by?: string | null;
          topic?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'content_suggestions_generated_article_id_fkey';
            columns: ['generated_article_id'];
            isOneToOne: false;
            referencedRelation: 'articles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'content_suggestions_suggested_by_fkey';
            columns: ['suggested_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      custom_pages: {
        Row: {
          blocks: Json;
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          published: boolean;
          published_at: string | null;
          seo: Json;
          slug: string;
          theme: Json;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          blocks?: Json;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          published?: boolean;
          published_at?: string | null;
          seo?: Json;
          slug: string;
          theme?: Json;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          blocks?: Json;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          published?: boolean;
          published_at?: string | null;
          seo?: Json;
          slug?: string;
          theme?: Json;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'custom_pages_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      encrypted_pii_config: {
        Row: {
          created_at: string;
          encryption_type: string;
          field_name: string;
          id: string;
          is_encrypted: boolean;
          table_name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          encryption_type?: string;
          field_name: string;
          id?: string;
          is_encrypted?: boolean;
          table_name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          encryption_type?: string;
          field_name?: string;
          id?: string;
          is_encrypted?: boolean;
          table_name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      encryption_key_metadata: {
        Row: {
          algorithm: string;
          created_at: string;
          created_by: string | null;
          expires_at: string | null;
          id: string;
          key_id: string;
          key_version: number;
          rotated_at: string | null;
          status: string;
        };
        Insert: {
          algorithm?: string;
          created_at?: string;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          key_id: string;
          key_version?: number;
          rotated_at?: string | null;
          status?: string;
        };
        Update: {
          algorithm?: string;
          created_at?: string;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          key_id?: string;
          key_version?: number;
          rotated_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'encryption_key_metadata_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      enterprise_sso_config: {
        Row: {
          active: boolean | null;
          allowed_groups: string[] | null;
          attribute_mappings: Json | null;
          auto_provision_users: boolean | null;
          created_at: string | null;
          created_by: string | null;
          default_role: string | null;
          id: string;
          last_used_at: string | null;
          oidc_authorization_endpoint: string | null;
          oidc_client_id: string | null;
          oidc_client_secret: string | null;
          oidc_issuer: string | null;
          oidc_jwks_uri: string | null;
          oidc_scopes: string[] | null;
          oidc_token_endpoint: string | null;
          oidc_userinfo_endpoint: string | null;
          organization_domain: string;
          organization_id: string | null;
          organization_name: string;
          saml_certificate: string | null;
          saml_entity_id: string | null;
          saml_metadata_url: string | null;
          saml_name_id_format: string | null;
          saml_slo_url: string | null;
          saml_sso_url: string | null;
          sso_provider: string;
          updated_at: string | null;
          verified_at: string | null;
        };
        Insert: {
          active?: boolean | null;
          allowed_groups?: string[] | null;
          attribute_mappings?: Json | null;
          auto_provision_users?: boolean | null;
          created_at?: string | null;
          created_by?: string | null;
          default_role?: string | null;
          id?: string;
          last_used_at?: string | null;
          oidc_authorization_endpoint?: string | null;
          oidc_client_id?: string | null;
          oidc_client_secret?: string | null;
          oidc_issuer?: string | null;
          oidc_jwks_uri?: string | null;
          oidc_scopes?: string[] | null;
          oidc_token_endpoint?: string | null;
          oidc_userinfo_endpoint?: string | null;
          organization_domain: string;
          organization_id?: string | null;
          organization_name: string;
          saml_certificate?: string | null;
          saml_entity_id?: string | null;
          saml_metadata_url?: string | null;
          saml_name_id_format?: string | null;
          saml_slo_url?: string | null;
          saml_sso_url?: string | null;
          sso_provider: string;
          updated_at?: string | null;
          verified_at?: string | null;
        };
        Update: {
          active?: boolean | null;
          allowed_groups?: string[] | null;
          attribute_mappings?: Json | null;
          auto_provision_users?: boolean | null;
          created_at?: string | null;
          created_by?: string | null;
          default_role?: string | null;
          id?: string;
          last_used_at?: string | null;
          oidc_authorization_endpoint?: string | null;
          oidc_client_id?: string | null;
          oidc_client_secret?: string | null;
          oidc_issuer?: string | null;
          oidc_jwks_uri?: string | null;
          oidc_scopes?: string[] | null;
          oidc_token_endpoint?: string | null;
          oidc_userinfo_endpoint?: string | null;
          organization_domain?: string;
          organization_id?: string | null;
          organization_name?: string;
          saml_certificate?: string | null;
          saml_entity_id?: string | null;
          saml_metadata_url?: string | null;
          saml_name_id_format?: string | null;
          saml_slo_url?: string | null;
          saml_sso_url?: string | null;
          sso_provider?: string;
          updated_at?: string | null;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'enterprise_sso_config_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      error_logs: {
        Row: {
          created_at: string | null;
          error_message: string | null;
          error_type: string;
          id: string;
          resolution_notes: string | null;
          resolved: boolean | null;
          resolved_at: string | null;
          resolved_by: string | null;
          severity: string;
          stack_trace: string | null;
          user_context: Json | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          error_message?: string | null;
          error_type: string;
          id?: string;
          resolution_notes?: string | null;
          resolved?: boolean | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          severity: string;
          stack_trace?: string | null;
          user_context?: Json | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          error_message?: string | null;
          error_type?: string;
          id?: string;
          resolution_notes?: string | null;
          resolved?: boolean | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          severity?: string;
          stack_trace?: string | null;
          user_context?: Json | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'error_logs_resolved_by_fkey';
            columns: ['resolved_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'error_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      feature_catalog: {
        Row: {
          category: string | null;
          created_at: string | null;
          description: string | null;
          enterprise_limit: number | null;
          feature_key: string;
          free_limit: number | null;
          id: string;
          is_active: boolean | null;
          name: string;
          pricing_type: string;
          professional_limit: number | null;
          requires_subscription: boolean | null;
          sort_order: number | null;
          starter_limit: number | null;
          team_limit: number | null;
          unit_name: string | null;
          unit_price: number | null;
          updated_at: string | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          enterprise_limit?: number | null;
          feature_key: string;
          free_limit?: number | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          pricing_type?: string;
          professional_limit?: number | null;
          requires_subscription?: boolean | null;
          sort_order?: number | null;
          starter_limit?: number | null;
          team_limit?: number | null;
          unit_name?: string | null;
          unit_price?: number | null;
          updated_at?: string | null;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          enterprise_limit?: number | null;
          feature_key?: string;
          free_limit?: number | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          pricing_type?: string;
          professional_limit?: number | null;
          requires_subscription?: boolean | null;
          sort_order?: number | null;
          starter_limit?: number | null;
          team_limit?: number | null;
          unit_name?: string | null;
          unit_price?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      feature_flags: {
        Row: {
          created_at: string;
          description: string | null;
          enabled: boolean;
          id: string;
          name: string;
          rollout_percentage: number;
          updated_at: string;
          user_ids: string[];
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          enabled?: boolean;
          id?: string;
          name: string;
          rollout_percentage?: number;
          updated_at?: string;
          user_ids?: string[];
        };
        Update: {
          created_at?: string;
          description?: string | null;
          enabled?: boolean;
          id?: string;
          name?: string;
          rollout_percentage?: number;
          updated_at?: string;
          user_ids?: string[];
        };
        Relationships: [];
      };
      feature_usage: {
        Row: {
          billed_count: number | null;
          created_at: string | null;
          feature_key: string;
          id: string;
          metadata: Json | null;
          pending_count: number | null;
          updated_at: string | null;
          usage_count: number;
          usage_period_end: string;
          usage_period_start: string;
          user_id: string;
        };
        Insert: {
          billed_count?: number | null;
          created_at?: string | null;
          feature_key: string;
          id?: string;
          metadata?: Json | null;
          pending_count?: number | null;
          updated_at?: string | null;
          usage_count?: number;
          usage_period_end?: string;
          usage_period_start?: string;
          user_id: string;
        };
        Update: {
          billed_count?: number | null;
          created_at?: string | null;
          feature_key?: string;
          id?: string;
          metadata?: Json | null;
          pending_count?: number | null;
          updated_at?: string | null;
          usage_count?: number;
          usage_period_end?: string;
          usage_period_start?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'feature_usage_feature_key_fkey';
            columns: ['feature_key'];
            isOneToOne: false;
            referencedRelation: 'feature_catalog';
            referencedColumns: ['feature_key'];
          },
          {
            foreignKeyName: 'feature_usage_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      ga4_oauth_credentials: {
        Row: {
          access_token: string;
          created_at: string | null;
          expires_at: string;
          id: string;
          is_active: boolean | null;
          last_refreshed_at: string | null;
          refresh_token: string;
          scope: string;
          token_type: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          access_token: string;
          created_at?: string | null;
          expires_at: string;
          id?: string;
          is_active?: boolean | null;
          last_refreshed_at?: string | null;
          refresh_token: string;
          scope: string;
          token_type?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          access_token?: string;
          created_at?: string | null;
          expires_at?: string;
          id?: string;
          is_active?: boolean | null;
          last_refreshed_at?: string | null;
          refresh_token?: string;
          scope?: string;
          token_type?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ga4_oauth_credentials_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      ga4_properties: {
        Row: {
          auto_sync_enabled: boolean | null;
          created_at: string | null;
          credential_id: string | null;
          currency_code: string | null;
          display_name: string | null;
          id: string;
          is_primary: boolean | null;
          last_synced_at: string | null;
          property_id: string;
          property_name: string;
          property_type: string | null;
          sync_error: string | null;
          sync_frequency: string | null;
          sync_status: string | null;
          time_zone: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          auto_sync_enabled?: boolean | null;
          created_at?: string | null;
          credential_id?: string | null;
          currency_code?: string | null;
          display_name?: string | null;
          id?: string;
          is_primary?: boolean | null;
          last_synced_at?: string | null;
          property_id: string;
          property_name: string;
          property_type?: string | null;
          sync_error?: string | null;
          sync_frequency?: string | null;
          sync_status?: string | null;
          time_zone?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          auto_sync_enabled?: boolean | null;
          created_at?: string | null;
          credential_id?: string | null;
          currency_code?: string | null;
          display_name?: string | null;
          id?: string;
          is_primary?: boolean | null;
          last_synced_at?: string | null;
          property_id?: string;
          property_name?: string;
          property_type?: string | null;
          sync_error?: string | null;
          sync_frequency?: string | null;
          sync_status?: string | null;
          time_zone?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ga4_properties_credential_id_fkey';
            columns: ['credential_id'];
            isOneToOne: false;
            referencedRelation: 'ga4_oauth_credentials';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ga4_properties_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      ga4_traffic_data: {
        Row: {
          average_session_duration: number | null;
          bounce_rate: number | null;
          campaign: string | null;
          city: string | null;
          conversion_rate: number | null;
          conversions: number | null;
          country: string | null;
          created_at: string | null;
          date: string;
          device_category: string | null;
          engaged_sessions: number | null;
          engagement_rate: number | null;
          events_per_session: number | null;
          id: string;
          landing_page: string | null;
          medium: string | null;
          new_users: number | null;
          page_path: string | null;
          page_title: string | null;
          pageviews: number | null;
          pageviews_change: number | null;
          property_id: string;
          sessions: number | null;
          sessions_change: number | null;
          source: string | null;
          total_revenue: number | null;
          users: number | null;
          users_change: number | null;
        };
        Insert: {
          average_session_duration?: number | null;
          bounce_rate?: number | null;
          campaign?: string | null;
          city?: string | null;
          conversion_rate?: number | null;
          conversions?: number | null;
          country?: string | null;
          created_at?: string | null;
          date: string;
          device_category?: string | null;
          engaged_sessions?: number | null;
          engagement_rate?: number | null;
          events_per_session?: number | null;
          id?: string;
          landing_page?: string | null;
          medium?: string | null;
          new_users?: number | null;
          page_path?: string | null;
          page_title?: string | null;
          pageviews?: number | null;
          pageviews_change?: number | null;
          property_id: string;
          sessions?: number | null;
          sessions_change?: number | null;
          source?: string | null;
          total_revenue?: number | null;
          users?: number | null;
          users_change?: number | null;
        };
        Update: {
          average_session_duration?: number | null;
          bounce_rate?: number | null;
          campaign?: string | null;
          city?: string | null;
          conversion_rate?: number | null;
          conversions?: number | null;
          country?: string | null;
          created_at?: string | null;
          date?: string;
          device_category?: string | null;
          engaged_sessions?: number | null;
          engagement_rate?: number | null;
          events_per_session?: number | null;
          id?: string;
          landing_page?: string | null;
          medium?: string | null;
          new_users?: number | null;
          page_path?: string | null;
          page_title?: string | null;
          pageviews?: number | null;
          pageviews_change?: number | null;
          property_id?: string;
          sessions?: number | null;
          sessions_change?: number | null;
          source?: string | null;
          total_revenue?: number | null;
          users?: number | null;
          users_change?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ga4_traffic_data_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: false;
            referencedRelation: 'ga4_properties';
            referencedColumns: ['id'];
          },
        ];
      };
      gdpr_data_requests: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          email_verified: boolean | null;
          failed_reason: string | null;
          file_expires_at: string | null;
          file_url: string | null;
          id: string;
          ip_address: string | null;
          processed_at: string | null;
          request_type: string;
          scheduled_deletion_at: string | null;
          status: string;
          updated_at: string | null;
          user_agent: string | null;
          user_id: string;
          verification_expires_at: string | null;
          verification_token_hash: string | null;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          email_verified?: boolean | null;
          failed_reason?: string | null;
          file_expires_at?: string | null;
          file_url?: string | null;
          id?: string;
          ip_address?: string | null;
          processed_at?: string | null;
          request_type: string;
          scheduled_deletion_at?: string | null;
          status: string;
          updated_at?: string | null;
          user_agent?: string | null;
          user_id: string;
          verification_expires_at?: string | null;
          verification_token_hash?: string | null;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          email_verified?: boolean | null;
          failed_reason?: string | null;
          file_expires_at?: string | null;
          file_url?: string | null;
          id?: string;
          ip_address?: string | null;
          processed_at?: string | null;
          request_type?: string;
          scheduled_deletion_at?: string | null;
          status?: string;
          updated_at?: string | null;
          user_agent?: string | null;
          user_id?: string;
          verification_expires_at?: string | null;
          verification_token_hash?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'gdpr_data_requests_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      gsc_keyword_performance: {
        Row: {
          clicks: number | null;
          clicks_change: number | null;
          country: string | null;
          created_at: string | null;
          ctr: number | null;
          ctr_change: number | null;
          date: string;
          device: string | null;
          id: string;
          impressions: number | null;
          impressions_change: number | null;
          position: number | null;
          position_change: number | null;
          property_id: string;
          query: string;
          search_type: string | null;
          url: string | null;
        };
        Insert: {
          clicks?: number | null;
          clicks_change?: number | null;
          country?: string | null;
          created_at?: string | null;
          ctr?: number | null;
          ctr_change?: number | null;
          date: string;
          device?: string | null;
          id?: string;
          impressions?: number | null;
          impressions_change?: number | null;
          position?: number | null;
          position_change?: number | null;
          property_id: string;
          query: string;
          search_type?: string | null;
          url?: string | null;
        };
        Update: {
          clicks?: number | null;
          clicks_change?: number | null;
          country?: string | null;
          created_at?: string | null;
          ctr?: number | null;
          ctr_change?: number | null;
          date?: string;
          device?: string | null;
          id?: string;
          impressions?: number | null;
          impressions_change?: number | null;
          position?: number | null;
          position_change?: number | null;
          property_id?: string;
          query?: string;
          search_type?: string | null;
          url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'gsc_keyword_performance_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: false;
            referencedRelation: 'gsc_properties';
            referencedColumns: ['id'];
          },
        ];
      };
      gsc_oauth_credentials: {
        Row: {
          access_token: string;
          created_at: string | null;
          expires_at: string;
          id: string;
          is_active: boolean | null;
          last_refreshed_at: string | null;
          refresh_token: string;
          scope: string;
          token_type: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          access_token: string;
          created_at?: string | null;
          expires_at: string;
          id?: string;
          is_active?: boolean | null;
          last_refreshed_at?: string | null;
          refresh_token: string;
          scope: string;
          token_type?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          access_token?: string;
          created_at?: string | null;
          expires_at?: string;
          id?: string;
          is_active?: boolean | null;
          last_refreshed_at?: string | null;
          refresh_token?: string;
          scope?: string;
          token_type?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'gsc_oauth_credentials_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      gsc_page_performance: {
        Row: {
          clicks: number | null;
          clicks_change: number | null;
          country: string | null;
          created_at: string | null;
          ctr: number | null;
          ctr_change: number | null;
          date: string;
          device: string | null;
          id: string;
          impressions: number | null;
          impressions_change: number | null;
          page_description: string | null;
          page_title: string | null;
          position: number | null;
          position_change: number | null;
          property_id: string;
          search_type: string | null;
          top_queries: Json | null;
          url: string;
        };
        Insert: {
          clicks?: number | null;
          clicks_change?: number | null;
          country?: string | null;
          created_at?: string | null;
          ctr?: number | null;
          ctr_change?: number | null;
          date: string;
          device?: string | null;
          id?: string;
          impressions?: number | null;
          impressions_change?: number | null;
          page_description?: string | null;
          page_title?: string | null;
          position?: number | null;
          position_change?: number | null;
          property_id: string;
          search_type?: string | null;
          top_queries?: Json | null;
          url: string;
        };
        Update: {
          clicks?: number | null;
          clicks_change?: number | null;
          country?: string | null;
          created_at?: string | null;
          ctr?: number | null;
          ctr_change?: number | null;
          date?: string;
          device?: string | null;
          id?: string;
          impressions?: number | null;
          impressions_change?: number | null;
          page_description?: string | null;
          page_title?: string | null;
          position?: number | null;
          position_change?: number | null;
          property_id?: string;
          search_type?: string | null;
          top_queries?: Json | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'gsc_page_performance_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: false;
            referencedRelation: 'gsc_properties';
            referencedColumns: ['id'];
          },
        ];
      };
      gsc_properties: {
        Row: {
          auto_sync_enabled: boolean | null;
          created_at: string | null;
          credential_id: string | null;
          id: string;
          is_primary: boolean | null;
          is_verified: boolean | null;
          last_synced_at: string | null;
          permission_level: string | null;
          property_name: string | null;
          property_type: string | null;
          property_url: string;
          sync_error: string | null;
          sync_frequency: string | null;
          sync_status: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          auto_sync_enabled?: boolean | null;
          created_at?: string | null;
          credential_id?: string | null;
          id?: string;
          is_primary?: boolean | null;
          is_verified?: boolean | null;
          last_synced_at?: string | null;
          permission_level?: string | null;
          property_name?: string | null;
          property_type?: string | null;
          property_url: string;
          sync_error?: string | null;
          sync_frequency?: string | null;
          sync_status?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          auto_sync_enabled?: boolean | null;
          created_at?: string | null;
          credential_id?: string | null;
          id?: string;
          is_primary?: boolean | null;
          is_verified?: boolean | null;
          last_synced_at?: string | null;
          permission_level?: string | null;
          property_name?: string | null;
          property_type?: string | null;
          property_url?: string;
          sync_error?: string | null;
          sync_frequency?: string | null;
          sync_status?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'gsc_properties_credential_id_fkey';
            columns: ['credential_id'];
            isOneToOne: false;
            referencedRelation: 'gsc_oauth_credentials';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'gsc_properties_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      instagram_bio_analyses: {
        Row: {
          created_at: string;
          id: string;
          input_data: Json;
          ip_address: string | null;
          market: string | null;
          overall_score: number;
          result_data: Json;
          session_id: string | null;
          updated_at: string;
          user_agent: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          input_data: Json;
          ip_address?: string | null;
          market?: string | null;
          overall_score: number;
          result_data: Json;
          session_id?: string | null;
          updated_at?: string;
          user_agent?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          input_data?: Json;
          ip_address?: string | null;
          market?: string | null;
          overall_score?: number;
          result_data?: Json;
          session_id?: string | null;
          updated_at?: string;
          user_agent?: string | null;
        };
        Relationships: [];
      };
      instagram_bio_analytics: {
        Row: {
          created_at: string;
          event_data: Json | null;
          event_type: string;
          id: string;
          ip_address: string | null;
          referrer: string | null;
          session_id: string;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          event_data?: Json | null;
          event_type: string;
          id?: string;
          ip_address?: string | null;
          referrer?: string | null;
          session_id: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          event_data?: Json | null;
          event_type?: string;
          id?: string;
          ip_address?: string | null;
          referrer?: string | null;
          session_id?: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'instagram_bio_analytics_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      instagram_bio_email_captures: {
        Row: {
          analysis_id: string | null;
          brokerage: string | null;
          converted_at: string | null;
          converted_to_paid: boolean | null;
          converted_to_trial: boolean | null;
          created_at: string;
          email: string;
          email_sequence_completed: boolean | null;
          email_sequence_started: boolean | null;
          first_name: string;
          id: string;
          last_email_sent_at: string | null;
          market: string;
          referral_code: string | null;
          referrals_count: number | null;
        };
        Insert: {
          analysis_id?: string | null;
          brokerage?: string | null;
          converted_at?: string | null;
          converted_to_paid?: boolean | null;
          converted_to_trial?: boolean | null;
          created_at?: string;
          email: string;
          email_sequence_completed?: boolean | null;
          email_sequence_started?: boolean | null;
          first_name: string;
          id?: string;
          last_email_sent_at?: string | null;
          market: string;
          referral_code?: string | null;
          referrals_count?: number | null;
        };
        Update: {
          analysis_id?: string | null;
          brokerage?: string | null;
          converted_at?: string | null;
          converted_to_paid?: boolean | null;
          converted_to_trial?: boolean | null;
          created_at?: string;
          email?: string;
          email_sequence_completed?: boolean | null;
          email_sequence_started?: boolean | null;
          first_name?: string;
          id?: string;
          last_email_sent_at?: string | null;
          market?: string;
          referral_code?: string | null;
          referrals_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'instagram_bio_email_captures_analysis_id_fkey';
            columns: ['analysis_id'];
            isOneToOne: false;
            referencedRelation: 'instagram_bio_analyses';
            referencedColumns: ['id'];
          },
        ];
      };
      instagram_bio_email_sequences: {
        Row: {
          clicked: boolean | null;
          clicked_at: string | null;
          converted: boolean | null;
          created_at: string;
          email_capture_id: string | null;
          email_subject: string;
          id: string;
          opened: boolean | null;
          opened_at: string | null;
          sent_at: string | null;
          sequence_number: number;
        };
        Insert: {
          clicked?: boolean | null;
          clicked_at?: string | null;
          converted?: boolean | null;
          created_at?: string;
          email_capture_id?: string | null;
          email_subject: string;
          id?: string;
          opened?: boolean | null;
          opened_at?: string | null;
          sent_at?: string | null;
          sequence_number: number;
        };
        Update: {
          clicked?: boolean | null;
          clicked_at?: string | null;
          converted?: boolean | null;
          created_at?: string;
          email_capture_id?: string | null;
          email_subject?: string;
          id?: string;
          opened?: boolean | null;
          opened_at?: string | null;
          sent_at?: string | null;
          sequence_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'instagram_bio_email_sequences_email_capture_id_fkey';
            columns: ['email_capture_id'];
            isOneToOne: false;
            referencedRelation: 'instagram_bio_email_captures';
            referencedColumns: ['id'];
          },
        ];
      };
      invoices: {
        Row: {
          amount: number;
          created_at: string;
          currency: string | null;
          hosted_invoice_url: string | null;
          id: string;
          invoice_pdf: string | null;
          paid_at: string | null;
          status: string;
          stripe_invoice_id: string;
          stripe_subscription_id: string | null;
          user_id: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string;
          currency?: string | null;
          hosted_invoice_url?: string | null;
          id?: string;
          invoice_pdf?: string | null;
          paid_at?: string | null;
          status: string;
          stripe_invoice_id: string;
          stripe_subscription_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string;
          currency?: string | null;
          hosted_invoice_url?: string | null;
          id?: string;
          invoice_pdf?: string | null;
          paid_at?: string | null;
          status?: string;
          stripe_invoice_id?: string;
          stripe_subscription_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'invoices_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      keywords: {
        Row: {
          category: string | null;
          created_at: string | null;
          difficulty: string | null;
          id: string;
          is_active: boolean | null;
          keyword: string;
          last_used_at: string | null;
          notes: string | null;
          search_volume: number | null;
          updated_at: string | null;
          usage_count: number | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          difficulty?: string | null;
          id?: string;
          is_active?: boolean | null;
          keyword: string;
          last_used_at?: string | null;
          notes?: string | null;
          search_volume?: number | null;
          updated_at?: string | null;
          usage_count?: number | null;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          difficulty?: string | null;
          id?: string;
          is_active?: boolean | null;
          keyword?: string;
          last_used_at?: string | null;
          notes?: string | null;
          search_volume?: number | null;
          updated_at?: string | null;
          usage_count?: number | null;
        };
        Relationships: [];
      };
      lead_activities: {
        Row: {
          activity_at: string | null;
          activity_type: string;
          call_duration_seconds: number | null;
          call_outcome: string | null;
          content: string | null;
          created_at: string | null;
          email_recipient: string | null;
          email_subject: string | null;
          id: string;
          is_internal: boolean | null;
          lead_id: string;
          meeting_location: string | null;
          meeting_scheduled_at: string | null;
          meeting_type: string | null;
          metadata: Json | null;
          new_status: string | null;
          previous_status: string | null;
          task_completed_at: string | null;
          task_due_date: string | null;
          task_priority: string | null;
          title: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          activity_at?: string | null;
          activity_type: string;
          call_duration_seconds?: number | null;
          call_outcome?: string | null;
          content?: string | null;
          created_at?: string | null;
          email_recipient?: string | null;
          email_subject?: string | null;
          id?: string;
          is_internal?: boolean | null;
          lead_id: string;
          meeting_location?: string | null;
          meeting_scheduled_at?: string | null;
          meeting_type?: string | null;
          metadata?: Json | null;
          new_status?: string | null;
          previous_status?: string | null;
          task_completed_at?: string | null;
          task_due_date?: string | null;
          task_priority?: string | null;
          title?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          activity_at?: string | null;
          activity_type?: string;
          call_duration_seconds?: number | null;
          call_outcome?: string | null;
          content?: string | null;
          created_at?: string | null;
          email_recipient?: string | null;
          email_subject?: string | null;
          id?: string;
          is_internal?: boolean | null;
          lead_id?: string;
          meeting_location?: string | null;
          meeting_scheduled_at?: string | null;
          meeting_type?: string | null;
          metadata?: Json | null;
          new_status?: string | null;
          previous_status?: string | null;
          task_completed_at?: string | null;
          task_due_date?: string | null;
          task_priority?: string | null;
          title?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'lead_activities_lead_id_fkey';
            columns: ['lead_id'];
            isOneToOne: false;
            referencedRelation: 'leads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lead_activities_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      lead_notes: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          is_system: boolean;
          lead_id: string;
          note: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_system?: boolean;
          lead_id: string;
          note: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_system?: boolean;
          lead_id?: string;
          note?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'lead_notes_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lead_notes_lead_id_fkey';
            columns: ['lead_id'];
            isOneToOne: false;
            referencedRelation: 'leads';
            referencedColumns: ['id'];
          },
        ];
      };
      lead_routing_rules: {
        Row: {
          assigned_to: string | null;
          created_at: string;
          criteria: Json;
          id: string;
          is_active: boolean;
          name: string;
          priority: number;
          team_id: string;
        };
        Insert: {
          assigned_to?: string | null;
          created_at?: string;
          criteria?: Json;
          id?: string;
          is_active?: boolean;
          name: string;
          priority?: number;
          team_id: string;
        };
        Update: {
          assigned_to?: string | null;
          created_at?: string;
          criteria?: Json;
          id?: string;
          is_active?: boolean;
          name?: string;
          priority?: number;
          team_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'lead_routing_rules_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lead_routing_rules_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
        ];
      };
      lead_scores: {
        Row: {
          confidence: number | null;
          conversion_recorded_at: string | null;
          converted: boolean | null;
          created_at: string;
          feature_importance: Json | null;
          id: string;
          lead_id: string;
          model_version: string | null;
          priority: string;
          probability: number | null;
          score: number;
          scored_at: string;
          user_id: string;
          variant: string;
        };
        Insert: {
          confidence?: number | null;
          conversion_recorded_at?: string | null;
          converted?: boolean | null;
          created_at?: string;
          feature_importance?: Json | null;
          id?: string;
          lead_id: string;
          model_version?: string | null;
          priority: string;
          probability?: number | null;
          score: number;
          scored_at?: string;
          user_id: string;
          variant: string;
        };
        Update: {
          confidence?: number | null;
          conversion_recorded_at?: string | null;
          converted?: boolean | null;
          created_at?: string;
          feature_importance?: Json | null;
          id?: string;
          lead_id?: string;
          model_version?: string | null;
          priority?: string;
          probability?: number | null;
          score?: number;
          scored_at?: string;
          user_id?: string;
          variant?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'lead_scores_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      leads: {
        Row: {
          assigned_to: string | null;
          closed_at: string | null;
          contacted_at: string | null;
          created_at: string | null;
          device: string | null;
          email: string;
          encrypted_email: string | null;
          encrypted_phone: string | null;
          first_responded_at: string | null;
          form_data: Json | null;
          id: string;
          lead_type: string;
          listing_id: string | null;
          message: string | null;
          name: string;
          notes: string | null;
          phone: string | null;
          preapproved: boolean | null;
          price_range: string | null;
          property_address: string | null;
          referrer_url: string | null;
          source: string | null;
          status: string | null;
          timeline: string | null;
          updated_at: string | null;
          user_id: string;
          utm_campaign: string | null;
          utm_medium: string | null;
          utm_source: string | null;
        };
        Insert: {
          assigned_to?: string | null;
          closed_at?: string | null;
          contacted_at?: string | null;
          created_at?: string | null;
          device?: string | null;
          email: string;
          encrypted_email?: string | null;
          encrypted_phone?: string | null;
          first_responded_at?: string | null;
          form_data?: Json | null;
          id?: string;
          lead_type: string;
          listing_id?: string | null;
          message?: string | null;
          name: string;
          notes?: string | null;
          phone?: string | null;
          preapproved?: boolean | null;
          price_range?: string | null;
          property_address?: string | null;
          referrer_url?: string | null;
          source?: string | null;
          status?: string | null;
          timeline?: string | null;
          updated_at?: string | null;
          user_id: string;
          utm_campaign?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
        };
        Update: {
          assigned_to?: string | null;
          closed_at?: string | null;
          contacted_at?: string | null;
          created_at?: string | null;
          device?: string | null;
          email?: string;
          encrypted_email?: string | null;
          encrypted_phone?: string | null;
          first_responded_at?: string | null;
          form_data?: Json | null;
          id?: string;
          lead_type?: string;
          listing_id?: string | null;
          message?: string | null;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          preapproved?: boolean | null;
          price_range?: string | null;
          property_address?: string | null;
          referrer_url?: string | null;
          source?: string | null;
          status?: string | null;
          timeline?: string | null;
          updated_at?: string | null;
          user_id?: string;
          utm_campaign?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'leads_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'leads_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
        ];
      };
      links: {
        Row: {
          click_count: number | null;
          created_at: string | null;
          icon: string | null;
          id: string;
          is_active: boolean | null;
          position: number;
          title: string;
          updated_at: string | null;
          url: string;
          user_id: string;
        };
        Insert: {
          click_count?: number | null;
          created_at?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          position?: number;
          title: string;
          updated_at?: string | null;
          url: string;
          user_id: string;
        };
        Update: {
          click_count?: number | null;
          created_at?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          position?: number;
          title?: string;
          updated_at?: string | null;
          url?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'links_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      listing_descriptions: {
        Row: {
          created_at: string;
          descriptions: Json;
          id: string;
          ip_address: string | null;
          property_details: Json;
          session_id: string | null;
          updated_at: string;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          descriptions: Json;
          id?: string;
          ip_address?: string | null;
          property_details: Json;
          session_id?: string | null;
          updated_at?: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          descriptions?: Json;
          id?: string;
          ip_address?: string | null;
          property_details?: Json;
          session_id?: string | null;
          updated_at?: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'listing_descriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      listing_email_captures: {
        Row: {
          brokerage_name: string | null;
          converted_at: string | null;
          converted_to_paid: boolean | null;
          converted_to_trial: boolean | null;
          created_at: string;
          email: string;
          email_sequence_completed: boolean | null;
          email_sequence_started: boolean | null;
          first_name: string;
          id: string;
          last_email_sent_at: string | null;
          listing_id: string | null;
          phone_number: string | null;
          referral_code: string | null;
          referrals_count: number | null;
        };
        Insert: {
          brokerage_name?: string | null;
          converted_at?: string | null;
          converted_to_paid?: boolean | null;
          converted_to_trial?: boolean | null;
          created_at?: string;
          email: string;
          email_sequence_completed?: boolean | null;
          email_sequence_started?: boolean | null;
          first_name: string;
          id?: string;
          last_email_sent_at?: string | null;
          listing_id?: string | null;
          phone_number?: string | null;
          referral_code?: string | null;
          referrals_count?: number | null;
        };
        Update: {
          brokerage_name?: string | null;
          converted_at?: string | null;
          converted_to_paid?: boolean | null;
          converted_to_trial?: boolean | null;
          created_at?: string;
          email?: string;
          email_sequence_completed?: boolean | null;
          email_sequence_started?: boolean | null;
          first_name?: string;
          id?: string;
          last_email_sent_at?: string | null;
          listing_id?: string | null;
          phone_number?: string | null;
          referral_code?: string | null;
          referrals_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'listing_email_captures_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listing_descriptions';
            referencedColumns: ['id'];
          },
        ];
      };
      listing_email_sequences: {
        Row: {
          clicked: boolean | null;
          clicked_at: string | null;
          converted: boolean | null;
          created_at: string;
          email_capture_id: string | null;
          email_subject: string;
          id: string;
          opened: boolean | null;
          opened_at: string | null;
          sent_at: string | null;
          sequence_number: number;
        };
        Insert: {
          clicked?: boolean | null;
          clicked_at?: string | null;
          converted?: boolean | null;
          created_at?: string;
          email_capture_id?: string | null;
          email_subject: string;
          id?: string;
          opened?: boolean | null;
          opened_at?: string | null;
          sent_at?: string | null;
          sequence_number: number;
        };
        Update: {
          clicked?: boolean | null;
          clicked_at?: string | null;
          converted?: boolean | null;
          created_at?: string;
          email_capture_id?: string | null;
          email_subject?: string;
          id?: string;
          opened?: boolean | null;
          opened_at?: string | null;
          sent_at?: string | null;
          sequence_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'listing_email_sequences_email_capture_id_fkey';
            columns: ['email_capture_id'];
            isOneToOne: false;
            referencedRelation: 'listing_email_captures';
            referencedColumns: ['id'];
          },
        ];
      };
      listing_generator_analytics: {
        Row: {
          created_at: string;
          event_data: Json | null;
          event_type: string;
          id: string;
          ip_address: string | null;
          referrer: string | null;
          session_id: string;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          event_data?: Json | null;
          event_type: string;
          id?: string;
          ip_address?: string | null;
          referrer?: string | null;
          session_id: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          event_data?: Json | null;
          event_type?: string;
          id?: string;
          ip_address?: string | null;
          referrer?: string | null;
          session_id?: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'listing_generator_analytics_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      listings: {
        Row: {
          address: string;
          bathrooms: number | null;
          baths: number;
          bedrooms: number | null;
          beds: number;
          city: string;
          created_at: string | null;
          days_on_market: number | null;
          description: string | null;
          id: string;
          image: string | null;
          is_featured: boolean | null;
          listed_date: string | null;
          lot_size_acres: number | null;
          mls_number: string | null;
          photos: Json | null;
          price: string;
          property_type: string | null;
          sold_date: string | null;
          sort_order: number | null;
          sqft: number | null;
          square_feet: number | null;
          status: string | null;
          updated_at: string | null;
          user_id: string;
          virtual_tour_url: string | null;
        };
        Insert: {
          address: string;
          bathrooms?: number | null;
          baths: number;
          bedrooms?: number | null;
          beds: number;
          city: string;
          created_at?: string | null;
          days_on_market?: number | null;
          description?: string | null;
          id?: string;
          image?: string | null;
          is_featured?: boolean | null;
          listed_date?: string | null;
          lot_size_acres?: number | null;
          mls_number?: string | null;
          photos?: Json | null;
          price: string;
          property_type?: string | null;
          sold_date?: string | null;
          sort_order?: number | null;
          sqft?: number | null;
          square_feet?: number | null;
          status?: string | null;
          updated_at?: string | null;
          user_id: string;
          virtual_tour_url?: string | null;
        };
        Update: {
          address?: string;
          bathrooms?: number | null;
          baths?: number;
          bedrooms?: number | null;
          beds?: number;
          city?: string;
          created_at?: string | null;
          days_on_market?: number | null;
          description?: string | null;
          id?: string;
          image?: string | null;
          is_featured?: boolean | null;
          listed_date?: string | null;
          lot_size_acres?: number | null;
          mls_number?: string | null;
          photos?: Json | null;
          price?: string;
          property_type?: string | null;
          sold_date?: string | null;
          sort_order?: number | null;
          sqft?: number | null;
          square_feet?: number | null;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string;
          virtual_tour_url?: string | null;
        };
        Relationships: [];
      };
      login_attempts: {
        Row: {
          created_at: string | null;
          device_fingerprint: string | null;
          email: string;
          failure_reason: string | null;
          id: string;
          ip_address: string;
          success: boolean;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          device_fingerprint?: string | null;
          email: string;
          failure_reason?: string | null;
          id?: string;
          ip_address: string;
          success?: boolean;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          device_fingerprint?: string | null;
          email?: string;
          failure_reason?: string | null;
          id?: string;
          ip_address?: string;
          success?: boolean;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'login_attempts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      mfa_temp_codes: {
        Row: {
          attempts: number | null;
          code_hash: string;
          code_type: string;
          created_at: string | null;
          expires_at: string;
          id: string;
          used: boolean | null;
          used_at: string | null;
          user_id: string;
        };
        Insert: {
          attempts?: number | null;
          code_hash: string;
          code_type: string;
          created_at?: string | null;
          expires_at: string;
          id?: string;
          used?: boolean | null;
          used_at?: string | null;
          user_id: string;
        };
        Update: {
          attempts?: number | null;
          code_hash?: string;
          code_type?: string;
          created_at?: string | null;
          expires_at?: string;
          id?: string;
          used?: boolean | null;
          used_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'mfa_temp_codes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      mfa_trusted_devices: {
        Row: {
          browser: string | null;
          created_at: string | null;
          device_fingerprint: string;
          device_name: string | null;
          id: string;
          ip_address: string | null;
          last_used_at: string | null;
          os: string | null;
          revoked: boolean | null;
          revoked_at: string | null;
          trusted_until: string;
          user_id: string;
        };
        Insert: {
          browser?: string | null;
          created_at?: string | null;
          device_fingerprint: string;
          device_name?: string | null;
          id?: string;
          ip_address?: string | null;
          last_used_at?: string | null;
          os?: string | null;
          revoked?: boolean | null;
          revoked_at?: string | null;
          trusted_until: string;
          user_id: string;
        };
        Update: {
          browser?: string | null;
          created_at?: string | null;
          device_fingerprint?: string;
          device_name?: string | null;
          id?: string;
          ip_address?: string | null;
          last_used_at?: string | null;
          os?: string | null;
          revoked?: boolean | null;
          revoked_at?: string | null;
          trusted_until?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'mfa_trusted_devices_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      mfa_verification_logs: {
        Row: {
          created_at: string | null;
          device_fingerprint: string | null;
          failure_reason: string | null;
          id: string;
          ip_address: string | null;
          method: string;
          status: string;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          device_fingerprint?: string | null;
          failure_reason?: string | null;
          id?: string;
          ip_address?: string | null;
          method: string;
          status: string;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          device_fingerprint?: string | null;
          failure_reason?: string | null;
          id?: string;
          ip_address?: string | null;
          method?: string;
          status?: string;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'mfa_verification_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      ml_model_weights: {
        Row: {
          accuracy: number | null;
          auc: number | null;
          created_at: string;
          id: string;
          training_examples: number | null;
          updated_at: string;
          user_id: string;
          version: string | null;
          weights: Json;
        };
        Insert: {
          accuracy?: number | null;
          auc?: number | null;
          created_at?: string;
          id?: string;
          training_examples?: number | null;
          updated_at?: string;
          user_id: string;
          version?: string | null;
          weights?: Json;
        };
        Update: {
          accuracy?: number | null;
          auc?: number | null;
          created_at?: string;
          id?: string;
          training_examples?: number | null;
          updated_at?: string;
          user_id?: string;
          version?: string | null;
          weights?: Json;
        };
        Relationships: [
          {
            foreignKeyName: 'ml_model_weights_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      ml_training_examples: {
        Row: {
          conversion_recorded_at: string | null;
          converted: boolean;
          created_at: string;
          features: Json;
          id: string;
          lead_created_at: string | null;
          lead_id: string;
          lead_type: string | null;
          source: string | null;
          user_id: string;
        };
        Insert: {
          conversion_recorded_at?: string | null;
          converted: boolean;
          created_at?: string;
          features: Json;
          id?: string;
          lead_created_at?: string | null;
          lead_id: string;
          lead_type?: string | null;
          source?: string | null;
          user_id: string;
        };
        Update: {
          conversion_recorded_at?: string | null;
          converted?: boolean;
          created_at?: string;
          features?: Json;
          id?: string;
          lead_created_at?: string | null;
          lead_id?: string;
          lead_type?: string | null;
          source?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ml_training_examples_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      monthly_usage_summary: {
        Row: {
          billing_status: string | null;
          created_at: string | null;
          features_used: Json | null;
          id: string;
          period_month: number;
          period_year: number;
          stripe_invoice_id: string | null;
          total_usage_amount: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          billing_status?: string | null;
          created_at?: string | null;
          features_used?: Json | null;
          id?: string;
          period_month: number;
          period_year: number;
          stripe_invoice_id?: string | null;
          total_usage_amount?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          billing_status?: string | null;
          created_at?: string | null;
          features_used?: Json | null;
          id?: string;
          period_month?: number;
          period_year?: number;
          stripe_invoice_id?: string | null;
          total_usage_amount?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'monthly_usage_summary_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      mortgage_calculations: {
        Row: {
          created_at: string;
          down_payment: number | null;
          down_payment_percent: number | null;
          hoa_monthly: number | null;
          home_insurance_annual: number | null;
          home_price: number;
          id: string;
          interest_rate: number | null;
          lead_id: string | null;
          listing_id: string | null;
          loan_amount: number | null;
          loan_term_years: number | null;
          monthly_payment: number | null;
          monthly_payment_breakdown: Json;
          pmi_monthly: number | null;
          property_tax_annual: number | null;
          total_cost: number | null;
          total_interest: number | null;
          user_id: string;
          visitor_email: string | null;
          visitor_name: string | null;
          visitor_phone: string | null;
        };
        Insert: {
          created_at?: string;
          down_payment?: number | null;
          down_payment_percent?: number | null;
          hoa_monthly?: number | null;
          home_insurance_annual?: number | null;
          home_price: number;
          id?: string;
          interest_rate?: number | null;
          lead_id?: string | null;
          listing_id?: string | null;
          loan_amount?: number | null;
          loan_term_years?: number | null;
          monthly_payment?: number | null;
          monthly_payment_breakdown?: Json;
          pmi_monthly?: number | null;
          property_tax_annual?: number | null;
          total_cost?: number | null;
          total_interest?: number | null;
          user_id: string;
          visitor_email?: string | null;
          visitor_name?: string | null;
          visitor_phone?: string | null;
        };
        Update: {
          created_at?: string;
          down_payment?: number | null;
          down_payment_percent?: number | null;
          hoa_monthly?: number | null;
          home_insurance_annual?: number | null;
          home_price?: number;
          id?: string;
          interest_rate?: number | null;
          lead_id?: string | null;
          listing_id?: string | null;
          loan_amount?: number | null;
          loan_term_years?: number | null;
          monthly_payment?: number | null;
          monthly_payment_breakdown?: Json;
          pmi_monthly?: number | null;
          property_tax_annual?: number | null;
          total_cost?: number | null;
          total_interest?: number | null;
          user_id?: string;
          visitor_email?: string | null;
          visitor_name?: string | null;
          visitor_phone?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'mortgage_calculations_lead_id_fkey';
            columns: ['lead_id'];
            isOneToOne: false;
            referencedRelation: 'leads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'mortgage_calculations_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'mortgage_calculations_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          created_at: string;
          data: Json | null;
          id: string;
          message: string | null;
          read_at: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          data?: Json | null;
          id?: string;
          message?: string | null;
          read_at?: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          data?: Json | null;
          id?: string;
          message?: string | null;
          read_at?: string | null;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      pii_encryption_audit: {
        Row: {
          created_at: string;
          error_message: string | null;
          fields_affected: string[] | null;
          id: string;
          ip_address: string | null;
          operation: string;
          record_id: string | null;
          success: boolean;
          table_name: string;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          error_message?: string | null;
          fields_affected?: string[] | null;
          id?: string;
          ip_address?: string | null;
          operation: string;
          record_id?: string | null;
          success?: boolean;
          table_name: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          error_message?: string | null;
          fields_affected?: string[] | null;
          id?: string;
          ip_address?: string | null;
          operation?: string;
          record_id?: string | null;
          success?: boolean;
          table_name?: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'pii_encryption_audit_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          brokerage_logo: string | null;
          brokerage_name: string | null;
          calendly_url: string | null;
          certifications: Json | null;
          created_at: string | null;
          custom_css: string | null;
          custom_domain: string | null;
          email_display: string | null;
          facebook_url: string | null;
          full_name: string | null;
          id: string;
          instagram_url: string | null;
          is_published: boolean | null;
          lead_count: number | null;
          license_number: string | null;
          license_state: string | null;
          link_click_count: number | null;
          linkedin_url: string | null;
          notification_preferences: Json;
          og_image: string | null;
          onboarding_completed_at: string | null;
          phone: string | null;
          realtor_com_url: string | null;
          seo_description: string | null;
          seo_title: string | null;
          service_cities: Json | null;
          service_zip_codes: Json | null;
          sms_enabled: boolean | null;
          specialties: Json | null;
          theme: string | null;
          tiktok_url: string | null;
          title: string | null;
          updated_at: string | null;
          username: string;
          view_count: number | null;
          website_url: string | null;
          years_experience: number | null;
          youtube_url: string | null;
          zapier_webhook_url: string | null;
          zillow_url: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          brokerage_logo?: string | null;
          brokerage_name?: string | null;
          calendly_url?: string | null;
          certifications?: Json | null;
          created_at?: string | null;
          custom_css?: string | null;
          custom_domain?: string | null;
          email_display?: string | null;
          facebook_url?: string | null;
          full_name?: string | null;
          id: string;
          instagram_url?: string | null;
          is_published?: boolean | null;
          lead_count?: number | null;
          license_number?: string | null;
          license_state?: string | null;
          link_click_count?: number | null;
          linkedin_url?: string | null;
          notification_preferences?: Json;
          og_image?: string | null;
          onboarding_completed_at?: string | null;
          phone?: string | null;
          realtor_com_url?: string | null;
          seo_description?: string | null;
          seo_title?: string | null;
          service_cities?: Json | null;
          service_zip_codes?: Json | null;
          sms_enabled?: boolean | null;
          specialties?: Json | null;
          theme?: string | null;
          tiktok_url?: string | null;
          title?: string | null;
          updated_at?: string | null;
          username: string;
          view_count?: number | null;
          website_url?: string | null;
          years_experience?: number | null;
          youtube_url?: string | null;
          zapier_webhook_url?: string | null;
          zillow_url?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          brokerage_logo?: string | null;
          brokerage_name?: string | null;
          calendly_url?: string | null;
          certifications?: Json | null;
          created_at?: string | null;
          custom_css?: string | null;
          custom_domain?: string | null;
          email_display?: string | null;
          facebook_url?: string | null;
          full_name?: string | null;
          id?: string;
          instagram_url?: string | null;
          is_published?: boolean | null;
          lead_count?: number | null;
          license_number?: string | null;
          license_state?: string | null;
          link_click_count?: number | null;
          linkedin_url?: string | null;
          notification_preferences?: Json;
          og_image?: string | null;
          onboarding_completed_at?: string | null;
          phone?: string | null;
          realtor_com_url?: string | null;
          seo_description?: string | null;
          seo_title?: string | null;
          service_cities?: Json | null;
          service_zip_codes?: Json | null;
          sms_enabled?: boolean | null;
          specialties?: Json | null;
          theme?: string | null;
          tiktok_url?: string | null;
          title?: string | null;
          updated_at?: string | null;
          username?: string;
          view_count?: number | null;
          website_url?: string | null;
          years_experience?: number | null;
          youtube_url?: string | null;
          zapier_webhook_url?: string | null;
          zillow_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      pseo_combination_queue: {
        Row: {
          attempt_count: number | null;
          combination: Json;
          error_message: string | null;
          id: string;
          page_type: string;
          priority: number;
          processed_at: string | null;
          queued_at: string | null;
          status: string;
        };
        Insert: {
          attempt_count?: number | null;
          combination: Json;
          error_message?: string | null;
          id?: string;
          page_type: string;
          priority?: number;
          processed_at?: string | null;
          queued_at?: string | null;
          status?: string;
        };
        Update: {
          attempt_count?: number | null;
          combination?: Json;
          error_message?: string | null;
          id?: string;
          page_type?: string;
          priority?: number;
          processed_at?: string | null;
          queued_at?: string | null;
          status?: string;
        };
        Relationships: [];
      };
      pseo_generation_errors: {
        Row: {
          combination: Json;
          created_at: string | null;
          error_detail: string | null;
          error_type: string;
          id: string;
          page_type: string;
          quality_check_failures: Json | null;
          raw_response: string | null;
        };
        Insert: {
          combination: Json;
          created_at?: string | null;
          error_detail?: string | null;
          error_type: string;
          id?: string;
          page_type: string;
          quality_check_failures?: Json | null;
          raw_response?: string | null;
        };
        Update: {
          combination?: Json;
          created_at?: string | null;
          error_detail?: string | null;
          error_type?: string;
          id?: string;
          page_type?: string;
          quality_check_failures?: Json | null;
          raw_response?: string | null;
        };
        Relationships: [];
      };
      pseo_pages: {
        Row: {
          agent_count: number;
          combination: Json;
          content: Json;
          content_hash: string | null;
          error_count: number | null;
          generated_at: string | null;
          generation_model: string | null;
          id: string;
          is_published: boolean | null;
          next_refresh_at: string | null;
          page_type: string;
          published_at: string | null;
          quality_score: number | null;
          updated_at: string | null;
          url_path: string;
        };
        Insert: {
          agent_count?: number;
          combination: Json;
          content: Json;
          content_hash?: string | null;
          error_count?: number | null;
          generated_at?: string | null;
          generation_model?: string | null;
          id?: string;
          is_published?: boolean | null;
          next_refresh_at?: string | null;
          page_type: string;
          published_at?: string | null;
          quality_score?: number | null;
          updated_at?: string | null;
          url_path: string;
        };
        Update: {
          agent_count?: number;
          combination?: Json;
          content?: Json;
          content_hash?: string | null;
          error_count?: number | null;
          generated_at?: string | null;
          generation_model?: string | null;
          id?: string;
          is_published?: boolean | null;
          next_refresh_at?: string | null;
          page_type?: string;
          published_at?: string | null;
          quality_score?: number | null;
          updated_at?: string | null;
          url_path?: string;
        };
        Relationships: [];
      };
      pseo_prompts: {
        Row: {
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          page_type: string;
          system_prompt: string;
          updated_at: string | null;
          user_prompt_template: string;
          version: number | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          page_type: string;
          system_prompt: string;
          updated_at?: string | null;
          user_prompt_template: string;
          version?: number | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          page_type?: string;
          system_prompt?: string;
          updated_at?: string | null;
          user_prompt_template?: string;
          version?: number | null;
        };
        Relationships: [];
      };
      pseo_taxonomy: {
        Row: {
          context: Json;
          created_at: string | null;
          display_name: string;
          id: string;
          is_active: boolean | null;
          parent_id: string | null;
          taxonomy_type: string;
          tier: number | null;
          updated_at: string | null;
        };
        Insert: {
          context: Json;
          created_at?: string | null;
          display_name: string;
          id: string;
          is_active?: boolean | null;
          parent_id?: string | null;
          taxonomy_type: string;
          tier?: number | null;
          updated_at?: string | null;
        };
        Update: {
          context?: Json;
          created_at?: string | null;
          display_name?: string;
          id?: string;
          is_active?: boolean | null;
          parent_id?: string | null;
          taxonomy_type?: string;
          tier?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'pseo_taxonomy_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'pseo_taxonomy';
            referencedColumns: ['id'];
          },
        ];
      };
      query_metrics: {
        Row: {
          created_at: string;
          duration_ms: number;
          endpoint: string | null;
          id: string;
          query_hash: string;
        };
        Insert: {
          created_at?: string;
          duration_ms: number;
          endpoint?: string | null;
          id?: string;
          query_hash: string;
        };
        Update: {
          created_at?: string;
          duration_ms?: number;
          endpoint?: string | null;
          id?: string;
          query_hash?: string;
        };
        Relationships: [];
      };
      rate_limit_entries: {
        Row: {
          blocked_until: string | null;
          created_at: string | null;
          id: string;
          identifier: string;
          limit_type: string;
          request_count: number | null;
          updated_at: string | null;
          window_end: string;
          window_start: string | null;
        };
        Insert: {
          blocked_until?: string | null;
          created_at?: string | null;
          id?: string;
          identifier: string;
          limit_type: string;
          request_count?: number | null;
          updated_at?: string | null;
          window_end: string;
          window_start?: string | null;
        };
        Update: {
          blocked_until?: string | null;
          created_at?: string | null;
          id?: string;
          identifier?: string;
          limit_type?: string;
          request_count?: number | null;
          updated_at?: string | null;
          window_end?: string;
          window_start?: string | null;
        };
        Relationships: [];
      };
      rate_limits: {
        Row: {
          created_at: string;
          endpoint: string;
          id: string;
          ip_address: string;
          request_count: number;
          window_start: string;
        };
        Insert: {
          created_at?: string;
          endpoint: string;
          id?: string;
          ip_address: string;
          request_count?: number;
          window_start: string;
        };
        Update: {
          created_at?: string;
          endpoint?: string;
          id?: string;
          ip_address?: string;
          request_count?: number;
          window_start?: string;
        };
        Relationships: [];
      };
      search_dashboard_config: {
        Row: {
          alert_thresholds: Json | null;
          created_at: string | null;
          dashboard_layout: Json | null;
          default_comparison_period: string | null;
          default_date_range: string | null;
          default_grouping: string | null;
          enable_alerts: boolean | null;
          enabled_platforms: Json | null;
          export_format: string | null;
          id: string;
          primary_platform: string | null;
          updated_at: string | null;
          user_id: string;
          visible_metrics: Json | null;
        };
        Insert: {
          alert_thresholds?: Json | null;
          created_at?: string | null;
          dashboard_layout?: Json | null;
          default_comparison_period?: string | null;
          default_date_range?: string | null;
          default_grouping?: string | null;
          enable_alerts?: boolean | null;
          enabled_platforms?: Json | null;
          export_format?: string | null;
          id?: string;
          primary_platform?: string | null;
          updated_at?: string | null;
          user_id: string;
          visible_metrics?: Json | null;
        };
        Update: {
          alert_thresholds?: Json | null;
          created_at?: string | null;
          dashboard_layout?: Json | null;
          default_comparison_period?: string | null;
          default_date_range?: string | null;
          default_grouping?: string | null;
          enable_alerts?: boolean | null;
          enabled_platforms?: Json | null;
          export_format?: string | null;
          id?: string;
          primary_platform?: string | null;
          updated_at?: string | null;
          user_id?: string;
          visible_metrics?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'search_dashboard_config_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      seo_alert_rules: {
        Row: {
          conditions: Json;
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          last_triggered_at: string | null;
          name: string;
          rule_type: string;
          severity: string | null;
          updated_at: string | null;
        };
        Insert: {
          conditions?: Json;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_triggered_at?: string | null;
          name: string;
          rule_type: string;
          severity?: string | null;
          updated_at?: string | null;
        };
        Update: {
          conditions?: Json;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_triggered_at?: string | null;
          name?: string;
          rule_type?: string;
          severity?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      seo_alerts: {
        Row: {
          affected_url: string | null;
          alert_rule_id: string | null;
          alert_type: string;
          created_at: string | null;
          id: string;
          message: string;
          severity: string;
          status: string | null;
          title: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          affected_url?: string | null;
          alert_rule_id?: string | null;
          alert_type: string;
          created_at?: string | null;
          id?: string;
          message: string;
          severity: string;
          status?: string | null;
          title: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          affected_url?: string | null;
          alert_rule_id?: string | null;
          alert_type?: string;
          created_at?: string | null;
          id?: string;
          message?: string;
          severity?: string;
          status?: string | null;
          title?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'seo_alerts_alert_rule_id_fkey';
            columns: ['alert_rule_id'];
            isOneToOne: false;
            referencedRelation: 'seo_alert_rules';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'seo_alerts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      seo_audit_history: {
        Row: {
          accessibility_score: number | null;
          audit_duration_ms: number | null;
          audit_type: string | null;
          best_practices_score: number | null;
          broken_links_count: number | null;
          created_at: string | null;
          critical_issues: Json | null;
          description_length: number | null;
          external_links_count: number | null;
          has_canonical: boolean | null;
          has_description: boolean | null;
          has_favicon: boolean | null;
          has_keywords: boolean | null;
          has_og_tags: boolean | null;
          has_robots_txt: boolean | null;
          has_sitemap: boolean | null;
          has_ssl: boolean | null;
          has_title: boolean | null;
          has_twitter_cards: boolean | null;
          heading_structure: Json | null;
          id: string;
          images_count: number | null;
          images_with_alt_count: number | null;
          internal_links_count: number | null;
          mobile_friendly: boolean | null;
          overall_score: number | null;
          page_load_time: number | null;
          performance_score: number | null;
          performed_by: string | null;
          raw_audit_data: Json | null;
          recommendations: Json | null;
          seo_score: number | null;
          title_length: number | null;
          url: string;
          warnings: Json | null;
          word_count: number | null;
        };
        Insert: {
          accessibility_score?: number | null;
          audit_duration_ms?: number | null;
          audit_type?: string | null;
          best_practices_score?: number | null;
          broken_links_count?: number | null;
          created_at?: string | null;
          critical_issues?: Json | null;
          description_length?: number | null;
          external_links_count?: number | null;
          has_canonical?: boolean | null;
          has_description?: boolean | null;
          has_favicon?: boolean | null;
          has_keywords?: boolean | null;
          has_og_tags?: boolean | null;
          has_robots_txt?: boolean | null;
          has_sitemap?: boolean | null;
          has_ssl?: boolean | null;
          has_title?: boolean | null;
          has_twitter_cards?: boolean | null;
          heading_structure?: Json | null;
          id?: string;
          images_count?: number | null;
          images_with_alt_count?: number | null;
          internal_links_count?: number | null;
          mobile_friendly?: boolean | null;
          overall_score?: number | null;
          page_load_time?: number | null;
          performance_score?: number | null;
          performed_by?: string | null;
          raw_audit_data?: Json | null;
          recommendations?: Json | null;
          seo_score?: number | null;
          title_length?: number | null;
          url: string;
          warnings?: Json | null;
          word_count?: number | null;
        };
        Update: {
          accessibility_score?: number | null;
          audit_duration_ms?: number | null;
          audit_type?: string | null;
          best_practices_score?: number | null;
          broken_links_count?: number | null;
          created_at?: string | null;
          critical_issues?: Json | null;
          description_length?: number | null;
          external_links_count?: number | null;
          has_canonical?: boolean | null;
          has_description?: boolean | null;
          has_favicon?: boolean | null;
          has_keywords?: boolean | null;
          has_og_tags?: boolean | null;
          has_robots_txt?: boolean | null;
          has_sitemap?: boolean | null;
          has_ssl?: boolean | null;
          has_title?: boolean | null;
          has_twitter_cards?: boolean | null;
          heading_structure?: Json | null;
          id?: string;
          images_count?: number | null;
          images_with_alt_count?: number | null;
          internal_links_count?: number | null;
          mobile_friendly?: boolean | null;
          overall_score?: number | null;
          page_load_time?: number | null;
          performance_score?: number | null;
          performed_by?: string | null;
          raw_audit_data?: Json | null;
          recommendations?: Json | null;
          seo_score?: number | null;
          title_length?: number | null;
          url?: string;
          warnings?: Json | null;
          word_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'seo_audit_history_performed_by_fkey';
            columns: ['performed_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      seo_audit_schedules: {
        Row: {
          active: boolean | null;
          audit_config: Json | null;
          created_at: string | null;
          created_by: string | null;
          cron_expression: string | null;
          description: string | null;
          id: string;
          last_run_at: string | null;
          last_run_results: Json | null;
          last_run_status: string | null;
          name: string;
          next_run_at: string | null;
          notification_channels: string[] | null;
          notification_recipients: string[] | null;
          schedule_type: string;
          updated_at: string | null;
        };
        Insert: {
          active?: boolean | null;
          audit_config?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          cron_expression?: string | null;
          description?: string | null;
          id?: string;
          last_run_at?: string | null;
          last_run_results?: Json | null;
          last_run_status?: string | null;
          name: string;
          next_run_at?: string | null;
          notification_channels?: string[] | null;
          notification_recipients?: string[] | null;
          schedule_type: string;
          updated_at?: string | null;
        };
        Update: {
          active?: boolean | null;
          audit_config?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          cron_expression?: string | null;
          description?: string | null;
          id?: string;
          last_run_at?: string | null;
          last_run_results?: Json | null;
          last_run_status?: string | null;
          name?: string;
          next_run_at?: string | null;
          notification_channels?: string[] | null;
          notification_recipients?: string[] | null;
          schedule_type?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'seo_audit_schedules_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      seo_autofix_history: {
        Row: {
          applied_at: string | null;
          applied_by: string | null;
          approved_by: string | null;
          error_message: string | null;
          fix_applied: Json;
          id: string;
          issue_id: string | null;
          issue_type: string;
          result: string;
          rollback_reason: string | null;
          rolled_back_at: string | null;
          rule_id: string | null;
        };
        Insert: {
          applied_at?: string | null;
          applied_by?: string | null;
          approved_by?: string | null;
          error_message?: string | null;
          fix_applied: Json;
          id?: string;
          issue_id?: string | null;
          issue_type: string;
          result: string;
          rollback_reason?: string | null;
          rolled_back_at?: string | null;
          rule_id?: string | null;
        };
        Update: {
          applied_at?: string | null;
          applied_by?: string | null;
          approved_by?: string | null;
          error_message?: string | null;
          fix_applied?: Json;
          id?: string;
          issue_id?: string | null;
          issue_type?: string;
          result?: string;
          rollback_reason?: string | null;
          rolled_back_at?: string | null;
          rule_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'seo_autofix_history_applied_by_fkey';
            columns: ['applied_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'seo_autofix_history_approved_by_fkey';
            columns: ['approved_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'seo_autofix_history_rule_id_fkey';
            columns: ['rule_id'];
            isOneToOne: false;
            referencedRelation: 'seo_autofix_rules';
            referencedColumns: ['id'];
          },
        ];
      };
      seo_autofix_rules: {
        Row: {
          active: boolean | null;
          applied_count: number | null;
          auto_apply: boolean | null;
          conditions: Json | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          failure_count: number | null;
          fix_action: Json;
          id: string;
          issue_type: string;
          name: string;
          priority: number | null;
          requires_approval: boolean | null;
          success_count: number | null;
          updated_at: string | null;
        };
        Insert: {
          active?: boolean | null;
          applied_count?: number | null;
          auto_apply?: boolean | null;
          conditions?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          failure_count?: number | null;
          fix_action: Json;
          id?: string;
          issue_type: string;
          name: string;
          priority?: number | null;
          requires_approval?: boolean | null;
          success_count?: number | null;
          updated_at?: string | null;
        };
        Update: {
          active?: boolean | null;
          applied_count?: number | null;
          auto_apply?: boolean | null;
          conditions?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          failure_count?: number | null;
          fix_action?: Json;
          id?: string;
          issue_type?: string;
          name?: string;
          priority?: number | null;
          requires_approval?: boolean | null;
          success_count?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'seo_autofix_rules_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      seo_automation_logs: {
        Row: {
          automation_id: string | null;
          automation_type: string;
          created_at: string | null;
          details: Json | null;
          duration_ms: number | null;
          id: string;
          message: string | null;
          status: string;
        };
        Insert: {
          automation_id?: string | null;
          automation_type: string;
          created_at?: string | null;
          details?: Json | null;
          duration_ms?: number | null;
          id?: string;
          message?: string | null;
          status: string;
        };
        Update: {
          automation_id?: string | null;
          automation_type?: string;
          created_at?: string | null;
          details?: Json | null;
          duration_ms?: number | null;
          id?: string;
          message?: string | null;
          status?: string;
        };
        Relationships: [];
      };
      seo_competitor_analysis: {
        Row: {
          analysis_date: string | null;
          analyzed_by: string | null;
          backlink_profile: Json | null;
          backlinks_count: number | null;
          blog_post_count: number | null;
          citation_flow: number | null;
          competitor_domain: string;
          competitor_name: string | null;
          content_gaps: Json | null;
          content_update_frequency: string | null;
          created_at: string | null;
          data_source: string | null;
          domain_authority: number | null;
          estimated_monthly_traffic: number | null;
          estimated_monthly_traffic_value: number | null;
          has_sitemap: boolean | null;
          has_ssl: boolean | null;
          id: string;
          indexed_pages: number | null;
          keyword_gap_count: number | null;
          keyword_gap_list: Json | null;
          keywords_they_rank_better: number | null;
          keywords_we_rank_better: number | null;
          mobile_friendly: boolean | null;
          notes: string | null;
          our_domain: string;
          page_authority: number | null;
          page_speed_score: number | null;
          referring_domains: number | null;
          shared_keywords: number | null;
          top_pages: Json | null;
          top_performing_keywords: Json | null;
          total_pages: number | null;
          trust_flow: number | null;
          updated_at: string | null;
        };
        Insert: {
          analysis_date?: string | null;
          analyzed_by?: string | null;
          backlink_profile?: Json | null;
          backlinks_count?: number | null;
          blog_post_count?: number | null;
          citation_flow?: number | null;
          competitor_domain: string;
          competitor_name?: string | null;
          content_gaps?: Json | null;
          content_update_frequency?: string | null;
          created_at?: string | null;
          data_source?: string | null;
          domain_authority?: number | null;
          estimated_monthly_traffic?: number | null;
          estimated_monthly_traffic_value?: number | null;
          has_sitemap?: boolean | null;
          has_ssl?: boolean | null;
          id?: string;
          indexed_pages?: number | null;
          keyword_gap_count?: number | null;
          keyword_gap_list?: Json | null;
          keywords_they_rank_better?: number | null;
          keywords_we_rank_better?: number | null;
          mobile_friendly?: boolean | null;
          notes?: string | null;
          our_domain: string;
          page_authority?: number | null;
          page_speed_score?: number | null;
          referring_domains?: number | null;
          shared_keywords?: number | null;
          top_pages?: Json | null;
          top_performing_keywords?: Json | null;
          total_pages?: number | null;
          trust_flow?: number | null;
          updated_at?: string | null;
        };
        Update: {
          analysis_date?: string | null;
          analyzed_by?: string | null;
          backlink_profile?: Json | null;
          backlinks_count?: number | null;
          blog_post_count?: number | null;
          citation_flow?: number | null;
          competitor_domain?: string;
          competitor_name?: string | null;
          content_gaps?: Json | null;
          content_update_frequency?: string | null;
          created_at?: string | null;
          data_source?: string | null;
          domain_authority?: number | null;
          estimated_monthly_traffic?: number | null;
          estimated_monthly_traffic_value?: number | null;
          has_sitemap?: boolean | null;
          has_ssl?: boolean | null;
          id?: string;
          indexed_pages?: number | null;
          keyword_gap_count?: number | null;
          keyword_gap_list?: Json | null;
          keywords_they_rank_better?: number | null;
          keywords_we_rank_better?: number | null;
          mobile_friendly?: boolean | null;
          notes?: string | null;
          our_domain?: string;
          page_authority?: number | null;
          page_speed_score?: number | null;
          referring_domains?: number | null;
          shared_keywords?: number | null;
          top_pages?: Json | null;
          top_performing_keywords?: Json | null;
          total_pages?: number | null;
          trust_flow?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'seo_competitor_analysis_analyzed_by_fkey';
            columns: ['analyzed_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      seo_competitor_tracking: {
        Row: {
          active: boolean | null;
          alert_on_content_updates: boolean | null;
          alert_on_new_backlinks: boolean | null;
          alert_on_rank_change: boolean | null;
          check_frequency: string | null;
          competitor_domain: string;
          competitor_name: string | null;
          created_at: string | null;
          created_by: string | null;
          id: string;
          keywords: string[] | null;
          last_checked_at: string | null;
          metadata: Json | null;
          next_check_at: string | null;
          notification_channels: string[] | null;
          notification_recipients: string[] | null;
          rank_change_threshold: number | null;
          updated_at: string | null;
        };
        Insert: {
          active?: boolean | null;
          alert_on_content_updates?: boolean | null;
          alert_on_new_backlinks?: boolean | null;
          alert_on_rank_change?: boolean | null;
          check_frequency?: string | null;
          competitor_domain: string;
          competitor_name?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          keywords?: string[] | null;
          last_checked_at?: string | null;
          metadata?: Json | null;
          next_check_at?: string | null;
          notification_channels?: string[] | null;
          notification_recipients?: string[] | null;
          rank_change_threshold?: number | null;
          updated_at?: string | null;
        };
        Update: {
          active?: boolean | null;
          alert_on_content_updates?: boolean | null;
          alert_on_new_backlinks?: boolean | null;
          alert_on_rank_change?: boolean | null;
          check_frequency?: string | null;
          competitor_domain?: string;
          competitor_name?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          keywords?: string[] | null;
          last_checked_at?: string | null;
          metadata?: Json | null;
          next_check_at?: string | null;
          notification_channels?: string[] | null;
          notification_recipients?: string[] | null;
          rank_change_threshold?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'seo_competitor_tracking_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      seo_content_optimization: {
        Row: {
          ai_suggestions: Json | null;
          ai_summary: string | null;
          analyzed_at: string | null;
          analyzed_by: string | null;
          average_sentence_length: number | null;
          competitive_gap: string | null;
          competitor_avg_readability: number | null;
          competitor_avg_word_count: number | null;
          content_additions: string[] | null;
          content_quality_score: number | null;
          covered_topics: string[] | null;
          created_at: string | null;
          engagement_score: number | null;
          flesch_kincaid_grade: number | null;
          flesch_reading_ease: number | null;
          h1_count: number | null;
          h2_count: number | null;
          h3_count: number | null;
          h4_count: number | null;
          h5_count: number | null;
          h6_count: number | null;
          heading_structure_score: number | null;
          heading_suggestions: Json | null;
          id: string;
          image_suggestions: string[] | null;
          infographic_topics: string[] | null;
          keyword_count: number | null;
          keyword_density: number | null;
          keyword_in_first_paragraph: boolean | null;
          keyword_in_h1: boolean | null;
          keyword_in_title: boolean | null;
          keyword_in_url: boolean | null;
          keyword_prominence_score: number | null;
          lsi_coverage_score: number | null;
          lsi_keywords: string[] | null;
          lsi_keywords_found: number | null;
          lsi_keywords_recommended: string[] | null;
          meta_description_suggestions: string[] | null;
          missing_topics: string[] | null;
          optimization_level: string | null;
          optimization_score: number | null;
          optimized_at: string | null;
          page_title: string | null;
          paragraph_count: number | null;
          readability_level: string | null;
          readability_score: number | null;
          recommended_internal_links: Json | null;
          sentence_count: number | null;
          status: string | null;
          target_keyword: string | null;
          title_suggestions: string[] | null;
          topic_coverage_score: number | null;
          uniqueness_score: number | null;
          updated_at: string | null;
          url: string;
          video_suggestions: string[] | null;
          word_count: number | null;
        };
        Insert: {
          ai_suggestions?: Json | null;
          ai_summary?: string | null;
          analyzed_at?: string | null;
          analyzed_by?: string | null;
          average_sentence_length?: number | null;
          competitive_gap?: string | null;
          competitor_avg_readability?: number | null;
          competitor_avg_word_count?: number | null;
          content_additions?: string[] | null;
          content_quality_score?: number | null;
          covered_topics?: string[] | null;
          created_at?: string | null;
          engagement_score?: number | null;
          flesch_kincaid_grade?: number | null;
          flesch_reading_ease?: number | null;
          h1_count?: number | null;
          h2_count?: number | null;
          h3_count?: number | null;
          h4_count?: number | null;
          h5_count?: number | null;
          h6_count?: number | null;
          heading_structure_score?: number | null;
          heading_suggestions?: Json | null;
          id?: string;
          image_suggestions?: string[] | null;
          infographic_topics?: string[] | null;
          keyword_count?: number | null;
          keyword_density?: number | null;
          keyword_in_first_paragraph?: boolean | null;
          keyword_in_h1?: boolean | null;
          keyword_in_title?: boolean | null;
          keyword_in_url?: boolean | null;
          keyword_prominence_score?: number | null;
          lsi_coverage_score?: number | null;
          lsi_keywords?: string[] | null;
          lsi_keywords_found?: number | null;
          lsi_keywords_recommended?: string[] | null;
          meta_description_suggestions?: string[] | null;
          missing_topics?: string[] | null;
          optimization_level?: string | null;
          optimization_score?: number | null;
          optimized_at?: string | null;
          page_title?: string | null;
          paragraph_count?: number | null;
          readability_level?: string | null;
          readability_score?: number | null;
          recommended_internal_links?: Json | null;
          sentence_count?: number | null;
          status?: string | null;
          target_keyword?: string | null;
          title_suggestions?: string[] | null;
          topic_coverage_score?: number | null;
          uniqueness_score?: number | null;
          updated_at?: string | null;
          url: string;
          video_suggestions?: string[] | null;
          word_count?: number | null;
        };
        Update: {
          ai_suggestions?: Json | null;
          ai_summary?: string | null;
          analyzed_at?: string | null;
          analyzed_by?: string | null;
          average_sentence_length?: number | null;
          competitive_gap?: string | null;
          competitor_avg_readability?: number | null;
          competitor_avg_word_count?: number | null;
          content_additions?: string[] | null;
          content_quality_score?: number | null;
          covered_topics?: string[] | null;
          created_at?: string | null;
          engagement_score?: number | null;
          flesch_kincaid_grade?: number | null;
          flesch_reading_ease?: number | null;
          h1_count?: number | null;
          h2_count?: number | null;
          h3_count?: number | null;
          h4_count?: number | null;
          h5_count?: number | null;
          h6_count?: number | null;
          heading_structure_score?: number | null;
          heading_suggestions?: Json | null;
          id?: string;
          image_suggestions?: string[] | null;
          infographic_topics?: string[] | null;
          keyword_count?: number | null;
          keyword_density?: number | null;
          keyword_in_first_paragraph?: boolean | null;
          keyword_in_h1?: boolean | null;
          keyword_in_title?: boolean | null;
          keyword_in_url?: boolean | null;
          keyword_prominence_score?: number | null;
          lsi_coverage_score?: number | null;
          lsi_keywords?: string[] | null;
          lsi_keywords_found?: number | null;
          lsi_keywords_recommended?: string[] | null;
          meta_description_suggestions?: string[] | null;
          missing_topics?: string[] | null;
          optimization_level?: string | null;
          optimization_score?: number | null;
          optimized_at?: string | null;
          page_title?: string | null;
          paragraph_count?: number | null;
          readability_level?: string | null;
          readability_score?: number | null;
          recommended_internal_links?: Json | null;
          sentence_count?: number | null;
          status?: string | null;
          target_keyword?: string | null;
          title_suggestions?: string[] | null;
          topic_coverage_score?: number | null;
          uniqueness_score?: number | null;
          updated_at?: string | null;
          url?: string;
          video_suggestions?: string[] | null;
          word_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'seo_content_optimization_analyzed_by_fkey';
            columns: ['analyzed_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      seo_core_web_vitals: {
        Row: {
          cls: number | null;
          cls_pass: boolean | null;
          created_at: string | null;
          data_source: string | null;
          device: string;
          diagnostics: Json | null;
          fcp: number | null;
          fetch_time_ms: number | null;
          fid: number | null;
          fid_pass: boolean | null;
          field_data: Json | null;
          id: string;
          lab_data: Json | null;
          lcp: number | null;
          lcp_pass: boolean | null;
          measured_at: string | null;
          opportunities: Json | null;
          overall_category: string | null;
          performance_score: number | null;
          si: number | null;
          tbt: number | null;
          ttfb: number | null;
          tti: number | null;
          url: string;
        };
        Insert: {
          cls?: number | null;
          cls_pass?: boolean | null;
          created_at?: string | null;
          data_source?: string | null;
          device: string;
          diagnostics?: Json | null;
          fcp?: number | null;
          fetch_time_ms?: number | null;
          fid?: number | null;
          fid_pass?: boolean | null;
          field_data?: Json | null;
          id?: string;
          lab_data?: Json | null;
          lcp?: number | null;
          lcp_pass?: boolean | null;
          measured_at?: string | null;
          opportunities?: Json | null;
          overall_category?: string | null;
          performance_score?: number | null;
          si?: number | null;
          tbt?: number | null;
          ttfb?: number | null;
          tti?: number | null;
          url: string;
        };
        Update: {
          cls?: number | null;
          cls_pass?: boolean | null;
          created_at?: string | null;
          data_source?: string | null;
          device?: string;
          diagnostics?: Json | null;
          fcp?: number | null;
          fetch_time_ms?: number | null;
          fid?: number | null;
          fid_pass?: boolean | null;
          field_data?: Json | null;
          id?: string;
          lab_data?: Json | null;
          lcp?: number | null;
          lcp_pass?: boolean | null;
          measured_at?: string | null;
          opportunities?: Json | null;
          overall_category?: string | null;
          performance_score?: number | null;
          si?: number | null;
          tbt?: number | null;
          ttfb?: number | null;
          tti?: number | null;
          url?: string;
        };
        Relationships: [];
      };
      seo_crawl_results: {
        Row: {
          broken_links: number | null;
          canonical_url: string | null;
          content_hash: string | null;
          crawl_depth: number | null;
          crawl_session_id: string;
          crawled_at: string | null;
          created_at: string | null;
          description: string | null;
          description_length: number | null;
          external_links: number | null;
          h1: string | null;
          h1_count: number | null;
          has_canonical: boolean | null;
          has_robots_meta: boolean | null;
          has_schema: boolean | null;
          has_viewport: boolean | null;
          id: string;
          images_count: number | null;
          images_data: Json | null;
          images_without_alt: number | null;
          internal_links: number | null;
          is_crawlable: boolean | null;
          is_indexable: boolean | null;
          issues: Json | null;
          language: string | null;
          links_found: Json | null;
          load_time_ms: number | null;
          page_size_kb: number | null;
          parent_url: string | null;
          redirect_chain: Json | null;
          redirect_url: string | null;
          resources_count: number | null;
          response_time_ms: number | null;
          robots_content: string | null;
          schema_types: string[] | null;
          status_code: number | null;
          title: string | null;
          title_length: number | null;
          url: string;
          warnings: Json | null;
          word_count: number | null;
        };
        Insert: {
          broken_links?: number | null;
          canonical_url?: string | null;
          content_hash?: string | null;
          crawl_depth?: number | null;
          crawl_session_id: string;
          crawled_at?: string | null;
          created_at?: string | null;
          description?: string | null;
          description_length?: number | null;
          external_links?: number | null;
          h1?: string | null;
          h1_count?: number | null;
          has_canonical?: boolean | null;
          has_robots_meta?: boolean | null;
          has_schema?: boolean | null;
          has_viewport?: boolean | null;
          id?: string;
          images_count?: number | null;
          images_data?: Json | null;
          images_without_alt?: number | null;
          internal_links?: number | null;
          is_crawlable?: boolean | null;
          is_indexable?: boolean | null;
          issues?: Json | null;
          language?: string | null;
          links_found?: Json | null;
          load_time_ms?: number | null;
          page_size_kb?: number | null;
          parent_url?: string | null;
          redirect_chain?: Json | null;
          redirect_url?: string | null;
          resources_count?: number | null;
          response_time_ms?: number | null;
          robots_content?: string | null;
          schema_types?: string[] | null;
          status_code?: number | null;
          title?: string | null;
          title_length?: number | null;
          url: string;
          warnings?: Json | null;
          word_count?: number | null;
        };
        Update: {
          broken_links?: number | null;
          canonical_url?: string | null;
          content_hash?: string | null;
          crawl_depth?: number | null;
          crawl_session_id?: string;
          crawled_at?: string | null;
          created_at?: string | null;
          description?: string | null;
          description_length?: number | null;
          external_links?: number | null;
          h1?: string | null;
          h1_count?: number | null;
          has_canonical?: boolean | null;
          has_robots_meta?: boolean | null;
          has_schema?: boolean | null;
          has_viewport?: boolean | null;
          id?: string;
          images_count?: number | null;
          images_data?: Json | null;
          images_without_alt?: number | null;
          internal_links?: number | null;
          is_crawlable?: boolean | null;
          is_indexable?: boolean | null;
          issues?: Json | null;
          language?: string | null;
          links_found?: Json | null;
          load_time_ms?: number | null;
          page_size_kb?: number | null;
          parent_url?: string | null;
          redirect_chain?: Json | null;
          redirect_url?: string | null;
          resources_count?: number | null;
          response_time_ms?: number | null;
          robots_content?: string | null;
          schema_types?: string[] | null;
          status_code?: number | null;
          title?: string | null;
          title_length?: number | null;
          url?: string;
          warnings?: Json | null;
          word_count?: number | null;
        };
        Relationships: [];
      };
      seo_duplicate_content: {
        Row: {
          affects_rankings: boolean | null;
          content_hash: string;
          content_snippet: string | null;
          created_at: string | null;
          description_duplicate: boolean | null;
          duplicate_type: string | null;
          first_detected_at: string | null;
          h1_duplicate: boolean | null;
          id: string;
          impact_level: string | null;
          last_checked_at: string | null;
          primary_url: string | null;
          resolution_method: string | null;
          resolution_notes: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          similarity_score: number | null;
          status: string | null;
          title_duplicate: boolean | null;
          updated_at: string | null;
          url_count: number | null;
          urls: Json;
          word_count: number | null;
        };
        Insert: {
          affects_rankings?: boolean | null;
          content_hash: string;
          content_snippet?: string | null;
          created_at?: string | null;
          description_duplicate?: boolean | null;
          duplicate_type?: string | null;
          first_detected_at?: string | null;
          h1_duplicate?: boolean | null;
          id?: string;
          impact_level?: string | null;
          last_checked_at?: string | null;
          primary_url?: string | null;
          resolution_method?: string | null;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          similarity_score?: number | null;
          status?: string | null;
          title_duplicate?: boolean | null;
          updated_at?: string | null;
          url_count?: number | null;
          urls?: Json;
          word_count?: number | null;
        };
        Update: {
          affects_rankings?: boolean | null;
          content_hash?: string;
          content_snippet?: string | null;
          created_at?: string | null;
          description_duplicate?: boolean | null;
          duplicate_type?: string | null;
          first_detected_at?: string | null;
          h1_duplicate?: boolean | null;
          id?: string;
          impact_level?: string | null;
          last_checked_at?: string | null;
          primary_url?: string | null;
          resolution_method?: string | null;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          similarity_score?: number | null;
          status?: string | null;
          title_duplicate?: boolean | null;
          updated_at?: string | null;
          url_count?: number | null;
          urls?: Json;
          word_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'seo_duplicate_content_resolved_by_fkey';
            columns: ['resolved_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      seo_fixes_applied: {
        Row: {
          after_value: string | null;
          applied_at: string | null;
          applied_by: string | null;
          audit_id: string | null;
          before_value: string | null;
          created_at: string | null;
          fix_category: string | null;
          fix_description: string;
          fix_impact: string | null;
          fix_type: string;
          id: string;
          issue_description: string;
          reverted_at: string | null;
          status: string | null;
          updated_at: string | null;
          url: string;
          verification_notes: string | null;
          verification_status: string | null;
        };
        Insert: {
          after_value?: string | null;
          applied_at?: string | null;
          applied_by?: string | null;
          audit_id?: string | null;
          before_value?: string | null;
          created_at?: string | null;
          fix_category?: string | null;
          fix_description: string;
          fix_impact?: string | null;
          fix_type: string;
          id?: string;
          issue_description: string;
          reverted_at?: string | null;
          status?: string | null;
          updated_at?: string | null;
          url: string;
          verification_notes?: string | null;
          verification_status?: string | null;
        };
        Update: {
          after_value?: string | null;
          applied_at?: string | null;
          applied_by?: string | null;
          audit_id?: string | null;
          before_value?: string | null;
          created_at?: string | null;
          fix_category?: string | null;
          fix_description?: string;
          fix_impact?: string | null;
          fix_type?: string;
          id?: string;
          issue_description?: string;
          reverted_at?: string | null;
          status?: string | null;
          updated_at?: string | null;
          url?: string;
          verification_notes?: string | null;
          verification_status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'seo_fixes_applied_applied_by_fkey';
            columns: ['applied_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'seo_fixes_applied_audit_id_fkey';
            columns: ['audit_id'];
            isOneToOne: false;
            referencedRelation: 'seo_audit_history';
            referencedColumns: ['id'];
          },
        ];
      };
      seo_image_analysis: {
        Row: {
          alt_text: string | null;
          alt_text_length: number | null;
          analyzed_at: string | null;
          aspect_ratio: string | null;
          compression_ratio: number | null;
          created_at: string | null;
          file_format: string | null;
          file_name: string | null;
          file_size_kb: number | null;
          has_alt: boolean | null;
          has_caption: boolean | null;
          has_srcset: boolean | null;
          has_title: boolean | null;
          height: number | null;
          id: string;
          image_src: string;
          is_lazy_loaded: boolean | null;
          is_optimized: boolean | null;
          is_responsive: boolean | null;
          issues: Json | null;
          optimization_score: number | null;
          page_url: string;
          potential_savings_kb: number | null;
          recommended_format: string | null;
          supports_lazy_loading: boolean | null;
          title_attribute: string | null;
          url: string;
          width: number | null;
        };
        Insert: {
          alt_text?: string | null;
          alt_text_length?: number | null;
          analyzed_at?: string | null;
          aspect_ratio?: string | null;
          compression_ratio?: number | null;
          created_at?: string | null;
          file_format?: string | null;
          file_name?: string | null;
          file_size_kb?: number | null;
          has_alt?: boolean | null;
          has_caption?: boolean | null;
          has_srcset?: boolean | null;
          has_title?: boolean | null;
          height?: number | null;
          id?: string;
          image_src: string;
          is_lazy_loaded?: boolean | null;
          is_optimized?: boolean | null;
          is_responsive?: boolean | null;
          issues?: Json | null;
          optimization_score?: number | null;
          page_url: string;
          potential_savings_kb?: number | null;
          recommended_format?: string | null;
          supports_lazy_loading?: boolean | null;
          title_attribute?: string | null;
          url: string;
          width?: number | null;
        };
        Update: {
          alt_text?: string | null;
          alt_text_length?: number | null;
          analyzed_at?: string | null;
          aspect_ratio?: string | null;
          compression_ratio?: number | null;
          created_at?: string | null;
          file_format?: string | null;
          file_name?: string | null;
          file_size_kb?: number | null;
          has_alt?: boolean | null;
          has_caption?: boolean | null;
          has_srcset?: boolean | null;
          has_title?: boolean | null;
          height?: number | null;
          id?: string;
          image_src?: string;
          is_lazy_loaded?: boolean | null;
          is_optimized?: boolean | null;
          is_responsive?: boolean | null;
          issues?: Json | null;
          optimization_score?: number | null;
          page_url?: string;
          potential_savings_kb?: number | null;
          recommended_format?: string | null;
          supports_lazy_loading?: boolean | null;
          title_attribute?: string | null;
          url?: string;
          width?: number | null;
        };
        Relationships: [];
      };
      seo_keyword_history: {
        Row: {
          checked_at: string | null;
          clicks: number | null;
          created_at: string | null;
          ctr: number | null;
          data_source: string | null;
          device: string | null;
          id: string;
          impressions: number | null;
          keyword: string;
          keyword_id: string;
          location: string | null;
          position: number | null;
          recorded_at: string | null;
          search_engine: string | null;
          search_volume: number | null;
          url: string | null;
          visibility_score: number | null;
        };
        Insert: {
          checked_at?: string | null;
          clicks?: number | null;
          created_at?: string | null;
          ctr?: number | null;
          data_source?: string | null;
          device?: string | null;
          id?: string;
          impressions?: number | null;
          keyword: string;
          keyword_id: string;
          location?: string | null;
          position?: number | null;
          recorded_at?: string | null;
          search_engine?: string | null;
          search_volume?: number | null;
          url?: string | null;
          visibility_score?: number | null;
        };
        Update: {
          checked_at?: string | null;
          clicks?: number | null;
          created_at?: string | null;
          ctr?: number | null;
          data_source?: string | null;
          device?: string | null;
          id?: string;
          impressions?: number | null;
          keyword?: string;
          keyword_id?: string;
          location?: string | null;
          position?: number | null;
          recorded_at?: string | null;
          search_engine?: string | null;
          search_volume?: number | null;
          url?: string | null;
          visibility_score?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'seo_keyword_history_keyword_id_fkey';
            columns: ['keyword_id'];
            isOneToOne: false;
            referencedRelation: 'seo_keywords';
            referencedColumns: ['id'];
          },
        ];
      };
      seo_keywords: {
        Row: {
          avg_position: number | null;
          best_position: number | null;
          category: string | null;
          clicks: number | null;
          competition: string | null;
          created_at: string | null;
          created_by: string | null;
          ctr: number | null;
          current_position: number | null;
          difficulty_score: number | null;
          first_ranked_at: string | null;
          id: string;
          impressions: number | null;
          intent: string | null;
          is_active: boolean | null;
          is_ranking: boolean | null;
          keyword: string;
          keyword_type: string | null;
          last_checked_at: string | null;
          last_position_change_at: string | null;
          monthly_searches: number | null;
          notes: string | null;
          position_change: number | null;
          previous_position: number | null;
          priority: number | null;
          search_volume: number | null;
          tags: string[] | null;
          target_position: number | null;
          target_url: string | null;
          updated_at: string | null;
          user_id: string | null;
          visibility_score: number | null;
        };
        Insert: {
          avg_position?: number | null;
          best_position?: number | null;
          category?: string | null;
          clicks?: number | null;
          competition?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          ctr?: number | null;
          current_position?: number | null;
          difficulty_score?: number | null;
          first_ranked_at?: string | null;
          id?: string;
          impressions?: number | null;
          intent?: string | null;
          is_active?: boolean | null;
          is_ranking?: boolean | null;
          keyword: string;
          keyword_type?: string | null;
          last_checked_at?: string | null;
          last_position_change_at?: string | null;
          monthly_searches?: number | null;
          notes?: string | null;
          position_change?: number | null;
          previous_position?: number | null;
          priority?: number | null;
          search_volume?: number | null;
          tags?: string[] | null;
          target_position?: number | null;
          target_url?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          visibility_score?: number | null;
        };
        Update: {
          avg_position?: number | null;
          best_position?: number | null;
          category?: string | null;
          clicks?: number | null;
          competition?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          ctr?: number | null;
          current_position?: number | null;
          difficulty_score?: number | null;
          first_ranked_at?: string | null;
          id?: string;
          impressions?: number | null;
          intent?: string | null;
          is_active?: boolean | null;
          is_ranking?: boolean | null;
          keyword?: string;
          keyword_type?: string | null;
          last_checked_at?: string | null;
          last_position_change_at?: string | null;
          monthly_searches?: number | null;
          notes?: string | null;
          position_change?: number | null;
          previous_position?: number | null;
          priority?: number | null;
          search_volume?: number | null;
          tags?: string[] | null;
          target_position?: number | null;
          target_url?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          visibility_score?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'seo_keywords_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'seo_keywords_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      seo_link_analysis: {
        Row: {
          analyzed_at: string | null;
          anchor_texts: Json | null;
          broken_links: number | null;
          created_at: string | null;
          dead_end_page: boolean | null;
          deep_level: number | null;
          external_dofollow_count: number | null;
          external_links: number | null;
          external_nofollow_count: number | null;
          id: string;
          internal_links: number | null;
          issues: Json | null;
          link_list: Json | null;
          nofollow_links: number | null;
          orphan_page: boolean | null;
          over_optimized_anchors: number | null;
          page_url: string;
          quality_score: number | null;
          recommendations: Json | null;
          redirect_links: number | null;
          total_links: number | null;
          toxic_links: number | null;
        };
        Insert: {
          analyzed_at?: string | null;
          anchor_texts?: Json | null;
          broken_links?: number | null;
          created_at?: string | null;
          dead_end_page?: boolean | null;
          deep_level?: number | null;
          external_dofollow_count?: number | null;
          external_links?: number | null;
          external_nofollow_count?: number | null;
          id?: string;
          internal_links?: number | null;
          issues?: Json | null;
          link_list?: Json | null;
          nofollow_links?: number | null;
          orphan_page?: boolean | null;
          over_optimized_anchors?: number | null;
          page_url: string;
          quality_score?: number | null;
          recommendations?: Json | null;
          redirect_links?: number | null;
          total_links?: number | null;
          toxic_links?: number | null;
        };
        Update: {
          analyzed_at?: string | null;
          anchor_texts?: Json | null;
          broken_links?: number | null;
          created_at?: string | null;
          dead_end_page?: boolean | null;
          deep_level?: number | null;
          external_dofollow_count?: number | null;
          external_links?: number | null;
          external_nofollow_count?: number | null;
          id?: string;
          internal_links?: number | null;
          issues?: Json | null;
          link_list?: Json | null;
          nofollow_links?: number | null;
          orphan_page?: boolean | null;
          over_optimized_anchors?: number | null;
          page_url?: string;
          quality_score?: number | null;
          recommendations?: Json | null;
          redirect_links?: number | null;
          total_links?: number | null;
          toxic_links?: number | null;
        };
        Relationships: [];
      };
      seo_mobile_analysis: {
        Row: {
          content_fits_viewport: boolean | null;
          created_at: string | null;
          font_size_legible: boolean | null;
          google_mobile_friendly_result: Json | null;
          has_viewport_meta: boolean | null;
          horizontal_scroll_required: boolean | null;
          id: string;
          issues: Json | null;
          minimum_tap_target_size: number | null;
          mobile_cls: number | null;
          mobile_fid: number | null;
          mobile_friendly: boolean | null;
          mobile_lcp: number | null;
          mobile_page_speed: number | null;
          mobile_score: number | null;
          passed_mobile_friendly_test: boolean | null;
          resource_count: number | null;
          tap_target_issues: number | null;
          tested_at: string | null;
          total_resource_size_kb: number | null;
          touch_targets_sized_appropriately: boolean | null;
          url: string;
          usability_score: number | null;
          uses_responsive_images: boolean | null;
          viewport_content: string | null;
          viewport_width: string | null;
        };
        Insert: {
          content_fits_viewport?: boolean | null;
          created_at?: string | null;
          font_size_legible?: boolean | null;
          google_mobile_friendly_result?: Json | null;
          has_viewport_meta?: boolean | null;
          horizontal_scroll_required?: boolean | null;
          id?: string;
          issues?: Json | null;
          minimum_tap_target_size?: number | null;
          mobile_cls?: number | null;
          mobile_fid?: number | null;
          mobile_friendly?: boolean | null;
          mobile_lcp?: number | null;
          mobile_page_speed?: number | null;
          mobile_score?: number | null;
          passed_mobile_friendly_test?: boolean | null;
          resource_count?: number | null;
          tap_target_issues?: number | null;
          tested_at?: string | null;
          total_resource_size_kb?: number | null;
          touch_targets_sized_appropriately?: boolean | null;
          url: string;
          usability_score?: number | null;
          uses_responsive_images?: boolean | null;
          viewport_content?: string | null;
          viewport_width?: string | null;
        };
        Update: {
          content_fits_viewport?: boolean | null;
          created_at?: string | null;
          font_size_legible?: boolean | null;
          google_mobile_friendly_result?: Json | null;
          has_viewport_meta?: boolean | null;
          horizontal_scroll_required?: boolean | null;
          id?: string;
          issues?: Json | null;
          minimum_tap_target_size?: number | null;
          mobile_cls?: number | null;
          mobile_fid?: number | null;
          mobile_friendly?: boolean | null;
          mobile_lcp?: number | null;
          mobile_page_speed?: number | null;
          mobile_score?: number | null;
          passed_mobile_friendly_test?: boolean | null;
          resource_count?: number | null;
          tap_target_issues?: number | null;
          tested_at?: string | null;
          total_resource_size_kb?: number | null;
          touch_targets_sized_appropriately?: boolean | null;
          url?: string;
          usability_score?: number | null;
          uses_responsive_images?: boolean | null;
          viewport_content?: string | null;
          viewport_width?: string | null;
        };
        Relationships: [];
      };
      seo_monitoring_log: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          id: string;
          results_summary: Json | null;
          schedule_id: string | null;
          started_at: string | null;
          status: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          id?: string;
          results_summary?: Json | null;
          schedule_id?: string | null;
          started_at?: string | null;
          status: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          id?: string;
          results_summary?: Json | null;
          schedule_id?: string | null;
          started_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'seo_monitoring_log_schedule_id_fkey';
            columns: ['schedule_id'];
            isOneToOne: false;
            referencedRelation: 'seo_monitoring_schedules';
            referencedColumns: ['id'];
          },
        ];
      };
      seo_monitoring_schedules: {
        Row: {
          additional_urls: string[] | null;
          config: Json | null;
          created_at: string | null;
          created_by: string | null;
          cron_expression: string | null;
          day_of_month: number | null;
          day_of_week: number | null;
          description: string | null;
          failure_count: number | null;
          frequency: string;
          id: string;
          is_active: boolean | null;
          last_run_at: string | null;
          last_run_duration_ms: number | null;
          last_run_status: string | null;
          name: string;
          next_run_at: string | null;
          run_count: number | null;
          schedule_type: string;
          success_count: number | null;
          target_url: string;
          time_of_day: string | null;
          timezone: string | null;
          updated_at: string | null;
        };
        Insert: {
          additional_urls?: string[] | null;
          config?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          cron_expression?: string | null;
          day_of_month?: number | null;
          day_of_week?: number | null;
          description?: string | null;
          failure_count?: number | null;
          frequency: string;
          id?: string;
          is_active?: boolean | null;
          last_run_at?: string | null;
          last_run_duration_ms?: number | null;
          last_run_status?: string | null;
          name: string;
          next_run_at?: string | null;
          run_count?: number | null;
          schedule_type: string;
          success_count?: number | null;
          target_url: string;
          time_of_day?: string | null;
          timezone?: string | null;
          updated_at?: string | null;
        };
        Update: {
          additional_urls?: string[] | null;
          config?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          cron_expression?: string | null;
          day_of_month?: number | null;
          day_of_week?: number | null;
          description?: string | null;
          failure_count?: number | null;
          frequency?: string;
          id?: string;
          is_active?: boolean | null;
          last_run_at?: string | null;
          last_run_duration_ms?: number | null;
          last_run_status?: string | null;
          name?: string;
          next_run_at?: string | null;
          run_count?: number | null;
          schedule_type?: string;
          success_count?: number | null;
          target_url?: string;
          time_of_day?: string | null;
          timezone?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'seo_monitoring_schedules_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      seo_notification_preferences: {
        Row: {
          broken_links: boolean | null;
          created_at: string | null;
          critical_alerts: boolean | null;
          email_address: string | null;
          email_enabled: boolean | null;
          id: string;
          in_app_enabled: boolean | null;
          performance_alerts: boolean | null;
          ranking_changes: boolean | null;
          security_alerts: boolean | null;
          slack_enabled: boolean | null;
          slack_webhook_url: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          broken_links?: boolean | null;
          created_at?: string | null;
          critical_alerts?: boolean | null;
          email_address?: string | null;
          email_enabled?: boolean | null;
          id?: string;
          in_app_enabled?: boolean | null;
          performance_alerts?: boolean | null;
          ranking_changes?: boolean | null;
          security_alerts?: boolean | null;
          slack_enabled?: boolean | null;
          slack_webhook_url?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          broken_links?: boolean | null;
          created_at?: string | null;
          critical_alerts?: boolean | null;
          email_address?: string | null;
          email_enabled?: boolean | null;
          id?: string;
          in_app_enabled?: boolean | null;
          performance_alerts?: boolean | null;
          ranking_changes?: boolean | null;
          security_alerts?: boolean | null;
          slack_enabled?: boolean | null;
          slack_webhook_url?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'seo_notification_preferences_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      seo_notification_queue: {
        Row: {
          channels: string[];
          created_at: string | null;
          data: Json | null;
          error_message: string | null;
          id: string;
          message: string;
          notification_type: string;
          recipients: string[];
          retry_count: number | null;
          sent_at: string | null;
          severity: string;
          status: string | null;
          title: string;
        };
        Insert: {
          channels: string[];
          created_at?: string | null;
          data?: Json | null;
          error_message?: string | null;
          id?: string;
          message: string;
          notification_type: string;
          recipients: string[];
          retry_count?: number | null;
          sent_at?: string | null;
          severity: string;
          status?: string | null;
          title: string;
        };
        Update: {
          channels?: string[];
          created_at?: string | null;
          data?: Json | null;
          error_message?: string | null;
          id?: string;
          message?: string;
          notification_type?: string;
          recipients?: string[];
          retry_count?: number | null;
          sent_at?: string | null;
          severity?: string;
          status?: string | null;
          title?: string;
        };
        Relationships: [];
      };
      seo_page_scores: {
        Row: {
          content_score: number | null;
          content_uniqueness: number | null;
          created_at: string | null;
          critical_issues: number | null;
          cumulative_layout_shift: number | null;
          description_score: number | null;
          external_links: number | null;
          first_contentful_paint: number | null;
          has_alt_tags: boolean | null;
          has_canonical: boolean | null;
          has_structured_data: boolean | null;
          headings_score: number | null;
          id: string;
          images_optimized: boolean | null;
          internal_links: number | null;
          keyword_density: number | null;
          keywords_score: number | null;
          largest_contentful_paint: number | null;
          last_scored_at: string | null;
          load_time_ms: number | null;
          mobile_score: number | null;
          overall_score: number | null;
          page_title: string | null;
          page_type: string | null;
          previous_score: number | null;
          readability_score: number | null;
          recommendations: Json | null;
          score_change: number | null;
          seo_score: number | null;
          technical_score: number | null;
          time_to_interactive: number | null;
          title_score: number | null;
          updated_at: string | null;
          url: string;
          ux_score: number | null;
          warnings: number | null;
          word_count: number | null;
        };
        Insert: {
          content_score?: number | null;
          content_uniqueness?: number | null;
          created_at?: string | null;
          critical_issues?: number | null;
          cumulative_layout_shift?: number | null;
          description_score?: number | null;
          external_links?: number | null;
          first_contentful_paint?: number | null;
          has_alt_tags?: boolean | null;
          has_canonical?: boolean | null;
          has_structured_data?: boolean | null;
          headings_score?: number | null;
          id?: string;
          images_optimized?: boolean | null;
          internal_links?: number | null;
          keyword_density?: number | null;
          keywords_score?: number | null;
          largest_contentful_paint?: number | null;
          last_scored_at?: string | null;
          load_time_ms?: number | null;
          mobile_score?: number | null;
          overall_score?: number | null;
          page_title?: string | null;
          page_type?: string | null;
          previous_score?: number | null;
          readability_score?: number | null;
          recommendations?: Json | null;
          score_change?: number | null;
          seo_score?: number | null;
          technical_score?: number | null;
          time_to_interactive?: number | null;
          title_score?: number | null;
          updated_at?: string | null;
          url: string;
          ux_score?: number | null;
          warnings?: number | null;
          word_count?: number | null;
        };
        Update: {
          content_score?: number | null;
          content_uniqueness?: number | null;
          created_at?: string | null;
          critical_issues?: number | null;
          cumulative_layout_shift?: number | null;
          description_score?: number | null;
          external_links?: number | null;
          first_contentful_paint?: number | null;
          has_alt_tags?: boolean | null;
          has_canonical?: boolean | null;
          has_structured_data?: boolean | null;
          headings_score?: number | null;
          id?: string;
          images_optimized?: boolean | null;
          internal_links?: number | null;
          keyword_density?: number | null;
          keywords_score?: number | null;
          largest_contentful_paint?: number | null;
          last_scored_at?: string | null;
          load_time_ms?: number | null;
          mobile_score?: number | null;
          overall_score?: number | null;
          page_title?: string | null;
          page_type?: string | null;
          previous_score?: number | null;
          readability_score?: number | null;
          recommendations?: Json | null;
          score_change?: number | null;
          seo_score?: number | null;
          technical_score?: number | null;
          time_to_interactive?: number | null;
          title_score?: number | null;
          updated_at?: string | null;
          url?: string;
          ux_score?: number | null;
          warnings?: number | null;
          word_count?: number | null;
        };
        Relationships: [];
      };
      seo_performance_budget: {
        Row: {
          alert_on_violation: boolean | null;
          alert_threshold_percentage: number | null;
          created_at: string | null;
          created_by: string | null;
          current_cls: number | null;
          current_css_size_kb: number | null;
          current_fid_ms: number | null;
          current_font_size_kb: number | null;
          current_image_size_kb: number | null;
          current_js_size_kb: number | null;
          current_lcp_ms: number | null;
          current_load_time_ms: number | null;
          current_page_size_kb: number | null;
          current_requests: number | null;
          id: string;
          is_active: boolean | null;
          is_within_budget: boolean | null;
          last_checked_at: string | null;
          last_violation_at: string | null;
          max_cls: number | null;
          max_css_size_kb: number | null;
          max_fid_ms: number | null;
          max_font_size_kb: number | null;
          max_image_size_kb: number | null;
          max_js_size_kb: number | null;
          max_lcp_ms: number | null;
          max_load_time_ms: number | null;
          max_page_size_kb: number | null;
          max_requests: number | null;
          name: string;
          updated_at: string | null;
          url_pattern: string;
          violation_count: number | null;
          violations: Json | null;
        };
        Insert: {
          alert_on_violation?: boolean | null;
          alert_threshold_percentage?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          current_cls?: number | null;
          current_css_size_kb?: number | null;
          current_fid_ms?: number | null;
          current_font_size_kb?: number | null;
          current_image_size_kb?: number | null;
          current_js_size_kb?: number | null;
          current_lcp_ms?: number | null;
          current_load_time_ms?: number | null;
          current_page_size_kb?: number | null;
          current_requests?: number | null;
          id?: string;
          is_active?: boolean | null;
          is_within_budget?: boolean | null;
          last_checked_at?: string | null;
          last_violation_at?: string | null;
          max_cls?: number | null;
          max_css_size_kb?: number | null;
          max_fid_ms?: number | null;
          max_font_size_kb?: number | null;
          max_image_size_kb?: number | null;
          max_js_size_kb?: number | null;
          max_lcp_ms?: number | null;
          max_load_time_ms?: number | null;
          max_page_size_kb?: number | null;
          max_requests?: number | null;
          name: string;
          updated_at?: string | null;
          url_pattern: string;
          violation_count?: number | null;
          violations?: Json | null;
        };
        Update: {
          alert_on_violation?: boolean | null;
          alert_threshold_percentage?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          current_cls?: number | null;
          current_css_size_kb?: number | null;
          current_fid_ms?: number | null;
          current_font_size_kb?: number | null;
          current_image_size_kb?: number | null;
          current_js_size_kb?: number | null;
          current_lcp_ms?: number | null;
          current_load_time_ms?: number | null;
          current_page_size_kb?: number | null;
          current_requests?: number | null;
          id?: string;
          is_active?: boolean | null;
          is_within_budget?: boolean | null;
          last_checked_at?: string | null;
          last_violation_at?: string | null;
          max_cls?: number | null;
          max_css_size_kb?: number | null;
          max_fid_ms?: number | null;
          max_font_size_kb?: number | null;
          max_image_size_kb?: number | null;
          max_js_size_kb?: number | null;
          max_lcp_ms?: number | null;
          max_load_time_ms?: number | null;
          max_page_size_kb?: number | null;
          max_requests?: number | null;
          name?: string;
          updated_at?: string | null;
          url_pattern?: string;
          violation_count?: number | null;
          violations?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'seo_performance_budget_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      seo_redirect_analysis: {
        Row: {
          chain_length: number | null;
          created_at: string | null;
          final_url: string;
          fixed_at: string | null;
          has_issues: boolean | null;
          id: string;
          is_chain: boolean | null;
          is_permanent: boolean | null;
          issues: Json | null;
          last_checked_at: string | null;
          priority: string | null;
          recommended_action: string | null;
          redirect_chain: Json;
          redirect_type: number | null;
          source_url: string;
          status: string | null;
          time_per_hop_ms: number | null;
          total_time_ms: number | null;
          updated_at: string | null;
        };
        Insert: {
          chain_length?: number | null;
          created_at?: string | null;
          final_url: string;
          fixed_at?: string | null;
          has_issues?: boolean | null;
          id?: string;
          is_chain?: boolean | null;
          is_permanent?: boolean | null;
          issues?: Json | null;
          last_checked_at?: string | null;
          priority?: string | null;
          recommended_action?: string | null;
          redirect_chain?: Json;
          redirect_type?: number | null;
          source_url: string;
          status?: string | null;
          time_per_hop_ms?: number | null;
          total_time_ms?: number | null;
          updated_at?: string | null;
        };
        Update: {
          chain_length?: number | null;
          created_at?: string | null;
          final_url?: string;
          fixed_at?: string | null;
          has_issues?: boolean | null;
          id?: string;
          is_chain?: boolean | null;
          is_permanent?: boolean | null;
          issues?: Json | null;
          last_checked_at?: string | null;
          priority?: string | null;
          recommended_action?: string | null;
          redirect_chain?: Json;
          redirect_type?: number | null;
          source_url?: string;
          status?: string | null;
          time_per_hop_ms?: number | null;
          total_time_ms?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      seo_report_history: {
        Row: {
          file_url: string | null;
          generated_at: string | null;
          generation_time_ms: number | null;
          id: string;
          report_data: Json;
          report_type: string;
          schedule_id: string | null;
          sent_to: string[] | null;
        };
        Insert: {
          file_url?: string | null;
          generated_at?: string | null;
          generation_time_ms?: number | null;
          id?: string;
          report_data: Json;
          report_type: string;
          schedule_id?: string | null;
          sent_to?: string[] | null;
        };
        Update: {
          file_url?: string | null;
          generated_at?: string | null;
          generation_time_ms?: number | null;
          id?: string;
          report_data?: Json;
          report_type?: string;
          schedule_id?: string | null;
          sent_to?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: 'seo_report_history_schedule_id_fkey';
            columns: ['schedule_id'];
            isOneToOne: false;
            referencedRelation: 'seo_scheduled_reports';
            referencedColumns: ['id'];
          },
        ];
      };
      seo_scheduled_reports: {
        Row: {
          active: boolean | null;
          created_at: string | null;
          created_by: string | null;
          cron_expression: string | null;
          delivery_channels: string[] | null;
          description: string | null;
          format: string | null;
          id: string;
          last_generated_at: string | null;
          name: string;
          next_generation_at: string | null;
          recipients: string[];
          report_config: Json | null;
          report_type: string;
          schedule_type: string;
          updated_at: string | null;
        };
        Insert: {
          active?: boolean | null;
          created_at?: string | null;
          created_by?: string | null;
          cron_expression?: string | null;
          delivery_channels?: string[] | null;
          description?: string | null;
          format?: string | null;
          id?: string;
          last_generated_at?: string | null;
          name: string;
          next_generation_at?: string | null;
          recipients: string[];
          report_config?: Json | null;
          report_type: string;
          schedule_type: string;
          updated_at?: string | null;
        };
        Update: {
          active?: boolean | null;
          created_at?: string | null;
          created_by?: string | null;
          cron_expression?: string | null;
          delivery_channels?: string[] | null;
          description?: string | null;
          format?: string | null;
          id?: string;
          last_generated_at?: string | null;
          name?: string;
          next_generation_at?: string | null;
          recipients?: string[];
          report_config?: Json | null;
          report_type?: string;
          schedule_type?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'seo_scheduled_reports_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      seo_security_analysis: {
        Row: {
          created_at: string | null;
          critical_issues: number | null;
          csp_policy: string | null;
          has_csp: boolean | null;
          has_hsts: boolean | null;
          has_permissions_policy: boolean | null;
          has_referrer_policy: boolean | null;
          has_ssl: boolean | null;
          has_x_content_type_options: boolean | null;
          has_x_frame_options: boolean | null;
          hsts_max_age: number | null;
          httponly_cookies: boolean | null;
          id: string;
          mixed_content_issues: number | null;
          passed_checks: number | null;
          referrer_policy: string | null;
          samesite_cookies: string | null;
          scanned_at: string | null;
          secure_cookies: boolean | null;
          security_grade: string | null;
          security_score: number | null;
          ssl_expiry_date: string | null;
          ssl_issuer: string | null;
          ssl_valid: boolean | null;
          total_checks: number | null;
          url: string;
          vulnerabilities: Json | null;
          warnings: number | null;
          x_frame_options: string | null;
        };
        Insert: {
          created_at?: string | null;
          critical_issues?: number | null;
          csp_policy?: string | null;
          has_csp?: boolean | null;
          has_hsts?: boolean | null;
          has_permissions_policy?: boolean | null;
          has_referrer_policy?: boolean | null;
          has_ssl?: boolean | null;
          has_x_content_type_options?: boolean | null;
          has_x_frame_options?: boolean | null;
          hsts_max_age?: number | null;
          httponly_cookies?: boolean | null;
          id?: string;
          mixed_content_issues?: number | null;
          passed_checks?: number | null;
          referrer_policy?: string | null;
          samesite_cookies?: string | null;
          scanned_at?: string | null;
          secure_cookies?: boolean | null;
          security_grade?: string | null;
          security_score?: number | null;
          ssl_expiry_date?: string | null;
          ssl_issuer?: string | null;
          ssl_valid?: boolean | null;
          total_checks?: number | null;
          url: string;
          vulnerabilities?: Json | null;
          warnings?: number | null;
          x_frame_options?: string | null;
        };
        Update: {
          created_at?: string | null;
          critical_issues?: number | null;
          csp_policy?: string | null;
          has_csp?: boolean | null;
          has_hsts?: boolean | null;
          has_permissions_policy?: boolean | null;
          has_referrer_policy?: boolean | null;
          has_ssl?: boolean | null;
          has_x_content_type_options?: boolean | null;
          has_x_frame_options?: boolean | null;
          hsts_max_age?: number | null;
          httponly_cookies?: boolean | null;
          id?: string;
          mixed_content_issues?: number | null;
          passed_checks?: number | null;
          referrer_policy?: string | null;
          samesite_cookies?: string | null;
          scanned_at?: string | null;
          secure_cookies?: boolean | null;
          security_grade?: string | null;
          security_score?: number | null;
          ssl_expiry_date?: string | null;
          ssl_issuer?: string | null;
          ssl_valid?: boolean | null;
          total_checks?: number | null;
          url?: string;
          vulnerabilities?: Json | null;
          warnings?: number | null;
          x_frame_options?: string | null;
        };
        Relationships: [];
      };
      seo_semantic_analysis: {
        Row: {
          analyzed_at: string | null;
          analyzed_by: string | null;
          authority_signals: Json | null;
          cluster_name: string | null;
          content_depth_recommendation: string | null;
          content_intent: string | null;
          created_at: string | null;
          eat_score: number | null;
          emotional_tone: string[] | null;
          expertise_signals: Json | null;
          faq_potential_score: number | null;
          id: string;
          is_pillar_content: boolean | null;
          keyword_co_occurrence: Json | null;
          lexical_diversity: number | null;
          main_entities: Json | null;
          missing_questions: string[] | null;
          nlp_confidence_score: number | null;
          nlp_model_used: string | null;
          overall_sentiment: string | null;
          primary_topic: string;
          questions_addressed: string[] | null;
          recommended_entities: string[] | null;
          recommended_topics: string[] | null;
          related_content_urls: string[] | null;
          search_intent_match_score: number | null;
          semantic_density: number | null;
          semantic_gaps: string[] | null;
          semantic_keywords: Json | null;
          semantic_relevance_score: number | null;
          sentiment_score: number | null;
          tf_idf_keywords: Json | null;
          topic_cluster_id: string | null;
          topic_weights: Json | null;
          topical_authority_score: number | null;
          topics_detected: string[] | null;
          trust_signals: Json | null;
          updated_at: string | null;
          url: string;
          vocabulary_size: number | null;
        };
        Insert: {
          analyzed_at?: string | null;
          analyzed_by?: string | null;
          authority_signals?: Json | null;
          cluster_name?: string | null;
          content_depth_recommendation?: string | null;
          content_intent?: string | null;
          created_at?: string | null;
          eat_score?: number | null;
          emotional_tone?: string[] | null;
          expertise_signals?: Json | null;
          faq_potential_score?: number | null;
          id?: string;
          is_pillar_content?: boolean | null;
          keyword_co_occurrence?: Json | null;
          lexical_diversity?: number | null;
          main_entities?: Json | null;
          missing_questions?: string[] | null;
          nlp_confidence_score?: number | null;
          nlp_model_used?: string | null;
          overall_sentiment?: string | null;
          primary_topic: string;
          questions_addressed?: string[] | null;
          recommended_entities?: string[] | null;
          recommended_topics?: string[] | null;
          related_content_urls?: string[] | null;
          search_intent_match_score?: number | null;
          semantic_density?: number | null;
          semantic_gaps?: string[] | null;
          semantic_keywords?: Json | null;
          semantic_relevance_score?: number | null;
          sentiment_score?: number | null;
          tf_idf_keywords?: Json | null;
          topic_cluster_id?: string | null;
          topic_weights?: Json | null;
          topical_authority_score?: number | null;
          topics_detected?: string[] | null;
          trust_signals?: Json | null;
          updated_at?: string | null;
          url: string;
          vocabulary_size?: number | null;
        };
        Update: {
          analyzed_at?: string | null;
          analyzed_by?: string | null;
          authority_signals?: Json | null;
          cluster_name?: string | null;
          content_depth_recommendation?: string | null;
          content_intent?: string | null;
          created_at?: string | null;
          eat_score?: number | null;
          emotional_tone?: string[] | null;
          expertise_signals?: Json | null;
          faq_potential_score?: number | null;
          id?: string;
          is_pillar_content?: boolean | null;
          keyword_co_occurrence?: Json | null;
          lexical_diversity?: number | null;
          main_entities?: Json | null;
          missing_questions?: string[] | null;
          nlp_confidence_score?: number | null;
          nlp_model_used?: string | null;
          overall_sentiment?: string | null;
          primary_topic?: string;
          questions_addressed?: string[] | null;
          recommended_entities?: string[] | null;
          recommended_topics?: string[] | null;
          related_content_urls?: string[] | null;
          search_intent_match_score?: number | null;
          semantic_density?: number | null;
          semantic_gaps?: string[] | null;
          semantic_keywords?: Json | null;
          semantic_relevance_score?: number | null;
          sentiment_score?: number | null;
          tf_idf_keywords?: Json | null;
          topic_cluster_id?: string | null;
          topic_weights?: Json | null;
          topical_authority_score?: number | null;
          topics_detected?: string[] | null;
          trust_signals?: Json | null;
          updated_at?: string | null;
          url?: string;
          vocabulary_size?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'seo_semantic_analysis_analyzed_by_fkey';
            columns: ['analyzed_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      seo_settings: {
        Row: {
          additional_meta_tags: Json | null;
          apple_touch_icon_url: string | null;
          bing_site_verification: string | null;
          canonical_url_override: string | null;
          created_at: string | null;
          default_author: string | null;
          default_description: string | null;
          default_keywords: string[] | null;
          default_og_image: string | null;
          default_title: string | null;
          favicon_url: string | null;
          google_analytics_id: string | null;
          google_site_verification: string | null;
          google_tag_manager_id: string | null;
          id: string;
          language: string | null;
          llms_txt: string | null;
          manifest_url: string | null;
          region: string | null;
          robots_txt: string | null;
          schema_org_data: Json | null;
          site_name: string | null;
          site_url: string;
          sitemap_enabled: boolean | null;
          sitemap_frequency: string | null;
          sitemap_priority: number | null;
          social_profiles: Json | null;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          additional_meta_tags?: Json | null;
          apple_touch_icon_url?: string | null;
          bing_site_verification?: string | null;
          canonical_url_override?: string | null;
          created_at?: string | null;
          default_author?: string | null;
          default_description?: string | null;
          default_keywords?: string[] | null;
          default_og_image?: string | null;
          default_title?: string | null;
          favicon_url?: string | null;
          google_analytics_id?: string | null;
          google_site_verification?: string | null;
          google_tag_manager_id?: string | null;
          id?: string;
          language?: string | null;
          llms_txt?: string | null;
          manifest_url?: string | null;
          region?: string | null;
          robots_txt?: string | null;
          schema_org_data?: Json | null;
          site_name?: string | null;
          site_url: string;
          sitemap_enabled?: boolean | null;
          sitemap_frequency?: string | null;
          sitemap_priority?: number | null;
          social_profiles?: Json | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          additional_meta_tags?: Json | null;
          apple_touch_icon_url?: string | null;
          bing_site_verification?: string | null;
          canonical_url_override?: string | null;
          created_at?: string | null;
          default_author?: string | null;
          default_description?: string | null;
          default_keywords?: string[] | null;
          default_og_image?: string | null;
          default_title?: string | null;
          favicon_url?: string | null;
          google_analytics_id?: string | null;
          google_site_verification?: string | null;
          google_tag_manager_id?: string | null;
          id?: string;
          language?: string | null;
          llms_txt?: string | null;
          manifest_url?: string | null;
          region?: string | null;
          robots_txt?: string | null;
          schema_org_data?: Json | null;
          site_name?: string | null;
          site_url?: string;
          sitemap_enabled?: boolean | null;
          sitemap_frequency?: string | null;
          sitemap_priority?: number | null;
          social_profiles?: Json | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'seo_settings_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      seo_structured_data: {
        Row: {
          created_at: string | null;
          critical_errors: number | null;
          eligible_for_rich_results: boolean | null;
          google_test_result: Json | null;
          has_structured_data: boolean | null;
          id: string;
          is_valid: boolean | null;
          recommended_schemas: string[] | null;
          rich_result_types: string[] | null;
          schema_coverage_score: number | null;
          schema_markup_validator_result: Json | null;
          schema_types: string[] | null;
          schemas: Json | null;
          url: string;
          validated_at: string | null;
          validation_errors: Json | null;
          validation_warnings: Json | null;
          warnings: number | null;
        };
        Insert: {
          created_at?: string | null;
          critical_errors?: number | null;
          eligible_for_rich_results?: boolean | null;
          google_test_result?: Json | null;
          has_structured_data?: boolean | null;
          id?: string;
          is_valid?: boolean | null;
          recommended_schemas?: string[] | null;
          rich_result_types?: string[] | null;
          schema_coverage_score?: number | null;
          schema_markup_validator_result?: Json | null;
          schema_types?: string[] | null;
          schemas?: Json | null;
          url: string;
          validated_at?: string | null;
          validation_errors?: Json | null;
          validation_warnings?: Json | null;
          warnings?: number | null;
        };
        Update: {
          created_at?: string | null;
          critical_errors?: number | null;
          eligible_for_rich_results?: boolean | null;
          google_test_result?: Json | null;
          has_structured_data?: boolean | null;
          id?: string;
          is_valid?: boolean | null;
          recommended_schemas?: string[] | null;
          rich_result_types?: string[] | null;
          schema_coverage_score?: number | null;
          schema_markup_validator_result?: Json | null;
          schema_types?: string[] | null;
          schemas?: Json | null;
          url?: string;
          validated_at?: string | null;
          validation_errors?: Json | null;
          validation_warnings?: Json | null;
          warnings?: number | null;
        };
        Relationships: [];
      };
      social_media_posts: {
        Row: {
          ai_prompt_used: string | null;
          content_type: string;
          created_at: string | null;
          created_by: string | null;
          id: string;
          listing_id: string | null;
          metadata: Json | null;
          platform_type: string;
          post_content: Json;
          post_title: string | null;
          posted_at: string | null;
          property_address: string | null;
          scheduled_for: string | null;
          status: string | null;
          subject_type: string;
          webhook_urls: string[] | null;
        };
        Insert: {
          ai_prompt_used?: string | null;
          content_type: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          listing_id?: string | null;
          metadata?: Json | null;
          platform_type: string;
          post_content: Json;
          post_title?: string | null;
          posted_at?: string | null;
          property_address?: string | null;
          scheduled_for?: string | null;
          status?: string | null;
          subject_type: string;
          webhook_urls?: string[] | null;
        };
        Update: {
          ai_prompt_used?: string | null;
          content_type?: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          listing_id?: string | null;
          metadata?: Json | null;
          platform_type?: string;
          post_content?: Json;
          post_title?: string | null;
          posted_at?: string | null;
          property_address?: string | null;
          scheduled_for?: string | null;
          status?: string | null;
          subject_type?: string;
          webhook_urls?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: 'social_media_posts_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'social_media_posts_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
        ];
      };
      social_media_webhooks: {
        Row: {
          created_at: string | null;
          headers: Json | null;
          id: string;
          is_active: boolean | null;
          name: string;
          platform: string;
          updated_at: string | null;
          webhook_url: string;
        };
        Insert: {
          created_at?: string | null;
          headers?: Json | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          platform: string;
          updated_at?: string | null;
          webhook_url: string;
        };
        Update: {
          created_at?: string | null;
          headers?: Json | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          platform?: string;
          updated_at?: string | null;
          webhook_url?: string;
        };
        Relationships: [];
      };
      sso_audit_logs: {
        Row: {
          config_id: string | null;
          created_at: string | null;
          event_details: Json | null;
          event_type: string;
          id: string;
          ip_address: string | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          config_id?: string | null;
          created_at?: string | null;
          event_details?: Json | null;
          event_type: string;
          id?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          config_id?: string | null;
          created_at?: string | null;
          event_details?: Json | null;
          event_type?: string;
          id?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sso_audit_logs_config_id_fkey';
            columns: ['config_id'];
            isOneToOne: false;
            referencedRelation: 'enterprise_sso_config';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sso_audit_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      sso_login_sessions: {
        Row: {
          completed_at: string | null;
          config_id: string;
          created_at: string | null;
          error_code: string | null;
          error_message: string | null;
          expires_at: string;
          id: string;
          ip_address: string | null;
          oidc_code_verifier: string | null;
          oidc_nonce: string | null;
          redirect_uri: string | null;
          request_id: string;
          saml_assertion_id: string | null;
          saml_request: string | null;
          saml_response: string | null;
          status: string;
          user_agent: string | null;
          user_email: string | null;
          user_id: string | null;
        };
        Insert: {
          completed_at?: string | null;
          config_id: string;
          created_at?: string | null;
          error_code?: string | null;
          error_message?: string | null;
          expires_at?: string;
          id?: string;
          ip_address?: string | null;
          oidc_code_verifier?: string | null;
          oidc_nonce?: string | null;
          redirect_uri?: string | null;
          request_id: string;
          saml_assertion_id?: string | null;
          saml_request?: string | null;
          saml_response?: string | null;
          status?: string;
          user_agent?: string | null;
          user_email?: string | null;
          user_id?: string | null;
        };
        Update: {
          completed_at?: string | null;
          config_id?: string;
          created_at?: string | null;
          error_code?: string | null;
          error_message?: string | null;
          expires_at?: string;
          id?: string;
          ip_address?: string | null;
          oidc_code_verifier?: string | null;
          oidc_nonce?: string | null;
          redirect_uri?: string | null;
          request_id?: string;
          saml_assertion_id?: string | null;
          saml_request?: string | null;
          saml_response?: string | null;
          status?: string;
          user_agent?: string | null;
          user_email?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sso_login_sessions_config_id_fkey';
            columns: ['config_id'];
            isOneToOne: false;
            referencedRelation: 'enterprise_sso_config';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sso_login_sessions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      sso_user_mappings: {
        Row: {
          config_id: string;
          created_at: string | null;
          id: string;
          last_login_at: string | null;
          login_count: number | null;
          sso_attributes: Json | null;
          sso_email: string;
          sso_groups: string[] | null;
          sso_subject_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          config_id: string;
          created_at?: string | null;
          id?: string;
          last_login_at?: string | null;
          login_count?: number | null;
          sso_attributes?: Json | null;
          sso_email: string;
          sso_groups?: string[] | null;
          sso_subject_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          config_id?: string;
          created_at?: string | null;
          id?: string;
          last_login_at?: string | null;
          login_count?: number | null;
          sso_attributes?: Json | null;
          sso_email?: string;
          sso_groups?: string[] | null;
          sso_subject_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sso_user_mappings_config_id_fkey';
            columns: ['config_id'];
            isOneToOne: false;
            referencedRelation: 'enterprise_sso_config';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sso_user_mappings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      stripe_customers: {
        Row: {
          created_at: string | null;
          default_payment_method: string | null;
          email: string | null;
          id: string;
          is_active: boolean | null;
          name: string | null;
          stripe_customer_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          default_payment_method?: string | null;
          email?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string | null;
          stripe_customer_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          default_payment_method?: string | null;
          email?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string | null;
          stripe_customer_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'stripe_customers_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      stripe_usage_records: {
        Row: {
          action: string | null;
          created_at: string | null;
          feature_key: string;
          id: string;
          quantity: number;
          stripe_subscription_item_id: string | null;
          stripe_usage_record_id: string | null;
          sync_error: string | null;
          sync_status: string | null;
          synced_at: string | null;
          timestamp: string;
          user_id: string;
        };
        Insert: {
          action?: string | null;
          created_at?: string | null;
          feature_key: string;
          id?: string;
          quantity: number;
          stripe_subscription_item_id?: string | null;
          stripe_usage_record_id?: string | null;
          sync_error?: string | null;
          sync_status?: string | null;
          synced_at?: string | null;
          timestamp?: string;
          user_id: string;
        };
        Update: {
          action?: string | null;
          created_at?: string | null;
          feature_key?: string;
          id?: string;
          quantity?: number;
          stripe_subscription_item_id?: string | null;
          stripe_usage_record_id?: string | null;
          sync_error?: string | null;
          sync_status?: string | null;
          synced_at?: string | null;
          timestamp?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'stripe_usage_records_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      subscription_plans: {
        Row: {
          created_at: string | null;
          features: Json;
          id: string;
          is_active: boolean | null;
          limits: Json;
          name: string;
          payment_link_monthly: string | null;
          payment_link_yearly: string | null;
          price_monthly: number;
          price_yearly: number | null;
          sort_order: number | null;
          stripe_price_id: string | null;
          stripe_price_id_monthly: string | null;
          stripe_price_id_yearly: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          features?: Json;
          id?: string;
          is_active?: boolean | null;
          limits?: Json;
          name: string;
          payment_link_monthly?: string | null;
          payment_link_yearly?: string | null;
          price_monthly: number;
          price_yearly?: number | null;
          sort_order?: number | null;
          stripe_price_id?: string | null;
          stripe_price_id_monthly?: string | null;
          stripe_price_id_yearly?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          features?: Json;
          id?: string;
          is_active?: boolean | null;
          limits?: Json;
          name?: string;
          payment_link_monthly?: string | null;
          payment_link_yearly?: string | null;
          price_monthly?: number;
          price_yearly?: number | null;
          sort_order?: number | null;
          stripe_price_id?: string | null;
          stripe_price_id_monthly?: string | null;
          stripe_price_id_yearly?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          amount: number | null;
          analytics_history_days: number | null;
          cancel_at: string | null;
          canceled_at: string | null;
          created_at: string | null;
          currency: string | null;
          current_period_end: string | null;
          current_period_start: string | null;
          custom_domain_enabled: boolean | null;
          id: string;
          interval: string | null;
          max_links: number | null;
          max_listings: number | null;
          max_testimonials: number | null;
          plan_name: string;
          priority_support: boolean | null;
          remove_branding: boolean | null;
          status: string;
          stripe_customer_id: string | null;
          stripe_price_id: string | null;
          stripe_subscription_id: string | null;
          trial_end: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          amount?: number | null;
          analytics_history_days?: number | null;
          cancel_at?: string | null;
          canceled_at?: string | null;
          created_at?: string | null;
          currency?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          custom_domain_enabled?: boolean | null;
          id?: string;
          interval?: string | null;
          max_links?: number | null;
          max_listings?: number | null;
          max_testimonials?: number | null;
          plan_name?: string;
          priority_support?: boolean | null;
          remove_branding?: boolean | null;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_price_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_end?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number | null;
          analytics_history_days?: number | null;
          cancel_at?: string | null;
          canceled_at?: string | null;
          created_at?: string | null;
          currency?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          custom_domain_enabled?: boolean | null;
          id?: string;
          interval?: string | null;
          max_links?: number | null;
          max_listings?: number | null;
          max_testimonials?: number | null;
          plan_name?: string;
          priority_support?: boolean | null;
          remove_branding?: boolean | null;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_price_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_end?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      system_metrics: {
        Row: {
          id: string;
          metadata: Json | null;
          metric_name: string;
          metric_type: string;
          recorded_at: string | null;
          unit: string | null;
          value: number;
        };
        Insert: {
          id?: string;
          metadata?: Json | null;
          metric_name: string;
          metric_type: string;
          recorded_at?: string | null;
          unit?: string | null;
          value: number;
        };
        Update: {
          id?: string;
          metadata?: Json | null;
          metric_name?: string;
          metric_type?: string;
          recorded_at?: string | null;
          unit?: string | null;
          value?: number;
        };
        Relationships: [];
      };
      team_members: {
        Row: {
          accepted_at: string | null;
          email: string | null;
          id: string;
          invited_at: string;
          role: string;
          team_id: string;
          user_id: string | null;
        };
        Insert: {
          accepted_at?: string | null;
          email?: string | null;
          id?: string;
          invited_at?: string;
          role?: string;
          team_id: string;
          user_id?: string | null;
        };
        Update: {
          accepted_at?: string | null;
          email?: string | null;
          id?: string;
          invited_at?: string;
          role?: string;
          team_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'team_members_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'team_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      team_round_robin: {
        Row: {
          last_index: number;
          team_id: string;
        };
        Insert: {
          last_index?: number;
          team_id: string;
        };
        Update: {
          last_index?: number;
          team_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'team_round_robin_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: true;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
        ];
      };
      teams: {
        Row: {
          created_at: string;
          id: string;
          max_seats: number;
          name: string;
          owner_id: string;
          plan_id: string | null;
          stripe_subscription_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          max_seats?: number;
          name: string;
          owner_id: string;
          plan_id?: string | null;
          stripe_subscription_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          max_seats?: number;
          name?: string;
          owner_id?: string;
          plan_id?: string | null;
          stripe_subscription_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'teams_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      testimonials: {
        Row: {
          client_name: string;
          client_photo: string | null;
          client_title: string | null;
          created_at: string | null;
          date: string | null;
          id: string;
          is_featured: boolean | null;
          is_published: boolean | null;
          listing_id: string | null;
          property_type: string | null;
          rating: number;
          review: string;
          sort_order: number | null;
          transaction_type: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          client_name: string;
          client_photo?: string | null;
          client_title?: string | null;
          created_at?: string | null;
          date?: string | null;
          id?: string;
          is_featured?: boolean | null;
          is_published?: boolean | null;
          listing_id?: string | null;
          property_type?: string | null;
          rating: number;
          review: string;
          sort_order?: number | null;
          transaction_type?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          client_name?: string;
          client_photo?: string | null;
          client_title?: string | null;
          created_at?: string | null;
          date?: string | null;
          id?: string;
          is_featured?: boolean | null;
          is_published?: boolean | null;
          listing_id?: string | null;
          property_type?: string | null;
          rating?: number;
          review?: string;
          sort_order?: number | null;
          transaction_type?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'testimonials_listing_id_fkey';
            columns: ['listing_id'];
            isOneToOne: false;
            referencedRelation: 'listings';
            referencedColumns: ['id'];
          },
        ];
      };
      unified_search_analytics: {
        Row: {
          average_position: number | null;
          bounce_rate: number | null;
          clicks: number | null;
          country: string | null;
          created_at: string | null;
          ctr: number | null;
          date: string;
          device: string | null;
          engagement_rate: number | null;
          id: string;
          impressions: number | null;
          page_title: string | null;
          page_url: string | null;
          pageviews: number | null;
          query: string | null;
          sessions: number | null;
          source_platform: string;
          source_property_id: string | null;
          updated_at: string | null;
          user_id: string;
          users: number | null;
        };
        Insert: {
          average_position?: number | null;
          bounce_rate?: number | null;
          clicks?: number | null;
          country?: string | null;
          created_at?: string | null;
          ctr?: number | null;
          date: string;
          device?: string | null;
          engagement_rate?: number | null;
          id?: string;
          impressions?: number | null;
          page_title?: string | null;
          page_url?: string | null;
          pageviews?: number | null;
          query?: string | null;
          sessions?: number | null;
          source_platform: string;
          source_property_id?: string | null;
          updated_at?: string | null;
          user_id: string;
          users?: number | null;
        };
        Update: {
          average_position?: number | null;
          bounce_rate?: number | null;
          clicks?: number | null;
          country?: string | null;
          created_at?: string | null;
          ctr?: number | null;
          date?: string;
          device?: string | null;
          engagement_rate?: number | null;
          id?: string;
          impressions?: number | null;
          page_title?: string | null;
          page_url?: string | null;
          pageviews?: number | null;
          query?: string | null;
          sessions?: number | null;
          source_platform?: string;
          source_property_id?: string | null;
          updated_at?: string | null;
          user_id?: string;
          users?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'unified_search_analytics_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      usage_tracking: {
        Row: {
          count: number | null;
          created_at: string | null;
          id: string;
          last_reset_at: string | null;
          resource_type: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          count?: number | null;
          created_at?: string | null;
          id?: string;
          last_reset_at?: string | null;
          resource_type: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          count?: number | null;
          created_at?: string | null;
          id?: string;
          last_reset_at?: string | null;
          resource_type?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'usage_tracking_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_activity_log: {
        Row: {
          activity_data: Json | null;
          activity_type: string;
          created_at: string | null;
          id: string;
          page_url: string | null;
          user_id: string | null;
        };
        Insert: {
          activity_data?: Json | null;
          activity_type: string;
          created_at?: string | null;
          id?: string;
          page_url?: string | null;
          user_id?: string | null;
        };
        Update: {
          activity_data?: Json | null;
          activity_type?: string;
          created_at?: string | null;
          id?: string;
          page_url?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_activity_log_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_mfa_settings: {
        Row: {
          backup_codes: string[] | null;
          backup_codes_generated_at: string | null;
          created_at: string | null;
          email_verified_for_mfa: boolean | null;
          failed_attempts: number | null;
          id: string;
          last_used_at: string | null;
          locked_until: string | null;
          mfa_enabled: boolean | null;
          mfa_method: string | null;
          phone_number: string | null;
          totp_secret: string | null;
          updated_at: string | null;
          user_id: string;
          verified_at: string | null;
        };
        Insert: {
          backup_codes?: string[] | null;
          backup_codes_generated_at?: string | null;
          created_at?: string | null;
          email_verified_for_mfa?: boolean | null;
          failed_attempts?: number | null;
          id?: string;
          last_used_at?: string | null;
          locked_until?: string | null;
          mfa_enabled?: boolean | null;
          mfa_method?: string | null;
          phone_number?: string | null;
          totp_secret?: string | null;
          updated_at?: string | null;
          user_id: string;
          verified_at?: string | null;
        };
        Update: {
          backup_codes?: string[] | null;
          backup_codes_generated_at?: string | null;
          created_at?: string | null;
          email_verified_for_mfa?: boolean | null;
          failed_attempts?: number | null;
          id?: string;
          last_used_at?: string | null;
          locked_until?: string | null;
          mfa_enabled?: boolean | null;
          mfa_method?: string | null;
          phone_number?: string | null;
          totp_secret?: string | null;
          updated_at?: string | null;
          user_id?: string;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_mfa_settings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database['public']['Enums']['app_role'];
          user_id: string;
        };
        Insert: {
          id?: string;
          role: Database['public']['Enums']['app_role'];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database['public']['Enums']['app_role'];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_roles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_sessions: {
        Row: {
          browser: string | null;
          created_at: string | null;
          device_type: string | null;
          expires_at: string;
          id: string;
          ip_address: string | null;
          is_current: boolean | null;
          last_activity_at: string | null;
          location_city: string | null;
          location_country: string | null;
          os: string | null;
          revoked: boolean | null;
          revoked_at: string | null;
          revoked_reason: string | null;
          session_token_hash: string;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          browser?: string | null;
          created_at?: string | null;
          device_type?: string | null;
          expires_at: string;
          id?: string;
          ip_address?: string | null;
          is_current?: boolean | null;
          last_activity_at?: string | null;
          location_city?: string | null;
          location_country?: string | null;
          os?: string | null;
          revoked?: boolean | null;
          revoked_at?: string | null;
          revoked_reason?: string | null;
          session_token_hash: string;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          browser?: string | null;
          created_at?: string | null;
          device_type?: string | null;
          expires_at?: string;
          id?: string;
          ip_address?: string | null;
          is_current?: boolean | null;
          last_activity_at?: string | null;
          location_city?: string | null;
          location_country?: string | null;
          os?: string | null;
          revoked?: boolean | null;
          revoked_at?: string | null;
          revoked_reason?: string | null;
          session_token_hash?: string;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_sessions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_settings: {
        Row: {
          created_at: string | null;
          email_leads: boolean | null;
          id: string;
          marketing_emails: boolean | null;
          show_contact_buttons: boolean | null;
          show_listings: boolean | null;
          show_social_proof: boolean | null;
          show_sold_properties: boolean | null;
          show_testimonials: boolean | null;
          sms_leads: boolean | null;
          updated_at: string | null;
          user_id: string;
          weekly_report: boolean | null;
        };
        Insert: {
          created_at?: string | null;
          email_leads?: boolean | null;
          id?: string;
          marketing_emails?: boolean | null;
          show_contact_buttons?: boolean | null;
          show_listings?: boolean | null;
          show_social_proof?: boolean | null;
          show_sold_properties?: boolean | null;
          show_testimonials?: boolean | null;
          sms_leads?: boolean | null;
          updated_at?: string | null;
          user_id: string;
          weekly_report?: boolean | null;
        };
        Update: {
          created_at?: string | null;
          email_leads?: boolean | null;
          id?: string;
          marketing_emails?: boolean | null;
          show_contact_buttons?: boolean | null;
          show_listings?: boolean | null;
          show_social_proof?: boolean | null;
          show_sold_properties?: boolean | null;
          show_testimonials?: boolean | null;
          sms_leads?: boolean | null;
          updated_at?: string | null;
          user_id?: string;
          weekly_report?: boolean | null;
        };
        Relationships: [];
      };
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null;
          created_at: string | null;
          current_period_end: string | null;
          current_period_start: string | null;
          id: string;
          plan_id: string | null;
          status: Database['public']['Enums']['subscription_status'] | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          cancel_at_period_end?: boolean | null;
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          plan_id?: string | null;
          status?: Database['public']['Enums']['subscription_status'] | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          cancel_at_period_end?: boolean | null;
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          plan_id?: string | null;
          status?: Database['public']['Enums']['subscription_status'] | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_subscriptions_plan_id_fkey';
            columns: ['plan_id'];
            isOneToOne: false;
            referencedRelation: 'subscription_plans';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      workflow_execution_queue: {
        Row: {
          attempts: number | null;
          created_at: string | null;
          execution_id: string;
          id: string;
          last_error: string | null;
          locked_at: string | null;
          locked_by: string | null;
          max_attempts: number | null;
          next_retry_at: string | null;
          node_id: string;
          priority: number | null;
          scheduled_for: string;
        };
        Insert: {
          attempts?: number | null;
          created_at?: string | null;
          execution_id: string;
          id?: string;
          last_error?: string | null;
          locked_at?: string | null;
          locked_by?: string | null;
          max_attempts?: number | null;
          next_retry_at?: string | null;
          node_id: string;
          priority?: number | null;
          scheduled_for?: string;
        };
        Update: {
          attempts?: number | null;
          created_at?: string | null;
          execution_id?: string;
          id?: string;
          last_error?: string | null;
          locked_at?: string | null;
          locked_by?: string | null;
          max_attempts?: number | null;
          next_retry_at?: string | null;
          node_id?: string;
          priority?: number | null;
          scheduled_for?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workflow_execution_queue_execution_id_fkey';
            columns: ['execution_id'];
            isOneToOne: false;
            referencedRelation: 'workflow_executions';
            referencedColumns: ['id'];
          },
        ];
      };
      workflow_execution_steps: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          duration_ms: number | null;
          error_details: Json | null;
          error_message: string | null;
          execution_id: string;
          id: string;
          input_data: Json | null;
          max_retries: number | null;
          node_id: string;
          node_name: string | null;
          node_type: string;
          output_data: Json | null;
          retry_count: number | null;
          started_at: string | null;
          status: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          duration_ms?: number | null;
          error_details?: Json | null;
          error_message?: string | null;
          execution_id: string;
          id?: string;
          input_data?: Json | null;
          max_retries?: number | null;
          node_id: string;
          node_name?: string | null;
          node_type: string;
          output_data?: Json | null;
          retry_count?: number | null;
          started_at?: string | null;
          status?: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          duration_ms?: number | null;
          error_details?: Json | null;
          error_message?: string | null;
          execution_id?: string;
          id?: string;
          input_data?: Json | null;
          max_retries?: number | null;
          node_id?: string;
          node_name?: string | null;
          node_type?: string;
          output_data?: Json | null;
          retry_count?: number | null;
          started_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workflow_execution_steps_execution_id_fkey';
            columns: ['execution_id'];
            isOneToOne: false;
            referencedRelation: 'workflow_executions';
            referencedColumns: ['id'];
          },
        ];
      };
      workflow_executions: {
        Row: {
          completed_at: string | null;
          completed_nodes: string[] | null;
          context: Json | null;
          created_at: string | null;
          current_node_id: string | null;
          error_message: string | null;
          error_node_id: string | null;
          id: string;
          result: Json | null;
          started_at: string | null;
          status: string;
          timeout_at: string | null;
          trigger_data: Json | null;
          trigger_type: string;
          user_id: string;
          variables: Json | null;
          workflow_id: string;
          workflow_version: number;
        };
        Insert: {
          completed_at?: string | null;
          completed_nodes?: string[] | null;
          context?: Json | null;
          created_at?: string | null;
          current_node_id?: string | null;
          error_message?: string | null;
          error_node_id?: string | null;
          id?: string;
          result?: Json | null;
          started_at?: string | null;
          status?: string;
          timeout_at?: string | null;
          trigger_data?: Json | null;
          trigger_type: string;
          user_id: string;
          variables?: Json | null;
          workflow_id: string;
          workflow_version: number;
        };
        Update: {
          completed_at?: string | null;
          completed_nodes?: string[] | null;
          context?: Json | null;
          created_at?: string | null;
          current_node_id?: string | null;
          error_message?: string | null;
          error_node_id?: string | null;
          id?: string;
          result?: Json | null;
          started_at?: string | null;
          status?: string;
          timeout_at?: string | null;
          trigger_data?: Json | null;
          trigger_type?: string;
          user_id?: string;
          variables?: Json | null;
          workflow_id?: string;
          workflow_version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'workflow_executions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workflow_executions_workflow_id_fkey';
            columns: ['workflow_id'];
            isOneToOne: false;
            referencedRelation: 'workflows';
            referencedColumns: ['id'];
          },
        ];
      };
      workflow_node_templates: {
        Row: {
          category: string;
          color: string | null;
          config_schema: Json;
          created_at: string | null;
          default_config: Json | null;
          description: string | null;
          documentation_url: string | null;
          icon: string | null;
          id: string;
          is_active: boolean | null;
          is_premium: boolean | null;
          name: string;
          subtype: string;
          type: string;
          updated_at: string | null;
        };
        Insert: {
          category: string;
          color?: string | null;
          config_schema?: Json;
          created_at?: string | null;
          default_config?: Json | null;
          description?: string | null;
          documentation_url?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_premium?: boolean | null;
          name: string;
          subtype: string;
          type: string;
          updated_at?: string | null;
        };
        Update: {
          category?: string;
          color?: string | null;
          config_schema?: Json;
          created_at?: string | null;
          default_config?: Json | null;
          description?: string | null;
          documentation_url?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_premium?: boolean | null;
          name?: string;
          subtype?: string;
          type?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      workflow_templates: {
        Row: {
          category: string;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          edges: Json;
          icon: string | null;
          id: string;
          is_premium: boolean | null;
          is_public: boolean | null;
          name: string;
          nodes: Json;
          preview_image_url: string | null;
          rating: number | null;
          rating_count: number | null;
          tags: string[] | null;
          trigger_config: Json | null;
          updated_at: string | null;
          use_count: number | null;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          edges: Json;
          icon?: string | null;
          id?: string;
          is_premium?: boolean | null;
          is_public?: boolean | null;
          name: string;
          nodes: Json;
          preview_image_url?: string | null;
          rating?: number | null;
          rating_count?: number | null;
          tags?: string[] | null;
          trigger_config?: Json | null;
          updated_at?: string | null;
          use_count?: number | null;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          edges?: Json;
          icon?: string | null;
          id?: string;
          is_premium?: boolean | null;
          is_public?: boolean | null;
          name?: string;
          nodes?: Json;
          preview_image_url?: string | null;
          rating?: number | null;
          rating_count?: number | null;
          tags?: string[] | null;
          trigger_config?: Json | null;
          updated_at?: string | null;
          use_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'workflow_templates_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      workflow_triggers: {
        Row: {
          config: Json | null;
          created_at: string | null;
          cron_expression: string | null;
          id: string;
          is_active: boolean | null;
          last_run_at: string | null;
          next_run_at: string | null;
          trigger_type: string;
          updated_at: string | null;
          webhook_secret: string | null;
          webhook_url: string | null;
          workflow_id: string;
        };
        Insert: {
          config?: Json | null;
          created_at?: string | null;
          cron_expression?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_run_at?: string | null;
          next_run_at?: string | null;
          trigger_type: string;
          updated_at?: string | null;
          webhook_secret?: string | null;
          webhook_url?: string | null;
          workflow_id: string;
        };
        Update: {
          config?: Json | null;
          created_at?: string | null;
          cron_expression?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_run_at?: string | null;
          next_run_at?: string | null;
          trigger_type?: string;
          updated_at?: string | null;
          webhook_secret?: string | null;
          webhook_url?: string | null;
          workflow_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workflow_triggers_workflow_id_fkey';
            columns: ['workflow_id'];
            isOneToOne: false;
            referencedRelation: 'workflows';
            referencedColumns: ['id'];
          },
        ];
      };
      workflow_versions: {
        Row: {
          change_summary: string | null;
          created_at: string | null;
          created_by: string | null;
          edges: Json;
          id: string;
          nodes: Json;
          trigger_config: Json | null;
          version: number;
          workflow_id: string;
        };
        Insert: {
          change_summary?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          edges: Json;
          id?: string;
          nodes: Json;
          trigger_config?: Json | null;
          version: number;
          workflow_id: string;
        };
        Update: {
          change_summary?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          edges?: Json;
          id?: string;
          nodes?: Json;
          trigger_config?: Json | null;
          version?: number;
          workflow_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workflow_versions_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workflow_versions_workflow_id_fkey';
            columns: ['workflow_id'];
            isOneToOne: false;
            referencedRelation: 'workflows';
            referencedColumns: ['id'];
          },
        ];
      };
      workflows: {
        Row: {
          category: string | null;
          created_at: string | null;
          description: string | null;
          edges: Json;
          execution_count: number | null;
          failure_count: number | null;
          id: string;
          is_active: boolean | null;
          is_published: boolean | null;
          last_executed_at: string | null;
          last_published_at: string | null;
          name: string;
          nodes: Json;
          published_version: number | null;
          success_count: number | null;
          tags: string[] | null;
          trigger_config: Json | null;
          updated_at: string | null;
          user_id: string;
          version: number | null;
          viewport: Json | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          edges?: Json;
          execution_count?: number | null;
          failure_count?: number | null;
          id?: string;
          is_active?: boolean | null;
          is_published?: boolean | null;
          last_executed_at?: string | null;
          last_published_at?: string | null;
          name: string;
          nodes?: Json;
          published_version?: number | null;
          success_count?: number | null;
          tags?: string[] | null;
          trigger_config?: Json | null;
          updated_at?: string | null;
          user_id: string;
          version?: number | null;
          viewport?: Json | null;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          edges?: Json;
          execution_count?: number | null;
          failure_count?: number | null;
          id?: string;
          is_active?: boolean | null;
          is_published?: boolean | null;
          last_executed_at?: string | null;
          last_published_at?: string | null;
          name?: string;
          nodes?: Json;
          published_version?: number | null;
          success_count?: number | null;
          tags?: string[] | null;
          trigger_config?: Json | null;
          updated_at?: string | null;
          user_id?: string;
          version?: number | null;
          viewport?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'workflows_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      yandex_webmaster_oauth_credentials: {
        Row: {
          access_token: string;
          created_at: string | null;
          expires_at: string;
          id: string;
          is_active: boolean | null;
          last_refreshed_at: string | null;
          refresh_token: string | null;
          token_type: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          access_token: string;
          created_at?: string | null;
          expires_at: string;
          id?: string;
          is_active?: boolean | null;
          last_refreshed_at?: string | null;
          refresh_token?: string | null;
          token_type?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          access_token?: string;
          created_at?: string | null;
          expires_at?: string;
          id?: string;
          is_active?: boolean | null;
          last_refreshed_at?: string | null;
          refresh_token?: string | null;
          token_type?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'yandex_webmaster_oauth_credentials_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      yandex_webmaster_search_data: {
        Row: {
          clicks: number | null;
          clicks_change: number | null;
          created_at: string | null;
          ctr: number | null;
          ctr_change: number | null;
          date: string;
          device: string | null;
          id: string;
          page_url: string | null;
          position: number | null;
          position_change: number | null;
          query: string | null;
          shows: number | null;
          shows_change: number | null;
          site_id: string;
        };
        Insert: {
          clicks?: number | null;
          clicks_change?: number | null;
          created_at?: string | null;
          ctr?: number | null;
          ctr_change?: number | null;
          date: string;
          device?: string | null;
          id?: string;
          page_url?: string | null;
          position?: number | null;
          position_change?: number | null;
          query?: string | null;
          shows?: number | null;
          shows_change?: number | null;
          site_id: string;
        };
        Update: {
          clicks?: number | null;
          clicks_change?: number | null;
          created_at?: string | null;
          ctr?: number | null;
          ctr_change?: number | null;
          date?: string;
          device?: string | null;
          id?: string;
          page_url?: string | null;
          position?: number | null;
          position_change?: number | null;
          query?: string | null;
          shows?: number | null;
          shows_change?: number | null;
          site_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'yandex_webmaster_search_data_site_id_fkey';
            columns: ['site_id'];
            isOneToOne: false;
            referencedRelation: 'yandex_webmaster_sites';
            referencedColumns: ['id'];
          },
        ];
      };
      yandex_webmaster_sites: {
        Row: {
          auto_sync_enabled: boolean | null;
          created_at: string | null;
          credential_id: string | null;
          host_display_name: string | null;
          host_id: string;
          host_url: string;
          id: string;
          is_primary: boolean | null;
          last_synced_at: string | null;
          sync_error: string | null;
          sync_frequency: string | null;
          sync_status: string | null;
          updated_at: string | null;
          user_id: string;
          verification_state: string | null;
        };
        Insert: {
          auto_sync_enabled?: boolean | null;
          created_at?: string | null;
          credential_id?: string | null;
          host_display_name?: string | null;
          host_id: string;
          host_url: string;
          id?: string;
          is_primary?: boolean | null;
          last_synced_at?: string | null;
          sync_error?: string | null;
          sync_frequency?: string | null;
          sync_status?: string | null;
          updated_at?: string | null;
          user_id: string;
          verification_state?: string | null;
        };
        Update: {
          auto_sync_enabled?: boolean | null;
          created_at?: string | null;
          credential_id?: string | null;
          host_display_name?: string | null;
          host_id?: string;
          host_url?: string;
          id?: string;
          is_primary?: boolean | null;
          last_synced_at?: string | null;
          sync_error?: string | null;
          sync_frequency?: string | null;
          sync_status?: string | null;
          updated_at?: string | null;
          user_id?: string;
          verification_state?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'yandex_webmaster_sites_credential_id_fkey';
            columns: ['credential_id'];
            isOneToOne: false;
            referencedRelation: 'yandex_webmaster_oauth_credentials';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'yandex_webmaster_sites_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      bio_analyzer_funnel: {
        Row: {
          capture_rate: number | null;
          email_captures: number | null;
          paid_conversion_rate: number | null;
          paid_conversions: number | null;
          sequences_completed: number | null;
          sequences_started: number | null;
          total_analyses: number | null;
          trial_conversion_rate: number | null;
          trial_signups: number | null;
        };
        Relationships: [];
      };
      bio_email_performance: {
        Row: {
          click_rate: number | null;
          conversions_to_paid: number | null;
          conversions_to_trial: number | null;
          email_subject: string | null;
          open_rate: number | null;
          sequence_number: number | null;
          total_clicked: number | null;
          total_opened: number | null;
          total_sent: number | null;
        };
        Relationships: [];
      };
      instagram_bio_stats: {
        Row: {
          avg_score: number | null;
          capture_rate: number | null;
          paid_conversions: number | null;
          total_analyses: number | null;
          total_email_captures: number | null;
          trial_conversions: number | null;
          unique_markets: number | null;
        };
        Relationships: [];
      };
      lead_activity_summary: {
        Row: {
          calls_count: number | null;
          emails_count: number | null;
          first_activity_at: string | null;
          last_activity_at: string | null;
          last_call_at: string | null;
          last_email_at: string | null;
          lead_id: string | null;
          meetings_count: number | null;
          notes_count: number | null;
          status_changes_count: number | null;
          total_activities: number | null;
        };
        Relationships: [];
      };
      listing_email_performance: {
        Row: {
          click_rate: number | null;
          clicks: number | null;
          conversion_rate: number | null;
          conversions: number | null;
          email_subject: string | null;
          open_rate: number | null;
          opens: number | null;
          sequence_number: number | null;
          total_sent: number | null;
        };
        Relationships: [];
      };
      listing_generator_funnel: {
        Row: {
          capture_rate: number | null;
          email_captures: number | null;
          paid_conversion_rate: number | null;
          paid_conversions: number | null;
          sequences_completed: number | null;
          sequences_started: number | null;
          total_generations: number | null;
          trial_conversion_rate: number | null;
          trial_signups: number | null;
        };
        Relationships: [];
      };
      listing_generator_stats: {
        Row: {
          capture_rate: number | null;
          paid_conversions: number | null;
          total_email_captures: number | null;
          total_generations: number | null;
          trial_conversions: number | null;
          unique_markets: number | null;
        };
        Relationships: [];
      };
      listing_popular_features: {
        Row: {
          count: number | null;
          feature: string | null;
        };
        Relationships: [];
      };
      listing_property_types: {
        Row: {
          count: number | null;
          percentage: number | null;
          property_type: string | null;
        };
        Relationships: [];
      };
      seo_content_optimization_summary: {
        Row: {
          avg_optimization_score: number | null;
          avg_readability_score: number | null;
          avg_word_count: number | null;
          excellent_pages: number | null;
          fair_pages: number | null;
          good_pages: number | null;
          poor_pages: number | null;
          total_pages: number | null;
        };
        Relationships: [];
      };
      seo_semantic_analysis_summary: {
        Row: {
          avg_authority_score: number | null;
          avg_eat_score: number | null;
          avg_semantic_score: number | null;
          pillar_content_count: number | null;
          topic_clusters: number | null;
          total_pages_analyzed: number | null;
          unique_topics: number | null;
        };
        Relationships: [];
      };
      user_subscription_details: {
        Row: {
          analytics_history_days: number | null;
          cancel_at: string | null;
          canceled_at: string | null;
          created_at: string | null;
          current_links: number | null;
          current_listings: number | null;
          current_period_end: string | null;
          current_period_start: string | null;
          current_testimonials: number | null;
          custom_domain_enabled: boolean | null;
          id: string | null;
          is_subscription_active: boolean | null;
          max_links: number | null;
          max_listings: number | null;
          max_testimonials: number | null;
          plan_name: string | null;
          priority_support: boolean | null;
          remove_branding: boolean | null;
          status: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          trial_end: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      calculate_content_freshness_score: {
        Args: { p_analyzed_at: string };
        Returns: number;
      };
      calculate_next_run_time: {
        Args: { p_cron_expression?: string; p_current_time?: string; p_schedule_type: string };
        Returns: string;
      };
      cancel_account_deletion: {
        Args: { p_cancel_reason?: string; p_user_id: string };
        Returns: boolean;
      };
      check_feature_limit: {
        Args: { _feature_key: string; _user_id: string };
        Returns: Record<string, unknown>[];
      };
      check_login_throttle: {
        Args: {
          p_email: string;
          p_ip_address: string;
          p_max_attempts?: number;
          p_window_minutes?: number;
        };
        Returns: Record<string, unknown>[];
      };
      check_mfa_enabled: { Args: { p_user_id: string }; Returns: boolean };
      check_rate_limit: {
        Args: {
          p_identifier: string;
          p_limit_type: string;
          p_max_requests?: number;
          p_window_seconds?: number;
        };
        Returns: Record<string, unknown>[];
      };
      check_subscription_limit: {
        Args: { _limit_type: string; _user_id: string };
        Returns: boolean;
      };
      check_usage_limit: {
        Args: { _limit: number; _resource_type: string; _user_id: string };
        Returns: boolean;
      };
      check_username_available: {
        Args: { _current_user_id: string; _username: string };
        Returns: boolean;
      };
      cleanup_expired_mfa_codes: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      cleanup_expired_sso_sessions: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      cleanup_query_metrics: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      cleanup_rate_limits: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      cleanup_security_tables: {
        Args: Record<PropertyKey, never>;
        Returns: Record<string, unknown>[];
      };
      complete_workflow_execution: {
        Args: {
          p_error_message?: string;
          p_error_node_id?: string;
          p_execution_id: string;
          p_result?: Json;
          p_status: string;
        };
        Returns: undefined;
      };
      find_duplicate_content: {
        Args: Record<PropertyKey, never>;
        Returns: Record<string, unknown>[];
      };
      find_or_create_sso_user: {
        Args: {
          p_attributes?: Json;
          p_config_id: string;
          p_email: string;
          p_full_name?: string;
          p_groups?: string[];
          p_subject_id: string;
        };
        Returns: string;
      };
      find_sso_config_by_email: { Args: { p_email: string }; Returns: string };
      find_topic_cluster_opportunities: {
        Args: Record<PropertyKey, never>;
        Returns: Record<string, unknown>[];
      };
      generate_encryption_key: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_active_gsc_credential: {
        Args: { p_user_id: string };
        Returns: Record<string, unknown>[];
      };
      get_average_page_score: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      get_connected_search_platforms: {
        Args: { p_user_id: string };
        Returns: Record<string, unknown>[];
      };
      get_content_by_score_range: {
        Args: { max_score?: number; min_score?: number };
        Returns: Record<string, unknown>[];
      };
      get_critical_alerts_count: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      get_encrypted_fields: {
        Args: { p_table_name: string };
        Returns: string[];
      };
      get_failing_cwv_pages: {
        Args: Record<PropertyKey, never>;
        Returns: Record<string, unknown>[];
      };
      get_lead_timeline: {
        Args: { _lead_id: string; _limit?: number; _offset?: number };
        Returns: Record<string, unknown>[];
      };
      get_open_alerts_count: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      get_pages_needing_optimization: {
        Args: Record<PropertyKey, never>;
        Returns: Record<string, unknown>[];
      };
      get_payment_link: {
        Args: { _interval?: string; _plan_name: string };
        Returns: string;
      };
      get_pending_bio_emails: {
        Args: Record<PropertyKey, never>;
        Returns: Record<string, unknown>[];
      };
      get_pending_listing_emails: {
        Args: Record<PropertyKey, never>;
        Returns: Record<string, unknown>[];
      };
      get_scheduled_workflows: {
        Args: { p_limit?: number };
        Returns: Record<string, unknown>[];
      };
      get_stripe_price_id: {
        Args: { _interval?: string; _plan_name: string };
        Returns: string;
      };
      get_system_health_summary: {
        Args: Record<PropertyKey, never>;
        Returns: Record<string, unknown>[];
      };
      get_user_plan: { Args: { _user_id: string }; Returns: Json };
      get_user_sessions: {
        Args: { p_user_id: string };
        Returns: Record<string, unknown>[];
      };
      get_user_statistics: {
        Args: Record<PropertyKey, never>;
        Returns: Record<string, unknown>[];
      };
      get_user_subscription_with_usage: {
        Args: { _user_id: string };
        Returns: Json;
      };
      has_role: {
        Args: { _role: Database['public']['Enums']['app_role']; _user_id: string };
        Returns: boolean;
      };
      increment_link_clicks: { Args: { link_id: string }; Returns: undefined };
      increment_mfa_failed_attempts: {
        Args: { p_user_id: string };
        Returns: number;
      };
      increment_profile_leads: {
        Args: { _profile_id: string };
        Returns: undefined;
      };
      increment_profile_views: {
        Args: { _profile_id: string };
        Returns: undefined;
      };
      is_device_trusted: {
        Args: { p_device_fingerprint: string; p_user_id: string };
        Returns: boolean;
      };
      is_field_encrypted: {
        Args: { p_field_name: string; p_table_name: string };
        Returns: boolean;
      };
      is_gsc_token_expired: {
        Args: { credential_id: string };
        Returns: boolean;
      };
      is_mfa_locked: { Args: { p_user_id: string }; Returns: boolean };
      is_team_admin: {
        Args: { p_team_id: string; p_user_id: string };
        Returns: boolean;
      };
      is_team_member: {
        Args: { p_team_id: string; p_user_id: string };
        Returns: boolean;
      };
      log_admin_action: {
        Args: {
          p_action: string;
          p_admin_id: string;
          p_details?: Json;
          p_ip_address?: string;
          p_target_id?: string;
          p_target_type?: string;
          p_user_agent?: string;
        };
        Returns: string;
      };
      log_audit_event: {
        Args: {
          p_action: string;
          p_actor_id?: string;
          p_details?: Json;
          p_ip_address?: string;
          p_resource_id?: string;
          p_resource_type?: string;
          p_risk_level?: string;
          p_status: string;
          p_user_agent?: string;
          p_user_id: string;
        };
        Returns: string;
      };
      log_automation_execution: {
        Args: {
          p_automation_id: string;
          p_automation_type: string;
          p_details?: Json;
          p_duration_ms?: number;
          p_message?: string;
          p_status: string;
        };
        Returns: string;
      };
      log_encryption_operation: {
        Args: {
          p_error?: string;
          p_fields?: string[];
          p_ip_address?: string;
          p_operation: string;
          p_record_id?: string;
          p_success?: boolean;
          p_table_name: string;
          p_user_agent?: string;
          p_user_id: string;
        };
        Returns: string;
      };
      log_error: {
        Args: {
          p_error_message: string;
          p_error_type: string;
          p_severity?: string;
          p_stack_trace?: string;
          p_user_context?: Json;
          p_user_id: string;
        };
        Returns: string;
      };
      log_lead_activity: {
        Args: {
          _activity_type: string;
          _content?: string;
          _lead_id: string;
          _metadata?: Json;
          _title?: string;
        };
        Returns: string;
      };
      log_lead_call: {
        Args: { _duration_seconds?: number; _lead_id: string; _notes?: string; _outcome: string };
        Returns: string;
      };
      log_lead_email: {
        Args: { _body?: string; _lead_id: string; _recipient: string; _subject: string };
        Returns: string;
      };
      log_lead_status_change: {
        Args: { _lead_id: string; _new_status: string; _note?: string; _previous_status: string };
        Returns: string;
      };
      log_sso_event: {
        Args: {
          p_config_id: string;
          p_details?: Json;
          p_event_type: string;
          p_ip_address?: string;
          p_user_agent?: string;
          p_user_id: string;
        };
        Returns: string;
      };
      log_user_activity: {
        Args: {
          p_activity_data?: Json;
          p_activity_type: string;
          p_page_url?: string;
          p_user_id: string;
        };
        Returns: string;
      };
      process_scheduled_account_deletions: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      queue_seo_notification: {
        Args: {
          p_channels: string[];
          p_data?: Json;
          p_message: string;
          p_notification_type: string;
          p_recipients: string[];
          p_severity: string;
          p_title: string;
        };
        Returns: string;
      };
      record_feature_usage: {
        Args: { _count?: number; _feature_key: string; _metadata?: Json; _user_id: string };
        Returns: boolean;
      };
      record_login_attempt: {
        Args: {
          p_device_fingerprint?: string;
          p_email: string;
          p_failure_reason?: string;
          p_ip_address: string;
          p_success?: boolean;
          p_user_agent?: string;
          p_user_id?: string;
        };
        Returns: string;
      };
      record_system_metric: {
        Args: {
          p_metadata?: Json;
          p_metric_name: string;
          p_metric_type: string;
          p_unit?: string;
          p_value: number;
        };
        Returns: string;
      };
      refresh_unified_analytics: {
        Args: { p_end_date: string; p_start_date: string; p_user_id: string };
        Returns: number;
      };
      request_account_deletion: {
        Args: {
          p_grace_period_days?: number;
          p_ip_address?: string;
          p_reason?: string;
          p_user_agent?: string;
          p_user_id: string;
        };
        Returns: string;
      };
      request_gdpr_data_export: {
        Args: { p_ip_address?: string; p_user_agent?: string; p_user_id: string };
        Returns: string;
      };
      reset_mfa_failed_attempts: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      revoke_all_other_sessions: {
        Args: { p_current_session_id?: string; p_user_id: string };
        Returns: number;
      };
      revoke_user_session: {
        Args: { p_reason?: string; p_session_id: string; p_user_id: string };
        Returns: boolean;
      };
      start_workflow_execution: {
        Args: { p_trigger_data?: Json; p_trigger_type: string; p_workflow_id: string };
        Returns: string;
      };
      top_slow_queries: {
        Args: { p_limit?: number };
        Returns: Record<string, unknown>[];
      };
      update_autofix_rule_stats: {
        Args: { p_rule_id: string; p_success: boolean };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: 'admin' | 'user';
      subscription_status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ['admin', 'user'],
      subscription_status: ['active', 'canceled', 'past_due', 'incomplete', 'trialing'],
    },
  },
} as const;
