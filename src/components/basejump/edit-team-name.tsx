import type { GetAccountResponse } from "@usebasejump/shared";

import { Input } from "@components/ui/input";
import { editTeamName } from "@lib/actions/teams";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { SubmitButton } from "../ui/submit-button";

type Props = {
  account: GetAccountResponse;
};

export default function EditTeamName({ account }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Info</CardTitle>
        <CardDescription>Your team name and identifier are unique for your team</CardDescription>
      </CardHeader>
      <form className="flex-1 text-foreground animate-in">
        <input type="hidden" name="accountId" value={account.account_id} />
        <CardContent className="flex flex-col gap-y-6">
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="name">Team Name</Label>
            <Input defaultValue={account.name} name="name" placeholder="My Team" required />
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton formAction={editTeamName} pendingText="Updating...">
            Save
          </SubmitButton>
        </CardFooter>
      </form>
    </Card>
  );
}
