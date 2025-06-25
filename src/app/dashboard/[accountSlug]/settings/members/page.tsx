import ManageTeamInvitations from "@components/basejump/manage-team-invitations";
import ManageTeamMembers from "@components/basejump/manage-team-members";
import { Alert } from "@components/ui/alert";
import { getAccountBySlug } from "@lib/actions/accounts";

export default async function TeamMembersPage({
  params: { accountSlug },
}: {
  params: { accountSlug: string };
}) {
  const teamAccount = await getAccountBySlug(accountSlug);

  if (teamAccount.account_role !== "owner") {
    return <Alert variant="destructive">You do not have permission to access this page</Alert>;
  }

  return (
    <div className="flex flex-col gap-y-8">
      <ManageTeamInvitations accountId={teamAccount.account_id} />
      <ManageTeamMembers accountId={teamAccount.account_id} />
    </div>
  );
}
