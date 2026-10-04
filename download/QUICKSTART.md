# EUMIND · The Green Loop — Quick Start

Your team dashboard is built, tested, and ready to deploy. Here's how to get it running.

## 1. Install dependencies

```bash
npm ci
```

## 2. Set up your environment

```bash
cp .env.example .env.local
```

Then edit `.env.local` and paste your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://zkiiynpilvyycwjnjqsc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_buRWByLYxXG9V07LRR6C-w_GUpNceGX
```

## 3. Run the missing-tables SQL (one time only)

Open **`download/EUMIND_missing_tables.sql`** in any text editor, copy the whole file, then:

- Go to **Supabase Studio → SQL Editor → New query**
- Paste the SQL
- Click **Run**

This creates the 3 tables the app needs that aren't in your database yet:
`tasks`, `blueprint_ideas`, `form_submissions`.

## 4. Run the app locally

```bash
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`. Sign in with any of your team accounts (Akshat is the leader; the others are team members):

| Email | Role |
|---|---|
| akshat@eumind.com | Leader |
| ananya@eumind.com | Member |
| ishaan@eumind.com | Member |
| medha@eumind.com | Member |

## 5. Deploy to Netlify

The repo already has `netlify.toml`. Just push to GitHub and link the repo to Netlify, then add these env vars in **Netlify → Site settings → Environment variables**:

```
NEXT_PUBLIC_SUPABASE_URL=https://zkiiynpilvyycwjnjqsc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_buRWByLYxXG9V07LRR6C-w_GUpNceGX
```

Also add your Netlify URL to Supabase's allowed redirects:
**Supabase → Authentication → URL Configuration → Site URL & Redirect URLs**
- `https://stellular-churros-ff0395.netlify.app/auth/callback`

## 6. Disable public signup (security)

In **Supabase Studio → Authentication → Sign In / Providers → Email**:
- Toggle **OFF** "Allow new users to sign up"
- Click **Save**

## What's in this project

- **`/overview`** — Live dashboard with project progress, milestone journey, activity feed
- **`/tasks`** — Drag-and-drop Kanban (To do · In progress · Needs review · Completed), inline editing, owner/priority/milestone pickers
- **`/blueprint`** — Rough canvas (autosaves) + idea scratchpad with sticky notes
- **`/forms`** — Hub for all 9 official EUMIND worksheets (roles, group-intro, expert-interview, prototype-specs, marketing-plan, individual-reflection, competences, self-assessment, ai-log)
- **`/forms/[id]`** — Real working editor for each form, with autosave, validation, word counters, and submit-for-review
- **`/admin/approval-queue`** — Leader-only page to approve or request revisions on submitted forms
- **`/rules`** — Privacy, media, and incognito-view guardrails

## Verification

```bash
npm run lint   # 0 errors, 0 warnings
npm run build  # compiles cleanly
```

## Files included in this zip

| Path | Purpose |
|---|---|
| `src/` | All application source code |
| `public/` | Static assets |
| `supabase/` | Database migrations |
| `supabase_schema.sql` | Original schema (you've already run this) |
| `database_schema.sql` | Updated version with the 3 new tables |
| `download/EUMIND_missing_tables.sql` | **Run this in Supabase SQL Editor** |
| `download/EUMIND_complete_setup.sql` | Full setup (only needed for fresh databases) |
| `.env.example` | Template for env vars |
| `README.md` | Full architecture docs |
| `worklog.md` | What changed from the original prototype |
| `netlify.toml` | Netlify build config |
| `package.json` + `package-lock.json` | Dependencies |

## Need help?

If anything breaks, the most common issues are:
1. **Forgot to run the SQL** — see step 3 above
2. **Forgot the env vars on Netlify** — see step 5
3. **Public signup still on** — see step 6

Enjoy your team workspace!
