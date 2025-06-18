import { redirect } from "next/navigation";

import DashboardHeader from "@components/dashboard/dashboard-header";
import { createClient } from "@lib/supabase/server";

export default async function PersonalAccountDashboard({
  children,
  params: { accountSlug },
}: {
  children: React.ReactNode;
  params: { accountSlug: string };
}) {
  const supabaseClient = createClient();

  const { data: teamAccount, error } = await supabaseClient.rpc("get_account_by_slug", {
    slug: accountSlug,
  });

  if (error !== null) {
    console.error(error);
  }

  if (teamAccount === null) {
    redirect("/dashboard");
  }

  const navigation = [
    {
      name: "Overview",
      href: `/dashboard/${accountSlug}`,
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
