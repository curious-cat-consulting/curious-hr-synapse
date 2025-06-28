import { redirect } from "next/navigation";

import AcceptTeamInvitation from "@components/basejump/accept-team-invitation";

export default async function AcceptInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (token == null) {
    redirect("/");
  }

  return (
    <div className="mx-auto my-12 w-full max-w-md">
      <AcceptTeamInvitation token={token} />
    </div>
  );
}
