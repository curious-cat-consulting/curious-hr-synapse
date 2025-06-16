"use client";

import { useAuthGuard } from "@hook/useAuthGuard";

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
  fallback?: React.ReactNode;
}

export function AuthGuard({
  children,
  redirectTo = "/login",
  requireAuth = true,
  fallback,
}: Readonly<AuthGuardProps>) {
  const { loading, isAuthenticated } = useAuthGuard({
    redirectTo,
    requireAuth,
  });

  if (loading) {
    return (
      fallback || (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      )
    );
  }

  if (requireAuth && !isAuthenticated) {
    return (
      fallback || (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
            <p className="mt-4 text-muted-foreground">Redirecting...</p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
