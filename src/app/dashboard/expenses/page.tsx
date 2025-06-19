import { ExpensesWithFilters } from "@components/expenses/expenses-with-filters";
import { NewExpenseDialog } from "@components/expenses/new-expense-dialog";
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
        <NewExpenseDialog />
      </div>

      <ExpensesWithFilters expenses={expenses ?? []} />
    </div>
  );
}
