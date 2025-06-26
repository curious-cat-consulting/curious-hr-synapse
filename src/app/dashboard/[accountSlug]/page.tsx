import { FeaturesOverview, teamFeatures } from "@components/dashboard/features-overview";
import { GettingStarted, teamGettingStartedSteps } from "@components/dashboard/getting-started";
import { QuickActions, teamQuickActions } from "@components/dashboard/quick-actions";
import { RecentActivity } from "@components/dashboard/recent-activity";
import { getAccountBySlug } from "@lib/actions/accounts";

interface TeamAccountPageProps {
  params: Promise<{
    accountSlug: string;
  }>;
}

export default async function TeamAccountPage({ params }: Readonly<TeamAccountPageProps>) {
  const { accountSlug } = await params;
  const teamAccount = await getAccountBySlug(accountSlug);

  return (
    <div className="container mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Team Dashboard</h1>
        <p className="text-muted-foreground">
          Manage team expenses, track approvals, and monitor spending patterns
        </p>
      </div>

      {/* Quick Actions */}
      <QuickActions actions={teamQuickActions(accountSlug)} />

      {/* Team Features Overview */}
      <FeaturesOverview title="Team Features" features={teamFeatures} />

      {/* Getting Started Guide */}
      <GettingStarted title="Getting Started" steps={teamGettingStartedSteps(accountSlug)} />

      {/* Recent Activity */}
      <RecentActivity title="Recent Activity" accountId={teamAccount.account_id} />
    </div>
  );
}
