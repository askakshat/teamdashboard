---
Task ID: 1
Agent: main
Task: Convert EUMIND team-dashboard prototype into a fully finished, polished product with zero errors. The repo is github.com/askakshat/teamdashboard, deployed at https://stellular-churros-ff0395.netlify.app/tasks.

Work Log:
- Cloned github.com/askakshat/teamdashboard into /home/z/my-project and ran `npm ci`.
- Verified baseline `npm run build` passes after excluding workspace `skills/` directory from tsconfig.
- Audited every page and component; catalogued placeholders, mock data, and bugs.
- Built a centralised `forms-config.ts` with all 9 official EUMIND forms + 10 milestones + 10 default seed tasks.
- Built a reusable `<ToastProvider>` for in-app notifications (no new dependencies).
- Built a `useFormSubmission` hook that backs every form via the `form_submissions` table (JSONB `data` column) with debounced autosave, manual save, and submit-for-review.
- Built all 9 form components (`roles-form`, `group-introduction-form`, `expert-interview-form`, `prototype-specs-form`, `marketing-plan-form`, `individual-reflection-form`, `competences-form`, `self-assessment-form`, `ai-log-form`) with real validation, word-count counters, star ratings, and the competences worksheet's tick-10-from-3-categories + group-top-5 logic.
- Replaced the placeholder `/forms/[id]` page with a dynamic dispatcher that renders the right form component per ID, with a styled 404 for unknown IDs.
- Made the Blueprint canvas autosave its 5 textareas to Supabase; the idea scratchpad still works as before but with toast feedback.
- Rebuilt the Overview page from a static placeholder into a live dashboard: 4 stat cards, project-journey timeline (M1–M7), next-actions list, recent-activity feed (tasks + form submissions + ideas + manual updates), guardrails panel, and an inline team-update composer.
- Rebuilt the Approval Queue from mock data into a real Supabase-driven queue that reads `form_submissions` where status = 'Pending approval', with approve / request-revision actions, per-form summary cards, and required-feedback validation. (Also fixed the existing typo bug `YouYou&apos;reapos;re`.)
- Upgraded the Tasks Kanban: inline title editing, owner assignment via select, priority picker, milestone picker using the official EUMIND milestones, toast feedback on every action, and a "Seed 10 EUMIND milestone tasks" prompt when the board is empty.
- Refactored the dashboard layout to fetch live counts (open tasks, pending approvals, collaborators) and pass them to the sidebars. Fixed an RSC-boundary bug by moving icon-using navigation items into the Client Components (Next.js 16 forbids passing Lucide component references from Server Components).
- Updated eslint.config.mjs to ignore workspace directories (skills/, scripts/, download/, upload/) so user-project lint is clean.
- Updated `database_schema.sql` to be safely re-runnable with `DO $$ ... EXCEPTION WHEN duplicate_object` blocks, and added helpful indices on `form_submissions(form_id, status)`.
- Rewrote README.md to document every feature, the Supabase setup, the new `form_submissions` schema, and the architecture.
- Verified: `npm run lint` → 0 errors / 0 warnings. `npm run build` → compiles cleanly. All 13 routes return HTTP 200 in dev.

Stage Summary:
- 9 new files created under src/components/forms/ and src/lib/
- 16 existing files modified
- ~2000 lines of code added/changed
- Every page now uses real Supabase data instead of placeholders or mock data
- The user's existing `form_submissions`, `tasks`, and `blueprint_ideas` tables are reused as-is — no schema migration needed beyond running the updated `database_schema.sql` if they want the new indices
- Build is production-ready; user can `git push` to deploy on Netlify
