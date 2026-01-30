import "./globals.css";
import "@sakun/system.css/dist/system.css";
import { Inter } from "next/font/google"; // Or use standard font from system.css if preferred, but Inter is in next.
// System.css uses standard sans-serif usually.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Webhook Service",
  description: "Retro Webhook Service Manager",
};

import Providers from "@/lib/providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="antialiased h-full overflow-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
