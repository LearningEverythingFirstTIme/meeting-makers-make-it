import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/components/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { HapticsProvider } from "@/components/haptics-provider";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#570013" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1c19" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "MEETING MAKERS // TRACKER_V1",
  description: "Track your AA meetings with brutalist precision",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Meeting Makers",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Meeting Makers",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicon */}
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        
        {/* 
          Google Fonts - Loaded via <link> tags to avoid Tailwind v4 bug
          where CSS @import for fonts can be silently blocked.
          
          Three voices:
          - Epilogue: Display/Headlines (Black 900, Bold 700)
          - Newsreader: Body/Editorial (Regular 400, Medium 500, Italic)
          - Space Grotesk: Labels/Data (Medium 500, Bold 700)
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Epilogue:wght@700;900&family=Newsreader:ital,wght@0,400;0,500;1,400;1,500&family=Space+Grotesk:wght@500;700&display=swap" 
          rel="stylesheet" 
        />
        
        {/* Material Symbols Outlined - for sparing icon use */}
        <link 
          rel="stylesheet" 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" 
        />
      </head>
      <body className="zine-grid antialiased">
        <ThemeProvider>
          <HapticsProvider>
            <AuthProvider>{children}</AuthProvider>
          </HapticsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
