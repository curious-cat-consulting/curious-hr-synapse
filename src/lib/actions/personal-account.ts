"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "../supabase/server";

export async function editPersonalAccountName(prevState: unknown, formData: FormData) {
  const name = formData.get("name") as string;
  const accountId = formData.get("accountId") as string;
  const supabase = createClient();

  const { error } = await supabase.rpc("update_account", {
    name,
    account_id: accountId,
  });

  if (error !== null) {
    return {
      message: error.message,
    };
  }

  // Revalidate the settings page to refresh the data
  revalidatePath("/dashboard/settings");

  return {
    message: "Name updated successfully",
  };
}

export async function updatePostingTeam(prevState: unknown, formData: FormData) {
  const postingTeamId = formData.get("postingTeamId") as string;
  const accountId = formData.get("accountId") as string;
  const supabase = createClient();

  const { error } = await supabase.rpc("update_account", {
    account_id: accountId,
    public_metadata: { posting_team_id: postingTeamId },
    replace_metadata: false,
  });

  if (error !== null) {
    return {
      message: error.message,
    };
  }

  // Revalidate the teams page to refresh the data
  revalidatePath("/dashboard/settings/teams");

  return {
    message: "Posting team updated successfully",
  };
}
