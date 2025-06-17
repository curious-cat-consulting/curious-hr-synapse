import { Upload, X, FileText, Image } from "lucide-react";
import { useCallback } from "react";
import { useDropzone, type DropzoneOptions } from "react-dropzone";

import { Button } from "@components/ui/button";
import type { UploadFile } from "@hooks/useFileUpload";
import { cn } from "@lib/utils";

interface FileDropzoneProps {
  onDrop: (files: File[]) => void;
  accept?: DropzoneOptions["accept"];
  disabled?: boolean;
  multiple?: boolean;
  maxSize?: number;
  files?: UploadFile[];
  onRemoveFile?: (id: string) => void;
  className?: string;
  dropzoneText?: {
    active: string;
    inactive: string;
    subtitle?: string;
  };
  showFileList?: boolean;
}

const getFileIcon = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (extension === undefined) {
    return <FileText className="h-4 w-4" />;
  }

  if (["png", "jpg", "jpeg", "gif", "webp"].includes(extension)) {
    return <Image className="h-4 w-4" aria-label="Image file" />;
  }

  return <FileText className="h-4 w-4" />;
};

export function FileDropzone({
  onDrop,
  accept = {
    "image/*": [".png", ".jpg", ".jpeg"],
    "application/pdf": [".pdf"],
  },
  disabled = false,
  multiple = true,
  maxSize = 10 * 1024 * 1024, // 10MB
  files = [],
  onRemoveFile,
  className,
  dropzoneText = {
    active: "Drop the files here...",
    inactive: "Drag & drop files here, or click to select files",
    subtitle: "Supports PNG, JPG, and PDF files",
  },
  showFileList = true,
}: Readonly<FileDropzoneProps>) {
  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      onDrop(acceptedFiles);
    },
    [onDrop]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop: handleDrop,
    accept,
    disabled,
    multiple,
    maxSize,
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive ? dropzoneText.active : dropzoneText.inactive}
        </p>
        {dropzoneText.subtitle !== undefined && (
          <p className="mt-1 text-xs text-gray-500">{dropzoneText.subtitle}</p>
        )}
      </div>

      {/* File Rejections */}
      {fileRejections.length > 0 && (
        <div className="rounded-lg bg-red-50 p-3">
          <h4 className="text-sm font-medium text-red-800">Some files were rejected:</h4>
          <ul className="mt-1 text-xs text-red-700">
            {fileRejections.map(({ file, errors }) => (
              <li key={file.name}>
                {file.name} - {errors.map((e) => e.message).join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* File List */}
      {showFileList && files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Selected Files:</h4>
          <div className="space-y-2">
            {files.map((uploadFile) => (
              <div
                key={uploadFile.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
              >
                <div className="flex min-w-0 flex-1 items-center space-x-2">
                  {getFileIcon(uploadFile.file.name)}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{uploadFile.file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(uploadFile.file.size)}</p>
                  </div>
                </div>
                {onRemoveFile !== undefined && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveFile(uploadFile.id)}
                    className="ml-2 h-8 w-8 p-0 hover:bg-red-100"
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
