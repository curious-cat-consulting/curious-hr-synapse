import {
  Receipt,
  Shield,
  Zap,
  Users,
  BarChart3,
  Check,
  TrendingUp,
  CheckCircle,
  Clock,
  Globe,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { HeroSection } from "@components/landing/hero-section";
import AppLogo from "@components/shared/app-logo";
import { ThemeToggle } from "@components/theme-toggle";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <AppLogo />
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link href="/login" className="text-sm font-medium hover:text-primary">
              Sign In
            </Link>
            <Button asChild>
              <Link href="/login">Get Started Free</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <HeroSection />

      {/* Key Features */}
      <section className="container px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Everything you need to manage expenses intelligently
            </h2>
            <p className="text-xl text-muted-foreground">
              Powerful features designed to save time and reduce errors
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Receipt className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>AI-Powered Receipt Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Upload receipts and let our AI automatically extract line items, amounts, and
                  vendor information with 99% accuracy.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Smart Categorization</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Automatic expense categorization and tagging based on machine learning patterns
                  and your business rules.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Team Collaboration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Streamlined approval workflows, team management, and real-time collaboration for
                  expense processing.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Real-time Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Monitor expense status, get instant notifications, and track spending patterns in
                  real-time.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Advanced Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Detailed reports, spending insights, and predictive analytics to optimize your
                  expense management.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Fraud Detection</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Automated validation, duplicate detection, and security measures to protect
                  against expense fraud.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container bg-muted/30 px-4 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">How It Works</h2>
          <p className="mb-16 text-xl text-muted-foreground">Get started in minutes, not hours</p>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                1
              </div>
              <h3 className="mb-2 text-xl font-semibold">Upload Receipts</h3>
              <p className="text-muted-foreground">
                Simply take a photo or upload your receipts. Our AI handles the rest.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                2
              </div>
              <h3 className="mb-2 text-xl font-semibold">AI Processing</h3>
              <p className="text-muted-foreground">
                Our AI extracts data, categorizes expenses, and flags any issues automatically.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                3
              </div>
              <h3 className="mb-2 text-xl font-semibold">Review & Approve</h3>
              <p className="text-muted-foreground">
                Review the processed data, make any adjustments, and submit for approval.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-12">
          <Image
            src="/images/approvals.png"
            alt="Synapse Dashboard Preview"
            width={800}
            height={400}
            className="mx-auto rounded-lg border shadow-2xl"
          />
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="container px-4 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Simple, Transparent Pricing</h2>
          <p className="mb-16 text-xl text-muted-foreground">
            Choose the plan that fits your needs
          </p>

          <div className="grid gap-8 lg:grid-cols-2">
            <Card className="border-2">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Personal Plan</CardTitle>
                <CardDescription>Perfect for individual expense tracking</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$9</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-left">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    AI receipt processing
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Smart categorization
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Basic analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Mobile app access
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Export to CSV/PDF
                  </li>
                </ul>
                <Button className="w-full" variant="outline">
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary">
              <CardHeader className="text-center">
                <Badge className="mx-auto mb-2 w-fit">Most Popular</Badge>
                <CardTitle className="text-2xl">Team Plan</CardTitle>
                <CardDescription>For organizations with approval workflows</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$29</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-left">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Everything in Personal
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Team collaboration
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Approval workflows
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Advanced analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Fraud detection
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    API access
                  </li>
                </ul>
                <Button className="w-full">Start Free Trial</Button>
              </CardContent>
            </Card>
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            All plans include a 14-day free trial. No credit card required.
          </p>
        </div>
      </section>

      {/* Why Choose Synapse */}
      <section className="container bg-muted/30 px-4 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Why Choose Synapse</h2>
          <p className="mb-12 text-xl text-muted-foreground">
            Built for modern teams who demand efficiency and accuracy
          </p>

          <div className="grid gap-8 md:grid-cols-3">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="mb-4 flex justify-center">
                  <Zap className="h-12 w-12 text-primary" />
                </div>
                <h3 className="mb-4 text-lg font-semibold">Lightning Fast Processing</h3>
                <p className="text-muted-foreground">
                  AI-powered receipt analysis that processes expenses in seconds, not hours. Get
                  instant insights and approvals for your team.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="mb-4 flex justify-center">
                  <Shield className="h-12 w-12 text-primary" />
                </div>
                <h3 className="mb-4 text-lg font-semibold">Built-in Fraud Detection</h3>
                <p className="text-muted-foreground">
                  Advanced AI algorithms automatically detect suspicious patterns and duplicates,
                  protecting your organization from expense fraud.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="mb-4 flex justify-center">
                  <Users className="h-12 w-12 text-primary" />
                </div>
                <h3 className="mb-4 text-lg font-semibold">Seamless Team Collaboration</h3>
                <p className="text-muted-foreground">
                  Streamlined approval workflows, real-time notifications, and comprehensive
                  analytics that keep everyone on the same page.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">Real-time Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Instant insights into spending patterns and team performance
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">99% AI Accuracy</h3>
              <p className="text-sm text-muted-foreground">
                Industry-leading accuracy for receipt processing and data extraction
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">24/7 Processing</h3>
              <p className="text-sm text-muted-foreground">
                Submit expenses anytime and get instant AI analysis and feedback
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Globe className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">Global Ready</h3>
              <p className="text-sm text-muted-foreground">
                Multi-currency support and international compliance standards
              </p>
            </div>
          </div>
        </div>
        <div className="mt-12">
          <Image
            src="/images/personal-analytics.png"
            alt="Synapse Dashboard Preview"
            width={800}
            height={400}
            className="mx-auto rounded-lg border shadow-2xl"
          />
        </div>
      </section>

      {/* Trust Elements */}
      <section className="container px-4 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Security & Compliance</h2>
          <p className="mb-16 text-xl text-muted-foreground">
            Your data security is our top priority
          </p>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <Shield className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 font-semibold">Bank-Level Security</h3>
              <p className="text-sm text-muted-foreground">
                AES-256 encryption and SOC 2 compliance
              </p>
            </div>

            <div className="text-center">
              <Zap className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 font-semibold">Real-time Processing</h3>
              <p className="text-sm text-muted-foreground">
                Instant AI analysis and fraud detection
              </p>
            </div>

            <div className="text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 font-semibold">Team Controls</h3>
              <p className="text-sm text-muted-foreground">Granular permissions and audit trails</p>
            </div>

            <div className="text-center">
              <BarChart3 className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 font-semibold">Compliance Ready</h3>
              <p className="text-sm text-muted-foreground">GDPR, HIPAA, and SOX compliant</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container bg-muted/30 px-4 py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-16 text-center text-3xl font-bold sm:text-4xl">
            Frequently Asked Questions
          </h2>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  How accurate is the AI receipt processing?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our AI achieves 99% accuracy for standard receipts. For complex or damaged
                  receipts, our system flags them for manual review to ensure complete accuracy.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Can I integrate with my existing accounting software?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! We offer integrations with QuickBooks, Xero, Sage, and other popular
                  accounting platforms. We also provide API access for custom integrations.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What happens during the free trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  You get full access to all features for 14 days. No credit card required. You can
                  upgrade to a paid plan anytime during or after the trial.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How secure is my data?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We use bank-level security with AES-256 encryption, SOC 2 compliance, and regular
                  security audits. Your data is never shared with third parties without your
                  explicit consent.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Ready to Transform Your Expense Management?
          </h2>
          <p className="mb-8 text-xl text-muted-foreground">
            Join thousands of companies saving time and money with AI-powered expense automation
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild className="text-lg">
              <Link href="/login">Start Your Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg">
              <Link href="/login">Schedule a Demo</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
        <div className="mt-12">
          <Image
            src="/images/personal-dashboard.png"
            alt="Synapse Dashboard Preview"
            width={800}
            height={400}
            className="mx-auto rounded-lg border shadow-2xl"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container px-4 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center space-x-2">
                <Receipt className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold">Synapse</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered expense management that saves time and reduces errors.
              </p>
            </div>

            <div>
              <h3 className="mb-4 font-semibold">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-primary">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary">
                    Integrations
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary">
                    API
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-semibold">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-primary">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-semibold">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-primary">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary">
                    Status
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Synapse. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-primary">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-primary">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
