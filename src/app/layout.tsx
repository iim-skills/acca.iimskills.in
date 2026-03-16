import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import NextTopLoader from "nextjs-toploader";
import LayoutClientWrapper from "./LayoutClientWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* =======================
SEO METADATA (GLOBAL)
======================= */
export const metadata: Metadata = {
  metadataBase: new URL("https://iimskills.com"),
  title: "IIM SKILLS - Professional Courses For A Highly Rewarding Career",
  description:
    "Key Reasons To Join IIM SKILLS - World's Best Faculty & Industry Experts - Lifetime LMS Access - Guaranteed Virtual Internships - Placement Assurance Programs.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", sizes: "32x32" },
      { url: "/favicon.png", sizes: "16x16" },
    ],
    apple: "/favicon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

/* =======================
IDS
======================= */
const GA_MEASUREMENT_ID = "G-KW34ZSPMW6";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>

        {/* =======================
        GA4
        ======================= */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script
          id="ga4-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', {
                send_page_view: true
              });
            `,
          }}
        />

        {/* =======================
        HUBSPOT
        ======================= */}
        <Script
          id="hubspot-script"
          strategy="afterInteractive"
          src="//js.hs-scripts.com/7042430.js"
        />

      </head>

      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-clip bg-white`}
      >

        {/* =======================
        UI
        ======================= */}
        <NextTopLoader color="#0070f3" showSpinner={false} height={3} />

        <LayoutClientWrapper>
          {children}
        </LayoutClientWrapper>

      </body>
    </html>
  );
}