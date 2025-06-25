import { redirect } from "next/navigation";

import DashboardHeader from "@components/dashboard/dashboard-header";
import { getAccountBySlug } from "@lib/actions/accounts";

export default async function PersonalAccountDashboard({
  children,
  params: { accountSlug },
}: {
  children: React.ReactNode;
  params: { accountSlug: string };
}) {
  const teamAccount = await getAccountBySlug(accountSlug);

  if (teamAccount === null) {
    redirect("/dashboard");
  }

  const navigation = [
    {
      name: "Overview",
      href: `/dashboard/${accountSlug}`,
    },
    {
      name: "Expenses",
      href: `/dashboard/${accountSlug}/expenses`,
    },
    {
      name: "Settings",
      href: `/dashboard/${accountSlug}/settings`,
    },
  ];

  return (
    <>
      <DashboardHeader accountId={teamAccount.account_id} navigation={navigation} />
      <div className="w-full p-8">{children}</div>
    </>
  );
}
