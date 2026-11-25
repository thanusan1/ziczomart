import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZicZo Mart | Online Shopping",
  description:
    "Discover amazing products at ZicZo Mart. Shop smarter, live better.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
