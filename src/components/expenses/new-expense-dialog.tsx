"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
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

export function NewExpenseDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);

      const response = await fetch("/api/expenses", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to create expense report");
      }

      // Show success toast and close dialog
      toast.success("Expense report created successfully");
      setOpen(false);

      // Reset form
      setTitle("");
      setDescription("");
    } catch {
      toast.error("Failed to create expense report");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceiptUpload = async (_files: File[]) => {
    // This will be handled by the ReceiptUploader component itself
    // We just need to provide the callback for the dialog context
    return Promise.resolve();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
              onUpload={handleReceiptUpload}
              title=""
              description=""
              className="border-0 shadow-none"
              showUploadButton={false}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Expense Report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
