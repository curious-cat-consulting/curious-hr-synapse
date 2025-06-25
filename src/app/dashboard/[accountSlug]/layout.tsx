import { redirect } from "next/navigation";

import DashboardHeader from "@components/dashboard/dashboard-header";
import { getAccountBySlug } from "@lib/actions/accounts";

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
