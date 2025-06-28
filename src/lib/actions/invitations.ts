"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "../supabase/server";

export async function createInvitation(
  prevState: unknown,
  formData: FormData
): Promise<{ token?: string; message?: string }> {
  "use server";

  const invitationType = formData.get("invitationType") as string;
  const accountId = formData.get("accountId") as string;
  const accountRole = formData.get("accountRole") as string;

  const supabase = createClient();

  const { data, error } = await supabase.rpc("create_invitation", {
    account_id: accountId,
    invitation_type: invitationType,
    account_role: accountRole,
  });

  if (error != null) {
    return {
      message: error.message,
    };
  }

  revalidatePath(`/dashboard/[accountSlug]/settings/members/page`);

  return {
    token: data.token as string,
  };
}

export async function deleteInvitation(prevState: unknown, formData: FormData) {
  "use server";

  const invitationId = formData.get("invitationId") as string;
  const returnPath = formData.get("returnPath") as string;

  const supabase = createClient();

  const { error } = await supabase.rpc("delete_invitation", {
    invitation_id: invitationId,
  });

  if (error != null) {
    return {
      message: error.message,
    };
  }
  redirect(returnPath);
}

export async function acceptInvitation(prevState: unknown, formData: FormData) {
  "use server";

  const token = formData.get("token") as string;

  const supabase = createClient();

  const { error, data } = await supabase.rpc("accept_invitation", {
    lookup_invitation_token: token,
  });

  if (error != null) {
    return {
      message: error.message,
    };
  }
  redirect(`/dashboard/${data.slug}`);
}
