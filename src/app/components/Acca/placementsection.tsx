"use client";
// PlacementSection.tsx
import React, { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

/* NEW imports for modal behaviour (same as your HeroSec) */
import MultiModalPopup, { ModalKey } from "@/components/props/MultiModalPopup";

type Company = {
  name: string;
  logo: string; // tailwind color class (e.g. "text-blue-600")
  ctc: string;
};

const customStyles = `
  @keyframes scroll-left {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  
  @keyframes scroll-right {
    0% { transform: translateX(-50%); }
    100% { transform: translateX(0%); }
  }

  .animate-scroll-left {
    animation: scroll-left 200s linear infinite;
  }
  
  .animate-scroll-right {
    animation: scroll-right 200s linear infinite;
  }

  .bg-doodle {
    background-color: #f9fafb;
    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }
`;

const companiesRow1: Company[] = [
  { name: "Barclays", logo: "/HiringPartners/barclays.png", ctc: "₹6–14 LPA" },
  { name: "Growexx", logo: "/HiringPartners/growexx.png", ctc: "₹4–8 LPA" },
  { name: "Gi Group", logo: "/HiringPartners/GiGroupHolding.png", ctc: "₹5–12 LPA" },
  { name: "Citi", logo: "/HomePageAssets/Logo/citi.svg", ctc: "₹7–16 LPA" },
  { name: "Credit Suisse", logo: "/HiringPartners/CreditSuisse.png", ctc: "₹8–18 LPA" },

  { name: "Barclays", logo: "/HiringPartners/barclays.png", ctc: "₹6–14 LPA" },
  { name: "Growexx", logo: "/HiringPartners/growexx.png", ctc: "₹4–8 LPA" },
  { name: "Gi Group", logo: "/HiringPartners/GiGroupHolding.png", ctc: "₹5–12 LPA" },
  { name: "Citi", logo: "/HomePageAssets/Logo/citi.svg", ctc: "₹7–16 LPA" },
  { name: "Credit Suisse", logo: "/HiringPartners/CreditSuisse.png", ctc: "₹8–18 LPA" },

  { name: "Barclays", logo: "/HiringPartners/barclays.png", ctc: "₹6–14 LPA" },
  { name: "Growexx", logo: "/HiringPartners/growexx.png", ctc: "₹4–8 LPA" },
  { name: "Gi Group", logo: "/HiringPartners/GiGroupHolding.png", ctc: "₹5–12 LPA" },
  { name: "Citi", logo: "/HomePageAssets/Logo/citi.svg", ctc: "₹7–16 LPA" },
  { name: "Credit Suisse", logo: "/HiringPartners/CreditSuisse.png", ctc: "₹8–18 LPA" },

  { name: "Barclays", logo: "/HiringPartners/barclays.png", ctc: "₹6–14 LPA" },
  { name: "Growexx", logo: "/HiringPartners/growexx.png", ctc: "₹4–8 LPA" },
  { name: "Gi Group", logo: "/HiringPartners/GiGroupHolding.png", ctc: "₹5–12 LPA" },
  { name: "Citi", logo: "/HomePageAssets/Logo/citi.svg", ctc: "₹7–16 LPA" },
  { name: "Credit Suisse", logo: "/HiringPartners/CreditSuisse.png", ctc: "₹8–18 LPA" },
];

const companiesRow2: Company[] = [
  { name: "Moody's", logo: "/HiringPartners/moodys.png", ctc: "₹6–15 LPA" },
  { name: "Blackstone", logo: "/HiringPartners/blackstone.png", ctc: "₹10–28 LPA" },
  { name: "EY", logo: "/HiringPartners/ey.webp", ctc: "₹5–12 LPA" },
  { name: "S&P Global", logo: "/HiringPartners/SNP.png", ctc: "₹6–14 LPA" },
  { name: "JPMorgan", logo: "/HiringPartners/JPMorgan.png", ctc: "₹8–22 LPA" },
  { name: "Goldman Sachs", logo: "/HiringPartners/GoldmanSachs.png", ctc: "₹10–26 LPA" },
  { name: "Morgan Stanley", logo: "/HiringPartners/MorganStanley.png", ctc: "₹9–28 LPA" },

  { name: "Moody's", logo: "/HiringPartners/moodys.png", ctc: "₹6–15 LPA" },
  { name: "Blackstone", logo: "/HiringPartners/blackstone.png", ctc: "₹10–28 LPA" },
  { name: "EY", logo: "/HiringPartners/ey.webp", ctc: "₹5–12 LPA" },
  { name: "S&P Global", logo: "/HiringPartners/SNP.png", ctc: "₹6–14 LPA" },
  { name: "JPMorgan", logo: "/HiringPartners/JPMorgan.png", ctc: "₹8–22 LPA" },
  { name: "Goldman Sachs", logo: "/HiringPartners/GoldmanSachs.png", ctc: "₹10–26 LPA" },
  { name: "Morgan Stanley", logo: "/HiringPartners/MorganStanley.png", ctc: "₹9–28 LPA" },

  { name: "Moody's", logo: "/HiringPartners/moodys.png", ctc: "₹6–15 LPA" },
  { name: "Blackstone", logo: "/HiringPartners/blackstone.png", ctc: "₹10–28 LPA" },
  { name: "EY", logo: "/HiringPartners/ey.webp", ctc: "₹5–12 LPA" },
  { name: "S&P Global", logo: "/HiringPartners/SNP.png", ctc: "₹6–14 LPA" },
  { name: "JPMorgan", logo: "/HiringPartners/JPMorgan.png", ctc: "₹8–22 LPA" },
  { name: "Goldman Sachs", logo: "/HiringPartners/GoldmanSachs.png", ctc: "₹10–26 LPA" },
  { name: "Morgan Stanley", logo: "/HiringPartners/MorganStanley.png", ctc: "₹9–28 LPA" },
];

/** Smooth counter hook — returns a number (animated from 0 -> end) */
const useCounter = (end: string | number, duration = 2000) => {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    const raw = end?.toString() ?? "";
    const endValue = parseFloat(raw.replace(/[^0-9.-]/g, ""));
    if (isNaN(endValue)) return;

    let rafId = 0;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const current = endValue * progress;
      setCount(current);
      if (progress < 1) rafId = requestAnimationFrame(step);
      else setCount(endValue);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [end, duration]);

  return count;
};

