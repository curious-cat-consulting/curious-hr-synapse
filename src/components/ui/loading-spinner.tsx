"use client";

import { cn } from "@lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text: string;
  className?: string;
}

export function LoadingSpinner({ size = "md", text, className }: Readonly<LoadingSpinnerProps>) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-gray-300 border-t-blue-600",
          sizeClasses[size]
        )}
      />
      <p className="text-sm text-gray-600 dark:text-gray-400">{text}</p>
    </div>
  );
}
