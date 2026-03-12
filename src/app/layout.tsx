import type { Metadata } from "next";
import { Archivo, Archivo_Black } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { HapticsProvider } from "@/components/haptics-provider";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-archivo",
});

const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-archivo-black",
});

export const metadata: Metadata = {
  title: "MEETING MAKERS // v2.0",
  description: "Track your AA meetings with brutalist precision",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${archivo.variable} ${archivoBlack.variable} antialiased`}>
        <ThemeProvider>
          <HapticsProvider>
            <AuthProvider>{children}</AuthProvider>
          </HapticsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
