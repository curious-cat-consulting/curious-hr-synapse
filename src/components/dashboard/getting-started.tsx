import Link from "next/link";

import { NewExpenseDrawer } from "@components/expenses/new-expense-drawer";
import { Button } from "@components/ui/button";

interface GettingStartedStep {
  number: number;
  title: string;
  description: string;
  action?: React.ReactNode;
  link?: { href: string; text: string };
}

interface GettingStartedProps {
  title: string;
  steps: GettingStartedStep[];
}

export function GettingStarted({ title, steps }: GettingStartedProps) {
  return (
    <div className="mb-8">
      <h2 className="mb-6 text-2xl font-semibold">{title}</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {steps.map((step) => (
          <div key={step.number} className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
              {step.number}
            </div>
            <h3 className="mb-2 font-semibold">{step.title}</h3>
            <p className="text-sm text-muted-foreground">{step.description}</p>
            {step.action != null && <div className="mt-2">{step.action}</div>}
            {step.link != null && (
              <Button asChild variant="link" className="mt-2">
                <Link href={step.link.href}>{step.link.text}</Link>
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Predefined step sets
export const teamGettingStartedSteps = (accountSlug: string): GettingStartedStep[] => [
  {
    number: 1,
    title: "Invite Team Members",
    description: "Start by inviting your team members and setting up their roles and permissions.",
    link: {
      href: `/dashboard/${accountSlug}/settings/members`,
      text: "Manage Members →",
    },
  },
  {
    number: 2,
    title: "Configure Workflows",
    description: "Set up approval workflows and spending limits for your team.",
    link: {
      href: `/dashboard/${accountSlug}/settings`,
      text: "Team Settings →",
    },
  },
  {
    number: 3,
    title: "Start Tracking Expenses",
    description: "Begin submitting and reviewing expenses with your team.",
    link: {
      href: `/dashboard/${accountSlug}/expenses`,
      text: "View Expenses →",
    },
  },
];

export const personalGettingStartedSteps: GettingStartedStep[] = [
  {
    number: 1,
    title: "Submit Your First Expense",
    description:
      "Start by uploading a receipt and letting our AI extract the details automatically.",
    action: <NewExpenseDrawer fullWidth={false} />,
  },
  {
    number: 2,
    title: "Review and Track",
    description: "Monitor your expense status and track your spending patterns over time.",
    link: {
      href: "/dashboard/expenses",
      text: "View My Expenses →",
    },
  },
  {
    number: 3,
    title: "Customize Settings",
    description:
      "Set up your preferences and notification settings to personalize your experience.",
    link: {
      href: "/dashboard/settings",
      text: "Account Settings →",
    },
  },
];
