import AccountBillingStatus from "@components/basejump/account-billing-status";
import { requireOwnerAccess } from "@lib/utils/owner-only";

const returnUrl = process.env.NEXT_PUBLIC_URL as string;

export default async function TeamBillingPage({
  params,
}: {
  params: Promise<{ accountSlug: string }>;
}) {
  const { accountSlug } = await params;
  const teamAccount = await requireOwnerAccess(accountSlug);

  return (
    <div>
      <AccountBillingStatus
        accountId={teamAccount.account_id}
        returnUrl={`${returnUrl}/dashboard/${accountSlug}/settings/billing`}
      />
    </div>
  );
}
