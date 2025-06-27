"use client";

import { format } from "date-fns";
import { useEffect, useState } from "react";

import { AIAnalyticsCard } from "@/src/components/analytics/ai-analytics-card";
import { AnalyticsOverview } from "@/src/components/analytics/analytics-overview";
import { CategoryBreakdownChart } from "@/src/components/analytics/category-breakdown-chart";
import { MemberPerformanceChart } from "@/src/components/analytics/member-performance-chart";
import { MonthlyTrendsChart } from "@/src/components/analytics/monthly-trends-chart";
import { StatusBreakdownChart } from "@/src/components/analytics/status-breakdown-chart";
import { VendorAnalysisChart } from "@/src/components/analytics/vendor-analysis-chart";
import { Badge } from "@components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import { createClient } from "@lib/supabase/client";

interface AnalyticsData {
  overview: {
    total_expenses: number;
    total_amount: number;
    avg_amount: number;
    total_members: number;
    first_expense_date: string;
    last_expense_date: string;
  };
  status_breakdown: {
    new: number;
    pending: number;
    analyzed: number;
    approved: number;
    rejected: number;
  };
  member_performance: Array<{
    member_name: string;
    expense_count: number;
    total_amount: number;
    avg_amount: number;
  }> | null;
  ai_analytics: {
    total_receipt_metadata: number;
    total_line_items: number;
    ai_generated_line_items: number;
    manual_line_items: number;
    ai_generation_rate: number;
    avg_confidence_score: number;
  };
  monthly_trends: Array<{
    month: string;
    expense_count: number;
    total_amount: number;
  }> | null;
  top_categories: Array<{
    category: string;
    line_item_count: number;
    total_amount: number;
  }> | null;
  top_vendors: Array<{
    vendor_name: string;
    receipt_count: number;
    total_amount: number;
    avg_confidence: number;
  }> | null;
}

interface AnalyticsPageProps {
  type: "personal" | "team";
  title: string;
  description: string;
  accountSlug?: string | null;
  accountName?: string | null;
  accountError?: string | null;
}

export function AnalyticsPage({
  type,
  title,
  description,
  accountSlug,
  accountName,
  accountError,
}: Readonly<AnalyticsPageProps>) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchAnalytics = async () => {
    try {
      const supabase = createClient();
      let data, error;

      if (type === "personal") {
        const result = await supabase.rpc("get_personal_analytics");
        data = result.data;
        error = result.error;
      } else {
        if (accountSlug == null || accountSlug === "") {
          setError("Account slug is required for team analytics");
          setIsLoading(false);
          return;
        }
        const result = await supabase.rpc("get_team_analytics", {
          team_account_slug: accountSlug,
        });
        data = result.data;
        error = result.error;
      }

      if (error !== null) {
        console.error("Error fetching analytics:", error);
        setError(error.message);
        return;
      }

      setAnalyticsData(data as AnalyticsData);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setError("Failed to load analytics data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (type === "personal" || (type === "team" && accountSlug != null)) {
      fetchAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, accountSlug]);

  // Handle account error for team analytics
  if (accountError != null) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <p className="text-red-600">Error loading account: {accountError}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error != null) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <p className="text-red-600">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (analyticsData == null) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <p className="text-gray-600">No analytics data available</p>
          </div>
        </div>
      </div>
    );
  }

  const isTeam = type === "team";
  const tabColumns = isTeam ? "grid-cols-5" : "grid-cols-4";
  const finalDescription =
    isTeam && accountName != null ? description.replace("your team", accountName) : description;

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-muted-foreground">{finalDescription}</p>
          </div>
          <Badge variant="secondary" className="text-sm">
            Last updated: {format(new Date(), "MMM d, yyyy 'at' h:mm a")}
          </Badge>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="mb-8">
        <AnalyticsOverview data={analyticsData.overview} />
      </div>

      {/* AI Analytics Card */}
      <div className="mb-8">
        <AIAnalyticsCard data={analyticsData.ai_analytics} />
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={`grid w-full ${tabColumns}`}>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {isTeam && <TabsTrigger value="members">Team Members</TabsTrigger>}
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Expense Status Breakdown</CardTitle>
                <CardDescription>Distribution of expenses by current status</CardDescription>
              </CardHeader>
              <CardContent>
                <StatusBreakdownChart data={analyticsData.status_breakdown} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
                <CardDescription>
                  Expense count and amount trends over the last 12 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MonthlyTrendsChart data={analyticsData.monthly_trends} />
              </CardContent>
            </Card>
          </div>

          {!isTeam && (
            <Card>
              <CardHeader>
                <CardTitle>Your Performance</CardTitle>
                <CardDescription>Your expense activity and spending patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <MemberPerformanceChart data={analyticsData.member_performance} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {isTeam && (
          <TabsContent value="members" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Member Performance</CardTitle>
                <CardDescription>
                  Expense activity and spending patterns by team member
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MemberPerformanceChart data={analyticsData.member_performance} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Expense Trends</CardTitle>
              <CardDescription>Detailed view of expense patterns over time</CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyTrendsChart data={analyticsData.monthly_trends} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
              <CardDescription>Top spending categories based on line items</CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryBreakdownChart data={analyticsData.top_categories} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Vendors</CardTitle>
              <CardDescription>Most frequent vendors and their spending patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <VendorAnalysisChart data={analyticsData.top_vendors} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
