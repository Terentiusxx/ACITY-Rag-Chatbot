// frontend/app/layout.tsx
import type { Metadata } from "next";
import { Inter, Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Academic City RAG Chatbot",
  description:
    "Manual RAG pipeline for Ghana's economy, elections, and fiscal policy. No LangChain / LlamaIndex.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${manrope.variable} ${spaceGrotesk.variable} font-inter bg-background text-on-surface antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
