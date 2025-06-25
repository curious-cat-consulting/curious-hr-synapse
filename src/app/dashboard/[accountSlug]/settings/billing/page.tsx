import AccountBillingStatus from "@components/basejump/account-billing-status";
import { Alert } from "@components/ui/alert";
import { getAccountBySlug } from "@lib/actions/accounts";

const returnUrl = process.env.NEXT_PUBLIC_URL as string;

export default async function TeamBillingPage({
  params,
}: {
  params: Promise<{ accountSlug: string }>;
}) {
  const { accountSlug } = await params;
  const teamAccount = await getAccountBySlug(accountSlug);

  if (teamAccount.account_role !== "owner") {
    return <Alert variant="destructive">You do not have permission to access this page</Alert>;
  }

  return (
    <div>
      <AccountBillingStatus
        accountId={teamAccount.account_id}
        returnUrl={`${returnUrl}/dashboard/${accountSlug}/settings/billing`}
      />
    </div>
  );
}
