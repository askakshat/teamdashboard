# EUMIND · The Green Loop

A collaborative project workspace for **The Creative Entrepreneur 2026–27**. The app brings the official EUMIND milestones, tasks, worksheets, forms, blueprint work and evidence workflow into one private team space.

## What's inside

- **Overview** — Live project dashboard with task progress, milestone journey, recent activity feed, and quick team-update box. All numbers come from real Supabase data.
- **Tasks & milestones** — A drag-and-drop Kanban board (To do · In progress · Needs review · Completed) with inline title editing, owner assignment, priority, milestone tagging, search/filter, and a one-click "Seed 10 EUMIND milestone tasks" starter.
- **Blueprint studio** — A rough canvas (problem, audience, differentiator, sketch, first test) that autosaves to Supabase, plus an idea scratchpad with sticky notes.
- **Forms hub** — The 9 official EUMIND worksheets, each with a real working editor:
  - **Roles & Responsibilities** — Editable role table, defaults for all 8 official roles
  - **Group Introduction & Platform** — Privacy guardrails, member hobbies/ambitions
  - **Local Expert Interview** — Logistics, questions, video URL, 300-word insights summary with live word count
  - **Prototype Specs & Quality** — Full product description + 7-criteria star ratings + reflection
  - **Marketing Plan · 7 Ps** — Strategy write-up (200–300w) + 7 Ps breakdown + asset links
  - **Individual Reflection** — 5 reflection prompts with combined 200-word minimum counter
  - **Competences Worksheet** — All 21 competences, individual (10 picks, 3+ categories) + group top-5 with validation
  - **Self-Assessment Rubric** — Full 100-point rubric with yes/no, scoring, and auto-totals
  - **AI Use Log (bonus)** — Per-prompt log entries with tool, prompt, response, adaptation, fact-check source
- **Approval queue** (leader only) — Real pending submissions from `form_submissions` with approve / request-revision actions and per-form summaries.
- **Project rules** — Privacy, media, and incognito-view guardrails.

Every form autosaves to Supabase, tracks progress %, has a "Save draft" + "Submit for review" workflow, and surfaces status (Not started → In progress → Pending approval → Approved / Needs revision) across the hub, editor, and approval queue.

## Stack

- Next.js 16 App Router + TypeScript + Turbopack
- Tailwind CSS v4 + shadcn/ui (Base UI) + Lucide
- Supabase Auth + PostgreSQL + RLS
- Netlify with the Next.js runtime plugin

## Local development

```bash
npm ci
cp .env.example .env.local
# Fill in the Supabase URL and anon key in .env.local
npm run dev
```

Open `http://localhost:3000`. Unauthenticated visitors are sent to `/login`.

## Supabase setup

1. Create a Supabase project.
2. Run [`supabase_schema.sql`](./supabase_schema.sql) once for a new database (creates `groups`, `profiles`, `milestones`, plus all the per-form tables).
3. Run [`database_schema.sql`](./database_schema.sql) to add the operational tables the app actually uses today: `tasks`, `blueprint_ideas`, and `form_submissions` (the JSONB-powered table that backs every worksheet in the Forms hub).
4. Run [`supabase/migrations/0001_production_auth.sql`](./supabase/migrations/0001_production_auth.sql) to enable signup profile creation and group-scoped RLS.
5. In Supabase Auth → URL Configuration, add the local and production callback URLs:
   - `http://localhost:3000/auth/callback`
   - `https://YOUR-SITE.netlify.app/auth/callback`
6. Create the team lead account, then set that profile's `role` to `leader` and assign its `group_id`. Add team members through Supabase Auth, then assign their `group_id` in `profiles`.

The application intentionally does not expose public signup. Team members should be invited or created by the project administrator.

### `form_submissions` schema (used by every worksheet)

| column       | type      | notes                                              |
| ------------ | --------- | -------------------------------------------------- |
| `id`         | uuid (pk) | auto-generated                                     |
| `form_id`    | text      | one of: `roles`, `group-introduction`, `expert-interview`, `prototype-specs`, `marketing-plan`, `individual-reflection`, `competences`, `self-assessment`, `ai-log`, `blueprint-canvas` |
| `data`       | jsonb     | the structured content of the form (free shape)    |
| `status`     | text      | `Not started` / `In progress` / `Pending approval` / `Approved` / `Needs revision` / `Published` |
| `progress`   | int       | 0–100, computed by each form's `computeProgress`   |
| `created_by` | uuid      | references `profiles.id`                           |
| `updated_at` | timestamptz | auto-managed                                      |

The Approval Queue reads any row where `status = 'Pending approval'`. Approving sets `status = 'Approved'`; requesting a revision sets `status = 'Needs revision'` and attaches `_leader_feedback` inside `data`.

## Netlify deployment

The repository includes [`netlify.toml`](./netlify.toml). Link the repository to a Netlify site using the `main` branch or the feature branch you are reviewing, then add these environment variables in Netlify:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Netlify should use:

- Build command: `npm run build`
- Publish directory: `.next`
- Plugin: `@netlify/plugin-nextjs`

## Verification

```bash
npm run lint   # 0 errors, 0 warnings
npm run build  # compiles cleanly with Turbopack
```

## Architecture notes

- **All forms share one hook** (`src/lib/use-form-submission.ts`) and one Supabase table (`form_submissions`). Adding a new form is two steps: add a config entry in `src/lib/forms-config.ts` and a component in `src/components/forms/`.
- **All forms share one footer** (`src/components/forms/form-footer.tsx`) that shows status, progress, autosave indicator, Save draft, and Submit for review buttons.
- **The Overview page** is a single Supabase read per render — no client-side polling. The dashboard layout also does three small `count` queries for the sidebar badges.
- **Toast notifications** are provided by a custom `<ToastProvider>` (no extra dependencies) wired into the root layout.
- **Privacy is enforced by UI copy and validation**, not just by the database — every public-facing field reminds students to use first names only.