const CompanyCard = ({ company }: { company: Company }) => (
  <div className="flex-shrink-0 w-[290px] h-28 mx-4 bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all duration-300 flex items-center overflow-hidden">
    {/* Logo Container - Fixed width and centered */}
    <div className="flex-shrink-0 w-20 h-16 bg-white flex items-center justify-center mr-4">
      <img
        src={company.logo}
        alt={company.name}
        className="max-w-full max-h-12 object-contain"
      />
    </div>

    {/* Vertical Divider (Optional for better structure) */}
    <div className="h-12 w-px bg-gray-100 mr-4" />

    {/* Text Content - Fixed heights to maintain uniformity */}
    <div className="flex-1 min-w-0 flex flex-col justify-center">
      {/* h-9 (approx 36px) is enough for 2 lines of text-sm. 
          line-clamp-2 ensures it never exceeds 2 lines. */}
      <h3 className="text-lg font-bold text-gray-900 leading-tight h-6 flex items-center line-clamp-2 overflow-hidden">
        {company.name}
      </h3>
      
      <div className="mt-1">
        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-2">
          Final CTC
        </p>
        <p className="text-[15px] font-extrabold text-black-700 leading-none">
          {company.ctc}
        </p>
      </div>
    </div>
  </div>
);

type StatBoxProps = {
  bg: string;
  value: string | number;
  label: string;
  subLabel?: string;
  suffix?: string;
  prefix?: string;
};

const StatBox = ({ bg, value, label, subLabel, suffix = "", prefix = "" }: StatBoxProps) => {
  const count = useCounter(value);
  const numericEnd = parseFloat(value.toString().replace(/[^0-9.-]/g, ""));
  const isFloat = !isNaN(numericEnd) && numericEnd % 1 !== 0;

  const displayValue: string | number = (() => {
    if (isNaN(numericEnd)) return value;
    if (isFloat) return count.toFixed(2);
    // integer — show whole number and format with commas
    return Math.floor(count).toLocaleString();
  })();

  return (
    <div className={`${bg} p-8 flex flex-col items-center justify-center text-white text-center transition-transform hover:scale-105 duration-300`}>
      <span className="text-3xl md:text-4xl font-extrabold flex items-center drop-shadow-md">
        {prefix}
        {displayValue}
        {suffix}
      </span>
      <span className="text-sm font-bold mt-1 tracking-wide opacity-95">{label}</span>
      {subLabel && <p className="text-xs opacity-80 mt-1 font-medium">{subLabel}</p>}
    </div>
  );
};

