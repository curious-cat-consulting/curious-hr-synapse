import { Inter as FontSans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";
import { cn } from "@lib/utils";

const defaultUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Curious HR Synapse - AI-Powered HR & Employee Admin Assistant",
  description: "Streamline your HR and administrative tasks with AI-powered expense management.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground">
        <ThemeProvider attribute="class">
          <TooltipProvider>
            <main className="flex min-h-screen flex-col items-center">{children}</main>
            <ToastContainer />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
