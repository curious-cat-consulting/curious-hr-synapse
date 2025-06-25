import { PartyPopper } from "lucide-react";
import Link from "next/link";

interface TeamAccountPageProps {
  params: Promise<{
    accountSlug: string;
  }>;
}

export default async function TeamAccountPage({ params }: Readonly<TeamAccountPageProps>) {
  const { accountSlug } = await params;

  return (
    <div className="mx-auto flex h-full w-full max-w-screen-md flex-col content-center items-center justify-center gap-y-4 py-12 text-center">
      <PartyPopper className="h-12 w-12 text-gray-400" />
      <h1 className="text-2xl font-bold">Team Account</h1>
      <div className="w-full space-y-6">
        <ul className="space-y-3 text-left">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <div>
              <strong>AI-Powered Review</strong>
              <p className="text-sm text-muted-foreground">
                Automated expense validation and fraud detection
              </p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <div>
              <strong>Team Management</strong>
              <p className="text-sm text-muted-foreground">
                Oversee team expenses and set approval workflows
              </p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <div>
              <strong>Advanced Analytics</strong>
              <p className="text-sm text-muted-foreground">
                Generate detailed reports and track spending patterns
              </p>
            </div>
          </li>
        </ul>
        <div className="mt-6 space-y-3">
          <Link
            href={`/dashboard/${accountSlug}/expenses`}
            className="block w-full rounded-md bg-primary px-4 py-2 text-center text-primary-foreground hover:opacity-90"
          >
            Review Team Expenses
          </Link>
          <Link
            href="/dashboard/analytics"
            className="block w-full rounded-md bg-secondary px-4 py-2 text-center text-secondary-foreground hover:opacity-90"
          >
            View Analytics
          </Link>
          <Link
            href={`/dashboard/${accountSlug}/settings`}
            className="block w-full rounded-md bg-blue-600 px-4 py-2 text-center text-white hover:opacity-90"
          >
            Team Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
