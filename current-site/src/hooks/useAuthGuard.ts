import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createClient } from "@lib/supabase/client";


interface AuthGuardOptions {
  redirectTo?: string;
  requireAuth?: boolean;
}

interface AuthGuardReturn {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export function useAuthGuard(options: AuthGuardOptions = {}): AuthGuardReturn {
  const { redirectTo = "/login", requireAuth = true } = options;
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setUser(user);

        // If auth is required but user is not authenticated, redirect
        if (requireAuth && !user) {
          const currentPath = window.location.pathname;
          const redirectUrl = `${redirectTo}${currentPath !== "/" ? `?redirectTo=${currentPath}` : ""}`;
          router.push(redirectUrl);
        }
      } catch (error) {
        console.error("Error getting user:", error);
        if (requireAuth) {
          router.push(redirectTo);
        }
      } finally {
        setLoading(false);
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      // Handle auth state changes
      if (requireAuth && !currentUser) {
        const currentPath = window.location.pathname;
        const redirectUrl = `${redirectTo}${currentPath !== "/" ? `?redirectTo=${currentPath}` : ""}`;
        router.push(redirectUrl);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, redirectTo, requireAuth]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
  };
}
