"use client";

import { FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@components/ui/button";

interface ReceiptDownloadButtonProps {
  expenseId: string;
  receiptId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function ReceiptDownloadButton({
  expenseId,
  receiptId,
  variant = "outline",
  size = "sm",
  className,
}: Readonly<ReceiptDownloadButtonProps>) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      const response = await fetch(`/api/expenses/${expenseId}/receipts/${receiptId}/download`);

      if (!response.ok) {
        throw new Error("Failed to download receipt");
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] ?? "receipt";

      // Create a blob from the response
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;

      // Trigger the download
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Receipt downloaded successfully");
    } catch (error) {
      console.error("Error downloading receipt:", error);
      toast.error("Failed to download receipt");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={handleDownload}
            disabled={isDownloading}
            className={className}
          >
            <FileText className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isDownloading ? "Downloading..." : "Download receipt"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
