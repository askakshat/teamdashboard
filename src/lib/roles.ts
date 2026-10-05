// Role-based permission helpers for the EUMIND dashboard.

export type Role = "leader" | "team_member" | "external_viewer";

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name?: string | null;
  display_name?: string | null;
  role: Role;
  group_id?: string | null;
  created_at?: string;
  project_role?: string | null;
}

/**
 * Returns the best available display name for a profile.
 * Priority: display_name → first_name → email prefix → "Team Member"
 */
export function getDisplayName(
  profile:
    | {
        display_name?: string | null;
        first_name?: string | null;
        email?: string | null;
      }
    | null
    | undefined,
): string {
  if (!profile) return "Team Member";
  if (profile.display_name && profile.display_name.trim()) {
    return profile.display_name.trim();
  }
  if (profile.first_name && profile.first_name.trim()) {
    return profile.first_name.trim();
  }
  if (profile.email) {
    return profile.email.split("@")[0];
  }
  return "Team Member";
}

/**
 * Returns 2-character initials for avatars, using display_name → first_name → email.
 */
export function getInitials(
  profile:
    | {
        display_name?: string | null;
        first_name?: string | null;
        email?: string | null;
      }
    | null
    | undefined,
): string {
  const name = getDisplayName(profile);
  if (name === "Team Member") return "--";
  return name.substring(0, 2).toUpperCase();
}

export function isLeader(profile: Pick<Profile, "role"> | null | undefined): boolean {
  return profile?.role === "leader";
}

export function isMember(profile: Pick<Profile, "role"> | null | undefined): boolean {
  return profile?.role === "team_member";
}

/**
 * Task permissions matrix:
 *
 * Action                    | Leader | Member
 * --------------------------|--------|--------
 * Create task               |   ✓    |   ✓  (assign to self only)
 * Edit task title/details   |   ✓    |   ✓  (only if created_by is self)
 * Assign task to anyone     |   ✓    |   ✗  (self only)
 * Change priority           |   ✓    |   ✓  (only own tasks)
 * Delete any task           |   ✓    |   ✗
 * Delete own task           |   ✓    |   ✓  (only if status is todo/in_progress)
 * Move to "in_progress"     |   ✓    |   ✓  (if assigned to self)
 * Move to "review"          |   ✓    |   ✓  (submit for leader review)
 * Move to "done"            |   ✓    |   ✗  (must go through review)
 * Move from "review" back   |   ✓    |   ✗  (leader rejects)
 * Approve from "review"     |   ✓    |   ✗
 */

export interface TaskPermissions {
  canEdit: (task: { created_by?: string | null; owner_id?: string | null }) => boolean;
  canDelete: (task: {
    created_by?: string | null;
    owner_id?: string | null;
    status: string;
  }) => boolean;
  canAssign: boolean; // can assign to anyone (false = self only)
  canDragTo: (status: string) => boolean;
  canApprove: boolean;
  canCreate: boolean;
}

export function getTaskPermissions(
  profile: Pick<Profile, "id" | "role"> | null | undefined,
): TaskPermissions {
  const leader = isLeader(profile);
  const userId = profile?.id;

  return {
    canEdit: (task) =>
      leader || task.created_by === userId || task.owner_id === userId,
    canDelete: (task) => {
      if (leader) return true;
      if (task.created_by !== userId && task.owner_id !== userId) return false;
      // Members can only delete tasks that haven't been submitted for review yet
      return task.status === "todo" || task.status === "in_progress";
    },
    canAssign: leader, // members can only assign to self
    canDragTo: (status) => {
      if (leader) return true; // leader can move anywhere
      // members: todo ↔ in_progress ↔ review, but NOT done
      return status !== "done";
    },
    canApprove: leader,
    canCreate: true,
  };
}

// Status flow helpers
export const TASK_STATUSES = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  REVIEW: "review",
  DONE: "done",
} as const;

export const STATUS_LABELS: Record<string, string> = {
  todo: "To do",
  in_progress: "In progress",
  review: "Needs review",
  done: "Completed",
};

export const STATUS_COLORS: Record<string, string> = {
  todo: "bg-slate-100 text-slate-600",
  in_progress: "bg-violet-50 text-violet-700",
  review: "bg-amber-50 text-amber-700",
  done: "bg-teal-50 text-teal-700",
};
