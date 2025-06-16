import { Card, CardContent } from "@components/ui/card";
import { Expense } from "@type/expense";
import Link from "next/link";

interface ExpenseCardProps {
  expense: Expense;
}

export function ExpenseCard({ expense }: Readonly<ExpenseCardProps>) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "ANALYZED":
        return "bg-blue-100 text-blue-800";
      case "NEW":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <Link href={`/dashboard/expenses/${expense.id}`}>
      <Card className="cursor-pointer transition-colors hover:bg-gray-50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold">{expense.title}</h3>
              <p className="text-sm text-gray-500">{expense.description}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">
                {expense.currency_code} {expense.amount.toFixed(2)}
              </p>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                  expense.status
                )}`}
              >
                {expense.status}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
