import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import CookieConsent from "../components/common/CookieConsent";
import ResponsibleGamingPopup from "../components/common/ResponsibleGamingPopup";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// generateMetadata runs server-side per request, so this can read
// the live site_name/site_description settings instead of the
// static fallback below - falls back silently (never throws, never
// blocks the page) if the backend is unreachable at request time.
export async function generateMetadata(): Promise<Metadata> {
  try {
    const response = await fetch(`${API_URL}/settings/public`, {
      next: { revalidate: 300 },
    });

    const data = await response.json();
    const general = data?.data?.general || {};

    const siteName = general.site_name || "Gamzzones";
    const siteDescription = general.site_description || "Gaming Platform";

    return {
      title: `${siteName} - ${siteDescription}`,
      description: `Play, manage your wallet, bets, and referrals on ${siteName}.`,
    };
  } catch {
    return {
      title: "Gamzzones - Gaming Platform",
      description: "Play, manage your wallet, bets, and referrals.",
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <ResponsibleGamingPopup />
        <CookieConsent />
      </body>
    </html>
  );
}
