import EditMileageRate from "@components/basejump/edit-mileage-rate";
import EditSelfApprovals from "@components/basejump/edit-self-approvals";
import EditTeamName from "@components/basejump/edit-team-name";
import EditTeamSlug from "@components/basejump/edit-team-slug";
import { requireOwnerAccess } from "@lib/utils/owner-only";

export default async function TeamSettingsPage({
  params,
}: {
  params: Promise<{ accountSlug: string }>;
}) {
  const { accountSlug } = await params;
  const teamAccount = await requireOwnerAccess(accountSlug);

  return (
    <div className="flex flex-col gap-y-8">
      <EditTeamName account={teamAccount} />
      <EditTeamSlug account={teamAccount} />
      <EditMileageRate account={teamAccount} />
      <EditSelfApprovals account={teamAccount} />
    </div>
  );
}
