"use client";

import { useState } from "react";
import { useFormState } from "react-dom";

import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { updateMileageRate } from "@lib/actions/teams";

interface EditMileageRateProps {
  account: {
    account_id: string;
    metadata?: {
      mileage_rate?: number;
    };
  };
}

export default function EditMileageRate({ account }: Readonly<EditMileageRateProps>) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, formAction] = useFormState(updateMileageRate, null);

  const currentRate = account.metadata?.mileage_rate ?? 0.7; // Default to IRS 2025 rate

  const handleSubmit = async (formData: FormData) => {
    formData.append("accountId", account.account_id);
    await formAction(formData);
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mileage Rate</CardTitle>
        <CardDescription>
          Configure the mileage reimbursement rate for your team. This rate will be used when
          calculating mileage expenses. If no custom rate is set, the system will use the current
          IRS standard rate.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isEditing ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Current Rate</p>
              <p className="text-2xl font-bold text-green-600">${currentRate.toFixed(3)}/mile</p>
              <p className="mt-1 text-xs text-gray-500">
                {currentRate === 0.7
                  ? "Using IRS 2025 standard rate ($0.70/mile)"
                  : `Using custom rate: $${currentRate.toFixed(3)}/mile`}
              </p>
              {currentRate === 0.7 && (
                <p className="mt-1 text-xs text-gray-400">
                  Source: IRS Standard Mileage Rate for 2025
                </p>
              )}
            </div>
            <Button onClick={() => setIsEditing(true)} variant="outline">
              Edit Rate
            </Button>
          </div>
        ) : (
          <form action={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="mileageRate">Mileage Rate (per mile)</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  id="mileageRate"
                  name="mileageRate"
                  type="number"
                  step="0.001"
                  min="0"
                  max="2"
                  defaultValue={currentRate}
                  className="pl-8"
                  placeholder="0.70"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Enter the rate in dollars per mile (e.g., 0.70 for $0.70/mile)
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Current IRS standard rate: $0.70/mile (2025)
              </p>
            </div>
            {state?.message != null && state.message !== "" && (
              <p
                className={`text-sm ${state.message.includes("successfully") ? "text-green-600" : "text-red-600"}`}
              >
                {state.message}
              </p>
            )}
            <div className="flex gap-2">
              <Button type="submit">Save Rate</Button>
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
