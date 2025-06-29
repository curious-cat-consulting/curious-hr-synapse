"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";

export type ExpenseSortOption = "created_date" | "id" | "title" | "updated_date" | "user";

interface ExpenseSortControlProps {
  sortBy: ExpenseSortOption;
  onSortChange: (value: ExpenseSortOption) => void;
  includeUserSort?: boolean;
}

export function ExpenseSortControl({
  sortBy,
  onSortChange,
  includeUserSort = false,
}: Readonly<ExpenseSortControlProps>) {
  return (
    <div className="flex items-center gap-2">
      <Select value={sortBy} onValueChange={(value: ExpenseSortOption) => onSortChange(value)}>
        <SelectTrigger id="sort" className="w-40" data-testid="sort-control">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="created_date">Created Date</SelectItem>
          <SelectItem value="id">ID</SelectItem>
          <SelectItem value="title">Title</SelectItem>
          <SelectItem value="updated_date">Updated Date</SelectItem>
          {includeUserSort && <SelectItem value="user">User</SelectItem>}
        </SelectContent>
      </Select>
    </div>
  );
}

// Generic sorting function that can be used with any expense type
export function sortExpenses<
  T extends {
    account_expense_id: number;
    title: string;
    created_at: string;
    updated_at?: string;
    user_name?: string;
  },
>(expenses: T[], sortBy: ExpenseSortOption): T[] {
  return [...expenses].sort((a, b) => {
    switch (sortBy) {
      case "created_date":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "id":
        return a.account_expense_id - b.account_expense_id;
      case "title":
        return a.title.localeCompare(b.title);
      case "updated_date":
        if (a.updated_at != null && b.updated_at != null) {
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        }
        // Fall back to created date if updated_at is not available
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "user":
        if (a.user_name != null && b.user_name != null) {
          return a.user_name.localeCompare(b.user_name);
        }
        return 0;
      default:
        return 0;
    }
  });
}
