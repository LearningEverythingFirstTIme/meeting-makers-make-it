import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "MEETING TRACKER // SYSTEM",
  description: "Track meetings and daily attendance check-ins",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jetbrainsMono.variable} bg-[#1a1a1a] text-[#e5e5e5] antialiased selection:bg-[#fbbf24] selection:text-black`}>
        <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]" 
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)' }}>
        </div>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
