import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Welcome to Catalyst HR
        </h1>
        <p className="text-xl mb-8 text-center">
          AI-Powered HR & Employee Admin Assistant for Small Businesses
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="p-6 border rounded-lg bg-card">
            <h2 className="text-2xl font-semibold mb-4">For Employees</h2>
            <ul className="space-y-2">
              <li>
                • Easy expense submission with AI-powered receipt processing
              </li>
              <li>• Real-time expense tracking and status updates</li>
              <li>• Simple and intuitive interface</li>
            </ul>
            <Link
              href="/dashboard/expenses/new"
              className="mt-4 inline-block bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90"
            >
              Submit Expense
            </Link>
          </div>
          <div className="p-6 border rounded-lg bg-card">
            <h2 className="text-2xl font-semibold mb-4">For Managers</h2>
            <ul className="space-y-2">
              <li>• AI-powered expense review and anomaly detection</li>
              <li>• Streamlined approval workflow</li>
              <li>• Comprehensive expense reporting</li>
            </ul>
            <Link
              href="/dashboard/review"
              className="mt-4 inline-block bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90"
            >
              Review Expenses
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
