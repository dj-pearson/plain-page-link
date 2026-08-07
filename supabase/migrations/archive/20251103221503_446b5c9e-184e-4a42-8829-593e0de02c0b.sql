-- Add profile visibility settings to user_settings table
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS show_listings boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_sold_properties boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_testimonials boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_social_proof boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_contact_buttons boolean DEFAULT true;