-- ============================================================================
-- EUMIND · Task assignees (multi-assign) + notification helpers
-- ============================================================================
-- Run in Supabase Studio → SQL Editor → New query → Run
-- Idempotent — safe to run multiple times.
-- ============================================================================

-- 1. task_assignees — junction table for multi-person task assignment
CREATE TABLE IF NOT EXISTS public.task_assignees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(task_id, user_id)
);
CREATE INDEX IF NOT EXISTS task_assignees_task_id_idx ON public.task_assignees(task_id);
CREATE INDEX IF NOT EXISTS task_assignees_user_id_idx ON public.task_assignees(user_id);

ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Authenticated can view task assignees" ON public.task_assignees
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated can insert task assignees" ON public.task_assignees
    FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated can delete task assignees" ON public.task_assignees
    FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Backfill: migrate existing owner_id values into task_assignees
INSERT INTO public.task_assignees (task_id, user_id)
SELECT t.id, t.owner_id
FROM public.tasks t
WHERE t.owner_id IS NOT NULL
ON CONFLICT (task_id, user_id) DO NOTHING;

-- 3. Allow anyone to insert notifications (already done in previous SQL,
--    but re-apply in case it was missed)
DO $$ BEGIN
  CREATE POLICY "Authenticated can insert notifications" ON public.notifications
    FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Verify
SELECT 'task_assignees' AS table_name, count(*) AS row_count FROM public.task_assignees;
