import type { Metadata, Viewport } from "next";
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
  title: "SatsNav — Autonomous Pre-Flight Payment Firewall",
  description: "Real-time BOLT #7 pathfinding, fee anomaly detection, and Model Context Protocol (MCP) agent co-pilot for the Bitcoin Lightning Network.",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: "#171717",
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
      <body className="min-h-full bg-[#f7f7f2] text-[#171717] font-sans selection:bg-[#d7f76a] selection:text-[#171717]">
        {children}
      </body>
    </html>
  );
}
