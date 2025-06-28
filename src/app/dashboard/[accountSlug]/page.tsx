import { notFound } from "next/navigation";

import { MemberDashboard } from "@components/dashboard/member-dashboard";
import { OwnerDashboard } from "@components/dashboard/owner-dashboard";
import { getAccountBySlug, isUserOwner } from "@lib/actions/accounts";
import { createClient } from "@lib/supabase/server";

interface TeamAccountPageProps {
  params: Promise<{
    accountSlug: string;
  }>;
}

export default async function TeamAccountPage({ params }: Readonly<TeamAccountPageProps>) {
  const { accountSlug } = await params;

  // Get account data - if it doesn't exist or user doesn't have access, this will throw
  let teamAccount;
  try {
    teamAccount = await getAccountBySlug(accountSlug);
  } catch {
    // If account doesn't exist or user doesn't have access, return 404
    notFound();
  }

  // Check if user is an owner
  const isOwner = await isUserOwner(teamAccount.account_id);

  // If user is not an owner, show simplified member dashboard
  if (!isOwner) {
    const supabaseClient = createClient();

    // Get the actual user role for this team
    const { data: userRole } = await supabaseClient.rpc("current_user_account_role", {
      account_id: teamAccount.account_id,
    });

    // Get personal account to check if this is the posting team
    const { data: personalAccount } = await supabaseClient.rpc("get_personal_account");
    const currentPostingTeamId = personalAccount?.metadata?.posting_team_id;
    const isPostingTeam = teamAccount.account_id === currentPostingTeamId;

    return (
      <MemberDashboard
        teamAccount={teamAccount}
        userRole={userRole ?? { account_role: "member", is_primary_owner: false }}
        isPostingTeam={isPostingTeam}
      />
    );
  }

  // Show owner dashboard
  return <OwnerDashboard accountSlug={accountSlug} teamAccount={teamAccount} />;
}
