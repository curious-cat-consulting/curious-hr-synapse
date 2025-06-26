import { AlertTriangle, Clock, DollarSign, Receipt, Shield, TrendingUp, User } from "lucide-react";

import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { getFraudDetectionData } from "@lib/actions/fraud-detection";

interface FraudIndicator {
  expense_id: string;
  account_expense_id: number;
  title: string;
  amount: number;
  status: string;
  created_at: string;
  user_id: string;
  user_name: string;
  vendor_name?: string;
  fraud_risk_score: number;
  risk_level: "HIGH" | "MEDIUM" | "LOW";
  indicators: {
    amount_anomaly?: string;
    submission_pattern?: string;
    timing_anomaly?: string;
    vendor_anomaly?: string;
    amount_pattern?: string;
    receipt_quality?: string;
  };
  context: {
    user_avg_amount?: number;
    expense_count_24h?: number;
    vendor_count?: number;
    avg_confidence?: number;
  };
}

interface FraudDetectionCardProps {
  accountId: string;
  accountSlug?: string;
}

// Helper functions moved outside components
const getIndicatorIcon = (indicator: string) => {
  switch (indicator) {
    case "HIGH_AMOUNT_ANOMALY":
    case "MEDIUM_AMOUNT_ANOMALY":
      return <DollarSign className="h-4 w-4" />;
    case "RAPID_SUBMISSION":
    case "FREQUENT_SUBMISSION":
      return <Clock className="h-4 w-4" />;
    case "WEEKEND_SUBMISSION":
    case "AFTER_HOURS_SUBMISSION":
      return <Clock className="h-4 w-4" />;
    case "UNUSUAL_VENDOR":
      return <Receipt className="h-4 w-4" />;
    case "ROUND_AMOUNT":
    case "SUSPICIOUS_AMOUNT":
      return <DollarSign className="h-4 w-4" />;
    case "LOW_RECEIPT_QUALITY":
    case "MEDIUM_RECEIPT_QUALITY":
      return <Receipt className="h-4 w-4" />;
    default:
      return <AlertTriangle className="h-4 w-4" />;
  }
};

const getIndicatorDescription = (indicator: string) => {
  switch (indicator) {
    case "HIGH_AMOUNT_ANOMALY":
      return "Amount significantly above user's average";
    case "MEDIUM_AMOUNT_ANOMALY":
      return "Amount moderately above user's average";
    case "RAPID_SUBMISSION":
      return "Multiple expenses submitted in 24 hours";
    case "FREQUENT_SUBMISSION":
      return "Frequent expense submissions";
    case "WEEKEND_SUBMISSION":
      return "Expense submitted on weekend";
    case "AFTER_HOURS_SUBMISSION":
      return "Expense submitted outside business hours";
    case "UNUSUAL_VENDOR":
      return "Unusual vendor for this user";
    case "ROUND_AMOUNT":
      return "Round dollar amount";
    case "SUSPICIOUS_AMOUNT":
      return "Common fraud amount pattern";
    case "LOW_RECEIPT_QUALITY":
      return "Low confidence receipt analysis";
    case "MEDIUM_RECEIPT_QUALITY":
      return "Medium confidence receipt analysis";
    default:
      return indicator;
  }
};

