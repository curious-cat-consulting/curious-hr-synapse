import { Receipt, BarChart3, Settings, CheckCircle } from "lucide-react";
import Link from "next/link";

import { NewExpenseDrawer } from "@components/expenses/new-expense-drawer";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";

interface QuickAction {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: { text: string; variant: "secondary" | "outline" };
  action: React.ReactNode;
  href?: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {actions.map((action, index) => (
        <Card key={index} className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              {action.icon}
              {action.badge != null && (
                <Badge variant={action.badge.variant}>{action.badge.text}</Badge>
              )}
            </div>
            <CardTitle className="text-lg">{action.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">{action.description}</p>
            {action.action}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Predefined action sets for different dashboard types
export const teamQuickActions = (
  accountSlug: string,
  teamAccount?: { account_id: string; name: string }
): QuickAction[] => [
  {
    icon: <Receipt className="h-5 w-5 text-primary" />,
    title: "Submit Expense",
    description: "Upload receipts and let AI extract the details",
    badge: { text: "New", variant: "secondary" },
    action: (
      <NewExpenseDrawer
        fullWidth={true}
        accountId={teamAccount?.account_id}
        accountName={teamAccount?.name}
      />
    ),
  },
  {
    icon: <CheckCircle className="h-5 w-5 text-green-600" />,
    title: "Review Expenses",
    description: "Approve or reject team member expenses",
    badge: { text: "Pending", variant: "outline" },
    action: (
      <Button asChild className="w-full" size="sm" variant="outline">
        <Link href={`/dashboard/${accountSlug}/expenses`}>View All Expenses</Link>
      </Button>
    ),
  },
  {
    icon: <BarChart3 className="h-5 w-5 text-blue-600" />,
    title: "Analytics",
    description: "View spending trends and generate detailed reports",
    badge: { text: "Analytics", variant: "outline" },
    action: (
      <Button asChild className="w-full" size="sm" variant="outline">
        <Link href={`/dashboard/${accountSlug}/analytics`}>View Analytics</Link>
      </Button>
    ),
  },
  {
    icon: <Settings className="h-5 w-5 text-gray-600" />,
    title: "Team Settings",
    description: "Manage team members, roles, and rates",
    badge: { text: "Admin", variant: "outline" },
    action: (
      <Button asChild className="w-full" size="sm" variant="outline">
        <Link href={`/dashboard/${accountSlug}/settings`}>Manage Team</Link>
      </Button>
    ),
  },
];

export const personalQuickActions: QuickAction[] = [
  {
    icon: <Receipt className="h-5 w-5 text-primary" />,
    title: "Submit Expense",
    description: "Upload receipts and let AI extract the details",
    badge: { text: "New", variant: "secondary" },
    action: <NewExpenseDrawer fullWidth={true} />,
  },
  {
    icon: <CheckCircle className="h-5 w-5 text-green-600" />,
    title: "My Expenses",
    description: "View and manage all your submitted expenses",
    badge: { text: "View", variant: "outline" },
    action: (
      <Button asChild className="w-full" size="sm" variant="outline">
        <Link href="/dashboard/expenses">View Expenses</Link>
      </Button>
    ),
  },
  {
    icon: <BarChart3 className="h-5 w-5 text-blue-600" />,
    title: "Spending Insights",
    description: "Track your spending patterns and trends",
    badge: { text: "Analytics", variant: "outline" },
    action: (
      <Button asChild className="w-full" size="sm" variant="outline">
        <Link href="/dashboard/analytics">View Analytics</Link>
      </Button>
    ),
  },
  {
    icon: <Settings className="h-5 w-5 text-gray-600" />,
    title: "Account Settings",
    description: "Manage your account preferences and profile",
    badge: { text: "Settings", variant: "outline" },
    action: (
      <Button asChild className="w-full" size="sm" variant="outline">
        <Link href="/dashboard/settings">Manage Settings</Link>
      </Button>
    ),
  },
];
