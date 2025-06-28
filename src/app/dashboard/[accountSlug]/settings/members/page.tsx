import ManageTeamInvitations from "@components/basejump/manage-team-invitations";
import ManageTeamMembers from "@components/basejump/manage-team-members";
import { requireOwnerAccess } from "@lib/utils/owner-only";

export default async function TeamMembersPage({
  params,
}: {
  params: Promise<{ accountSlug: string }>;
}) {
  const { accountSlug } = await params;
  const teamAccount = await requireOwnerAccess(accountSlug);

  return (
    <div className="flex flex-col gap-y-8">
      <ManageTeamInvitations accountId={teamAccount.account_id} />
      <ManageTeamMembers accountId={teamAccount.account_id} />
    </div>
  );
}
