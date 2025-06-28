import { Receipt } from "lucide-react";
import Link from "next/link";

import { cn } from "@lib/utils";

type Props = {
  size?: "sm" | "lg";
  className?: string;
  logoOnly?: boolean;
  href?: string;
};

const AppLogo = ({ size = "sm", className, logoOnly = false, href = "/" }: Props) => {
  const iconSize = size === "sm" ? "h-6 w-6" : "h-8 w-8";
  const textSize = size === "sm" ? "text-xl" : "text-2xl";

  const logoContent = (
    <div
      className={cn(
        "flex items-center gap-2",
        {
          "gap-2": size === "sm",
          "gap-3": size === "lg",
        },
        className
      )}
    >
      <Receipt className={cn(iconSize, "text-primary")} />
      {!logoOnly && <span className={cn("font-bold", textSize)}>Synapse</span>}
    </div>
  );

  return (
    <Link href={href} className="transition-opacity hover:opacity-80">
      {logoContent}
    </Link>
  );
};

export default AppLogo;
