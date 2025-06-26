"use client";

import { Filter, RotateCcw, Users, ListOrdered } from "lucide-react";
import * as React from "react";

import {
  ExpenseSortControl,
  type ExpenseSortOption,
} from "@components/expenses/expense-sort-control";
import { ExportExpenseButton } from "@components/expenses/export-expense-button";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { Label } from "@components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@components/ui/tabs";
import { cn } from "@lib/utils";
import type { Expense, TeamExpense } from "@type/expense";

import type { MultiSelectOption } from "../ui/multi-select";
import { MultiSelect } from "../ui/multi-select";

export type ExpenseStatus = "NEW" | "PENDING" | "ANALYZED" | "APPROVED" | "REJECTED";

interface ExpenseFiltersProps {
  // Filter state
  statusFilters: ExpenseStatus[];
  onStatusFiltersChange: (statuses: ExpenseStatus[]) => void;

  selectedUser?: string;
  onSelectedUserChange?: (userId: string) => void;

  viewMode?: "chronological" | "byUser";
  onViewModeChange?: (mode: "chronological" | "byUser") => void;

  sortBy: ExpenseSortOption;
  onSortByChange: (sort: ExpenseSortOption) => void;

  // Configuration
  users?: Array<{ id: string; name: string }>;
  includeTeamFeatures?: boolean;
  includeUserSort?: boolean;

  // UI
  className?: string;

  // Actions
  onResetFilters?: () => void;

  // Export
  expenses?: (Expense | TeamExpense)[];
  exportFilename?: string;
}

const STATUS_OPTIONS: MultiSelectOption[] = [
  { label: "New", value: "NEW" },
  { label: "Pending", value: "PENDING" },
  { label: "Analyzed", value: "ANALYZED" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

export function ExpenseFilters({
  statusFilters,
  onStatusFiltersChange,
  selectedUser = "all",
  onSelectedUserChange,
  viewMode = "chronological",
  onViewModeChange,
  sortBy,
  onSortByChange,
  users = [],
  includeTeamFeatures = false,
  includeUserSort = false,
  className,
  onResetFilters,
  expenses = [],
  exportFilename,
}: ExpenseFiltersProps) {
  const hasActiveFilters = React.useMemo(() => {
    const defaultStatuses = ["NEW", "PENDING", "ANALYZED"];
    const hasNonDefaultStatus =
      !statusFilters.every((status) => defaultStatuses.includes(status)) ||
      statusFilters.length !== defaultStatuses.length;
    const hasUserFilter = includeTeamFeatures && selectedUser !== "all";
    const hasNonDefaultSort = sortBy !== "created_date";

    return hasNonDefaultStatus || hasUserFilter || hasNonDefaultSort;
  }, [statusFilters, selectedUser, sortBy, includeTeamFeatures]);

  return (
    <div className={cn("space-y-6", className)}>
      <Card className="border-0 bg-gradient-to-r from-muted/50 to-muted/30">
        <CardContent className="p-6">
          {/* Reset Filters Button - Top Right */}
          <div className="mb-4 flex justify-end gap-2">
            {expenses.length > 0 && (
              <ExportExpenseButton
                expenses={expenses}
                filename={exportFilename}
                variant="outline"
                size="sm"
              />
            )}
            {hasActiveFilters && onResetFilters != null && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onResetFilters}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                title="Reset filters"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr_1fr]">
            {/* Status Filter */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <Filter className="h-4 w-4" />
                Status Filter
              </Label>
              <MultiSelect
                options={STATUS_OPTIONS}
                selected={statusFilters as string[]}
                onChange={(selected) => onStatusFiltersChange(selected as ExpenseStatus[])}
                placeholder="Select statuses..."
                searchPlaceholder="Search statuses..."
                emptyText="No statuses found"
              />
            </div>

            {/* User Filter - Only show for team features */}
            {includeTeamFeatures && onSelectedUserChange != null && (
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <Users className="h-4 w-4" />
                  User Filter
                </Label>
                <Select value={selectedUser} onValueChange={onSelectedUserChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Sort Control */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <ListOrdered className="h-4 w-4" />
                Sort
              </Label>
              <ExpenseSortControl
                sortBy={sortBy}
                onSortChange={onSortByChange}
                includeUserSort={includeUserSort}
              />
            </div>
          </div>

          {/* View Mode Toggle - Only for team features */}
          {includeTeamFeatures && onViewModeChange != null && (
            <div className="mt-6 border-t border-border/50 pt-6">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">View Mode</Label>
                <Tabs
                  value={viewMode}
                  onValueChange={(value) => onViewModeChange(value as "chronological" | "byUser")}
                >
                  <TabsList className="bg-background/60">
                    <TabsTrigger
                      value="chronological"
                      className="data-[state=active]:bg-background"
                    >
                      Chronological
                    </TabsTrigger>
                    <TabsTrigger value="byUser" className="data-[state=active]:bg-background">
                      By User
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
