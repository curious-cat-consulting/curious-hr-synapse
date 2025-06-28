import { redirect } from "next/navigation";

import handleEdgeFunctionError from "../supabase/handle-edge-error";
import { createClient } from "../supabase/server";

export async function setupNewSubscription(prevState: unknown, formData: FormData) {
  "use server";

  const accountId = formData.get("accountId") as string;
  const returnUrl = formData.get("returnUrl") as string;
  const supabaseClient = createClient();

  const { data, error } = await supabaseClient.functions.invoke("billing-functions", {
    body: {
      action: "get_new_subscription_url",
      args: {
        account_id: accountId,
        success_url: returnUrl,
        cancel_url: returnUrl,
      },
    },
  });

  if (error != null) {
    return await handleEdgeFunctionError(error);
  }

  redirect(data.url);
}

export async function manageSubscription(prevState: unknown, formData: FormData) {
  "use server";

  const accountId = formData.get("accountId") as string;
  const returnUrl = formData.get("returnUrl") as string;
  const supabaseClient = createClient();

  const { data, error } = await supabaseClient.functions.invoke("billing-functions", {
    body: {
      action: "get_billing_portal_url",
      args: {
        account_id: accountId,
        return_url: returnUrl,
      },
    },
  });

  if (error != null) {
    return await handleEdgeFunctionError(error);
  }

  redirect(data.url);
}
