# SG Hire Insight

Singapore's video-first hiring transparency platform.

## Stack
- **Frontend**: React + Vite
- **Routing**: React Router v6
- **Auth & DB**: Supabase
- **Hosting**: Vercel
- **Video**: Mux (planned)

## Getting started locally

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/sghireinsight.git
cd sghireinsight

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase project

# 4. Run locally
npm run dev
```

Open http://localhost:5173

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to https://vercel.com → New Project → Import from GitHub
3. Add environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
4. Click Deploy — your site is live in ~60 seconds

## Supabase tables needed

```sql
-- Users (handled by Supabase Auth)

-- Candidate profiles
create table profiles (
  id uuid references auth.users primary key,
  full_name text,
  role text,
  experience_years int,
  skills text[],
  video_url text,
  created_at timestamp default now()
);

-- Role insights
create table insights (
  id uuid primary key default gen_random_uuid(),
  role text,
  company text,
  industry text,
  salary_range text,
  work_mode text,
  items text[],
  created_at timestamp default now()
);

-- Referrals
create table referrals (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references profiles(id),
  referred_by text,
  referred_by_role text,
  quote text,
  video_url text,
  created_at timestamp default now()
);
```

## Environment variables

| Variable | Where to find it |
|---|---|
| VITE_SUPABASE_URL | Supabase project → Settings → API |
| VITE_SUPABASE_ANON_KEY | Supabase project → Settings → API |

## Cost at scale

| Stage | Monthly cost |
|---|---|
| 0–500 users | $0 (free tiers) |
| 500–5,000 users | ~$50–80/mo |
| 5,000–50,000 users | ~$200–400/mo |