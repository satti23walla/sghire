-- Run this in Supabase → SQL Editor BEFORE deploying the mark-job-filled function.

-- 1. Track when a role was filled (and keep is_active = false alongside it)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS filled_at TIMESTAMPTZ;

-- 2. Track that the videos for an application have been purged, so the UI can
--    explain the absence instead of showing a broken player.
ALTER TABLE applications ADD COLUMN IF NOT EXISTS videos_purged_at TIMESTAMPTZ;

-- 3. Allow a 'closed' status so candidates who were never actioned get an
--    honest outcome instead of sitting on 'submitted' forever.
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE applications ADD CONSTRAINT applications_status_check
  CHECK (status IN ('submitted', 'reviewed', 'shortlisted', 'rejected', 'closed'));
