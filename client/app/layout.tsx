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

// ==========================================================
// SITE-WIDE TITLE TEMPLATE + SHARED META DESCRIPTION
// ==========================================================
//
// Every page's own metadata (see each page.jsx's `export const
// metadata = { title: "..." }`) supplies ONLY its page name
// ("Wallet", "Color Prediction", "Admins", etc). Next.js slots
// that into this layout's `title.template` (%s) automatically,
// producing "Page Name | Site Name - Site Tagline" everywhere
// with zero brand text duplicated in any individual page file.
// A page that sets no title at all falls back to `title.default`
// (the bare "Site Name - Site Tagline").
//
// `description` here is also the single shared meta description
// for the whole site (from the site_description setting) - pages
// deliberately do NOT set their own `description`, so there is
// exactly one meta-description source of truth, per the current
// requirement that it come from Admin Settings everywhere rather
// than being hardcoded per page.
//
// generateMetadata runs server-side on every request (not just at
// build time) as long as its data fetch opts out of caching - that
// `cache: "no-store"` below is load-bearing: without it, Next.js
// would treat this as static data, bake whatever site_name was live
// AT BUILD TIME into the prerendered page, and only refresh it on a
// background revalidation window - so an admin changing Site Name/
// Description in Settings would not be reflected until that window
// passed, in production. no-store forces a real fetch on every
// request instead, and (per Next.js's caching model) opting a fetch
// out of the Data Cache also opts the whole route out of the Full
// Route Cache, so the page itself is never statically served stale
// either. Falls back to these two literals ONLY when the backend is
// completely unreachable or no site_name/site_description setting
// exists in the database at all - never used while a real setting
// value is available.
export async function generateMetadata(): Promise<Metadata> {
  try {
    const response = await fetch(`${API_URL}/settings/public`, {
      cache: "no-store",
    });

    const data = await response.json();
    const general = data?.data?.general || {};

    const siteName = general.site_name || "Gamzzones";
    const siteDescription = general.site_description || "Gaming Platform";

    return {
      title: {
        template: `%s | ${siteName} - ${siteDescription}`,
        default: `${siteName} - ${siteDescription}`,
      },
      description: siteDescription,
    };
  } catch {
    return {
      title: {
        template: "%s | Gamzzones - Gaming Platform",
        default: "Gamzzones - Gaming Platform",
      },
      description: "Gaming Platform",
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
