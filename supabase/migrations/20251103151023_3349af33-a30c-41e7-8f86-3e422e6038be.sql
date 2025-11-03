-- Add 'marketing' to content_type allowed values
ALTER TABLE public.social_media_posts DROP CONSTRAINT social_media_posts_content_type_check;
ALTER TABLE public.social_media_posts ADD CONSTRAINT social_media_posts_content_type_check 
  CHECK (content_type = ANY (ARRAY['property_highlight'::text, 'market_update'::text, 'agent_tip'::text, 'community_spotlight'::text, 'success_story'::text, 'general'::text, 'marketing'::text]));

-- Add 'agent_signup' to subject_type allowed values
ALTER TABLE public.social_media_posts DROP CONSTRAINT social_media_posts_subject_type_check;
ALTER TABLE public.social_media_posts ADD CONSTRAINT social_media_posts_subject_type_check 
  CHECK (subject_type = ANY (ARRAY['listing_of_the_day'::text, 'market_analysis'::text, 'buyer_seller_tip'::text, 'neighborhood_feature'::text, 'testimonial_highlight'::text, 'special_announcement'::text, 'agent_signup'::text]));

-- Add 'multi_platform' to platform_type allowed values
ALTER TABLE public.social_media_posts DROP CONSTRAINT social_media_posts_platform_type_check;
ALTER TABLE public.social_media_posts ADD CONSTRAINT social_media_posts_platform_type_check 
  CHECK (platform_type = ANY (ARRAY['twitter_threads'::text, 'facebook_linkedin'::text, 'instagram'::text, 'combined'::text, 'multi_platform'::text]));