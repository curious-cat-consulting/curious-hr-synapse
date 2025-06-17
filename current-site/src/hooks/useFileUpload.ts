import { useCallback, useState, useEffect } from "react";

import { useToast } from "@components/ui/use-toast";

export interface UploadFile {
  file: File;
  preview: string;
  id: string;
}

export interface UploadOptions {
  mode?: "automatic" | "manual";
  expenseId?: string;
  uploadEndpoint?: string;
  onUploadComplete?: () => void;
  onFilesSelected: ((files: UploadFile[]) => void) | undefined;
  maxFiles?: number;
  userId?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export const useFileUpload = (options: UploadOptions) => {
  const {
    mode = "automatic",
    expenseId,
    uploadEndpoint,
    onUploadComplete,
    onFilesSelected,
    maxFiles = 10,
    userId,
  } = options;

  const { toast } = useToast();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isFunction = (value: unknown): value is Function => typeof value === "function";

  const createUploadFile = useCallback((file: File): UploadFile => {
    return {
      file,
      preview: URL.createObjectURL(file),
      id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };
  }, []);

  const handleAutomaticUpload = useCallback(
    async (filesToUpload: File[]) => {
      if (expenseId === undefined) {
        const errorMessage = "Cannot upload files without an expense ID";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      const endpoint = uploadEndpoint ?? `/api/expenses/${expenseId}/receipts`;

      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      filesToUpload.forEach((file) => {
        formData.append("receipts", file);
      });

      if (userId !== undefined) {
        formData.append("userId", userId);
      }

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error ?? "Failed to upload files");
        }

        toast({
          title: "Success",
          description: "Files uploaded successfully",
        });

        onUploadComplete?.();
      } catch (uploadError) {
        const errorMessage =
          uploadError instanceof Error ? uploadError.message : "Failed to upload files";

        console.error("Error uploading files:", uploadError);
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
        setUploadProgress(null);
      }
    },
    [expenseId, uploadEndpoint, userId, onUploadComplete, toast]
  );

  const addFiles = useCallback(
    (newFiles: File[]) => {
      if (newFiles.length === 0) return;

      // Check file limit
      const totalFiles = files.length + newFiles.length;
      if (totalFiles > maxFiles) {
        toast({
          title: "Too many files",
          description: `Maximum ${maxFiles} files allowed. ${totalFiles - maxFiles} files will be ignored.`,
          variant: "destructive",
        });
        newFiles = newFiles.slice(0, maxFiles - files.length);
      }

      const uploadFiles = newFiles.map(createUploadFile);

      if (mode === "manual") {
        setFiles((prev) => [...prev, ...uploadFiles]);
        return;
      }

      // Automatic mode - upload immediately
      handleAutomaticUpload(newFiles);
    },
    [files, maxFiles, mode, createUploadFile, toast, handleAutomaticUpload]
  );

  // Add effect to handle onFilesSelected callback
  useEffect(() => {
    if (mode === "manual" && isFunction(onFilesSelected)) {
      onFilesSelected(files);
    }
  }, [files, mode, onFilesSelected]);

  const removeFile = useCallback(
    (id: string) => {
      setFiles((prev) => {
        const fileToRemove = prev.find((f) => f.id === id);
        if (fileToRemove !== undefined) {
          URL.revokeObjectURL(fileToRemove.preview);
        }

        const updated = prev.filter((f) => f.id !== id);
        onFilesSelected?.(updated);
        return updated;
      });
    },
    [onFilesSelected]
  );

  const clearFiles = useCallback(() => {
    files.forEach((file) => URL.revokeObjectURL(file.preview));
    setFiles([]);
    onFilesSelected?.([]);
    setError(null);
  }, [files, onFilesSelected]);

  const uploadManualFiles = useCallback(async () => {
    if (files.length === 0) return;

    const filesToUpload = files.map((f) => f.file);
    await handleAutomaticUpload(filesToUpload);
    clearFiles();
  }, [files, handleAutomaticUpload, clearFiles]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    files.forEach((file) => URL.revokeObjectURL(file.preview));
  }, [files]);

  return {
    files,
    isUploading,
    uploadProgress,
    error,
    addFiles,
    removeFile,
    clearFiles,
    uploadManualFiles,
    cleanup,
  };
};
