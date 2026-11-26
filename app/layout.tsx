import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "ZicZo Mart | Shop Smarter, Live Better",
    template: "%s | ZicZo Mart",
  },
  description:
    "ZicZo Mart — your trusted online store for quality products at great prices. Fast delivery across Sri Lanka.",
  keywords: [
    "ZicZo Mart",
    "online shopping",
    "Sri Lanka",
    "buy online",
    "e-commerce",
  ],
  openGraph: {
    siteName: "ZicZo Mart",
    type: "website",
    locale: "en_LK",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
