import { Card, CardContent } from "@components/ui/card";
import { ReceiptLineItem } from "@type/expense";
import { Trash2 } from "lucide-react";
import { Button } from "@components/ui/button";
import { useToast } from "@components/ui/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@components/ui/tooltip";

interface LineItemsListProps {
  lineItems: ReceiptLineItem[];
  onLineItemDeleted?: () => void;
}

export function LineItemsList({ lineItems, onLineItemDeleted }: Readonly<LineItemsListProps>) {
  const { toast } = useToast();

  if (!lineItems || lineItems.length === 0) return null;

  const handleDelete = async (itemId: string) => {
    try {
      const response = await fetch(`/api/expenses/line-items/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete line item");

      toast({
        title: "Success",
        description: "Line item deleted successfully",
      });

      onLineItemDeleted?.();
    } catch (error) {
      console.error("Error deleting line item:", error);
      toast({
        title: "Error",
        description: "Failed to delete line item",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {lineItems.map((item) => (
            <div key={item.id} className="space-y-2 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex min-w-0 items-center gap-2">
                    <h3 className="truncate font-medium">{item.description}</h3>
                    <span className="flex-shrink-0 rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-600">
                      {item.is_ai_generated ? "AI" : "MN"}
                    </span>
                  </div>
                  {item.category && (
                    <p className="text-sm text-gray-500">Category: {item.category}</p>
                  )}
                </div>
                <div className="flex min-w-0 items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">${item.total_amount.toFixed(2)}</p>
                    {item.quantity && item.unit_price && (
                      <p className="text-sm text-gray-500">
                        {item.quantity} × ${item.unit_price.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDelete(item.id)}
                            disabled={item.is_ai_generated}
                            tabIndex={item.is_ai_generated ? -1 : 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {item.is_ai_generated
                          ? "Cannot delete AI-generated item"
                          : "Delete line item"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
