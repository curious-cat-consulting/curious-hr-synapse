"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newReceipts = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: `${file.name}-${Date.now()}-${Math.random()}`,
    }));

    setReceipts((prev) => [...prev, ...newReceipts]);
  };

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
        throw new Error(data.error || "Failed to create expense report");
      }

      // Show success toast and redirect
      toast({
        title: "Success",
        description: "Expense report created successfully",
      });
      router.push("/dashboard/expenses?success=true");
    } catch (error: any) {
      console.error("Error creating expense report:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create expense report",
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
              <Label htmlFor="title">Report Title</Label>
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
                placeholder="Enter description (optional)"
              />
            </div>

            <div className="space-y-2">
              <Label>Receipts</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {receipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    className="relative aspect-square border rounded-lg overflow-hidden"
                  >
                    <img
                      src={receipt.preview}
                      alt={`Receipt ${receipt.id}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                <label className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    multiple
                    onChange={handleFileUpload}
                  />
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <span className="mt-2 block text-sm text-gray-500">
                      Upload Receipts
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
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
