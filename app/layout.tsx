import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "Subtech Ajo Solution — Digital Ajo Savings",
  description:
    "Save together, grow together. Subtech Ajo Solution brings the trusted Nigerian ajo savings tradition to the digital age.",
  icons: {
    icon: [{ url: "/subtech-ajo-logo.svg", type: "image/svg+xml" }],
    shortcut: "/subtech-ajo-logo.svg",
    apple: "/subtech-ajo-logo.svg",
    other: [
      {
        rel: "mask-icon",
        url: "/subtech-ajo-solution-mark-mono-dark.svg",
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
