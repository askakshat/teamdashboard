-- ============================================================================
-- EUMIND · Direct messages + Personal notes (for all users)
-- ============================================================================
-- Run in Supabase Studio → SQL Editor → New query → Run
-- Idempotent — safe to run multiple times.
-- ============================================================================

-- 1. direct_messages — private 1-on-1 DMs between team members
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS dm_sender_idx ON public.direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS dm_recipient_idx ON public.direct_messages(recipient_id);
CREATE INDEX IF NOT EXISTS dm_created_at_idx ON public.direct_messages(created_at DESC);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can view own DMs" ON public.direct_messages
    FOR SELECT TO authenticated
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can send DMs" ON public.direct_messages
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = sender_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Recipients can mark DMs as read" ON public.direct_messages
    FOR UPDATE TO authenticated
    USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Senders can delete own DMs" ON public.direct_messages
    FOR DELETE TO authenticated
    USING (auth.uid() = sender_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. personal_notes — private scratchpad for ALL users (not just leader)
CREATE TABLE IF NOT EXISTS public.personal_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT,
    body TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT 'bg-amber-100/80',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS personal_notes_user_id_idx ON public.personal_notes(user_id);

ALTER TABLE public.personal_notes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can view own notes" ON public.personal_notes
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can insert own notes" ON public.personal_notes
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can update own notes" ON public.personal_notes
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can delete own notes" ON public.personal_notes
    FOR DELETE TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Verify
SELECT 'direct_messages' AS table_name, count(*) AS row_count FROM public.direct_messages
UNION ALL SELECT 'personal_notes', count(*) FROM public.personal_notes;
