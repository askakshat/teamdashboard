-- ============================================================================
-- EUMIND · Multi-blueprint system with approval workflow
-- ============================================================================
-- Run in Supabase Studio → SQL Editor → New query → Run
-- Idempotent — safe to run multiple times.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.blueprints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'Untitled blueprint',
    problem TEXT,
    audience TEXT,
    differentiator TEXT,
    sketch TEXT,
    first_test TEXT,
    status TEXT NOT NULL DEFAULT 'draft', -- draft, pending_approval, approved, needs_revision
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    submission_note TEXT,
    leader_feedback TEXT,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS blueprints_status_idx ON public.blueprints(status);
CREATE INDEX IF NOT EXISTS blueprints_created_by_idx ON public.blueprints(created_by);
CREATE INDEX IF NOT EXISTS blueprints_created_at_idx ON public.blueprints(created_at DESC);

ALTER TABLE public.blueprints ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Authenticated can view blueprints" ON public.blueprints
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated can create blueprints" ON public.blueprints
    FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated can update blueprints" ON public.blueprints
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated can delete blueprints" ON public.blueprints
    FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Migrate existing canvas data from form_submissions into a blueprint row
INSERT INTO public.blueprints (title, problem, audience, differentiator, sketch, first_test, status, created_by)
SELECT
  'Imported canvas',
  (data->>'problem')::TEXT,
  (data->>'audience')::TEXT,
  (data->>'differentiator')::TEXT,
  (data->>'sketch')::TEXT,
  (data->>'first_test')::TEXT,
  'approved',
  created_by
FROM public.form_submissions
WHERE form_id = 'blueprint-canvas'
  AND data IS NOT NULL
  AND data::TEXT != '{}'
ON CONFLICT DO NOTHING;

-- Verify
SELECT 'blueprints' AS table_name, count(*) AS row_count FROM public.blueprints;
