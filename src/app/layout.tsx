import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NOVA AI",
  description: "ChatGPT-style production chat workspace",
  keywords: ["AI chat", "artificial intelligence", "chatbot", "workspace", "productivity"],
  icons: {
    icon: "/icon",
  },
  openGraph: {
    title: "NOVA AI",
    description: "ChatGPT-style production chat workspace",
    siteName: "NOVA AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#FAFAFA] text-foreground overflow-x-hidden`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
