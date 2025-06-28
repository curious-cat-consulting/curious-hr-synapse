import { FeaturesOverview, teamFeatures } from "@components/dashboard/features-overview";
import { FraudDetectionOverview } from "@components/dashboard/fraud-detection-overview";
import { GettingStarted, teamGettingStartedSteps } from "@components/dashboard/getting-started";
import { QuickActions, teamQuickActions } from "@components/dashboard/quick-actions";
import { RecentActivity } from "@components/dashboard/recent-activity";

interface OwnerDashboardProps {
  accountSlug: string;
  teamAccount: {
    account_id: string;
    name: string;
  };
}

export function OwnerDashboard({ accountSlug, teamAccount }: Readonly<OwnerDashboardProps>) {
  return (
    <div className="container mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Team Owner Dashboard</h1>
        <p className="text-muted-foreground">
          Manage team expenses, track approvals, and monitor spending patterns
        </p>
      </div>

      {/* Quick Actions */}
      <QuickActions actions={teamQuickActions(accountSlug, teamAccount)} />

      {/* Dashboard Grid */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Fraud Detection Overview */}
        <FraudDetectionOverview accountId={teamAccount.account_id} accountSlug={accountSlug} />

        {/* Recent Activity */}
        <div className="md:col-span-2">
          <RecentActivity title="Recent Activity" accountId={teamAccount.account_id} />
        </div>
      </div>

      {/* Getting Started Guide */}
      <GettingStarted title="Getting Started" steps={teamGettingStartedSteps(accountSlug)} />

      {/* Team Features Overview */}
      <FeaturesOverview title="Team Features" features={teamFeatures} />
    </div>
  );
}
