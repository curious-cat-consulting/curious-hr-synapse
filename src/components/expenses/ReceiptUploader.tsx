import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@components/ui/button";
import { useToast } from "@components/ui/use-toast";
import { Upload } from "lucide-react";

interface ReceiptFile {
  file: File;
  preview: string;
  id: string;
}

interface ReceiptUploaderProps {
  expenseId: string;
  onUploadComplete: () => void;
}

export function ReceiptUploader({
  expenseId,
  onUploadComplete,
}: Readonly<ReceiptUploaderProps>) {
  const { toast } = useToast();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const formData = new FormData();
      acceptedFiles.forEach((file) => {
        formData.append("receipts", file);
      });

      try {
        const response = await fetch(`/api/expenses/${expenseId}/receipts`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to upload receipts");
        }

        toast({
          title: "Success",
          description: "Receipts uploaded successfully",
        });

        onUploadComplete();
      } catch (error) {
        console.error("Error uploading receipts:", error);
        toast({
          title: "Error",
          description: "Failed to upload receipts",
          variant: "destructive",
        });
      }
    },
    [expenseId, onUploadComplete, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg"],
      "application/pdf": [".pdf"],
    },
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
        isDragActive ? "border-primary bg-primary/5" : "border-gray-300"
      }`}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-12 w-12 text-gray-400" />
      <p className="mt-2 text-sm text-gray-600">
        {isDragActive
          ? "Drop the files here..."
          : "Drag & drop receipts here, or click to select files"}
      </p>
      <p className="text-xs text-gray-500 mt-1">
        Supports PNG, JPG, and PDF files
      </p>
    </div>
  );
}
