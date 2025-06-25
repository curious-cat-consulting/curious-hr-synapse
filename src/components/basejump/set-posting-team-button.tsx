"use client";

import { Target } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

import { updatePostingTeam } from "@lib/actions/personal-account";

import { Button } from "../ui/button";

interface SetPostingTeamButtonProps {
  teamId: string;
  personalAccountId: string;
}

export function SetPostingTeamButton({
  teamId,
  personalAccountId,
}: Readonly<SetPostingTeamButtonProps>) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSetPostingTeam = async () => {
    setIsUpdating(true);

    try {
      const formData = new FormData();
      formData.append("postingTeamId", teamId);
      formData.append("accountId", personalAccountId);

      const result = await updatePostingTeam(null, formData);

      if (typeof result === "object" && "message" in result && result.message !== "") {
        toast.success(result.message);
      }
    } catch {
      toast.error("Failed to update posting team");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSetPostingTeam}
      disabled={isUpdating}
      title="Set as posting team"
    >
      <Target className="h-4 w-4" />
    </Button>
  );
}
