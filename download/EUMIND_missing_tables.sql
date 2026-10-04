-- ============================================================================
-- EUMIND · The Green Loop — Add the 3 missing operational tables
-- ============================================================================
-- Your database already has `profiles` and `groups` set up correctly.
-- This script adds ONLY the 3 tables the app needs that are missing:
--   1. tasks                — used by the /tasks Kanban board
--   2. blueprint_ideas      — used by the /blueprint idea scratchpad
--   3. form_submissions     — used by every worksheet in the /forms hub
--
-- RUN THIS IN: Supabase Studio → SQL Editor → New query → paste → Run
-- It is idempotent — safe to run multiple times.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. tasks — Kanban board
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'todo',  -- todo, in_progress, review, done
    milestone INTEGER NOT NULL DEFAULT 1,
    due_date TEXT,
    priority TEXT NOT NULL DEFAULT 'Medium',  -- Low, Medium, High
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view all tasks" ON public.tasks
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert tasks" ON public.tasks
    FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update tasks" ON public.tasks
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete tasks" ON public.tasks
    FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 2. blueprint_ideas — sticky-note scratchpad on the Blueprint page
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
  CREATE POLICY "Users can view all ideas" ON public.blueprint_ideas
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert ideas" ON public.blueprint_ideas
    FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update ideas" ON public.blueprint_ideas
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete ideas" ON public.blueprint_ideas
    FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 3. form_submissions — JSONB backbone for every worksheet in the Forms hub
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

CREATE INDEX IF NOT EXISTS form_submissions_form_id_idx
  ON public.form_submissions(form_id);
CREATE INDEX IF NOT EXISTS form_submissions_status_idx
  ON public.form_submissions(status);

ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view all form submissions" ON public.form_submissions
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert form submissions" ON public.form_submissions
    FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update form submissions" ON public.form_submissions
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete form submissions" ON public.form_submissions
    FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ----------------------------------------------------------------------------
-- DONE. After running this, your dashboard will be fully functional.
-- ----------------------------------------------------------------------------
-- To verify, run this query at the bottom of the script:
SELECT 'tasks' AS table_name, count(*) AS row_count FROM public.tasks
UNION ALL
SELECT 'blueprint_ideas', count(*) FROM public.blueprint_ideas
UNION ALL
SELECT 'form_submissions', count(*) FROM public.form_submissions;
-- Expected: 3 rows, all with row_count = 0 (since these are new tables)
