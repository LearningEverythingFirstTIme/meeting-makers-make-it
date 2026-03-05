import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Meeting Makers Make It",
  description: "Track meetings and daily attendance check-ins",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} bg-[var(--background)] text-black antialiased selection:bg-pink-300 selection:text-black`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
