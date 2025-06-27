import { AlertTriangle, Shield } from "lucide-react";

import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Progress } from "@components/ui/progress";
import { getFraudDetectionSummary } from "@lib/actions/fraud-detection";

interface FraudSummary {
  total_expenses: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  avg_risk_score: number;
  max_risk_score: number;
  risk_percentage: number;
}

interface FraudDetectionOverviewProps {
  accountId: string;
  accountSlug: string;
}

export async function FraudDetectionOverview({
  accountId,
  accountSlug,
}: Readonly<FraudDetectionOverviewProps>) {
  try {
    const summary = await getFraudDetectionSummary(accountId);

    if (summary == null || summary.total_expenses === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Fraud Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="py-6 text-center">
              <Shield className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No expenses to analyze yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Fraud detection will activate once expenses are submitted
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    const totalRiskCount =
      summary.high_risk_count + summary.medium_risk_count + summary.low_risk_count;
    const riskPercentage = summary.risk_percentage;

    const getRiskLevel = () => {
      if (riskPercentage >= 20)
        return { level: "HIGH", color: "text-red-600", bgColor: "bg-red-100" };
      if (riskPercentage >= 10)
        return { level: "MEDIUM", color: "text-amber-600", bgColor: "bg-amber-100" };
      return { level: "LOW", color: "text-green-600", bgColor: "bg-green-100" };
    };

    const riskLevel = getRiskLevel();

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Fraud Detection
            <Badge variant="outline" className="ml-auto">
              {summary.total_expenses} expenses
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Risk Overview */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Risk Level</p>
              <p className={`text-lg font-semibold ${riskLevel.color}`}>{riskLevel.level}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">Risk Score</p>
              <p className="text-lg font-semibold">{summary.avg_risk_score.toFixed(1)}/100</p>
            </div>
          </div>

          {/* Risk Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Risk Percentage</span>
              <span>{riskPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={riskPercentage} className="h-2" />
          </div>

          {/* Risk Breakdown */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summary.high_risk_count}</div>
              <div className="text-xs text-muted-foreground">High Risk</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{summary.medium_risk_count}</div>
              <div className="text-xs text-muted-foreground">Medium Risk</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.low_risk_count}</div>
              <div className="text-xs text-muted-foreground">Low Risk</div>
            </div>
          </div>

          {/* Action Button */}
          {totalRiskCount > 0 && (
            <Button variant="outline" className="w-full" asChild>
              <a href={`/dashboard/${accountSlug}/expenses?fraud=high`}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Review {totalRiskCount} Flagged Expenses
              </a>
            </Button>
          )}

          {/* Insights */}
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>• Analyzes spending patterns, timing, and vendor behavior</p>
            <p>• Flags expenses with unusual amounts or submission patterns</p>
            <p>• Only visible to team owners and administrators</p>
          </div>
        </CardContent>
      </Card>
    );
  } catch (error) {
    console.error("Error fetching fraud detection summary:", error);
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Fraud Detection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-6 text-center">
            <p className="text-red-600">Error loading fraud detection data</p>
          </div>
        </CardContent>
      </Card>
    );
  }
}
