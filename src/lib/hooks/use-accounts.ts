import type { GetAccountsResponse } from "@usebasejump/shared";
import type { SWRConfiguration } from "swr";
import useSWR from "swr";

import { createClient } from "../supabase/client";

export const useAccounts = (options?: SWRConfiguration) => {
  const supabaseClient = createClient();
  return useSWR<GetAccountsResponse>(
    !!supabaseClient && ["accounts"],
    async () => {
      const { data, error } = await supabaseClient.rpc("get_accounts");

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    options
  );
};
