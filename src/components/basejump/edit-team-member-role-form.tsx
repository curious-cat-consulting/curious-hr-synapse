"use client";

import type { GetAccountMembersResponse } from "@usebasejump/shared";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@components/ui/select";
import { updateTeamMemberRole } from "@lib/actions/members";

import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { SubmitButton } from "../ui/submit-button";

type Props = {
  accountId: string;
  isPrimaryOwner: boolean;
  teamMember: GetAccountMembersResponse[0];
};

const memberOptions = [
  { label: "Owner", value: "owner" },
  { label: "Member", value: "member" },
];

export default function EditTeamMemberRoleForm({ accountId, teamMember, isPrimaryOwner }: Props) {
  const [teamRole, setTeamRole] = useState(teamMember.account_role as string);
  const pathName = usePathname();

  return (
    <form className="flex w-full flex-1 flex-col justify-center gap-y-6 text-foreground animate-in">
      <input type="hidden" name="accountId" value={accountId} />
      <input type="hidden" name="userId" value={teamMember.user_id} />
      <input type="hidden" name="returnUrl" value={pathName} />
      <div className="flex flex-col gap-y-2">
        <Label htmlFor="accountRole">Team Role</Label>
        <Select value={teamRole} onValueChange={setTeamRole} name="accountRole">
          <SelectTrigger>
            <SelectValue placeholder="Member type" />
          </SelectTrigger>
          <SelectContent>
            {memberOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {teamRole === "owner" && isPrimaryOwner && (
        <div className="flex items-center space-x-2">
          <Checkbox id="makePrimaryOwner" name="makePrimaryOwner" />
          <label
            htmlFor="makePrimaryOwner"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Make this user the primary owner
          </label>
        </div>
      )}
      <SubmitButton formAction={updateTeamMemberRole} pendingText="Updating...">
        Update Role
      </SubmitButton>
    </form>
  );
}
