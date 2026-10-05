// The 8 official EUMIND project roles from the Creative Entrepreneur 2026-27
// guidelines (page 4). Each member is assigned exactly one of these.

export interface ProjectRole {
  id: string;
  name: string;
  shortName: string;
  icon: string; // emoji for quick visual scanning
  description: string;
  responsibilities: string[];
}

export const PROJECT_ROLES: ProjectRole[] = [
  {
    id: "leader",
    name: "Leader",
    shortName: "Leader",
    icon: "👑",
    description: "Organises the team and keeps everything on track.",
    responsibilities: [
      "Organises group meetings and monitors deadlines",
      "Sends short updates twice a month",
      "Main contact with the teacher-coach",
      "Coordinates self-assessment and keeps everyone involved",
    ],
  },
  {
    id: "platform-editor",
    name: "Platform Editor",
    shortName: "Platform",
    icon: "🖥️",
    description: "Builds and maintains the team's project platform.",
    responsibilities: [
      "Learns how to use the platform's features",
      "Collects content from group members",
      "Builds and updates the project site",
      "Uploads the worksheet once it's filled in",
    ],
  },
  {
    id: "photographer",
    name: "Photographer & Video Editor",
    shortName: "Photo/Video",
    icon: "📸",
    description: "Captures and edits all visual evidence.",
    responsibilities: [
      "Edits the group intro and interview videos",
      "Uploads videos to YouTube (Unlisted, 'Eumind' in title)",
      "Takes photos to document project progress",
    ],
  },
  {
    id: "communication",
    name: "Communication Manager",
    shortName: "Comms",
    icon: "💬",
    description: "Keeps the team connected and informed.",
    responsibilities: [
      "Sets up and monitors group communication tools",
      "Ensures everyone stays in the loop",
    ],
  },
  {
    id: "brainstorming",
    name: "Brainstorming / Blueprint Manager",
    shortName: "Brainstorm",
    icon: "💡",
    description: "Leads the ideation and blueprint phase.",
    responsibilities: [
      "Leads brainstorming sessions with the group and coach",
      "Ensures full participation",
      "Posts the brainstorming report on the platform",
    ],
  },
  {
    id: "product-creator",
    name: "Product Creator",
    shortName: "Product",
    icon: "🔧",
    description: "Builds the actual prototype.",
    responsibilities: [
      "Plans and manages the production process (materials, techniques)",
      "Posts about creating the product",
    ],
  },
  {
    id: "promotions",
    name: "Promotions Manager",
    shortName: "Promotions",
    icon: "📣",
    description: "Handles marketing and outreach.",
    responsibilities: [
      "Handles promotion and marketing",
      "Manages social media, pitches, and promotional content",
    ],
  },
  {
    id: "interview-expert",
    name: "Interview Expert",
    shortName: "Interview",
    icon: "🎤",
    description: "Runs the local expert interview.",
    responsibilities: [
      "Prepares the interview and questions",
      "Summarises expert feedback and posts it on the platform",
    ],
  },
];

export function getProjectRole(id: string | null | undefined): ProjectRole | null {
  if (!id) return null;
  return PROJECT_ROLES.find((r) => r.id === id) ?? null;
}

/**
 * Returns all ProjectRole objects for an array of role IDs.
 * Use this when a member can have multiple roles.
 */
export function getProjectRoles(
  ids: string[] | null | undefined,
): ProjectRole[] {
  if (!ids || !Array.isArray(ids) || ids.length === 0) return [];
  return ids
    .map((id) => PROJECT_ROLES.find((r) => r.id === id))
    .filter((r): r is ProjectRole => r !== null);
}

export const PROJECT_ROLE_COLORS: Record<string, string> = {
  leader: "bg-amber-100 text-amber-800",
  "platform-editor": "bg-sky-100 text-sky-800",
  photographer: "bg-violet-100 text-violet-800",
  communication: "bg-teal-100 text-teal-800",
  brainstorming: "bg-rose-100 text-rose-800",
  "product-creator": "bg-slate-100 text-slate-800",
  promotions: "bg-fuchsia-100 text-fuchsia-800",
  "interview-expert": "bg-indigo-100 text-indigo-800",
};
