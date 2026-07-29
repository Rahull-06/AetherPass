"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

/** Sends already-signed-in users away from login/register. */
export function RedirectIfAuthenticated({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isBootstrapping, homePath } = useAuth();

  useEffect(() => {
    if (!isBootstrapping && isAuthenticated) {
      router.replace(homePath);
    }
  }, [isBootstrapping, isAuthenticated, homePath, router]);

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted">
        Loading…
      </div>
    );
  }

  if (isAuthenticated) return null;

  return <>{children}</>;
}
