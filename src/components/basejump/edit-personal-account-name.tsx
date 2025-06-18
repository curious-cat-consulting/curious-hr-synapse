import type { GetAccountResponse } from "@usebasejump/shared";

import { Input } from "@components/ui/input";
import { editPersonalAccountName } from "@lib/actions/personal-account";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { SubmitButton } from "../ui/submit-button";


type Props = {
  account: GetAccountResponse;
};

export default function EditPersonalAccountName({ account }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your info</CardTitle>
        <CardDescription>
          Your name is used on your personal profile as well as in your teams
        </CardDescription>
      </CardHeader>
      <form className="flex-1 text-foreground animate-in">
        <input type="hidden" name="accountId" value={account.account_id} />
        <CardContent className="flex flex-col gap-y-6">
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="name">Name</Label>
            <Input defaultValue={account.name} name="name" placeholder="Marty Mcfly" required />
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton formAction={editPersonalAccountName} pendingText="Updating...">
            Save
          </SubmitButton>
        </CardFooter>
      </form>
    </Card>
  );
}
