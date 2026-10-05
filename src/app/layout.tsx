import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

const themeInitScript = `(() => {
  try {
    const saved = localStorage.getItem('theme');
    const isDark = saved ? saved === 'dark' : true;
    document.documentElement.classList.toggle('dark', isDark);
  } catch {
    document.documentElement.classList.add('dark');
  }
})();`;

export const metadata: Metadata = {
  title: "Auditly",
  description:
    "Technical website intelligence for developers, agencies, and modern businesses. Analyze performance, SEO, accessibility, security signals, UX, and technology stack.",
  openGraph: {
    title: "Auditly",
    description: "Find what is holding your website back.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Auditly",
    description: "Understand what is wrong with your website — and what to fix next.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} min-h-screen antialiased`}
        suppressHydrationWarning
      >
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        {children}
      </body>
    </html>
  );
}
