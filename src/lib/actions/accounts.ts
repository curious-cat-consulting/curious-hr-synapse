import { cache } from "react";

import { createClient } from "../supabase/server";

/**
 * Server-side function to get account by slug with React cache
 * This provides caching benefits while keeping components as server components
 */
export const getAccountBySlug = cache(async (slug: string) => {
  const supabaseClient = createClient();

  const { data, error } = await supabaseClient.rpc("get_account_by_slug", {
    slug,
  });

  if (error !== null) {
    throw new Error(error.message);
  }

  return data;
});
