import { Badge, Card, CardContent, CardHeader, CardTitle } from "@components/ui";

import type { Expense } from "./types";

interface ExpenseCardProps {
  expense: Expense;
}

export function ExpenseCard({ expense }: Readonly<ExpenseCardProps>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Expense #{expense.id}</span>
          <Badge variant="outline">{expense.status}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* TODO: Add more expense details as needed */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{/* Add more expense information here */}</p>
        </div>
      </CardContent>
    </Card>
  );
}
