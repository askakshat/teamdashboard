# EUMIND Creative Entrepreneur - Next.js App Router Structure

```text
eumind-app/
├── app/
│   ├── (auth)/                  # Auth routes (grouped)
│   │   ├── login/
│   │   │   └── page.tsx         # Login page
│   │   └── layout.tsx           # Auth layout (minimal)
│   ├── (dashboard)/             # Protected dashboard routes
│   │   ├── layout.tsx           # Sidebar, header, RBAC logic context
│   │   ├── overview/            # Executive Dashboard (KPIs, badges)
│   │   │   └── page.tsx
│   │   ├── tasks/               # Kanban & List view
│   │   │   └── page.tsx
│   │   ├── blueprint/           # Ideation Studio & Blueprint questions
│   │   │   └── page.tsx
│   │   ├── forms/               # Official Forms Hub
│   │   │   ├── page.tsx         # Form list
│   │   │   ├── [formId]/        # Individual form views/editors (autosave)
│   │   │   │   └── page.tsx
│   │   ├── rules/               # Project Rules & Compliance Center
│   │   │   └── page.tsx
│   │   └── admin/               # Leader-only routes
│   │       ├── approval-queue/  # Approval & Review Pipeline
│   │       │   └── page.tsx
│   │       └── users/           # User management (Leader only)
│   │           └── page.tsx
│   ├── public/                  # Public/External Viewer routes
│   │   ├── [groupToken]/        # View-only presentation layout
│   │   │   └── page.tsx
│   ├── api/                     # API Routes (if needed, though Server Actions preferred)
│   ├── layout.tsx               # Root layout (fonts, providers)
│   └── page.tsx                 # Landing page / redirection
├── components/                  # Reusable UI Components
│   ├── ui/                      # shadcn/ui components (buttons, cards, inputs, etc.)
│   ├── dashboard/               # Dashboard specific widgets (KPI cards, Clock)
│   ├── forms/                   # Form inputs, autosave wrappers, Zod hooked forms
│   ├── kanban/                  # Drag and drop board components
│   └── admin/                   # Admin components (LeaderApprovalQueue)
├── lib/                         # Utilities and Configuration
│   ├── supabase/                # Supabase client initialization
│   │   ├── client.ts            # Browser client
│   │   ├── server.ts            # Server client
│   │   └── middleware.ts        # Supabase middleware helper
│   ├── utils.ts                 # Tailwind merge, formatting utils
│   ├── types.ts                 # TypeScript interfaces and types
│   └── schemas/                 # Zod validation schemas for forms
├── actions/                     # Next.js Server Actions (Database mutations)
│   ├── auth.ts                  # Login/logout actions
│   ├── forms.ts                 # Form submission and saving actions
│   ├── tasks.ts                 # Task moving actions
│   └── admin.ts                 # Approval/rejection actions
├── middleware.ts                # Next.js Middleware (Route protection & RBAC)
├── tailwind.config.ts           # Tailwind configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies
```
