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
  title: "Curious HR: Synapse - AI-Powered HR & Employee Admin Assistant",
  description: "Streamline your HR and administrative tasks with AI-powered expense management.",
  icons: {
    icon: [
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon/favicon.ico",
    apple: "/favicon/apple-touch-icon.png",
    other: [
      { rel: "icon", url: "/favicon/favicon.ico" },
      {
        rel: "icon",
        url: "/favicon/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        rel: "icon",
        url: "/favicon/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
  manifest: "/favicon/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Synapse",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href="/favicon/android-chrome-192x192.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="512x512"
          href="/favicon/android-chrome-512x512.png"
        />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="msapplication-TileColor" content="#ffffff" />
      </head>
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
