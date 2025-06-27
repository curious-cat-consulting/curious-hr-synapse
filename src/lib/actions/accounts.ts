import { cache } from "react";

import { createClient } from "../supabase/server";

/**
 * Server-side function to get account by slug with React cache
 * This provides caching benefits while keeping components as server components
 */
export const getAccountBySlug = cache(async (accountSlug: string) => {
  const supabaseClient = createClient();

  const { data, error } = await supabaseClient.rpc("get_account_by_slug", {
    slug: accountSlug,
  });

  if (error != null) {
    throw new Error(error.message);
  }

  return data;
});

/**
 * Server-side function to check if current user is a member (not owner) of an account
 */
export const isUserMember = cache(async (accountId: string) => {
  const supabaseClient = createClient();

  const { data, error } = await supabaseClient.rpc("current_user_account_role", {
    account_id: accountId,
  });

  if (error != null) {
    throw new Error(error.message);
  }

  // Return true if user is a member (not an owner)
  return data?.account_role === "member";
});
