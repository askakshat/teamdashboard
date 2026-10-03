export type UserRole = 'leader' | 'team_member' | 'external_viewer';
export type FormStatus = 'draft' | 'pending_approval' | 'approved' | 'needs_revision' | 'published';
export type TaskStatus = 'backlog' | 'in_progress' | 'pending_review' | 'completed';

export interface Group {
    id: string;
    name: string;
    created_at: string;
}

export interface Profile {
    id: string;
    email: string;
    first_name: string;
    last_name?: string;
    role: UserRole;
    group_id?: string;
    created_at: string;
}

export interface Milestone {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    milestone_number: number;
    assigned_to?: string;
    due_date?: string;
    group_id?: string;
    created_at: string;
    updated_at: string;
}

export interface BlueprintForm {
    id: string;
    group_id: string;
    submitted_by: string;
    status: FormStatus;
    visual_design?: string;
    materials_needed?: string;
    availability?: string;
    cost_effectiveness?: string;
    construction_feasibility?: string;
    competitors?: string;
    time_constraints?: string;
    societal_accessibility?: string;
    cost_reduction?: string;
    multi_purpose?: string;
    leader_feedback?: string;
    created_at: string;
    updated_at: string;
}

export interface RolesResponsibilitiesForm {
    id: string;
    group_id: string;
    submitted_by: string;
    status: FormStatus;
    data?: Record<string, unknown>;
    leader_feedback?: string;
    created_at: string;
    updated_at: string;
}
