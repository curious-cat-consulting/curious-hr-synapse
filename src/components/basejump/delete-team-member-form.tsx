import type { GetAccountMembersResponse } from "@usebasejump/shared";
import { usePathname } from "next/navigation";

import { removeTeamMember } from "@lib/actions/members";

import { SubmitButton } from "../ui/submit-button";


type Props = {
  accountId: string;
  teamMember: GetAccountMembersResponse[0];
};

export default function DeleteTeamMemberForm({ accountId, teamMember }: Props) {
  const pathName = usePathname();

  return (
    <form className="flex w-full flex-1 flex-col justify-center gap-y-6 text-foreground animate-in">
      <input type="hidden" name="accountId" value={accountId} />
      <input type="hidden" name="userId" value={teamMember.user_id} />
      <input type="hidden" name="returnUrl" value={pathName} />

      <SubmitButton variant="destructive" formAction={removeTeamMember} pendingText="Removing...">
        Remove member
      </SubmitButton>
    </form>
  );
}
