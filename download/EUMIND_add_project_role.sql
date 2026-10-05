-- ============================================================================
-- EUMIND · Add project_role column to profiles
-- ============================================================================
-- Run in Supabase Studio → SQL Editor → New query → Run
-- Adds a project_role column to store each member's official EUMIND role
-- (Leader, Platform Editor, Photographer & Video Editor, etc.)
-- Idempotent — safe to run multiple times.
-- ============================================================================

-- Add the project_role column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS project_role TEXT;

-- Optional: backfill the existing leader with the "Leader" project role
UPDATE public.profiles
SET project_role = 'Leader'
WHERE role = 'leader' AND project_role IS NULL;

-- Verify
SELECT id, email, first_name, role, project_role FROM public.profiles ORDER BY first_name;
