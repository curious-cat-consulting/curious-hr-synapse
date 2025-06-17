"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ReceiptUploader } from "@components/expenses/ReceiptUploader";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { toast } from "@components/ui/use-toast";

interface ReceiptFile {
  file: File;
  preview: string;
  id: string;
}

export default function NewExpensePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [receipts, setReceipts] = useState<ReceiptFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);

      // Append all receipt files
      receipts.forEach((receipt) => {
        formData.append("receipts", receipt.file);
      });

      const response = await fetch("/api/expenses", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to create expense report");
      }

      // Show success toast and redirect
      toast({
        title: "Success",
        description: "Expense report created successfully",
        variant: "success",
      });
      router.push("/dashboard/expenses?success=true");
    } catch (error: any) {
      console.error("Error creating expense report:", error);
      toast({
        title: "Error",
        description: error.message ?? "Failed to create expense report",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>New Expense Report</CardTitle>
        </CardHeader>
        <CardContent>
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
              <ReceiptUploader mode="manual" onFilesSelected={setReceipts} />
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Expense Report"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
