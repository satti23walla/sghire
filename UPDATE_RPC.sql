-- Run this in Supabase SQL Editor

-- 1. Add video_visibility column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS video_visibility TEXT DEFAULT 'applications'
  CHECK (video_visibility IN ('public', 'applications', 'private'));

-- 2. Update RPC function to include video_visibility
CREATE OR REPLACE FUNCTION update_my_profile(
  p_full_name TEXT,
  p_headline TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_skills TEXT DEFAULT NULL,
  p_company_name TEXT DEFAULT NULL,
  p_linkedin_url TEXT DEFAULT NULL,
  p_intro_video_url TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL,
  p_video_visibility TEXT DEFAULT 'applications'
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles SET
    full_name = p_full_name,
    headline = p_headline,
    location = p_location,
    skills = p_skills,
    company_name = p_company_name,
    linkedin_url = p_linkedin_url,
    intro_video_url = p_intro_video_url,
    avatar_url = p_avatar_url,
    video_visibility = p_video_visibility
  WHERE id = auth.uid();
END;
$$;
