import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import type { ExpenseDetails } from "@type/expense";

interface ExpenseDetailsCardProps {
  expense: ExpenseDetails;
}

function getStatusColor(status: string) {
  switch (status) {
    case "APPROVED":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
    case "REJECTED":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
    case "ANALYZED":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
    case "NEW":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    default:
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
  }
}

export function ExpenseDetailsCard({ expense }: Readonly<ExpenseDetailsCardProps>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Details</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Description</dt>
            <dd className="mt-1">{expense.description}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Amount</dt>
            <dd className="mt-1">
              {expense.currency_code} {expense.amount.toFixed(2)}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Status</dt>
            <dd className="mt-1">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                  expense.status
                )}`}
              >
                {expense.status}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Created</dt>
            <dd className="mt-1">{new Date(expense.created_at).toLocaleDateString()}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
