-- Drop existing tables to recreate
DROP TABLE IF EXISTS "public"."ai_logs";
DROP TABLE IF EXISTS "public"."competences";
DROP TABLE IF EXISTS "public"."individual_reflections";
DROP TABLE IF EXISTS "public"."marketing_plans";
DROP TABLE IF EXISTS "public"."prototype_specs";
DROP TABLE IF EXISTS "public"."expert_interviews";
DROP TABLE IF EXISTS "public"."roles_responsibilities";
DROP TABLE IF EXISTS "public"."blueprint";
DROP TABLE IF EXISTS "public"."milestones";
DROP TABLE IF EXISTS "public"."profiles";
DROP TABLE IF EXISTS "public"."groups";

-- Create Groups Table (Even if there's only 1 group for now, good practice)
CREATE TABLE "public"."groups" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enum types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('leader', 'team_member', 'external_viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE form_status AS ENUM ('draft', 'pending_approval', 'approved', 'needs_revision', 'published');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('backlog', 'in_progress', 'pending_review', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Profiles Table
CREATE TABLE "public"."profiles" (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT,
    role user_role DEFAULT 'team_member' NOT NULL,
    group_id UUID REFERENCES "public"."groups"(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Milestones / Tasks (Kanban)
CREATE TABLE "public"."milestones" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status task_status DEFAULT 'backlog',
    milestone_number INTEGER NOT NULL,
    assigned_to UUID REFERENCES "public"."profiles"(id) ON DELETE SET NULL,
    due_date DATE,
    group_id UUID REFERENCES "public"."groups"(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1. Group Intro handled via standard file uploads/text (could be a generic form, skipping for now as it's just media/text on dashboard)

-- 2. Roles & Responsibilities
CREATE TABLE "public"."roles_responsibilities" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES "public"."groups"(id) ON DELETE CASCADE,
    submitted_by UUID REFERENCES "public"."profiles"(id),
    status form_status DEFAULT 'draft',
    data JSONB, -- Stores the role assignments
    leader_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Blueprint (10 Questions)
CREATE TABLE "public"."blueprint" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES "public"."groups"(id) ON DELETE CASCADE,
    submitted_by UUID REFERENCES "public"."profiles"(id),
    status form_status DEFAULT 'draft',
    visual_design TEXT,
    materials_needed TEXT,
    availability TEXT,
    cost_effectiveness TEXT,
    construction_feasibility TEXT,
    competitors TEXT,
    time_constraints TEXT,
    societal_accessibility TEXT,
    cost_reduction TEXT,
    multi_purpose TEXT,
    leader_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Expert Interview
CREATE TABLE "public"."expert_interviews" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES "public"."groups"(id) ON DELETE CASCADE,
    submitted_by UUID REFERENCES "public"."profiles"(id),
    status form_status DEFAULT 'draft',
    expert_name TEXT,
    profession TEXT,
    interview_date DATE,
    location TEXT,
    student_interviewers TEXT,
    questions_asked TEXT,
    insights_summary TEXT,
    video_url TEXT,
    leader_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Prototype Specs
CREATE TABLE "public"."prototype_specs" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES "public"."groups"(id) ON DELETE CASCADE,
    submitted_by UUID REFERENCES "public"."profiles"(id),
    status form_status DEFAULT 'draft',
    materials TEXT,
    unit_cost NUMERIC,
    selling_price NUMERIC,
    production_setup TEXT,
    rating_functionality INTEGER CHECK (rating_functionality BETWEEN 1 AND 5),
    rating_usability INTEGER CHECK (rating_usability BETWEEN 1 AND 5),
    rating_durability INTEGER CHECK (rating_durability BETWEEN 1 AND 5),
    rating_aesthetics INTEGER CHECK (rating_aesthetics BETWEEN 1 AND 5),
    rating_cost_efficiency INTEGER CHECK (rating_cost_efficiency BETWEEN 1 AND 5),
    rating_innovation INTEGER CHECK (rating_innovation BETWEEN 1 AND 5),
    rating_sustainability INTEGER CHECK (rating_sustainability BETWEEN 1 AND 5),
    leader_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Marketing 7Ps
CREATE TABLE "public"."marketing_plans" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES "public"."groups"(id) ON DELETE CASCADE,
    submitted_by UUID REFERENCES "public"."profiles"(id),
    status form_status DEFAULT 'draft',
    strategy_analysis TEXT,
    p_product TEXT,
    p_price TEXT,
    p_place TEXT,
    p_promotion TEXT,
    p_people TEXT,
    p_process TEXT,
    p_physical_evidence TEXT,
    leader_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Individual Reflections
CREATE TABLE "public"."individual_reflections" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES "public"."profiles"(id) ON DELETE CASCADE,
    group_id UUID REFERENCES "public"."groups"(id) ON DELETE CASCADE,
    status form_status DEFAULT 'draft',
    role_description TEXT,
    contributions TEXT,
    challenges TEXT,
    improvements TEXT,
    satisfaction TEXT,
    leader_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Competences Matrix (JSON for flexibility)
CREATE TABLE "public"."competences" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES "public"."groups"(id) ON DELETE CASCADE,
    submitted_by UUID REFERENCES "public"."profiles"(id),
    status form_status DEFAULT 'draft',
    individual_selections JSONB,
    group_top_5 JSONB,
    explanation TEXT,
    leader_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bonus: AI Logs
CREATE TABLE "public"."ai_logs" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES "public"."groups"(id) ON DELETE CASCADE,
    submitted_by UUID REFERENCES "public"."profiles"(id),
    status form_status DEFAULT 'draft',
    log_date DATE,
    project_phase TEXT,
    tool_used TEXT,
    prompt_text TEXT,
    response_summary TEXT,
    adaptation_details TEXT,
    fact_checking_source TEXT,
    leader_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Setup (Basic)
ALTER TABLE "public"."groups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."milestones" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."roles_responsibilities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."blueprint" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."expert_interviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."prototype_specs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."marketing_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."individual_reflections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."competences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ai_logs" ENABLE ROW LEVEL SECURITY;

-- Disable RLS temporarily or set it up permissive for demo (In real project, would restrict to group_id matching user's group_id)
CREATE POLICY "Enable all for authenticated users" ON "public"."groups" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON "public"."profiles" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON "public"."milestones" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON "public"."roles_responsibilities" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON "public"."blueprint" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON "public"."expert_interviews" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON "public"."prototype_specs" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON "public"."marketing_plans" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON "public"."individual_reflections" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON "public"."competences" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON "public"."ai_logs" FOR ALL TO authenticated USING (true) WITH CHECK (true);
