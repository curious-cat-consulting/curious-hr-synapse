"use client";

import { useEffect, useState } from "react";

import { AnalyticsPage } from "@/src/components/analytics/analytics-page";
import { useAccountBySlug } from "@lib/hooks/use-accounts";

interface TeamAnalyticsPageProps {
  params: Promise<{
    accountSlug: string;
  }>;
}

export default function TeamAnalyticsPage({ params }: Readonly<TeamAnalyticsPageProps>) {
  const [accountSlug, setAccountSlug] = useState<string | null>(null);

  // Use the cached hook instead of manual fetching
  const { data: accountData, error: accountError } = useAccountBySlug(accountSlug);
  const accountName = accountData?.name ?? null;

  useEffect(() => {
    const loadParams = async () => {
      const { accountSlug: slug } = await params;
      setAccountSlug(slug);
    };
    loadParams();
  }, [params]);

  return (
    <AnalyticsPage
      type="team"
      title="Team Analytics"
      description="Comprehensive insights for your team"
      accountSlug={accountSlug}
      accountName={accountName}
      accountError={accountError?.message ?? null}
    />
  );
}
