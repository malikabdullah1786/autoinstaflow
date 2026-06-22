import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Auto Insta Flow | Instagram Comment & DM Automation SaaS",
  description: "Automate your Instagram comments, direct messages, story replies, lead collection, and follow gates to 10x your conversions and engagement.",
  keywords: ["instagram automation", "instagram bot", "DM automation", "comment guard", "follow gate", "lead magnet", "social media SaaS"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#09090b]">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
