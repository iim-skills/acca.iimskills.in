"use client";
import { useEffect, useRef, useState } from "react";
import MultiModalPopup, { ModalKey } from "@/components/props/MultiModalPopup";
import ModalForm from "@/components/props/AllCoursePopup";
import ContactForm from "@/components/SelectCourseForm";

const menuItems = [
  { label: "Placements", target: "#placements" },
  { label: "Why Us", target: "#comparison" },
  { label: "Curriculum", target: "#course-curriculumn" },
  { label: "Alumni", target: "#alumni-stats" },
  { label: "Certifications", target: "#certifications" },
  { label: "Trainers", target: "#trainers" },
  { label: "Batch", target: "#batch-details" },
  { label: "Fees", target: "#program-fee" },
  // { label: "Overview", target: "#overview" },
  { label: "FAQ", target: "#faq" },
];

export default function CourseStickyHeader() {
  const [visible, setVisible] = useState(false);
  const [activeModal, setActiveModalState] = useState<ModalKey | null>(null);
  const [customTitle, setCustomTitle] = useState<string | undefined>();
  const [customDescription, setCustomDescription] = useState<string | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);

  // update mobile flag on mount & resize (client only)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640); // Tailwind 'sm' breakpoint
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // show header after a small vertical scroll measured in VH (10vh)
  useEffect(() => {
    let lastScroll = window.scrollY;
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const showAfter = window.innerHeight * 0.1; // 10vh

      // show/hide based on position (same as before)
      if (scrollTop > showAfter) setVisible(true);
      else setVisible(false);

      // optional: simple up/down hide pattern (keep subtle)
      lastScroll = scrollTop;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Observe which of the existing sections (from menuItems) are in view and set activeSection
  useEffect(() => {
    if (typeof window === "undefined") return;
    const targets = menuItems
      .map((m) => m.target.replace("#", ""))
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (!targets.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        root: null,
        rootMargin: "-40% 0px -40% 0px", // consider element 'active' when roughly centered
        threshold: 0.01,
      }
    );

    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  // whenever activeSection changes, if on mobile, make the nav scroll so the active item is centered
  useEffect(() => {
    if (!isMobile) return;
    if (!navRef.current || !activeSection) return;

    const navEl = navRef.current as HTMLElement;
    const link = navEl.querySelector(`a[href="#${activeSection}"]`) as HTMLElement | null;
    if (!link) return;

    // compute scroll to center the active link
    const navRect = navEl.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    const currentScrollLeft = navEl.scrollLeft;
    const offset = linkRect.left - navRect.left; // distance from nav left
    const targetScroll = currentScrollLeft + offset - (navRect.width / 2) + (linkRect.width / 2);

    // smooth scroll with bounds
    const bounded = Math.max(0, Math.min(targetScroll, navEl.scrollWidth - navRect.width));
    navEl.scrollTo({ left: bounded, behavior: "smooth" });
  }, [activeSection, isMobile]);

  const setActiveModal = (key: ModalKey | null) => {
    setActiveModalState(key);
  };

  // smooth scroll handler that will skip missing targets gracefully
  const handleMenuClick = (e: React.MouseEvent, target: string) => {
    e.preventDefault();
    const id = target.replace("#", "");
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    // if the exact ID is not present, try to find the first element that contains the label word
    const fallback = Array.from(document.querySelectorAll("section, div, header, main"))
      .find((node) => node.textContent?.toLowerCase().includes(id.toLowerCase()));
    if (fallback) {
      (fallback as HTMLElement).scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    // last fallback: scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // mobile top style: give a top offset of max 5vh on mobile to avoid overlapping tall mobile status bars
  const mobileTopStyle: React.CSSProperties = isMobile ? { top: "7vh" } : { top: 0 };

  return (
    <>
      <div
        ref={headerRef}
        style={mobileTopStyle}
        className={`fixed left-0 w-full bg-white shadow-md z-50 transition-transform duration-700 ease-out transform
          ${visible ? "translate-y-0" : "-translate-y-full"}
        `}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-2 sm:py-3">

          {/* LEFT – Menu items (horizontally scrollable on small screens) */}
          <nav
            ref={navRef}
            className={`flex gap-4 text-[14px] font-medium overflow-x-auto snap-x snap-mandatory no-scrollbar pr-4 sm:pr-0 transition-all duration-700
              ${visible ? "translate-x-0 opacity-100" : "translate-x-10 opacity-0"}
            `}
            style={{ WebkitOverflowScrolling: "touch" }}
            aria-label="Course sections"
          >
            {menuItems.map((item, idx) => {
              const id = item.target.replace("#", "");
              const isActive = activeSection === id;
              return (
                <a
                  key={idx}
                  href={item.target}
                  onClick={(e) => handleMenuClick(e, item.target)}
                  className={`whitespace-nowrap px-3 py-1 rounded-md hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors text-sm snap-center flex-shrink-0
                    ${isActive ? "text-blue-700 font-semibold" : "text-gray-700"}
                  `}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* RIGHT – Buttons (hidden on mobile) */}
          <div className="hidden sm:flex gap-3 transition-all duration-700 delay-200 items-center">
            <button
              onClick={() => {
                setActiveModal("ACCA");
                setCustomTitle("Download Course Brochure");
                setCustomDescription("Get complete details about the program.");
              }}
              className="px-4 sm:px-5 py-2 border border-blue-600 text-blue-600 rounded-full text-sm hover:bg-blue-50 transition bg-white"
            >
              Get Brochure
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Modal (Request Callback) */}
      <ModalForm
        title="Talk To Our Experts"
        description="Fill out the form and we’ll reach out shortly."
        form={<ContactForm />}
        isManualOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <MultiModalPopup
        activeModal={activeModal}
        setActiveModal={setActiveModal}
        customTitle={customTitle}
        customDescription={customDescription}
      />
    </>
  );
}