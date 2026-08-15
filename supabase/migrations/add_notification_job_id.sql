-- Run in Supabase → SQL Editor.
--
-- Notifications currently have no link to the job they are about, so deleting
-- a role leaves the candidate holding notifications for a job that no longer
-- exists, pointing at dead links.
--
-- ON DELETE CASCADE means Postgres cleans them up automatically whenever the
-- job goes — no application code needed, and it also covers the employer
-- account deletion path.

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS notifications_job_id_idx ON notifications(job_id);
