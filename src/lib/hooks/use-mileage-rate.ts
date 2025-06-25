import { useMemo } from "react";

interface AccountData {
  metadata?: {
    mileage_rate?: number;
  };
}

export function useMileageRate(account?: AccountData | null): number {
  return useMemo(() => {
    // Return the team's custom rate if set, otherwise use the default IRS rate
    return account?.metadata?.mileage_rate ?? 0.7; // IRS 2025 rate as default
  }, [account?.metadata?.mileage_rate]);
}
