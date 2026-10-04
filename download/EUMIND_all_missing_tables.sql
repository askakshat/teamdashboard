-- ============================================================================
-- EUMIND · The Green Loop — Complete missing tables setup
-- ============================================================================
-- Run this ENTIRE script in Supabase Studio → SQL Editor → New query → Run
--
-- This creates ALL missing tables the app needs:
--   1. task_comments      — collaboration on task cards
--   2. announcements      — leader-pinned team messages
--   3. notifications      — per-user notification feed
--   4. private_notes      — leader-only sticky notes
--   5. team_chat          — team chatbox on the Overview page
-- And adds review-workflow columns to the tasks table.
--
-- IDEMPOTENT — safe to run multiple times.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Add review-workflow columns to tasks (if missing)
-- ----------------------------------------------------------------------------
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS submitted_for_review_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS submitted_for_review_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS rejection_feedback TEXT;

-- ----------------------------------------------------------------------------
-- 1. task_comments — collaboration on any task card
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS task_comments_task_id_idx ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS task_comments_created_at_idx ON public.task_comments(created_at DESC);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Authenticated can view task comments" ON public.task_comments FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated can insert task comments" ON public.task_comments FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated can delete own task comments" ON public.task_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 2. announcements — leader pins, members see on overview
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    pinned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_pinned BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS announcements_is_pinned_idx ON public.announcements(is_pinned);
CREATE INDEX IF NOT EXISTS announcements_created_at_idx ON public.announcements(created_at DESC);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Authenticated can view announcements" ON public.announcements FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated can insert announcements" ON public.announcements FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated can update announcements" ON public.announcements FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated can delete announcements" ON public.announcements FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 3. notifications — per-user notification feed (RLS: only own)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    link TEXT,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON public.notifications(read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can insert own notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Allow anyone authenticated to insert notifications FOR OTHER USERS
-- (needed so member A can notify member B when assigning a task)
-- We drop the restrictive insert policy and add a permissive one
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DO $$ BEGIN
  CREATE POLICY "Authenticated can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 4. private_notes — leader-only sticky notes (RLS: only own)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.private_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    leader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT,
    body TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT 'bg-amber-100/80',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS private_notes_leader_id_idx ON public.private_notes(leader_id);

ALTER TABLE public.private_notes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Leaders can view own notes" ON public.private_notes FOR SELECT TO authenticated USING (auth.uid() = leader_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Leaders can insert own notes" ON public.private_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = leader_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Leaders can update own notes" ON public.private_notes FOR UPDATE TO authenticated USING (auth.uid() = leader_id) WITH CHECK (auth.uid() = leader_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Leaders can delete own notes" ON public.private_notes FOR DELETE TO authenticated USING (auth.uid() = leader_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 5. team_chat — team chatbox on the Overview page
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.team_chat (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS team_chat_created_at_idx ON public.team_chat(created_at DESC);

ALTER TABLE public.team_chat ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Authenticated can view team chat" ON public.team_chat FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated can insert team chat" ON public.team_chat FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can delete own chat messages" ON public.team_chat FOR DELETE TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ----------------------------------------------------------------------------
-- DONE — verify everything was created
-- ----------------------------------------------------------------------------
SELECT 'tasks (with new cols)' AS table_name, count(*) AS row_count FROM public.tasks
UNION ALL SELECT 'task_comments', count(*) FROM public.task_comments
UNION ALL SELECT 'announcements', count(*) FROM public.announcements
UNION ALL SELECT 'notifications', count(*) FROM public.notifications
UNION ALL SELECT 'private_notes', count(*) FROM public.private_notes
UNION ALL SELECT 'team_chat', count(*) FROM public.team_chat;
-- Expected: 6 rows. task_comments/announcements/notifications/private_notes/team_chat
-- should all show 0 (empty). tasks will show your existing count.
