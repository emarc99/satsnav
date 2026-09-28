import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SatNav | Autonomous Lightning Routing & Liquidity Sentinel",
  description: "Real-time BOLT #7 pathfinding, fee anomaly detection, and Model Context Protocol (MCP) agent co-pilot for the Bitcoin Lightning Network.",
};

import { Navbar } from "@/components/Navbar";
import { NetworkTicker } from "@/components/NetworkTicker";
import { Footer } from "@/components/Footer";

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
      <body className="min-h-full flex flex-col bg-[#06080D] text-slate-100 font-sans selection:bg-[#F7931A]/30 selection:text-[#F7931A]">
        <Navbar />
        <NetworkTicker />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
