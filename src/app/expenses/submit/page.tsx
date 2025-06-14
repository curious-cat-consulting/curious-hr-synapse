import ExpenseSubmissionForm from "@/components/ExpenseSubmissionForm";
import { Toaster } from "react-hot-toast";

export default function SubmitExpensesPage() {
  // TODO: Get these from the authenticated user's session
  const organizationId = "temp-org-id";
  const userId = "temp-user-id";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Submit Expenses</h1>
          <p className="mt-2 text-gray-600">
            Upload your receipts and let AI handle the rest
          </p>
        </div>

        <ExpenseSubmissionForm
          organizationId={organizationId}
          userId={userId}
        />
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
