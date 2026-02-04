import "./globals.css";
import "@sakun/system.css/dist/system.css";
import { Montserrat } from "next/font/google";
import type { Metadata } from "next";

const montserrat = Montserrat({ subsets: ["latin"] });

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
      <body className={`${montserrat.className} antialiased h-full overflow-hidden`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
