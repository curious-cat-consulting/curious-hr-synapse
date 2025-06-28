"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";

import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Checkbox } from "@components/ui/checkbox";
import { Label } from "@components/ui/label";
import { updateSelfApprovals } from "@lib/actions/teams";

interface EditSelfApprovalsProps {
  account: {
    account_id: string;
    metadata?: {
      self_approvals_enabled?: boolean;
    };
  };
}

export default function EditSelfApprovals({ account }: Readonly<EditSelfApprovalsProps>) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, formAction] = useFormState(updateSelfApprovals, null);
  const [localSelfApprovalsEnabled, setLocalSelfApprovalsEnabled] = useState(
    account.metadata?.self_approvals_enabled ?? false
  );
  const pendingValueRef = useRef<boolean | null>(null);

  // Update local state when account prop changes
  useEffect(() => {
    setLocalSelfApprovalsEnabled(account.metadata?.self_approvals_enabled ?? false);
  }, [account.metadata?.self_approvals_enabled]);

  // Update local state when form submission is successful
  useEffect(() => {
    if (
      state?.message != null &&
      state.message !== "" &&
      state.message.includes("successfully") &&
      pendingValueRef.current !== null
    ) {
      setLocalSelfApprovalsEnabled(pendingValueRef.current);
      pendingValueRef.current = null;
    }
  }, [state]);

  const handleSubmit = async (formData: FormData) => {
    formData.append("accountId", account.account_id);
    const checkboxValue = formData.get("selfApprovalsEnabled");
    const newValue = checkboxValue !== null;

    // Store the pending value
    pendingValueRef.current = newValue;

    if (checkboxValue !== null) {
      formData.set("selfApprovalsEnabled", "on");
    }

    await formAction(formData);
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Self Approvals</CardTitle>
        <CardDescription>
          Allow team owners to approve their own expenses. When enabled, team owners will be able to
          approve expenses they submitted themselves.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isEditing ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Self Approvals</p>
              <p
                className={`text-lg font-semibold ${localSelfApprovalsEnabled ? "text-green-600" : "text-gray-600"}`}
              >
                {localSelfApprovalsEnabled ? "Enabled" : "Disabled"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {localSelfApprovalsEnabled
                  ? "Team owners can approve their own expenses"
                  : "Team owners cannot approve their own expenses"}
              </p>
            </div>
            <Button onClick={() => setIsEditing(true)} variant="outline">
              Edit Setting
            </Button>
          </div>
        ) : (
          <form action={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="selfApprovalsEnabled"
                name="selfApprovalsEnabled"
                defaultChecked={localSelfApprovalsEnabled}
              />
              <Label
                htmlFor="selfApprovalsEnabled"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Enable self approvals for team owners
              </Label>
            </div>
            <p className="text-xs text-gray-500">
              When checked, team owners will be able to approve expenses they submitted themselves.
              This can be useful for smaller teams or when you want to streamline the approval
              process.
            </p>
            {state?.message != null && state.message !== "" && (
              <p
                className={`text-sm ${state.message.includes("successfully") ? "text-green-600" : "text-red-600"}`}
              >
                {state.message}
              </p>
            )}
            <div className="flex gap-2">
              <Button type="submit">Save Setting</Button>
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
