import Cookies from "js-cookie";
import { useState, useMemo, useEffect } from "react";

import { sortExpenses, type ExpenseSortOption } from "@components/expenses/expense-sort-control";

export type ExpenseStatus = "NEW" | "PENDING" | "ANALYZED" | "APPROVED" | "REJECTED";

interface UseExpenseFiltersProps {
  initialStatusFilters?: ExpenseStatus[];
  initialSelectedUser?: string;
  initialViewMode?: "chronological" | "byUser";
  initialSortBy?: ExpenseSortOption;
  includeTeamFeatures?: boolean;
}

interface UseExpenseFiltersReturn {
  filters: {
    statusFilters: ExpenseStatus[];
    selectedUser: string;
    viewMode: "chronological" | "byUser";
    sortBy: ExpenseSortOption;
  };
  actions: {
    setStatusFilters: (statuses: ExpenseStatus[]) => void;
    setSelectedUser: (userId: string) => void;
    setViewMode: (mode: "chronological" | "byUser") => void;
    setSortBy: (sort: ExpenseSortOption) => void;
    resetFilters: () => void;
  };
  filterExpenses: <
    T extends {
      status: string;
      user_id?: string;
      user_name?: string;
      account_expense_id: number;
      title: string;
      created_at: string;
      updated_at?: string;
    },
  >(
    expenses: T[]
  ) => T[];
  getUniqueUsers: <T extends { user_id?: string; user_name?: string }>(
    expenses: T[]
  ) => Array<{ id: string; name: string }>;
}

interface SavedFilters {
  statusFilters?: ExpenseStatus[];
  selectedUser?: string;
  viewMode?: "chronological" | "byUser";
  sortBy?: ExpenseSortOption;
}

// Add this helper function at the top
const getCookieKey = (includeTeamFeatures: boolean) =>
  includeTeamFeatures ? "team-expense-filters" : "expense-filters";

const loadFiltersFromCookie = (includeTeamFeatures: boolean): SavedFilters | null => {
  try {
    const saved = Cookies.get(getCookieKey(includeTeamFeatures));
    return saved !== undefined ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const saveFiltersToCookie = (filters: SavedFilters, includeTeamFeatures: boolean) => {
  Cookies.set(getCookieKey(includeTeamFeatures), JSON.stringify(filters), {
    expires: 30, // 30 days
  });
};

// In your useExpenseFilters function, replace the useState calls:
export function useExpenseFilters({
  initialStatusFilters = ["NEW", "PENDING", "ANALYZED"],
  initialSelectedUser = "all",
  initialViewMode = "chronological",
  initialSortBy = "created_date",
  includeTeamFeatures = false,
}: UseExpenseFiltersProps = {}): UseExpenseFiltersReturn {
  // Load from cookies on initial render
  const savedFilters = loadFiltersFromCookie(includeTeamFeatures);

  const [statusFilters, setStatusFilters] = useState<ExpenseStatus[]>(
    savedFilters?.statusFilters ?? initialStatusFilters
  );
  const [selectedUser, setSelectedUser] = useState<string>(
    savedFilters?.selectedUser ?? initialSelectedUser
  );
  const [viewMode, setViewMode] = useState<"chronological" | "byUser">(
    savedFilters?.viewMode ?? initialViewMode
  );
  const [sortBy, setSortBy] = useState<ExpenseSortOption>(savedFilters?.sortBy ?? initialSortBy);

  // Save to cookies whenever filters change
  useEffect(() => {
    const filters: SavedFilters = { statusFilters, selectedUser, viewMode, sortBy };
    saveFiltersToCookie(filters, includeTeamFeatures);
  }, [statusFilters, selectedUser, viewMode, sortBy, includeTeamFeatures]);

  const resetFilters = () => {
    setStatusFilters(initialStatusFilters);
    setSelectedUser(initialSelectedUser);
    setViewMode(initialViewMode);
    setSortBy(initialSortBy);
  };

  const filterExpenses = useMemo(
    () =>
      <
        T extends {
          status: string;
          user_id?: string;
          user_name?: string;
          account_expense_id: number;
          title: string;
          created_at: string;
          updated_at?: string;
        },
      >(
        expenses: T[]
      ): T[] => {
        const filtered = expenses.filter((expense) => {
          const statusMatch = statusFilters.includes(expense.status as ExpenseStatus);
          const userMatch =
            !includeTeamFeatures || selectedUser === "all" || expense.user_id === selectedUser;
          return statusMatch && userMatch;
        });

        // Apply sorting to the filtered results
        return sortExpenses(filtered, sortBy);
      },
    [statusFilters, selectedUser, sortBy, includeTeamFeatures]
  );

  const getUniqueUsers = useMemo(
    () =>
      <T extends { user_id?: string; user_name?: string }>(
        expenses: T[]
      ): Array<{ id: string; name: string }> => {
        if (!includeTeamFeatures) return [];

        const userMap = new Map<string, { name: string }>();
        expenses.forEach((expense) => {
          if (
            expense.user_id != null &&
            expense.user_name != null &&
            !userMap.has(expense.user_id)
          ) {
            userMap.set(expense.user_id, {
              name: expense.user_name,
            });
          }
        });

        return Array.from(userMap.entries()).map(([id, user]) => ({
          id,
          name: user.name,
        }));
      },
    [includeTeamFeatures]
  );

  return {
    filters: {
      statusFilters,
      selectedUser,
      viewMode,
      sortBy,
    },
    actions: {
      setStatusFilters,
      setSelectedUser,
      setViewMode,
      setSortBy,
      resetFilters,
    },
    filterExpenses,
    getUniqueUsers,
  };
}
