import { AlertTriangle, ExternalLink, Receipt } from "lucide-react";

import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { getDuplicateDetectionData } from "@lib/actions/duplicate-detection";

interface DuplicateReceipt {
  receipt_id: string;
  vendor_name: string;
  receipt_date: string;
  receipt_total: number;
  expense_id: string;
  expense_title: string;
  user_name: string;
  similarity_score: number;
  match_reason: string;
}

interface DuplicateDetectionCardProps {
  expenseId: string;
  accountSlug?: string;
}

export async function DuplicateDetectionCard({
  expenseId,
  accountSlug,
}: Readonly<DuplicateDetectionCardProps>) {
  try {
    const duplicates = await getDuplicateDetectionData(expenseId);

    if (duplicates.length === 0) {
      return null;
    }

    const highConfidenceDuplicates = duplicates.filter(
      (d: DuplicateReceipt) => d.similarity_score >= 0.8
    );
    const mediumConfidenceDuplicates = duplicates.filter(
      (d: DuplicateReceipt) => d.similarity_score >= 0.5 && d.similarity_score < 0.8
    );

    return (
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-5 w-5" />
            Potential Duplicates Detected
            <span className="ml-auto text-sm font-normal text-amber-600 dark:text-amber-300">
              {duplicates.length} found
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* High confidence duplicates */}
          {highConfidenceDuplicates.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-amber-700 dark:text-amber-300">
                High Confidence Matches ({highConfidenceDuplicates.length})
              </h4>
              {highConfidenceDuplicates.slice(0, 2).map((duplicate: DuplicateReceipt) => (
                <DuplicateReceiptItem
                  key={`high-${duplicate.receipt_id}-${duplicate.expense_id}`}
                  duplicate={duplicate}
                  accountSlug={accountSlug}
                  isHighConfidence={true}
                />
              ))}
            </div>
          )}

          {/* Medium confidence duplicates */}
          {mediumConfidenceDuplicates.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-amber-600 dark:text-amber-400">
                Medium Confidence Matches ({mediumConfidenceDuplicates.length})
              </h4>
              {mediumConfidenceDuplicates.slice(0, 2).map((duplicate: DuplicateReceipt) => (
                <DuplicateReceiptItem
                  key={`medium-${duplicate.receipt_id}-${duplicate.expense_id}`}
                  duplicate={duplicate}
                  accountSlug={accountSlug}
                  isHighConfidence={false}
                />
              ))}
            </div>
          )}

          {/* Show more button - links to filtered view */}
          {duplicates.length > 4 && accountSlug != null && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="w-full text-amber-700 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200"
            >
              <a href={`/dashboard/${accountSlug}/expenses?duplicates=true`}>
                View All {duplicates.length} Potential Duplicates
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  } catch (error) {
    console.error("Error fetching duplicate detection data:", error);
    return null;
  }
}

interface DuplicateReceiptItemProps {
  duplicate: DuplicateReceipt;
  accountSlug?: string;
  isHighConfidence: boolean;
}

function DuplicateReceiptItem({
  duplicate,
  accountSlug,
  isHighConfidence,
}: Readonly<DuplicateReceiptItemProps>) {
  const confidenceColor = isHighConfidence
    ? "bg-red-100 border-red-300 text-red-800 dark:bg-red-950/30 dark:border-red-700 dark:text-red-200"
    : "bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-950/30 dark:border-amber-700 dark:text-amber-200";

  return (
    <div className={`flex items-center justify-between rounded-lg border p-3 ${confidenceColor}`}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{duplicate.vendor_name}</p>
            <p className="truncate text-sm opacity-80">
              {duplicate.expense_title} • {duplicate.user_name}
            </p>
            <p className="text-xs opacity-70">
              {duplicate.receipt_date} • {duplicate.match_reason}
            </p>
          </div>
        </div>
      </div>
      <div className="ml-3 flex items-center gap-2">
        <div className="text-right">
          <p className="font-medium">${duplicate.receipt_total.toFixed(2)}</p>
          <p className="text-xs opacity-70">
            {Math.round(duplicate.similarity_score * 100)}% match
          </p>
        </div>
        {accountSlug != null && accountSlug !== "" && (
          <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
            <a href={`/dashboard/${accountSlug}/expenses/${duplicate.expense_id}`}>
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
