"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@components/ui/button";
import { createClient } from "@lib/supabase/client";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error("Error getting user:", error);
      } finally {
        setLoading(false);
      }
    };
    getUser();

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Catalyst HR</h1>
            </div>
            <div className="flex items-center">
              {user && (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">{user.email}</span>
                  <Button variant="outline" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-bold">Welcome to Catalyst HR</h2>
            <p className="text-xl text-gray-600">
              AI-Powered HR & Employee Admin Assistant for Small Businesses
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-2xl font-semibold">For Employees</h2>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <div>
                    <strong>Smart Expense Submission</strong>
                    <p className="text-sm text-muted-foreground">
                      Upload receipts and let AI automatically extract and categorize expenses
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <div>
                    <strong>Real-time Tracking</strong>
                    <p className="text-sm text-muted-foreground">
                      Monitor your expense status and get instant notifications on approvals
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <div>
                    <strong>Expense History</strong>
                    <p className="text-sm text-muted-foreground">
                      Access your complete expense history and generate reports anytime
                    </p>
                  </div>
                </li>
              </ul>
              <div className="mt-6 space-y-3">
                <Link
                  href="/dashboard/expenses/new"
                  className="block w-full rounded-md bg-primary px-4 py-2 text-center text-primary-foreground hover:opacity-90"
                >
                  Submit New Expense
                </Link>
                <Link
                  href="/dashboard/expenses"
                  className="block w-full rounded-md bg-secondary px-4 py-2 text-center text-secondary-foreground hover:opacity-90"
                >
                  View My Expenses
                </Link>
              </div>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-2xl font-semibold">For Managers</h2>
              <ul className="space-y-3">
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
                  href="/dashboard/review"
                  className="block w-full rounded-md bg-primary px-4 py-2 text-center text-primary-foreground hover:opacity-90"
                >
                  Review Pending Expenses
                </Link>
                <Link
                  href="/dashboard/analytics"
                  className="block w-full rounded-md bg-secondary px-4 py-2 text-center text-secondary-foreground hover:opacity-90"
                >
                  View Analytics
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
