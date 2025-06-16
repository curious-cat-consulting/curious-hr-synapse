"use client";
import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export function TooltipProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  return <TooltipPrimitive.Provider>{children}</TooltipPrimitive.Provider>;
}

export function Tooltip({ children }: Readonly<{ children: React.ReactNode }>) {
  return <TooltipPrimitive.Root>{children}</TooltipPrimitive.Root>;
}

export function TooltipTrigger({
  children,
  asChild = false,
}: Readonly<{
  children: React.ReactNode;
  asChild?: boolean;
}>) {
  return <TooltipPrimitive.Trigger asChild={asChild}>{children}</TooltipPrimitive.Trigger>;
}

export function TooltipContent({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={4}
        className="animate-fade-in z-50 rounded bg-gray-900 px-2 py-1.5 text-xs text-white shadow-md"
      >
        {children}
        <TooltipPrimitive.Arrow className="fill-gray-900" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}
