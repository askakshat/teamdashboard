"use client";

import * as React from "react";
import type { Profile } from "@/lib/roles";

interface ProfileContextValue {
  profile: Profile | null;
  loading: boolean;
}

const ProfileContext = React.createContext<ProfileContextValue | null>(null);

export function ProfileProvider({
  profile,
  children,
}: {
  profile: Profile | null;
  children: React.ReactNode;
}) {
  // The profile is fetched server-side in the dashboard layout and passed in.
  // We keep it in state so future client-side refetches can update it.
  const value = React.useMemo(
    () => ({ profile, loading: false }),
    [profile],
  );
  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile(): Profile | null {
  const ctx = React.useContext(ProfileContext);
  return ctx?.profile ?? null;
}

export function useRole(): string | undefined {
  return useProfile()?.role;
}

export function useIsLeader(): boolean {
  return useProfile()?.role === "leader";
}
