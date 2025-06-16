import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@components/ui/button";
import { useToast } from "@components/ui/use-toast";
import { Upload, X } from "lucide-react";

interface ReceiptFile {
  file: File;
  preview: string;
  id: string;
}

interface ReceiptUploaderProps {
  expenseId?: string;
  onUploadComplete?: () => void;
  onFilesSelected?: (files: ReceiptFile[]) => void;
  mode?: "automatic" | "manual";
}

export function ReceiptUploader({
  expenseId,
  onUploadComplete,
  onFilesSelected,
  mode = "automatic",
}: Readonly<ReceiptUploaderProps>) {
  const { toast } = useToast();
  const [files, setFiles] = useState<ReceiptFile[]>([]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const newFiles = acceptedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        id: Math.random().toString(36).substring(7),
      }));

      if (mode === "manual") {
        setFiles((prev) => [...prev, ...newFiles]);
        onFilesSelected?.([...files, ...newFiles]);
        return;
      }

      if (!expenseId) {
        toast({
          title: "Error",
          description: "Cannot upload receipts without an expense ID",
          variant: "destructive",
        });
        return;
      }

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

        onUploadComplete?.();
      } catch (error) {
        console.error("Error uploading receipts:", error);
        toast({
          title: "Error",
          description: "Failed to upload receipts",
          variant: "destructive",
        });
      }
    },
    [expenseId, onUploadComplete, onFilesSelected, mode, files, toast]
  );

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const newFiles = prev.filter((f) => f.id !== id);
      onFilesSelected?.(newFiles);
      return newFiles;
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg"],
      "application/pdf": [".pdf"],
    },
  });

  return (
    <div className="space-y-4">
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

      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Selected Files:</h4>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <span className="text-sm truncate flex-1">
                  {file.file.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  className="ml-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
