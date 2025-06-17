import { FileUploadArea } from "@components/shared/FileUploadArea";

interface ReceiptUploaderProps {
  expenseId?: string;
  onUploadComplete?: () => void;
  onFilesSelected?: (files: Array<{ file: File; preview: string; id: string }>) => void;
  mode?: "automatic" | "manual";
  className?: string;
}

export function ReceiptUploader({
  expenseId,
  onUploadComplete,
  onFilesSelected,
  mode = "automatic",
  className,
}: Readonly<ReceiptUploaderProps>) {
  return (
    <FileUploadArea
      mode={mode}
      expenseId={expenseId}
      onUploadComplete={onUploadComplete}
      onFilesSelected={onFilesSelected}
      className={className}
      loadingMessage="Uploading and analyzing receipts..."
      dropzoneText={{
        active: "Drop the receipts here...",
        inactive: "Drag & drop receipts here, or click to select files",
        subtitle: "Supports PNG, JPG, and PDF files",
      }}
    />
  );
}
