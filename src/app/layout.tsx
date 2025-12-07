import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ping Pong Tournament Bracket",
  description: "Run casual double-elimination ping pong tournaments.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        data-theme="player"
        className={`${display.variable} ${body.variable} antialiased bg-[var(--bg)] text-[var(--ink)]`}
      >
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  );
}
