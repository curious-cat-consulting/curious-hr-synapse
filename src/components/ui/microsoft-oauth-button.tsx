"use client";

import { Button } from "@components/ui/button";
import { createClient } from "@lib/supabase/client";

interface MicrosoftOAuthButtonProps {
  returnUrl?: string;
  className?: string;
}

export function MicrosoftOAuthButton({
  returnUrl,
  className,
}: Readonly<MicrosoftOAuthButtonProps>) {
  const handleMicrosoftSignIn = async () => {
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: {
        scopes: "email",
        redirectTo:
          returnUrl != null && returnUrl !== ""
            ? `${window.location.origin}/auth/callback?returnUrl=${encodeURIComponent(returnUrl)}`
            : `${window.location.origin}/auth/callback`,
      },
    });

    if (error != null) {
      console.error("Microsoft OAuth error:", error);
    }
  };

  return (
    <Button
      variant="outline"
      type="button"
      className={`relative flex items-center justify-center pl-10 ${className ?? ""}`}
      onClick={handleMicrosoftSignIn}
      data-testid="microsoft-sign-in-button"
    >
      <svg
        className="absolute left-4 h-4 w-4"
        aria-hidden="true"
        focusable="false"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 23 23"
      >
        <path fill="#f25022" d="M1 1h10v10H1z" />
        <path fill="#7fba00" d="M12 1h10v10H12z" />
        <path fill="#00a4ef" d="M1 12h10v10H1z" />
        <path fill="#ffb900" d="M12 12h10v10H12z" />
      </svg>
      <span className="font-normal">Sign in with Microsoft</span>
    </Button>
  );
}
