import EditMileageRate from "@components/basejump/edit-mileage-rate";
import EditTeamName from "@components/basejump/edit-team-name";
import EditTeamSlug from "@components/basejump/edit-team-slug";
import { getAccountBySlug } from "@lib/actions/accounts";

export default async function TeamSettingsPage({
  params: { accountSlug },
}: {
  params: { accountSlug: string };
}) {
  const teamAccount = await getAccountBySlug(accountSlug);

  return (
    <div className="flex flex-col gap-y-8">
      <EditTeamName account={teamAccount} />
      <EditTeamSlug account={teamAccount} />
      <EditMileageRate account={teamAccount} />
    </div>
  );
}
