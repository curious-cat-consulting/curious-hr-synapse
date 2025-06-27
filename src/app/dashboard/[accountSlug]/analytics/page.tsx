import { AnalyticsPage } from "@/src/components/analytics/analytics-page";
import { requireOwnerAccess } from "@lib/utils/owner-only";

interface TeamAnalyticsPageProps {
  params: Promise<{
    accountSlug: string;
  }>;
}

export default async function TeamAnalyticsPage({ params }: Readonly<TeamAnalyticsPageProps>) {
  const { accountSlug } = await params;
  const teamAccount = await requireOwnerAccess(accountSlug);

  return (
    <AnalyticsPage
      type="team"
      title="Team Analytics"
      description="Comprehensive insights for your team"
      accountSlug={accountSlug}
      accountName={teamAccount.name}
      accountError={null}
    />
  );
}
