import { Navbar } from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "lexical-beautiful-mentions",
  description: "A mentions plugin for the lexical editor.",
};

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Navbar />
          <main className="container flex flex-col items-center pb-3 pt-5">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
