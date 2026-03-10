import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "AjoPay — Digital Ajo Savings",
  description: "Save together, grow together. AjoPay brings the trusted Nigerian ajo savings tradition to the digital age.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/ajopay-mark.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/ajopay-mark.svg",
    other: [
      {
        rel: "mask-icon",
        url: "/ajopay-mark-mono-dark.svg",
        color: "#0F172A",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
