import { Trash2, Car, Receipt } from "lucide-react";

import { Button } from "@components/ui/button";
import type { LineItem } from "@type/expense";

interface LineItemCardProps {
  item: LineItem;
  canEdit: boolean;
  onDelete: (itemId: string, itemType: "regular" | "miles") => void;
}

// Function to extract street name from address
const extractStreetName = (address: string): string => {
  if (address === "") return "";

  // Remove common suffixes and prefixes
  const cleanAddress = address
    .replace(/^(apt|apartment|suite|ste|unit|#)\s*\d+/i, "") // Remove apartment/unit numbers
    .replace(/,\s*\d{5}(-\d{4})?/g, "") // Remove ZIP codes
    .replace(/,\s*[A-Z]{2}\s*\d{5}(-\d{4})?/g, "") // Remove state + ZIP
    .replace(/,\s*[A-Z]{2}$/g, "") // Remove just state
    .replace(/,\s*[^,]+$/g, "") // Remove last comma-separated part (usually city)
    .trim();

  // If we still have a comma, take the first part (usually street)
  if (cleanAddress.includes(",")) {
    return cleanAddress.split(",")[0].trim();
  }

  return cleanAddress;
};

// Function to create short title for mileage items
const createMileageTitle = (fromAddress: string, toAddress: string): string => {
  const fromStreet = extractStreetName(fromAddress);
  const toStreet = extractStreetName(toAddress);

  if (fromStreet !== "" && toStreet !== "") {
    return `${fromStreet} → ${toStreet}`;
  }

  // Fallback to original addresses if parsing fails
  return `${fromAddress} → ${toAddress}`;
};

export function LineItemCard({ item, canEdit, onDelete }: Readonly<LineItemCardProps>) {
  const isDeleted = item.is_deleted ?? false;

  return (
    <div
      className={`space-y-2 rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
        isDeleted
          ? "border-gray-200 bg-gray-50/50 opacity-60 dark:border-gray-700 dark:bg-gray-900/30"
          : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start gap-2">
            {item._type === "miles" ? (
              <Car
                className={`mt-0.5 h-4 w-4 flex-shrink-0 ${isDeleted ? "text-gray-400 dark:text-gray-500" : "text-blue-500"}`}
              />
            ) : (
              <Receipt
                className={`mt-0.5 h-4 w-4 flex-shrink-0 ${isDeleted ? "text-gray-400 dark:text-gray-500" : "text-green-500"}`}
              />
            )}
            <div className="min-w-0 flex-1">
              {item._type === "miles" ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`truncate font-medium ${
                        isDeleted ? "text-gray-400 line-through dark:text-gray-500" : ""
                      }`}
                    >
                      {createMileageTitle(item.from_address, item.to_address)}
                    </h3>
                    <span
                      className={`flex-shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${
                        isDeleted
                          ? "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                          : "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-100"
                      }`}
                    >
                      Miles
                    </span>
                    {isDeleted && (
                      <span className="flex-shrink-0 rounded bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-500 dark:bg-red-900/20 dark:text-red-400">
                        Deleted
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5 text-sm">
                    <p
                      className={`${
                        isDeleted
                          ? "text-gray-400 dark:text-gray-500"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      <span className="font-medium">From:</span>{" "}
                      <span className="break-words">{item.from_address}</span>
                    </p>
                    <p
                      className={`${
                        isDeleted
                          ? "text-gray-400 dark:text-gray-500"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      <span className="font-medium">To:</span>{" "}
                      <span className="break-words">{item.to_address}</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3
                    className={`truncate font-medium ${
                      isDeleted ? "text-gray-400 line-through dark:text-gray-500" : ""
                    }`}
                  >
                    {item.description}
                  </h3>
                  <span
                    className={`flex-shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${
                      isDeleted
                        ? "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                        : "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-100"
                    }`}
                  >
                    {item.is_ai_generated ? "AI" : "Manual"}
                  </span>
                  {isDeleted && (
                    <span className="flex-shrink-0 rounded bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-500 dark:bg-red-900/20 dark:text-red-400">
                      Deleted
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {(item.category ?? "") !== "" && (
            <p
              className={`text-sm ${
                isDeleted ? "text-gray-400 dark:text-gray-500" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              Category: {item.category}
            </p>
          )}

          {item._type === "miles" && (
            <p
              className={`text-sm ${
                isDeleted ? "text-gray-400 dark:text-gray-500" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              Miles: {item.miles_driven} • Rate: $0.655/mile
            </p>
          )}

          {item._type === "regular" && (item.quantity ?? 0) > 0 && (item.unit_price ?? 0) > 0 && (
            <p
              className={`text-sm ${
                isDeleted ? "text-gray-400 dark:text-gray-500" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {item.quantity} × ${item.unit_price?.toFixed(2)}
            </p>
          )}

          {(item.line_item_date ?? "") !== "" && (
            <p
              className={`mt-1 text-xs ${
                isDeleted ? "text-gray-400 dark:text-gray-500" : "text-gray-400 dark:text-gray-500"
              }`}
            >
              Date: {new Date(item.line_item_date!).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="flex min-w-0 flex-shrink-0 items-center gap-4">
          <div className="text-right">
            <p className={`font-medium ${isDeleted ? "text-gray-400 dark:text-gray-500" : ""}`}>
              ${item.total_amount.toFixed(2)}
            </p>
          </div>

          {canEdit && !isDeleted && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                onClick={() => onDelete(item.id, item._type)}
                title="Delete line item"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
