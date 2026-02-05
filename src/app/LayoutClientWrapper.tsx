"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import Header from "./header";
import Footer from "./Footer";
 
import { pageview } from "../lib/fbpixel";

export default function LayoutClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // 🔥 Fire Meta Pixel PageView on every route change (SPA tracking)
  useEffect(() => {
    pageview();
  }, [pathname]);

  // Normalize path
  const cleanPath =
    pathname !== "/" ? pathname.replace(/\/+$/, "").toLowerCase() : pathname;

  // Pages where layout should be hidden
  const hideRoutes = ["/iim-skills-registration-form"];

  const hideLayout =
    hideRoutes.some((r) => cleanPath === r) || cleanPath.startsWith("/admin");

  return (
    <>
      {/* Header */}
      

      {/* Main Content */}
      {children}

      {/* Footer */}
       
      {/* Floating Footer Buttons */}
      
    </>
  );
}