export async function FraudDetectionCard({
  accountId,
  accountSlug,
}: Readonly<FraudDetectionCardProps>) {
  try {
    const { fraudIndicators, summary } = await getFraudDetectionData(accountId);

    if (fraudIndicators.length === 0) {
      return null;
    }

    const highRiskItems = fraudIndicators.filter(
      (item: FraudIndicator) => item.risk_level === "HIGH"
    );
    const mediumRiskItems = fraudIndicators.filter(
      (item: FraudIndicator) => item.risk_level === "MEDIUM"
    );
    const lowRiskItems = fraudIndicators.filter(
      (item: FraudIndicator) => item.risk_level === "LOW"
    );

    const getRiskColor = (riskLevel: string) => {
      switch (riskLevel) {
        case "HIGH":
          return "bg-red-100 border-red-300 text-red-800 dark:bg-red-950/30 dark:border-red-700 dark:text-red-200";
        case "MEDIUM":
          return "bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-950/30 dark:border-amber-700 dark:text-amber-200";
        case "LOW":
          return "bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-950/30 dark:border-blue-700 dark:text-blue-200";
        default:
          return "bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-950/30 dark:border-gray-700 dark:text-gray-200";
      }
    };

    return (
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <Shield className="h-5 w-5" />
            Fraud Detection Alert
            <span className="ml-auto text-sm font-normal text-amber-600 dark:text-amber-300">
              {fraudIndicators.length} flagged
            </span>
          </CardTitle>
          {summary != null && (
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span>{summary.high_risk_count} High Risk</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <span>{summary.medium_risk_count} Medium Risk</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span>{summary.low_risk_count} Low Risk</span>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {/* High Risk Items */}
          {highRiskItems.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-red-700 dark:text-red-300">
                High Risk Items ({highRiskItems.length})
              </h4>
              {highRiskItems.slice(0, 2).map((item: FraudIndicator) => (
                <FraudIndicatorItem
                  key={`high-${item.expense_id}`}
                  item={item}
                  accountSlug={accountSlug}
                  riskColor={getRiskColor(item.risk_level)}
                />
              ))}
            </div>
          )}

          {/* Medium Risk Items */}
          {mediumRiskItems.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-amber-700 dark:text-amber-300">
                Medium Risk Items ({mediumRiskItems.length})
              </h4>
              {mediumRiskItems.slice(0, 2).map((item: FraudIndicator) => (
                <FraudIndicatorItem
                  key={`medium-${item.expense_id}`}
                  item={item}
                  accountSlug={accountSlug}
                  riskColor={getRiskColor(item.risk_level)}
                />
              ))}
            </div>
          )}

          {/* Low Risk Items */}
          {lowRiskItems.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Low Risk Items ({lowRiskItems.length})
              </h4>
              {lowRiskItems.slice(0, 2).map((item: FraudIndicator) => (
                <FraudIndicatorItem
                  key={`low-${item.expense_id}`}
                  item={item}
                  accountSlug={accountSlug}
                  riskColor={getRiskColor(item.risk_level)}
                />
              ))}
            </div>
          )}

          {/* Show more button - links to filtered view */}
          {fraudIndicators.length > 6 && accountSlug != null && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="w-full text-amber-700 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200"
            >
              <a href={`/dashboard/${accountSlug}/expenses?fraud=high`}>
                View All {fraudIndicators.length} Flagged Expenses
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  } catch (error) {
    console.error("Error fetching fraud detection data:", error);
    return null;
  }
}

interface FraudIndicatorItemProps {
  item: FraudIndicator;
  accountSlug?: string;
  riskColor: string;
}

function FraudIndicatorItem({ item, accountSlug, riskColor }: Readonly<FraudIndicatorItemProps>) {
  const indicators = Object.entries(item.indicators).filter(([_, value]) => value != null);

  return (
    <div className={`rounded-lg border p-3 ${riskColor}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <User className="h-4 w-4 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{item.title}</p>
              <p className="truncate text-sm opacity-80">
                {item.user_name} • {item.vendor_name ?? "No vendor"}
              </p>
            </div>
          </div>

          {/* Risk Score */}
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Risk Score: {item.fraud_risk_score}
            </Badge>
            <Badge
              variant={
                item.risk_level === "HIGH"
                  ? "destructive"
                  : item.risk_level === "MEDIUM"
                    ? "default"
                    : "secondary"
              }
              className="text-xs"
            >
              {item.risk_level} RISK
            </Badge>
          </div>

          {/* Indicators */}
          <div className="space-y-1">
            {indicators.map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 text-xs">
                {getIndicatorIcon(value)}
                <span>{getIndicatorDescription(value)}</span>
              </div>
            ))}
          </div>

          {/* Context Information */}
          {item.context.user_avg_amount != null && item.context.user_avg_amount > 0 && (
            <p className="mt-2 text-xs opacity-70">
              User avg: ${item.context.user_avg_amount.toFixed(2)} • 24h count:{" "}
              {item.context.expense_count_24h ?? 0} • Vendors: {item.context.vendor_count ?? 0}
            </p>
          )}
        </div>

        <div className="ml-3 flex items-center gap-2">
          <div className="text-right">
            <p className="font-medium">${item.amount.toFixed(2)}</p>
            <p className="text-xs opacity-70">#{item.account_expense_id}</p>
          </div>
          {accountSlug != null && (
            <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
              <a href={`/dashboard/${accountSlug}/expenses/${item.expense_id}`}>
                <TrendingUp className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
