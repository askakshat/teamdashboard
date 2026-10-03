-- Enum types
CREATE TYPE user_role AS ENUM ('leader', 'team_member', 'external_viewer');
CREATE TYPE form_status AS ENUM ('draft', 'pending_approval', 'approved', 'needs_revision', 'published');
CREATE TYPE milestone_type AS ENUM (
    'group_introduction',
    'roles_responsibilities',
    'blueprint',
    'expert_interview',
    'prototype_production',
    'marketing_plan',
    'reflection',
    'self_assessment'
);

-- Users Table (Extends Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    role user_role DEFAULT 'team_member' NOT NULL,
    group_id UUID, -- References groups table
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups Table
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    public_token UUID DEFAULT gen_random_uuid() UNIQUE, -- For external viewing
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key after groups is created
ALTER TABLE users ADD CONSTRAINT fk_group FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;

-- Milestones/Tasks (Kanban) Table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    milestone milestone_type NOT NULL,
    status TEXT DEFAULT 'backlog', -- backlog, in_progress, pending_review, completed
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Base Submissions/Forms Table
CREATE TABLE form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    milestone milestone_type NOT NULL,
    submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status form_status DEFAULT 'draft',
    form_data JSONB NOT NULL DEFAULT '{}'::jsonb, -- Flexible JSON for different forms
    feedback TEXT, -- Leader feedback for revisions
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- 1. Leader has FULL access to everything
CREATE POLICY leader_all_users ON users FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'leader'
);
CREATE POLICY leader_all_groups ON groups FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'leader'
);
CREATE POLICY leader_all_tasks ON tasks FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'leader'
);
CREATE POLICY leader_all_forms ON form_submissions FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'leader'
);

-- 2. Team Members can view users in their group, view their group, and manage tasks/forms in their group
CREATE POLICY member_view_users ON users FOR SELECT USING (
    group_id = (SELECT group_id FROM users WHERE id = auth.uid())
    OR id = auth.uid()
);

CREATE POLICY member_view_group ON groups FOR SELECT USING (
    id = (SELECT group_id FROM users WHERE id = auth.uid())
);

CREATE POLICY member_all_tasks ON tasks FOR ALL USING (
    group_id = (SELECT group_id FROM users WHERE id = auth.uid())
);

CREATE POLICY member_all_forms ON form_submissions FOR ALL USING (
    group_id = (SELECT group_id FROM users WHERE id = auth.uid())
);

-- 3. External Viewer (Public token based access, typically handled in backend queries via token without auth session, or generic public policy)
-- In Supabase, usually public token viewing is done via a server action or edge function with a service role, or a public SELECT policy checking the token.
CREATE POLICY external_view_groups ON groups FOR SELECT USING (true); -- Usually restricted by token in app logic
CREATE POLICY external_view_forms ON form_submissions FOR SELECT USING (
    status = 'published'
);

