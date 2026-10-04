# EUMIND · The Green Loop

A collaborative project workspace for **The Creative Entrepreneur 2026–27**. The app brings the official EUMIND milestones, tasks, worksheets, forms, blueprint work and evidence workflow into one private team space.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS + shadcn/ui + Lucide
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
2. Run [`supabase_schema.sql`](./supabase_schema.sql) once for a new database.
3. Run [`supabase/migrations/0001_production_auth.sql`](./supabase/migrations/0001_production_auth.sql) to enable signup profile creation and group-scoped RLS.
4. In Supabase Auth → URL Configuration, add the local and production callback URLs:
   - `http://localhost:3000/auth/callback`
   - `https://YOUR-SITE.netlify.app/auth/callback`
5. Create the team lead account, then set that profile's `role` to `leader` and assign its `group_id`. Add team members through Supabase Auth, then assign their `group_id` in `profiles`.

The application intentionally does not expose public signup. Team members should be invited or created by the project administrator.

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
npm run lint
npm run build
```

Lint currently reports only legacy unused-import warnings in older pages and helpers; the production build completes successfully.
