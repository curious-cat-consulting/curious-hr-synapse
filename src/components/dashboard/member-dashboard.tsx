import { FileText, Calendar, Users } from "lucide-react";
import Link from "next/link";

import { RecentActivity } from "@components/dashboard/recent-activity";
import { NewExpenseDrawer } from "@components/expenses/new-expense-drawer";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";

interface MemberDashboardProps {
  teamAccount: {
    account_id: string;
    name: string;
  };
  userRole: {
    account_role: string;
    is_primary_owner: boolean;
  };
}

export function MemberDashboard({ teamAccount, userRole }: Readonly<MemberDashboardProps>) {
  return (
    <div className="container mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Team Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to {teamAccount.name} - Your team expense management hub
        </p>
      </div>

      {/* Member Quick Actions */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Submit Expense
              </CardTitle>
              <CardDescription>Create a new expense report</CardDescription>
            </CardHeader>
            <CardContent>
              <NewExpenseDrawer
                accountId={teamAccount.account_id}
                accountName={teamAccount.name}
                fullWidth={true}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                View My Expenses
              </CardTitle>
              <CardDescription>See your submitted expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/expenses">View My Expenses</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Team Information and Recent Activity */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Team Information & Activity</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Team Name</p>
                <p className="text-lg font-semibold">{teamAccount.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Your Role</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {userRole.account_role}
                  </Badge>
                  {userRole.is_primary_owner && <Badge variant="outline">Primary Owner</Badge>}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Team ID</p>
                <p className="rounded bg-muted p-2 font-mono text-sm">{teamAccount.account_id}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Latest Updates</CardTitle>
              <CardDescription>Recent activity from your team</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentActivity title="" accountId={teamAccount.account_id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
