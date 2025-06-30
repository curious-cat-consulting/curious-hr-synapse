"use client";

import { Button } from "@components/ui/button";
import { Separator } from "@components/ui/separator";
import { createClient } from "@lib/supabase/client";

interface GoogleOAuthButtonProps {
  returnUrl?: string;
  className?: string;
}

export function GoogleOAuthButton({ returnUrl, className }: Readonly<GoogleOAuthButtonProps>) {
  const handleGoogleSignIn = async () => {
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          returnUrl != null && returnUrl !== ""
            ? `${window.location.origin}/auth/callback?returnUrl=${encodeURIComponent(returnUrl)}`
            : `${window.location.origin}/auth/callback`,
      },
    });

    if (error != null) {
      console.error("Google OAuth error:", error);
    }
  };

  return (
    <div className={className}>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>
      <Button
        variant="outline"
        type="button"
        className="mt-4 w-full"
        onClick={handleGoogleSignIn}
        data-testid="google-sign-in-button"
      >
        <svg
          className="mr-2 h-4 w-4"
          aria-hidden="true"
          focusable="false"
          data-prefix="fab"
          data-icon="google"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 488 512"
        >
          <path
            fill="currentColor"
            d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h240z"
          />
        </svg>
        Continue with Google
      </Button>
    </div>
  );
}
