import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";

interface ReceiptFile {
  file: File;
  preview: string;
  id: string;
}

interface ReceiptUploaderProps {
  onUpload: (files: ReceiptFile[]) => void;
  existingReceipts?: string[];
}

export function ReceiptUploader({
  onUpload,
  existingReceipts = [],
}: Readonly<ReceiptUploaderProps>) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newReceipts = acceptedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        id: `${file.name}-${Date.now()}-${Math.random()}`,
      }));

      onUpload(newReceipts);
    },
    [onUpload]
  );

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
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          ${isDragActive ? "border-primary bg-primary/5" : "border-gray-300"}`}
      >
        <input {...getInputProps()} />
        <div className="text-center">
          <Upload className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">
            {isDragActive
              ? "Drop the files here..."
              : "Drag and drop receipts here, or click to select files"}
          </p>
        </div>
      </div>

      {existingReceipts.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">Existing Receipts:</h3>
          <ul className="list-disc list-inside">
            {existingReceipts.map((receipt) => (
              <li key={receipt} className="text-sm text-gray-600">
                {receipt}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
