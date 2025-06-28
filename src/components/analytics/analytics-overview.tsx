import { format } from "date-fns";
import { DollarSign, FileText, Users, TrendingUp, Calendar, Clock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";

interface AnalyticsOverviewProps {
  data: {
    total_expenses: number;
    total_amount: number;
    avg_amount: number;
    total_members: number;
    first_expense_date: string;
    last_expense_date: string;
  };
}

export function AnalyticsOverview({ data }: Readonly<AnalyticsOverviewProps>) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy");
  };

  const getTimeRange = () => {
    if (
      data.first_expense_date.length === 0 ||
      data.first_expense_date === "" ||
      data.last_expense_date.length === 0 ||
      data.last_expense_date === ""
    ) {
      return "No data";
    }

    const first = new Date(data.first_expense_date);
    const last = new Date(data.last_expense_date);
    const diffTime = Math.abs(last.getTime() - first.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day";
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${Math.floor(diffDays / 365)} years`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Total Expenses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.total_expenses.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Across all team members</p>
        </CardContent>
      </Card>

      {/* Total Amount */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.total_amount)}</div>
          <p className="text-xs text-muted-foreground">Combined spending</p>
        </CardContent>
      </Card>

      {/* Average Amount */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Expense</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.avg_amount)}</div>
          <p className="text-xs text-muted-foreground">Per expense</p>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Members</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.total_members}</div>
          <p className="text-xs text-muted-foreground">With expenses</p>
        </CardContent>
      </Card>

      {/* Time Range */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Time Range</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{getTimeRange()}</div>
          <p className="text-xs text-muted-foreground">
            {data.first_expense_date.length > 0 &&
              data.first_expense_date !== "" &&
              data.last_expense_date.length > 0 &&
              data.last_expense_date !== "" && (
                <>
                  {formatDate(data.first_expense_date)} - {formatDate(data.last_expense_date)}
                </>
              )}
          </p>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.last_expense_date.length > 0 && data.last_expense_date !== ""
              ? formatDate(data.last_expense_date)
              : "N/A"}
          </div>
          <p className="text-xs text-muted-foreground">Most recent expense</p>
        </CardContent>
      </Card>
    </div>
  );
}
