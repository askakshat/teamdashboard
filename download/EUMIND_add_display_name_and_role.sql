-- ============================================================================
-- EUMIND · Add display_name and project_role columns to profiles
-- ============================================================================
-- Run in Supabase Studio → SQL Editor → New query → Run
-- Idempotent — safe to run multiple times.
-- ============================================================================

-- Add display_name column (preferred display name for the user)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Add project_role column (the official EUMIND role: Leader, Platform Editor, etc.)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS project_role TEXT;

-- Backfill display_name from first_name where it's null
UPDATE public.profiles
SET display_name = first_name
WHERE display_name IS NULL AND first_name IS NOT NULL;

-- Backfill the leader's project_role
UPDATE public.profiles
SET project_role = 'Leader'
WHERE role = 'leader' AND project_role IS NULL;

-- Verify
SELECT id, email, first_name, display_name, role, project_role
FROM public.profiles
ORDER BY first_name;
