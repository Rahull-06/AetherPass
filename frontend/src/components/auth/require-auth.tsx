"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import type { UserRole } from "@/types/auth";

type Props = {
  children: React.ReactNode;
  roles?: UserRole[];
  redirectTo?: string;
};

/**
 * Blocks a page until auth is known, then redirects guests / wrong roles.
 */
export function RequireAuth({
  children,
  roles,
  redirectTo = "/login",
}: Props) {
  const router = useRouter();
  const { isAuthenticated, isBootstrapping, hasRole, homePath } = useAuth();

  useEffect(() => {
    if (isBootstrapping) return;

    if (!isAuthenticated) {
      router.replace(redirectTo);
      return;
    }

    if (roles && roles.length > 0 && !hasRole(...roles)) {
      router.replace(homePath);
    }
  }, [
    isBootstrapping,
    isAuthenticated,
    roles,
    hasRole,
    homePath,
    redirectTo,
    router,
  ]);

  if (isBootstrapping || !isAuthenticated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted">
        Checking your pass…
      </div>
    );
  }

  if (roles && roles.length > 0 && !hasRole(...roles)) {
    return null;
  }

  return <>{children}</>;
}
