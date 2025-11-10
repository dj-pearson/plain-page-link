-- Migration: Add Calendly Integration
-- Description: Adds calendly_url field to profiles table for calendar booking integration
-- Created: 2025-11-10

-- Add calendly_url to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS calendly_url TEXT;

-- Add comment
COMMENT ON COLUMN profiles.calendly_url IS 'Calendly booking URL for showing appointments';

-- Example: https://calendly.com/johndoe/30min or https://calendly.com/johndoe/property-showing
