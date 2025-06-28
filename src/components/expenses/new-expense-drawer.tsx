"use client";

import { Plus, Target } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

import { ReceiptUploader } from "@/src/components/shared/receipt-uploader";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@components/ui/drawer";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { LoadingIndicator } from "@components/ui/loading-indicator";
import { createClient } from "@lib/supabase/client";

interface NewExpenseDrawerProps {
  onExpenseCreated?: (expenseId: string) => void;
  accountId?: string; // Optional account_id for team expenses
  accountName?: string; // Optional account name to display
  fullWidth?: boolean; // Optional prop to make button full width
}

interface ExpenseApiResponse {
  success: boolean;
  data: {
    id: string;
    title: string;
    description: string;
    status: string;
    created_at: string;
    updated_at: string;
    account_id: string;
  };
}

interface AccountData {
  account_id: string;
  name: string;
  metadata?: {
    posting_team_id?: string;
  };
}

export function NewExpenseDrawer({
  onExpenseCreated,
  accountId,
  accountName,
  fullWidth,
}: Readonly<NewExpenseDrawerProps>) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptFiles, setReceiptFiles] = useState<File[]>([]);
  const [resolvedAccountId, setResolvedAccountId] = useState<string | undefined>(accountId);
  const [resolvedAccountName, setResolvedAccountName] = useState<string | undefined>(accountName);
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);

  // Resolve account details when dialog opens or accountId changes
  useEffect(() => {
    const resolveAccountDetails = async () => {
      // If accountId is provided, use it directly
      if (accountId != null && accountId !== "") {
        setResolvedAccountId(accountId);
        setResolvedAccountName(accountName);
        return;
      }

      // Otherwise, fetch personal account and check for posting team
      setIsLoadingAccount(true);
      try {
        const supabase = createClient();

        // Get personal account
        const { data: personalAccount, error: personalError } =
          await supabase.rpc("get_personal_account");

        if (personalError !== null) {
          console.error("Error fetching personal account:", personalError);
          return;
        }

        const personal = personalAccount as AccountData;

        // Check if personal account has a posting team
        if (
          personal.metadata?.posting_team_id != null &&
          personal.metadata.posting_team_id !== ""
        ) {
          // Fetch the posting team details
          const { data: teamAccount, error: teamError } = await supabase.rpc("get_account", {
            account_id: personal.metadata.posting_team_id,
          });

          if (teamError !== null) {
            console.error("Error fetching posting team:", teamError);
            // Fall back to personal account
            setResolvedAccountId(personal.account_id);
            setResolvedAccountName(personal.name);
          } else {
            const team = teamAccount as AccountData;
            setResolvedAccountId(team.account_id);
            setResolvedAccountName(team.name);
          }
        } else {
          // Use personal account
          setResolvedAccountId(personal.account_id);
          setResolvedAccountName(personal.name);
        }
      } catch (error) {
        console.error("Error resolving account details:", error);
      } finally {
        setIsLoadingAccount(false);
      }
    };

    if (open) {
      resolveAccountDetails();
    }
  }, [open, accountId, accountName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Close dialog immediately when submission starts
    setOpen(false);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);

      // Add resolved account_id
      if (resolvedAccountId != null && resolvedAccountId !== "") {
        formData.append("account_id", resolvedAccountId);
      }

      // Add receipt files to form data
      receiptFiles.forEach((file) => {
        formData.append("receipts", file);
      });

      const response = await fetch("/api/expenses", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as ExpenseApiResponse;

      if (!response.ok) {
        throw new Error((data as { error?: string }).error ?? "Failed to create expense report");
      }

      // Notify parent with expense ID immediately
      try {
        if (data.data.id !== "") {
          onExpenseCreated?.(data.data.id);
        }
      } catch {
        // Ignore callback errors
      }

      // Reset form
      setTitle("");
      setDescription("");
      setReceiptFiles([]);
    } catch {
      toast.error("Failed to create expense report");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFilesChange = useCallback((files: File[]) => {
    setReceiptFiles(files);
  }, []);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isSubmitting) {
      // Reset form when closing (but not when submitting)
      setTitle("");
      setDescription("");
      setReceiptFiles([]);
    }
    setOpen(newOpen);
  };

  return (
    <>
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>
          <Button className={fullWidth === true ? "w-full" : ""} data-testid="new-expense-button">
            <Plus className="mr-2 h-4 w-4" />
            New Expense
          </Button>
        </DrawerTrigger>
        <DrawerContent className="max-h-[85vh] overflow-y-auto">
          <DrawerHeader>
            <div className="flex items-start justify-between">
              <div>
                <DrawerTitle>New Expense Report</DrawerTitle>
                <DrawerDescription>
                  Create a new expense report and upload your receipts
                </DrawerDescription>
              </div>
              {resolvedAccountName != null && resolvedAccountName !== "" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {resolvedAccountName}
                </Badge>
              )}
            </div>
          </DrawerHeader>
          <form id="new-expense-form" onSubmit={handleSubmit} className="space-y-6 px-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter expense report title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter expense report description"
              />
            </div>

            <div className="space-y-2">
              <Label>Receipts</Label>
              <ReceiptUploader
                onFilesChange={handleFilesChange}
                title=""
                description=""
                className="border-0 shadow-none"
                showUploadButton={false}
                inDrawer={true}
              />
            </div>
          </form>
          <DrawerFooter>
            <div className="flex w-full gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isLoadingAccount}
                form="new-expense-form"
                className="flex-1"
                data-testid="create-expense-button"
              >
                {isSubmitting ? "Creating..." : "Create Expense Report"}
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <LoadingIndicator isVisible={isSubmitting || isLoadingAccount} />
    </>
  );
}
