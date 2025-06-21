"use client";

import type { FilePondFile, FilePondInitialFile } from "filepond";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import { X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FilePond, registerPlugin } from "react-filepond";
import { toast } from "react-toastify";

// Import FilePond styles
import "filepond/dist/filepond.min.css";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";

import { Button } from "@components/ui/button";

// Register FilePond plugins
registerPlugin(FilePondPluginImagePreview);

interface ReceiptUploaderProps {
  expenseId?: string;
  onUpload?: (files: File[]) => Promise<void>;
  onFilesChange?: (files: File[]) => void;
  className?: string;
  title?: string;
  description?: string;
  showUploadButton?: boolean;
}

export function ReceiptUploader({
  expenseId,
  onUpload,
  onFilesChange,
  className = "",
  title = "Upload Receipts",
  description = "Drag and drop your receipt files here or click to browse",
  showUploadButton = true,
}: Readonly<ReceiptUploaderProps>) {
  const [files, setFiles] = useState<(FilePondInitialFile | FilePondFile)[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Memoize the file objects to prevent unnecessary re-renders
  const fileObjects = useCallback(() => {
    return files
      .filter((file): file is FilePondFile => "file" in file)
      .map((file) => file.file as File);
  }, [files]);

  // Notify parent when files change (for cases where showUploadButton is false)
  useEffect(() => {
    if (onFilesChange !== undefined && !showUploadButton) {
      onFilesChange(fileObjects());
    }
  }, [fileObjects, onFilesChange, showUploadButton]);

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Please select at least one receipt to upload");
      return;
    }

    setIsUploading(true);

    try {
      if (onUpload !== undefined) {
        // Use custom upload handler if provided
        await onUpload(fileObjects());
      } else if (expenseId !== undefined && expenseId !== "") {
        // Default upload behavior
        const formData = new FormData();
        formData.append("expenseId", expenseId);

        files.forEach((file) => {
          if ("file" in file) {
            formData.append("receipts", file.file);
          }
        });

        const response = await fetch(`/api/expenses/${expenseId}/receipts`, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to upload receipts");
        }
      }

      // Show success toast and reset files
      toast.success("Receipts uploaded successfully");
      setFiles([]);
    } catch {
      toast.error("Failed to upload receipts");
    } finally {
      setIsUploading(false);
    }
  };

  const showHeader = title !== "" || description !== "";

  return (
    <div className={`overflow-hidden ${className}`}>
      {showHeader && (
        <div className="border-b bg-gray-50/50 p-6 dark:bg-gray-900/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>
            </div>
            {files.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFiles([])}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="mr-1 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="p-6">
        <FilePond
          // @ts-ignore
          files={files}
          onupdatefiles={setFiles}
          allowMultiple={true}
          maxFiles={5}
          name="receipts"
          labelIdle='Drag & drop to add receipts or <span class="filepond--label-action">Browse</span>'
          acceptedFileTypes={["image/*", "application/pdf"]}
          allowImagePreview={true}
          imagePreviewMaxFileSize="10MB"
        />

        {files.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {files.length} receipt{files.length !== 1 ? "s" : ""} selected
            </p>
            {showUploadButton && (
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isUploading ? "Uploading..." : "Upload Receipts"}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
