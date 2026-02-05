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
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || "GTM-P88C5MR";
const META_PIXEL_ID = "558274361867902";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>

        {/* =======================
           GOOGLE TAG MANAGER
        ======================= */}
        {GTM_ID && (
          <>
            <Script
              id="gtm-datalayer"
              strategy="beforeInteractive"
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer = window.dataLayer || [];`,
              }}
            />
            <Script
              id="gtm-head"
              strategy="beforeInteractive"
              dangerouslySetInnerHTML={{
                __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`,
              }}
            />
          </>
        )}

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
           META / FACEBOOK PIXEL (FIXED)
        ======================= */}
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s){
                if(f.fbq)return;
                n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;
                n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s);
              }(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');

              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-clip bg-white`}
      >
        {/* =======================
           GTM NOSCRIPT
        ======================= */}
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}

        {/* =======================
           META PIXEL NOSCRIPT
        ======================= */}
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt="meta-pixel"
          />
        </noscript>

        {/* =======================
           UI
        ======================= */}
        <NextTopLoader color="#0070f3" showSpinner={false} height={3} />

        
          <LayoutClientWrapper>
             
            {children}
          {/* <GlobalNotificationToast /> */}
          </LayoutClientWrapper>
        

        

      </body>
    </html>
  );
}
