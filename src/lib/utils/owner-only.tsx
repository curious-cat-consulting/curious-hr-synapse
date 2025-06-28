import { notFound } from "next/navigation";

import { getAccountBySlug, isUserOwner } from "@lib/actions/accounts";

interface OwnerOnlyPageProps {
  accountSlug: string;
  children: React.ReactNode;
}

/**
 * Higher-order component that enforces owner-only access
 * If the user is not an owner, it returns a 404 (notFound)
 */
export async function OwnerOnlyPage({ accountSlug, children }: Readonly<OwnerOnlyPageProps>) {
  const teamAccount = await getAccountBySlug(accountSlug);

  if (teamAccount === null) {
    notFound();
  }

  const isOwner = await isUserOwner(teamAccount.account_id);

  if (!isOwner) {
    notFound();
  }

  return <>{children}</>;
}

/**
 * Utility function to check if user is owner and return account data
 * Throws notFound() if user is not an owner
 */
export async function requireOwnerAccess(accountSlug: string) {
  const teamAccount = await getAccountBySlug(accountSlug);

  if (teamAccount === null) {
    notFound();
  }

  const isOwner = await isUserOwner(teamAccount.account_id);

  if (!isOwner) {
    notFound();
  }

  return teamAccount;
}
