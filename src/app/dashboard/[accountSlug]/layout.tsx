import { redirect } from "next/navigation";

import DashboardHeader from "@components/dashboard/dashboard-header";
import { getAccountBySlug, isUserMember } from "@lib/actions/accounts";

export default async function PersonalAccountDashboard({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ accountSlug: string }>;
}) {
  const { accountSlug } = await params;
  const teamAccount = await getAccountBySlug(accountSlug);

  if (teamAccount === null) {
    redirect("/dashboard");
  }

  // Check if user is a member (not an owner)
  const isMember = await isUserMember(teamAccount.account_id);

  const navigation = [
    {
      name: "Overview",
      href: `/dashboard/${accountSlug}`,
    },
    {
      name: "Expenses",
      href: isMember ? "/dashboard/expenses" : `/dashboard/${accountSlug}/expenses`,
    },
    {
      name: "Analytics",
      href: isMember ? "/dashboard/analytics" : `/dashboard/${accountSlug}/analytics`,
    },
    {
      name: "Settings",
      href: isMember ? "/dashboard/settings" : `/dashboard/${accountSlug}/settings`,
    },
  ];

  return (
    <>
      <DashboardHeader accountId={teamAccount.account_id} navigation={navigation} />
      <div className="w-full p-8">{children}</div>
    </>
  );
}
