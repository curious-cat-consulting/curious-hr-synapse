import Image from "next/image";
import Link from "next/link";

import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";

export function HeroSection() {
  return (
    <section className="container px-4 py-24 text-center">
      <div className="mx-auto max-w-4xl">
        <Badge variant="secondary" className="mb-4">
          🚀 AI-Powered Expense Management
        </Badge>
        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          Streamline Your{" "}
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Expense Management
          </span>{" "}
          with AI
        </h1>
        <p className="mb-8 text-xl text-muted-foreground lg:text-2xl">
          Upload receipts, auto-extract data, and get intelligent insights. Save hours every month
          with our AI-powered expense automation platform.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" asChild className="text-lg">
            <Link href="/login">Start Your Free Trial</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="text-lg">
            <Link href="#demo">Watch Demo</Link>
          </Button>
        </div>
        <div className="mt-12">
          <Image
            src="/images/owner-dashboard.png"
            alt="Synapse Dashboard Preview"
            width={800}
            height={400}
            className="mx-auto rounded-lg border shadow-2xl"
          />
        </div>
      </div>
    </section>
  );
}
