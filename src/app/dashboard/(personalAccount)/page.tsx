import { PartyPopper } from "lucide-react";
import Link from "next/link";

export default function PersonalAccountPage() {
  return (
    <div className="mx-auto flex h-full w-full max-w-screen-md flex-col content-center items-center justify-center gap-y-4 py-12 text-center">
      <PartyPopper className="h-12 w-12 text-gray-400" />
      <h1 className="text-2xl font-bold">Personal Account</h1>
      <div className="w-full space-y-6">
        <ul className="space-y-3 text-left">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <div>
              <strong>Smart Expense Submission</strong>
              <p className="text-sm text-muted-foreground">
                Upload receipts and let AI automatically extract and categorize expenses
              </p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <div>
              <strong>Real-time Tracking</strong>
              <p className="text-sm text-muted-foreground">
                Monitor your expense status and get instant notifications on approvals
              </p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <div>
              <strong>Expense History</strong>
              <p className="text-sm text-muted-foreground">
                Access your complete expense history and generate reports anytime
              </p>
            </div>
          </li>
        </ul>
        <div className="mt-6 space-y-3">
          <Link
            href="/dashboard/expenses/new"
            className="block w-full rounded-md bg-primary px-4 py-2 text-center text-primary-foreground hover:opacity-90"
          >
            Submit New Expense
          </Link>
          <Link
            href="/dashboard/expenses"
            className="block w-full rounded-md bg-secondary px-4 py-2 text-center text-secondary-foreground hover:opacity-90"
          >
            View My Expenses
          </Link>
        </div>
      </div>
    </div>
  );
}
