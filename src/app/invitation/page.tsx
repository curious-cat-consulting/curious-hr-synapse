import { redirect } from "next/navigation";

import AcceptTeamInvitation from "@/components/basejump/accept-team-invitation";

export default async function AcceptInvitationPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  if (!searchParams.token) {
    redirect("/");
  }

  return (
    <div className="mx-auto my-12 w-full max-w-md">
      <AcceptTeamInvitation token={searchParams.token} />
    </div>
  );
}
