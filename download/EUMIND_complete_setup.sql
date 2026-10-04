-- ============================================================================
-- EUMIND · The Green Loop — Complete database setup
-- ============================================================================
-- Run this ENTIRE script in your Supabase dashboard:
--   Supabase Studio → SQL Editor → New query → paste → Run
--
-- This script is IDEMPOTENT — safe to run multiple times.
-- It will:
--   1. Create the `groups` and `profiles` tables (if missing)
--   2. Create the operational tables: `tasks`, `blueprint_ideas`, `form_submissions`
--   3. Create the per-form tables (for the official EUMIND schema)
--   4. Enable Row Level Security with permissive policies for authenticated users
--   5. Create a trigger that auto-creates a profile row when a new auth user signs up
--   6. Create a `groups` row for your team (so you can assign members to it)
--
-- After running this:
--   1. Disable public signup in Supabase Auth → Settings → "Allow new users to sign up"
--   2. Create your team lead user in Supabase Auth → Users → "Add user"
--   3. Run the UPDATE statement at the bottom to make that user a leader
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Types
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('leader', 'team_member', 'external_viewer');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE form_status AS ENUM ('draft', 'pending_approval', 'approved', 'needs_revision', 'published');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('backlog', 'in_progress', 'pending_review', 'completed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 2. Groups
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can view all groups" ON public.groups FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated can insert groups" ON public.groups FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated can update groups" ON public.groups FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated can delete groups" ON public.groups FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 3. Profiles
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT,
    role user_role DEFAULT 'team_member' NOT NULL,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can update profiles" ON public.profiles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Auto-create a profile row when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  insert into public.profiles (id, email, first_name, role, group_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', split_part(coalesce(new.email, 'Member'), '@', 1)),
    'team_member',
    nullif(new.raw_user_meta_data->>'group_id', '')::uuid
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper functions for RLS (group membership + leader check)
CREATE OR REPLACE FUNCTION public.current_user_group_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  select group_id from public.profiles where id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_leader()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  select coalesce((select role = 'leader' from public.profiles where id = auth.uid()), false);
$$;

-- ----------------------------------------------------------------------------
-- 4. Tasks (Kanban board) — used by /tasks page
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'todo', -- todo, in_progress, review, done
    milestone INTEGER NOT NULL DEFAULT 1,
    due_date TEXT,
    priority TEXT NOT NULL DEFAULT 'Medium', -- Low, Medium, High
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can view all tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can insert tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can update tasks" ON public.tasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can delete tasks" ON public.tasks FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 5. Blueprint ideas (sticky-note scratchpad) — used by /blueprint page
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blueprint_ideas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    tag TEXT NOT NULL DEFAULT 'New',
    tone TEXT NOT NULL DEFAULT 'bg-sky-100/80',
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.blueprint_ideas ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can view all ideas" ON public.blueprint_ideas FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can insert ideas" ON public.blueprint_ideas FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can update ideas" ON public.blueprint_ideas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can delete ideas" ON public.blueprint_ideas FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 6. Form submissions — the JSONB-powered backbone of every worksheet
--    form_id values used by the app:
--      roles, group-introduction, expert-interview, prototype-specs,
--      marketing-plan, individual-reflection, competences, self-assessment,
--      ai-log, blueprint-canvas
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.form_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    form_id TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'Not started',
    progress INTEGER NOT NULL DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS form_submissions_form_id_idx ON public.form_submissions(form_id);
CREATE INDEX IF NOT EXISTS form_submissions_status_idx ON public.form_submissions(status);
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can view all form submissions" ON public.form_submissions FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can insert form submissions" ON public.form_submissions FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can update form submissions" ON public.form_submissions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can delete form submissions" ON public.form_submissions FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 7. Official EUMIND per-form tables (matches supabase_schema.sql)
--    These are NOT strictly required by the app today (everything uses
--    form_submissions), but they're here for completeness if you want to
--    migrate to structured per-form tables later.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status task_status DEFAULT 'backlog',
    milestone_number INTEGER NOT NULL,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    due_date DATE,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can view milestones" ON public.milestones FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can insert milestones" ON public.milestones FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can update milestones" ON public.milestones FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can delete milestones" ON public.milestones FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 8. Create your team's group — replace the name with your team's name
-- ----------------------------------------------------------------------------
INSERT INTO public.groups (name)
SELECT 'The Green Loop'
WHERE NOT EXISTS (SELECT 1 FROM public.groups WHERE name = 'The Green Loop');

-- ----------------------------------------------------------------------------
-- 9. AFTER RUNNING THIS SCRIPT:
-- ----------------------------------------------------------------------------
-- A. Disable public signup:
--    Supabase Dashboard → Authentication → Sign In / Providers → Email
--    Turn OFF "Allow new users to sign up"
--    (This stops random people from creating accounts on your workspace.)
--
-- B. Delete the test user that was just created:
--    Supabase Dashboard → Authentication → Users
--    Find user with email "test_eumind_probe@example.com" → Delete
--
-- C. Create your team lead:
--    Supabase Dashboard → Authentication → Users → "Add user"
--    Email: your-leader@email.com
--    Password: (set a strong one)
--    After they sign in once, the trigger will auto-create their profile
--    with role='team_member'. To make them the leader, run:
--
--      UPDATE public.profiles
--      SET role = 'leader',
--          group_id = (SELECT id FROM public.groups WHERE name = 'The Green Loop')
--      WHERE email = 'your-leader@email.com';
--
-- D. Add team members:
--    Supabase Dashboard → Authentication → Users → "Add user"
--    After each one signs in, their profile auto-creates.
--    Then assign them to the group:
--
--      UPDATE public.profiles
--      SET group_id = (SELECT id FROM public.groups WHERE name = 'The Green Loop')
--      WHERE email IN ('member1@...', 'member2@...');
--
-- E. Add the same env vars to Netlify:
--    NEXT_PUBLIC_SUPABASE_URL=https://zkiiynpilvyycwjnjqsc.supabase.co
--    NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_buRWByLYxXG9V07LRR6C-w_GUpNceGX
--
-- F. In Supabase Auth → URL Configuration, add your site URL to allowed redirects:
--    https://stellular-churros-ff0395.netlify.app/auth/callback
-- ============================================================================