import { Menu } from "lucide-react";
import Link from "next/link";

import UserAccountButton from "@components/basejump/user-account-button";
import NavigatingAccountSelector from "@components/dashboard/navigation-account-selector";
import BasejumpLogo from "@components/getting-started/basejump-logo";
import { NotificationBell } from "@components/notifications/notification-bell";
import { ThemeToggle } from "@components/theme-toggle";

import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";

interface Props {
  accountId: string;
  navigation?: {
    name: string;
    href: string;
  }[];
}
export default function DashboardHeader({ accountId, navigation = [] }: Props) {
  return (
    <nav className="flex w-full items-center justify-between border-b p-4">
      <div className="hidden items-center justify-start gap-x-4 md:flex lg:gap-x-6">
        <div className="flex items-center gap-x-4">
          <Link href="/">
            <BasejumpLogo logoOnly />
          </Link>
          <span className="h-6 rotate-12 border-l" />
          <NavigatingAccountSelector accountId={accountId} />
        </div>
        {navigation.map((navItem) => (
          <Link
            key={navItem.name}
            href={navItem.href}
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            {navItem.name}
          </Link>
        ))}
      </div>
      <Sheet>
        <SheetTrigger className="md:hidden">
          <Menu className="h-6 w-6" />
        </SheetTrigger>
        <SheetContent side="left">
          <div className="absolute left-2 top-2">
            <Link href="/">
              <BasejumpLogo logoOnly />
            </Link>
          </div>

          <div className="-mx-4 flex flex-col items-center gap-y-4 pt-12 text-center">
            <NavigatingAccountSelector accountId={accountId} />

            <div className="flex w-full flex-col items-start gap-y-2">
              {navigation.map((navItem) => (
                <Link
                  key={navItem.name}
                  href={navItem.href}
                  className="block w-full px-3 py-1 text-left text-sm font-medium transition-colors hover:text-primary"
                >
                  {navItem.name}
                </Link>
              ))}
            </div>

            <div className="flex w-full justify-center pt-4">
              <ThemeToggle />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex items-center gap-x-4">
        <NotificationBell />
        <ThemeToggle />
        <UserAccountButton />
      </div>
    </nav>
  );
}
