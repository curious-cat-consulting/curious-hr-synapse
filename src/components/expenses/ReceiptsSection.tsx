import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { ReceiptMetadata, ReceiptLineItem } from "@type/expense";
import { ReceiptUploader } from "./ReceiptUploader";

interface ReceiptsSectionProps {
  expenseId: string;
  receiptMetadata: ReceiptMetadata[];
  lineItems: ReceiptLineItem[];
  onReceiptsUploaded: () => void;
}

export function ReceiptsSection({
  expenseId,
  receiptMetadata,
  lineItems,
  onReceiptsUploaded,
}: Readonly<ReceiptsSectionProps>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Receipts & Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ReceiptUploader
          expenseId={expenseId}
          onUploadComplete={onReceiptsUploaded}
        />

        {receiptMetadata && receiptMetadata.length > 0 && (
          <div className="space-y-4">
            {receiptMetadata.map((receipt) => (
              <div key={receipt.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{receipt.vendor_name}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(receipt.receipt_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {receipt.currency_code}{" "}
                      {receipt.receipt_total?.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Confidence: {(receipt.confidence_score * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
                {lineItems
                  ?.filter((item) => item.receipt_name === receipt.receipt_name)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span>{item.description}</span>
                        {item.is_ai_generated && (
                          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                            AI
                          </span>
                        )}
                      </div>
                      <span>
                        {receipt.currency_code} {item.total_amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
