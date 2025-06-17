import { Download } from "lucide-react";

import { Button } from "@components/ui/button";

interface ExpenseDetailsHeaderProps {
  title: string;
  status: string;
  hasReceipts: boolean;
  isAnalyzing: boolean;
  isRequestingApproval: boolean;
  isManager: boolean;
  onAnalyze: () => void;
  onRequestApproval: () => void;
  onApprove: () => void;
  onReject: () => void;
  onExport: () => void;
}

export function ExpenseDetailsHeader({
  title,
  status,
  hasReceipts,
  isAnalyzing,
  isRequestingApproval,
  isManager,
  onAnalyze,
  onRequestApproval,
  onApprove,
  onReject,
  onExport,
}: Readonly<ExpenseDetailsHeaderProps>) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="flex gap-2">
        {status === "NEW" && (
          <Button
            onClick={onAnalyze}
            disabled={!hasReceipts || isAnalyzing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isAnalyzing ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Analyzing...
              </div>
            ) : (
              "Analyze Receipts"
            )}
          </Button>
        )}
        {status === "ANALYZED" && (
          <Button
            onClick={onRequestApproval}
            disabled={isRequestingApproval}
            className="bg-green-600 hover:bg-green-700"
          >
            {isRequestingApproval ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Requesting...
              </div>
            ) : (
              "Request Approval"
            )}
          </Button>
        )}
        {isManager && status === "PENDING" && (
          <>
            <Button onClick={onApprove} className="bg-green-600 hover:bg-green-700">
              Approve
            </Button>
            <Button onClick={onReject} className="bg-red-600 hover:bg-red-700">
              Reject
            </Button>
          </>
        )}
        {isManager && status === "APPROVED" && (
          <Button onClick={onExport} className="bg-blue-600 hover:bg-blue-700">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        )}
      </div>
    </div>
  );
}