const PlacementSection = () => {
  const [activeModal, setActiveModalState] = useState<ModalKey | null>(null);
  const [customTitle, setCustomTitle] = useState<string | undefined>();
  const [customDescription, setCustomDescription] = useState<string | undefined>();

  const courseConfigs: Record<string, { imageUrl: string; productId: string; contactOwner: string; redirectUrl: string; courseKey?: string }> = {
    ACCA: {
      imageUrl: "/DemoImage/ACCA.png",
      productId: "ACCA",
      contactOwner: "IIM SKILLS",
      redirectUrl: "/Thank-You/Acca/",
      courseKey: "acca",
    },
  };
  const config = courseConfigs["ACCA"];

  return (
    <div className="font-sans text-gray-800 bg-white">
      <style>{customStyles}</style>

      <div id="placements" className="max-w-5xl mx-auto px-4 pt-8 md:pt-16 pb-8 text-center">
        <h2 className="text-orange-600 font-bold tracking-widest text-sm uppercase mb-3">
          ACCA Course With Placement Assistance
        </h2>

        <div className="relative inline-block">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900  relative z-10">
            Placement Record by  <span className="text-blue-700">IIM SKILLS</span>
          </h2>

          {/* <div className="absolute -bottom-2 left-0 right-0 h-3 bg-orange-300 opacity-60 -skew-x-6 transform z-0 mx-auto w-3/4"></div> */}
        </div>

        <p className="max-w-6xl mx-auto text-gray-600 text-[15px] md:text-lg leading-relaxed mb-12">
         The IIM SKILLS ACCA Coaching equips students with the expertise, knowledge, and skills needed to secure global career opportunities. As a result of our structured training, students have secured jobs in top MNCs, accounting firms, & Big 4s. 
        </p>

        {/* Stats Bar with Counters */}
       <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 shadow-2xl rounded-2xl overflow-hidden max-w-5xl mx-auto relative z-20 mb-[-40px]">
          <StatBox bg="bg-gradient-to-br from-blue-600 to-blue-800" value="95" suffix="%" label="Placement Rate" />
          <StatBox bg="bg-gradient-to-br from-orange-500 to-red-500" value="30" suffix="L" label="Highest CTC" />
          <StatBox bg="bg-gradient-to-br from-blue-500 to-cyan-600" value="550" suffix="+" label="Recruitment partners" />
          <StatBox bg="bg-gradient-to-br from-amber-500 to-orange-600" value="55000" suffix="+" label="Students Trained" />
        </div>
      </div>

      {/* Marquee Section with Doodle Background */}
      <div className="bg-doodle pt-20 pb-16 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-white to-transparent z-10"></div>

        <div className="space-y-8">
          {/* First Row - Scrolling Left */}
          <div className="relative w-full overflow-hidden">
            <div className="flex w-max animate-scroll-left">
              {[...companiesRow1, ...companiesRow1, ...companiesRow1].map((company, idx) => (
                <CompanyCard key={`row1-${idx}`} company={company} />
              ))}
            </div>
          </div>

          {/* Second Row - Scrolling Right */}
          <div className="relative w-full overflow-hidden">
            <div className="flex w-max animate-scroll-right" style={{ animationDelay: "-30s" }}>
              {[...companiesRow2, ...companiesRow2, ...companiesRow2].map((company, idx) => (
                <CompanyCard key={`row2-${idx}`} company={company} />
              ))}
            </div>
          </div>
        </div>

        {/* View Reports Button */}
        <div className="text-center mt-12 relative z-20">
          <button
            onClick={() => {
              setActiveModalState("ACCA");
              setCustomTitle("View Placement Reports");
              setCustomDescription("Download placement reports and placement insights for the ACCA course");
            }}
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all transform hover:-translate-y-1 hover:shadow-xl flex items-center mx-auto gap-2"
          >
            View Placement Reports
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none"></div>
      </div>

      {/* NEW: Modal component (same usage as in HeroSec). This does not alter any layout or style above. */}
      <MultiModalPopup
        activeModal={activeModal}
        setActiveModal={(k) => setActiveModalState(k)}
        customTitle={customTitle}
        customImage={config.imageUrl}
        customDescription={customDescription}
        productId={config.productId}
      />
    </div>
  );
};

export default PlacementSection;
