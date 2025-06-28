import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Input } from "@components/ui/input";
import { SubmitButton } from "@components/ui/submit-button";
import { createClient } from "@lib/supabase/server";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ message: string; returnUrl?: string }>;
}) {
  const params = await searchParams;

  const signIn = async (_prevState: unknown, formData: FormData) => {
    "use server";

    // Helper function to check if returnUrl is valid
    const isValidReturnUrl = (url: string | undefined): boolean => {
      return url != null && url !== "" && url !== "undefined";
    };

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error !== null) {
      // Only include returnUrl if it's valid
      const returnUrlParam = isValidReturnUrl(params.returnUrl)
        ? `&returnUrl=${params.returnUrl}`
        : "";
      return redirect(`/login?message=Could not authenticate user${returnUrlParam}`);
    }

    // Only redirect to returnUrl if it's valid, otherwise go to dashboard
    return redirect(isValidReturnUrl(params.returnUrl) ? params.returnUrl! : "/dashboard");
  };

  const signUp = async (_prevState: unknown, formData: FormData) => {
    "use server";

    // Helper function to check if returnUrl is valid
    const isValidReturnUrl = (url: string | undefined): boolean => {
      return url != null && url !== "" && url !== "undefined";
    };

    const headersList = await headers();
    const origin = headersList.get("origin");
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Only include returnUrl in emailRedirectTo if it's valid
        emailRedirectTo: isValidReturnUrl(params.returnUrl)
          ? `${origin}/auth/callback?returnUrl=${params.returnUrl}`
          : `${origin}/auth/callback`,
      },
    });

    if (error !== null) {
      // Only include returnUrl if it's valid
      const returnUrlParam = isValidReturnUrl(params.returnUrl)
        ? `&returnUrl=${params.returnUrl}`
        : "";
      return redirect(`/login?message=Could not authenticate user${returnUrlParam}`);
    }

    // Only include returnUrl in success message if it's valid
    const returnUrlParam = isValidReturnUrl(params.returnUrl)
      ? `&returnUrl=${params.returnUrl}`
      : "";
    return redirect(`/login?message=Check email to continue sign in process${returnUrlParam}`);
  };

  return (
    <div className="flex w-full flex-1 flex-col justify-center gap-2 px-8 sm:max-w-md">
      <Link
        href="/"
        className="bg-btn-background hover:bg-btn-background-hover group absolute left-8 top-8 flex items-center rounded-md px-4 py-2 text-sm text-foreground no-underline"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>{" "}
        Back
      </Link>

      <form className="flex w-full flex-1 flex-col justify-center gap-2 text-foreground animate-in">
        <label className="text-md" htmlFor="email">
          Email
        </label>
        <Input
          id="email"
          name="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        <label className="text-md" htmlFor="password">
          Password
        </label>
        <Input
          id="password"
          type="password"
          name="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
        <SubmitButton formAction={signIn} pendingText="Signing In..." data-testid="sign-in-button">
          Sign In
        </SubmitButton>
        <SubmitButton
          formAction={signUp}
          variant="outline"
          pendingText="Signing Up..."
          data-testid="sign-up-button"
        >
          Sign Up
        </SubmitButton>
        {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
        {params.message?.length > 0 && (
          <p className="mt-4 bg-foreground/10 p-4 text-center text-foreground">{params.message}</p>
        )}
      </form>
    </div>
  );
}
