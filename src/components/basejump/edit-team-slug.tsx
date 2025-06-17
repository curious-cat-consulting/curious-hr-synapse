"use client";

import type { GetAccountResponse } from "@usebasejump/shared";

import { Input } from "@/components/ui/input";
import { editTeamSlug } from "@/lib/actions/teams";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { SubmitButton } from "../ui/submit-button";

type Props = {
  account: GetAccountResponse;
};

export default function EditTeamSlug({ account }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Identifier</CardTitle>
        <CardDescription>Your team identifier must be unique</CardDescription>
      </CardHeader>
      <form className="flex-1 text-foreground animate-in">
        <input type="hidden" name="accountId" value={account.account_id} />
        <CardContent className="flex flex-col gap-y-6">
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="slug">Identifier</Label>
            <div className="flex items-center gap-x-2">
              <span className="grow whitespace-nowrap text-sm text-muted-foreground">
                https://your-app.com/
              </span>
              <Input defaultValue={account.slug} name="slug" placeholder="my-team" required />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton formAction={editTeamSlug} pendingText="Updating...">
            Save
          </SubmitButton>
        </CardFooter>
      </form>
    </Card>
  );
}
