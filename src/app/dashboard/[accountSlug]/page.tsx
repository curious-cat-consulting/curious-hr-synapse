import { MemberDashboard } from "@components/dashboard/member-dashboard";
import { OwnerDashboard } from "@components/dashboard/owner-dashboard";
import { getAccountBySlug } from "@lib/actions/accounts";
import { createClient } from "@lib/supabase/server";

interface TeamAccountPageProps {
  params: Promise<{
    accountSlug: string;
  }>;
}

export default async function TeamAccountPage({ params }: Readonly<TeamAccountPageProps>) {
  const { accountSlug } = await params;
  const teamAccount = await getAccountBySlug(accountSlug);

  // Get current user's role on this account
  const supabaseClient = createClient();
  const { data: userRole } = await supabaseClient.rpc("current_user_account_role", {
    account_id: teamAccount.account_id,
  });

  const isOwner = userRole?.account_role === "owner";

  // If user is not an owner, show simplified member dashboard
  if (!isOwner) {
    return <MemberDashboard teamAccount={teamAccount} userRole={userRole} />;
  }

  // Show owner dashboard
  return <OwnerDashboard accountSlug={accountSlug} teamAccount={teamAccount} />;
}
