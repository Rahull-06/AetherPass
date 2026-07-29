"use client";

import { RequireAuth } from "@/components/auth/require-auth";

export default function OrganizerSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth roles={["ROLE_ORGANIZER", "ROLE_ADMIN"]}>
      {children}
    </RequireAuth>
  );
}
