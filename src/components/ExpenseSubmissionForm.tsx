import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-hot-toast";

import { LoadingScreen } from "@components/ui/loading-screen";
import { createClient } from "@lib/supabase/client";

interface ExpenseSubmissionFormProps {
  userId: string;
}

export default function ExpenseSubmissionForm({ userId }: Readonly<ExpenseSubmissionFormProps>) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg"],
      "application/pdf": [".pdf"],
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const supabase = createClient();
      // Upload files to Supabase Storage
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const { data, error } = await supabase.storage.from("receipts").upload(filePath, file);

        if (error) throw error;

        // Get the public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("receipts").getPublicUrl(filePath);

        return {
          receiptUrl: publicUrl,
          fileName: file.name,
          fileType: file.type,
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      // Send to API for AI processing
      const response = await fetch("/api/expenses/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: uploadedFiles,
          userId,
        }),
      });

      if (!response.ok) throw new Error("Failed to analyze receipts");

      const analyzedExpenses = await response.json();
      setExpenses(analyzedExpenses);
      toast.success("Receipts uploaded and analyzed successfully!");

      // Clear the form
      setFiles([]);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to upload receipts");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      {isUploading && <LoadingScreen message="Analyzing your receipts..." />}
      <div className="mx-auto max-w-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p>Drop the files here ...</p>
            ) : (
              <p>Drag and drop receipts here, or click to select files</p>
            )}
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Selected Files:</h3>
              <ul className="list-inside list-disc">
                {files.map((file) => (
                  <li key={file.name}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="submit"
            disabled={files.length === 0 || isUploading}
            className={`w-full rounded-md px-4 py-2 font-medium text-white ${
              isUploading || files.length === 0
                ? "cursor-not-allowed bg-gray-400"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isUploading ? "Uploading..." : "Submit Expenses"}
          </button>
        </form>

        {expenses.length > 0 && (
          <div className="mt-8">
            <h3 className="mb-4 text-lg font-medium">Analyzed Expenses</h3>
            <div className="space-y-4">
              {expenses.map((expense, index) => (
                <div key={expense.id} className="rounded-lg border p-4">
                  <p>
                    <strong>Amount:</strong> ${expense.amount}
                  </p>
                  <p>
                    <strong>Category:</strong> {expense.category}
                  </p>
                  <p>
                    <strong>Confidence:</strong> {expense.confidence}%
                  </p>
                  {expense.notes && (
                    <p>
                      <strong>Notes:</strong> {expense.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
