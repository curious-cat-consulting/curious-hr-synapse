import { Plus } from "lucide-react";
import Link from "next/link";

import { ExpensesWithFilters } from "@components/expenses/expenses-with-filters";
import { Button } from "@components/ui/button";
import { createClient } from "@lib/supabase/server";

export default async function ExpensesPage() {
  const supabase = createClient();
  const { data: expenses, error } = await supabase.rpc("get_expenses");

  if (error !== null) {
    console.error("Error fetching expenses:", error);
    return <div>Error loading expenses</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <Button asChild>
          <Link href="/expenses/new">
            <Plus className="mr-2 h-4 w-4" />
            New Expense
          </Link>
        </Button>
      </div>

      <ExpensesWithFilters expenses={expenses ?? []} />
    </div>
  );
}
