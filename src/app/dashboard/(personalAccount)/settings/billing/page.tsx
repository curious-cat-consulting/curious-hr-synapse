import AccountBillingStatus from "@components/basejump/account-billing-status";
import { createClient } from "@lib/supabase/server";

const returnUrl = process.env.NEXT_PUBLIC_URL as string;

export default async function PersonalAccountBillingPage() {
  const supabaseClient = createClient();
  const { data: personalAccount } = await supabaseClient.rpc("get_personal_account");

  return (
    <div>
      <AccountBillingStatus
        accountId={personalAccount.account_id}
        returnUrl={`${returnUrl}/dashboard/settings/billing`}
      />
    </div>
  );
}
