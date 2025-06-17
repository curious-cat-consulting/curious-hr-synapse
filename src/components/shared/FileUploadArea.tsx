import { Button } from "@components/ui/button";
import { LoadingScreen } from "@components/ui/loading-screen";
import { useFileUpload, type UploadOptions } from "@hooks/useFileUpload";

import { FileDropzone } from "./FileDropzone";

interface FileUploadAreaProps extends UploadOptions {
  className?: string;
  dropzoneText?: {
    active: string;
    inactive: string;
    subtitle?: string;
  };
  showUploadButton?: boolean;
  uploadButtonText?: string;
  loadingMessage?: string;
}

export function FileUploadArea({
  className,
  dropzoneText,
  showUploadButton = false,
  uploadButtonText = "Upload Files",
  loadingMessage = "Uploading files...",
  ...uploadOptions
}: Readonly<FileUploadAreaProps>) {
  const { files, isUploading, error, addFiles, removeFile, uploadManualFiles } =
    useFileUpload(uploadOptions);

  return (
    <>
      {isUploading && <LoadingScreen message={loadingMessage} />}

      <div className={className}>
        <FileDropzone
          onDrop={addFiles}
          files={files}
          onRemoveFile={removeFile}
          disabled={isUploading}
          dropzoneText={dropzoneText}
        />

        {error !== null && (
          <div className="mt-2 rounded-lg bg-red-50 p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {showUploadButton && files.length > 0 && uploadOptions.mode !== "automatic" && (
          <div className="mt-4">
            <Button
              onClick={uploadManualFiles}
              disabled={isUploading || files.length === 0}
              className="w-full"
            >
              {isUploading ? "Uploading..." : uploadButtonText}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
