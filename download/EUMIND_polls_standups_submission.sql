-- ============================================================================
-- EUMIND · Task submission notes + polls + standups
-- ============================================================================
-- Run in Supabase Studio → SQL Editor → New query → Run
-- Idempotent — safe to run multiple times.
-- ============================================================================

-- 1. Add submission_note column to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS submission_note TEXT;

-- 2. Quick polls — leader creates, members vote
CREATE TABLE IF NOT EXISTS public.polls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    closes_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Authenticated can view polls" ON public.polls FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated can create polls" ON public.polls FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated can delete polls" ON public.polls FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Poll votes — one vote per user per poll
CREATE TABLE IF NOT EXISTS public.poll_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    option_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(poll_id, user_id)
);
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Authenticated can view poll votes" ON public.poll_votes FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can vote" ON public.poll_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can change own vote" ON public.poll_votes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can delete own vote" ON public.poll_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 4. Standup check-ins — daily progress updates
CREATE TABLE IF NOT EXISTS public.standups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    did_yesterday TEXT NOT NULL,
    doing_today TEXT NOT NULL,
    blockers TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS standups_user_id_idx ON public.standups(user_id);
CREATE INDEX IF NOT EXISTS standups_created_at_idx ON public.standups(created_at DESC);
ALTER TABLE public.standups ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Authenticated can view standups" ON public.standups FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can insert own standup" ON public.standups FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can delete own standup" ON public.standups FOR DELETE TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Verify
SELECT 'tasks (with submission_note)' AS name, count(*) FROM public.tasks
UNION ALL SELECT 'polls', count(*) FROM public.polls
UNION ALL SELECT 'poll_votes', count(*) FROM public.poll_votes
UNION ALL SELECT 'standups', count(*) FROM public.standups;
