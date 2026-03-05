import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Welted — Heritage Boot Community",
  description: "Track your collection, share patina, buy/sell/trade heritage boots.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-welted-bg text-welted-text`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
