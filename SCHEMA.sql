-- ================================================================
-- HIRERIGHT SG — SUPABASE SCHEMA
-- Run this in: Supabase → SQL Editor → New Query
-- ================================================================

-- STEP 1: Create tables
-- ================================================================

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT CHECK (role IN ('candidate', 'employer')) NOT NULL,
  full_name TEXT,
  email TEXT,
  company_name TEXT,
  headline TEXT,
  skills TEXT,
  location TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  company_name TEXT,
  description TEXT,
  requirements TEXT,
  location TEXT,
  job_type TEXT CHECK (job_type IN ('full-time', 'part-time', 'contract', 'internship')),
  is_active BOOLEAN DEFAULT TRUE,
  video_question TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  candidate_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('submitted', 'reviewed', 'shortlisted', 'rejected')) DEFAULT 'submitted',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, candidate_id)
);

CREATE TABLE video_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('introduction', 'job_response')) NOT NULL,
  video_url TEXT,
  duration_seconds INT,
  transcript TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  candidate_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  project_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- STEP 2: Enable Row Level Security
-- ================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;


-- STEP 3: RLS Policies
-- ================================================================

-- PROFILES
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Employers can view candidate profiles via applications"
  ON profiles FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM applications
      JOIN jobs ON jobs.id = applications.job_id
      WHERE applications.candidate_id = profiles.id
      AND jobs.employer_id = auth.uid()
    )
  );

-- JOBS
CREATE POLICY "Anyone can view active jobs"
  ON jobs FOR SELECT USING (is_active = true);

CREATE POLICY "Employers can manage own jobs"
  ON jobs FOR ALL USING (auth.uid() = employer_id);

-- APPLICATIONS
CREATE POLICY "Candidates can view own applications"
  ON applications FOR SELECT USING (auth.uid() = candidate_id);

CREATE POLICY "Candidates can submit applications"
  ON applications FOR INSERT WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Employers can view applications for their jobs"
  ON applications FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = applications.job_id
      AND jobs.employer_id = auth.uid()
    )
  );

CREATE POLICY "Employers can update application status"
  ON applications FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = applications.job_id
      AND jobs.employer_id = auth.uid()
    )
  );

-- VIDEO RESPONSES
CREATE POLICY "Candidates can manage own video responses"
  ON video_responses FOR ALL USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = video_responses.application_id
      AND applications.candidate_id = auth.uid()
    )
  );

CREATE POLICY "Employers can view video responses for their jobs"
  ON video_responses FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM applications
      JOIN jobs ON jobs.id = applications.job_id
      WHERE applications.id = video_responses.application_id
      AND jobs.employer_id = auth.uid()
    )
  );

-- PROJECTS
CREATE POLICY "Candidates can manage own projects"
  ON projects FOR ALL USING (auth.uid() = candidate_id);

CREATE POLICY "Employers can view projects for their jobs"
  ON projects FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM applications
      JOIN jobs ON jobs.id = applications.job_id
      WHERE applications.id = projects.application_id
      AND jobs.employer_id = auth.uid()
    )
  );
