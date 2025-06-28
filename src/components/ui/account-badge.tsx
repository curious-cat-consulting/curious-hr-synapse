import { User, Users } from "lucide-react";

import { Badge } from "@components/ui/badge";
import { cn } from "@lib/utils";

interface AccountBadgeProps {
  accountName: string;
  isPersonal: boolean;
  variant?: "default" | "secondary" | "outline";
  className?: string;
  size?: "sm" | "md";
}

export function AccountBadge({
  accountName,
  isPersonal,
  variant = "default",
  className,
  size = "sm",
}: Readonly<AccountBadgeProps>) {
  const Icon = isPersonal ? User : Users;

  return (
    <Badge
      variant={isPersonal ? "secondary" : variant}
      className={cn("flex items-center gap-1", size === "sm" ? "text-xs" : "text-sm", className)}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
      {accountName}
    </Badge>
  );
}
