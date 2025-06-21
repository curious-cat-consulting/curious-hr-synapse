"use client";

import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";

import { ReceiptUploader } from "@/src/components/shared/receipt-uploader";
import { Button } from "@components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { LoadingIndicator } from "@components/ui/loading-indicator";

interface NewExpenseDialogProps {
  onExpenseCreated?: (expenseId: string) => void;
}

interface ExpenseApiResponse {
  success: boolean;
  data: {
    id: string;
    title: string;
    description: string;
    status: string;
    created_at: string;
    updated_at: string;
  };
}

export function NewExpenseDialog({ onExpenseCreated }: Readonly<NewExpenseDialogProps>) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptFiles, setReceiptFiles] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Close dialog immediately when submission starts
    setOpen(false);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);

      // Add receipt files to form data
      receiptFiles.forEach((file) => {
        formData.append("receipts", file);
      });

      const response = await fetch("/api/expenses", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as ExpenseApiResponse;

      if (!response.ok) {
        throw new Error((data as any).error ?? "Failed to create expense report");
      }

      // Notify parent with expense ID immediately
      try {
        if (data.data.id !== "") {
          onExpenseCreated?.(data.data.id);
        }
      } catch {
        // Ignore callback errors
      }

      // Show success toast
      toast.success("Expense report created successfully");

      // Reset form
      setTitle("");
      setDescription("");
      setReceiptFiles([]);
    } catch {
      toast.error("Failed to create expense report");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFilesChange = useCallback((files: File[]) => {
    setReceiptFiles(files);
  }, []);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isSubmitting) {
      // Reset form when closing (but not when submitting)
      setTitle("");
      setDescription("");
      setReceiptFiles([]);
    }
    setOpen(newOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Expense
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>New Expense Report</DialogTitle>
            <DialogDescription>
              Create a new expense report and upload your receipts
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter expense report title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter expense report description"
              />
            </div>

            <div className="space-y-2">
              <Label>Receipts</Label>
              <ReceiptUploader
                onFilesChange={handleFilesChange}
                title=""
                description=""
                className="border-0 shadow-none"
                showUploadButton={false}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Expense Report"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <LoadingIndicator isVisible={isSubmitting} />
    </>
  );
}
