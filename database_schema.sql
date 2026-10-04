-- Run this in your Supabase SQL Editor
-- This file is safe to re-run.

-- 1. Tasks Table (Kanban board)
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

-- Row Level Security for tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can view all tasks" ON public.tasks FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can insert tasks" ON public.tasks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can update tasks" ON public.tasks FOR UPDATE USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can delete tasks" ON public.tasks FOR DELETE USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Blueprint Ideas Table
CREATE TABLE IF NOT EXISTS public.blueprint_ideas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    tag TEXT NOT NULL DEFAULT 'New',
    tone TEXT NOT NULL DEFAULT 'bg-sky-100/80',
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security for blueprint_ideas
ALTER TABLE public.blueprint_ideas ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can view all ideas" ON public.blueprint_ideas FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can insert ideas" ON public.blueprint_ideas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can update ideas" ON public.blueprint_ideas FOR UPDATE USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can delete ideas" ON public.blueprint_ideas FOR DELETE USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Form Submissions Table (the JSONB-powered backbone of every worksheet in the Forms hub)
-- The `data` column is free-shape JSONB; each form knows how to read/write its own fields.
-- The `form_id` is one of:
--   roles, group-introduction, expert-interview, prototype-specs,
--   marketing-plan, individual-reflection, competences, self-assessment,
--   ai-log, blueprint-canvas
CREATE TABLE IF NOT EXISTS public.form_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    form_id TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'Not started', -- Not started, In progress, Pending approval, Approved, Needs revision, Published
    progress INTEGER NOT NULL DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Helpful index for fetching the latest submission for a given form
CREATE INDEX IF NOT EXISTS form_submissions_form_id_idx ON public.form_submissions(form_id);
CREATE INDEX IF NOT EXISTS form_submissions_status_idx ON public.form_submissions(status);

-- Row Level Security for form_submissions
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can view all forms" ON public.form_submissions FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can insert forms" ON public.form_submissions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can update forms" ON public.form_submissions FOR UPDATE USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can delete forms" ON public.form_submissions FOR DELETE USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;
