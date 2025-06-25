import type { GetAccountsResponse } from "@usebasejump/shared";
import type { SWRConfiguration } from "swr";
import useSWR from "swr";

import { createClient } from "../supabase/client";

export const useAccounts = (options?: SWRConfiguration) => {
  const supabaseClient = createClient();
  return useSWR<GetAccountsResponse>(
    ["accounts"],
    async () => {
      const { data, error } = await supabaseClient.rpc("get_accounts");

      if (error !== null) {
        throw new Error(error.message);
      }

      return data;
    },
    options
  );
};

export const useAccountBySlug = (slug: string | null, options?: SWRConfiguration) => {
  const supabaseClient = createClient();
  return useSWR(
    slug !== null && slug !== "" ? ["account-by-slug", slug] : null,
    async () => {
      const { data, error } = await supabaseClient.rpc("get_account_by_slug", {
        slug,
      });

      if (error !== null) {
        throw new Error(error.message);
      }

      return data;
    },
    options
  );
};

export const useCurrentUser = (options?: SWRConfiguration) => {
  const supabaseClient = createClient();
  return useSWR<{ id: string; email?: string }>(
    ["current-user"],
    async () => {
      const {
        data: { user },
        error,
      } = await supabaseClient.auth.getUser();

      if (error !== null) {
        throw new Error(error.message);
      }

      if (user === null) {
        throw new Error("No authenticated user");
      }

      return {
        id: user.id,
        email: user.email ?? undefined,
      };
    },
    options
  );
};
