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

export const metadata: Metadata = {
  title: "Gaming Platform - Color Prediction",
  description: "Play Color Prediction and manage your wallet, bets, and referrals.",
};

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
