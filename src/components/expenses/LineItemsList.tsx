import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { ReceiptLineItem } from "@type/expense";

interface LineItemsListProps {
  lineItems: ReceiptLineItem[];
}

export function LineItemsList({ lineItems }: Readonly<LineItemsListProps>) {
  if (!lineItems || lineItems.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Line Items</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {lineItems.map((item) => (
            <div key={item.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{item.description}</h3>
                  {item.category && (
                    <p className="text-sm text-gray-500">
                      Category: {item.category}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium">${item.total_amount.toFixed(2)}</p>
                  {item.quantity && item.unit_price && (
                    <p className="text-sm text-gray-500">
                      {item.quantity} × ${item.unit_price.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
