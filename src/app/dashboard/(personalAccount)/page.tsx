import { FeaturesOverview, personalFeatures } from "@components/dashboard/features-overview";
import { GettingStarted, personalGettingStartedSteps } from "@components/dashboard/getting-started";
import { QuickActions, personalQuickActions } from "@components/dashboard/quick-actions";
import { QuickTips, personalQuickTips } from "@components/dashboard/quick-tips";
import { RecentActivity } from "@components/dashboard/recent-activity";

export default async function PersonalAccountPage() {
  return (
    <div className="container mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Personal Dashboard</h1>
        <p className="text-muted-foreground">
          Track your expenses, manage receipts, and monitor your spending
        </p>
      </div>

      {/* Quick Actions */}
      <QuickActions actions={personalQuickActions} />

      {/* Personal Features Overview */}
      <FeaturesOverview title="Personal Features" features={personalFeatures} />

      {/* Getting Started Guide */}
      <GettingStarted title="Getting Started" steps={personalGettingStartedSteps} />

      {/* Recent Activity */}
      <RecentActivity title="Recent Activity" />

      {/* Quick Tips */}
      <QuickTips title="Quick Tips" tips={personalQuickTips} />
    </div>
  );
}
