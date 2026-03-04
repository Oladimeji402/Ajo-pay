import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AjoPay — Digital Ajo Savings",
  description: "Save together, grow together. AjoPay brings the trusted Nigerian ajo savings tradition to the digital age.",
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
