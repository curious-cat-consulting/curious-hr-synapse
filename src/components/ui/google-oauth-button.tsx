"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

import { createClient } from "@lib/supabase/client";

// Type definitions for Google API
declare global {
  interface Window {
    google: {
      accounts?: {
        id?: {
          initialize: (config: unknown) => void;
          renderButton: (element: HTMLElement, options: unknown) => void;
        };
      };
    };
  }
}

interface GoogleOAuthButtonProps {
  returnUrl?: string;
  className?: string;
}

export function GoogleOAuthButton({ returnUrl, className }: Readonly<GoogleOAuthButtonProps>) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // Load Google's script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      // Initialize Google Sign-In
      if (
        typeof window !== "undefined" &&
        window.google.accounts?.id != null &&
        buttonRef.current != null
      ) {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: async (response: { credential: string }) => {
            const supabase = createClient();

            const { error } = await supabase.auth.signInWithIdToken({
              provider: "google",
              token: response.credential,
            });

            if (error != null) {
              console.error("Google OAuth error:", error);
            } else {
              // Redirect to returnUrl or dashboard
              const redirectUrl = returnUrl != null && returnUrl !== "" ? returnUrl : "/dashboard";
              window.location.href = redirectUrl;
            }
          },
          use_fedcm_for_prompt: true, // For Chrome's third-party cookie phase-out
        });

        // Determine the theme for the Google button
        // Use resolvedTheme to get the actual theme (handles system theme)
        const googleTheme = resolvedTheme === "dark" ? "filled_black" : "filled_white";

        // Render the button
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: googleTheme,
          size: "large",
          text: "signin_with",
          shape: "rectangular",
          logo_alignment: "left",
        });
      }
    };

    return () => {
      // Cleanup
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [returnUrl, resolvedTheme]); // Add resolvedTheme to dependencies

  return (
    <div className={className}>
      <div ref={buttonRef} className="w-full" />
    </div>
  );
}
