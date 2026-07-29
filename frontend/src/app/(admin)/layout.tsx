"use client";

import { RequireAuth } from "@/components/auth/require-auth";

export default function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuth roles={["ROLE_ADMIN"]}>{children}</RequireAuth>;
}
