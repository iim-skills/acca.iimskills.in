"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";

type AdminRouteHeaderProps = {
  backHref?: string;
  className?: string;
  compact?: boolean;
  description?: string;
  forceShow?: boolean;
  hideOn?: string[];
  maxWidthClassName?: string;
  title?: string;
};

const SEGMENT_LABELS: Record<string, string> = {
  batches: "Batches",
  coupons: "Coupons",
  "course-builder": "Course Builder",
  create: "Create",
  edit: "Edit",
  enrol: "Enrollment",
  MentorsBooking: "Mentor Slots",
  notifications: "Notifications",
  payment: "Payments",
  preview: "Preview",
  profile: "Profile",
  quizzes: "Quizzes",
  StudentSec: "Students",
  studyMT: "Study Material",
  users: "Users",
  videos: "Videos",
};

function formatSegment(segment: string) {
  const decoded = decodeURIComponent(segment);
  const mapped = SEGMENT_LABELS[decoded];

  if (mapped) {
    return mapped;
  }

  return decoded
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AdminRouteHeader({
  backHref = "/admin",
  className = "",
  compact = false,
  description,
  forceShow = false,
  hideOn = [],
  maxWidthClassName = "max-w-7xl",
  title,
}: AdminRouteHeaderProps) {
  const pathname = usePathname();

  if (!forceShow) {
    if (pathname === "/admin") {
      return null;
    }

    if (hideOn.includes(pathname)) {
      return null;
    }
  }

  const segments = pathname.split("/").filter(Boolean).slice(1);

  if (!segments.length && !forceShow) {
    return null;
  }

  const crumbs = [
    { href: "/admin", label: "Admin" },
    ...segments.map((segment, index) => ({
      href: `/admin/${segments.slice(0, index + 1).join("/")}`,
      label: formatSegment(segment),
    })),
  ];

  const resolvedTitle = title ?? crumbs[crumbs.length - 1]?.label ?? "Admin";

  return (
    <div className={`px-4 pt-4 sm:px-6 lg:px-8 ${className}`.trim()}>
      <div className={`mx-auto w-full ${maxWidthClassName}`.trim()}>
        <div
          className={`rounded-[1.5rem] border border-slate-200 bg-white shadow-sm ${
            compact ? "px-4 py-4 sm:px-5" : "px-5 py-5 sm:px-6 sm:py-6"
          }`}
        >
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400"
          >
            {crumbs.map((crumb, index) => {
              const isCurrent = index === crumbs.length - 1;

              return (
                <div
                  key={crumb.href}
                  className="flex items-center gap-2"
                >
                  {index > 0 ? <ChevronRight size={14} /> : null}
                  {isCurrent ? (
                    <span className="text-slate-500">{crumb.label}</span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="transition-colors hover:text-slate-700"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="mt-3 flex items-start gap-3 sm:items-center">
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </Link>

            <div className="min-w-0">
              <h1
                className={`font-bold text-slate-900 ${
                  compact ? "text-base sm:text-lg" : "text-xl sm:text-2xl"
                }`}
              >
                {resolvedTitle}
              </h1>
              {description ? (
                <p className="mt-1 text-sm text-slate-500">{description}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
