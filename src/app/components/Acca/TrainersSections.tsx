"use client";

import React, { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

// --- MOCK NAVIGATION FOR PREVIEW ---
const usePathname = (): string => "/digital-marketing-course-in-mumbai"; // Simulating a city URL
// ----------------------------------

// --- INLINE MODAL COMPONENT (To ensure preview works) ---
type MultiModalPopupProps = {
  activeModal: string | null;
  setActiveModal: React.Dispatch<React.SetStateAction<string | null>>;
};

const MultiModalPopup: React.FC<MultiModalPopupProps> = ({ activeModal, setActiveModal }) => {
  if (!activeModal) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
        <button
          onClick={() => setActiveModal(null)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Download Trainer Profiles</h3>
          <p className="text-gray-600 mb-6 text-sm">
            Get detailed portfolios of all our 12+ industry mentors and their past session recordings.
          </p>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <input
              type="text"
              placeholder="Full Name"
              className="w-full border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            <input
              type="email"
              placeholder="Email Address"
              className="w-full border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-blue-200">
              Download Now
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
// --------------------------------------------------------

// --- DATA: Trainers from Digital Marketing Brochure Page 12 ---
type Trainer = {
  id: string;
  name: string;
  role?: string;
  image: string;
  companyLogo?: string;
  highlights: string[];
  companies?: string[];
  linkedin?: string;
};

const trainersData: Trainer[] = [
  {
    id: "vanthana",
    name: "Vanthana Baburao",
    role: "Vice President Data Analytics Department",
    image: "/trainer/vanthan.jpeg",
    companyLogo: "/Logo_IIMSKILLS.webp",
    highlights: [
      "Extensive experience in data analytics leadership",
      "Leads data analytics initiatives and teams",
      "Deep domain understanding of analytics applied to finance"
    ],
    companies: [
      "/Review/wipro-co.webp",
      "/Corporate-Customer/citibank-150x60.jpg",
      "/HiringPartners/pwc.png"
    ],
    linkedin: "https://www.linkedin.com/in/vanthana-baburao-254a0494/"
  },
  {
    id: "akash",
    name: "Akash Gup",
    role: "Vice President Data Analytics Department",
    image: "/trainer/vanthan.jpeg",
    companyLogo: "/Logo_IIMSKILLS.webp",
    highlights: [
      "Extensive experience in data analytics leadership",
      "Leads data analytics initiatives and teams",
      "Deep domain understanding of analytics applied to finance"
    ],
    companies: [
      "/Review/wipro-co.webp",
      "/Corporate-Customer/citibank-150x60.jpg",
      "/HiringPartners/pwc.png"
    ],
    linkedin: "https://www.linkedin.com/in/vanthana-baburao-254a0494/"
  },
  {
    id: "vanthana",
    name: "Vanthana Baburao",
    role: "Vice President Data Analytics Department",
    image: "/trainer/vanthan.jpeg",
    companyLogo: "/Logo_IIMSKILLS.webp",
    highlights: [
      "Extensive experience in data analytics leadership",
      "Leads data analytics initiatives and teams",
      "Deep domain understanding of analytics applied to finance"
    ],
    companies: [
      "/Review/wipro-co.webp",
      "/Corporate-Customer/citibank-150x60.jpg",
      "/HiringPartners/pwc.png"
    ],
    linkedin: "https://www.linkedin.com/in/vanthana-baburao-254a0494/"
  },
  {
    id: "jatin",
    name: "Jatin Sahnan",
    role: "Data Analyst Consultant",
    image: "/trainer/jatin.jpg",
    companyLogo: "/trainer/dataintellec.jpg",
    highlights: [
      "Currently working as the Director at Dataintellec",
      "Strong experience in Data Analytics and Business Intelligence",
      "Clear teaching style and provides hands-on training in machine learning, deep learning, and data analysis."
    ],
    companies: ["/trainer/sodexo.jpg", "/trainer/absolutelab.jpg"],
    linkedin: "https://www.linkedin.com/in/jatin-sahnan-07549469/"
  },
  {
    id: "padmalochni",
    name: "Padmalochni Selvamani",
    role: "Data Scientist",
    image: "/trainer/padmalochini.jpg",
    companyLogo: "/trainer/iit-bombay.jpg",
    highlights: [
      "Highly-Experienced Data Scientist",
      "Worked at prestigious institutions - IIT Bombay",
      "Known for her deep expertise in data science and clear explanations."
    ],
    companies: ["/trainer/anubio.jpg", "/trainer/aero2astro.jpg"],
    linkedin: "https://www.linkedin.com/in/padmalochini-selvamani-990623ba/"
  },
  {
    id: "hiruthiga-kasthuri",
    name: "Hiruthiga Kasthuri",
    role: "Data Scientist",
    image: "/trainer/hiruthiga-kasthuri.jpg",
    companyLogo: "/trainer/wirecard.png",
    highlights: [
      "Data Scientist and leading trainer at IIM SKILLS",
      "Possess strong analytical skills.",
      "Has worked with top companies - Wirecard."
    ],
    companies: ["/trainer/make-a-difference.jpg"],
    linkedin: "https://www.linkedin.com/in/hiruthiga-kasthuri-a107718b/"
  },
  {
    id: "rajeshwari-khairnar",
    name: "Rajeshwari Khairnar",
    role: "Subject Matter Expert",
    image: "/trainer/rajeshwari.png",
    companyLogo: "/trainer/emeritus.jpg",
    highlights: [
      "Subject Matter Expert",
      "Has deep expertise in AI and Business Analytics",
      "Known for her personalized mentorship and guidance in business analytics."
    ],
    companies: ["/trainer/citran.jpg", "/trainer/linc.jpg"],
    linkedin: "https://www.linkedin.com/in/rk44/"
  },
  {
    id: "ayan-kumar-ghosh",
    name: "Ayan Kumar Ghosh",
    role: "Python Engineer",
    image: "/trainer/ayan.jpg",
    companyLogo: "/trainer/avodha.png",
    highlights: [
      "Worked at: Avodha",
      "Possess strong knowledge of Python programming and database management."
    ],
    companies: ["/trainer/tcg-crest.jpg", "/trainer/iiem.jpg/"],
    linkedin: "https://www.linkedin.com/in/akghsh/"
  },
  {
    id: "gaurav-sethi",
    name: "Gaurav Sethi",
    role: "Lead Project Manager",
    image: "/trainer/gaurav.png",
    companyLogo: "/trainer/air-india.png",
    highlights: [
      "Worked with renowned companies like Spicejet, Genpact Infosolutions, and Air India Limited.",
      "Lead Project Manager"
    ],
    companies: ["/trainer/mphasis.png"],
    linkedin: "https://www.linkedin.com/in/g-sethi-a3024822/"
  },
];


type MountRevealProps = {
  children: React.ReactNode;
  delay?: number;
};

function MountReveal({ children, delay = 0 }: MountRevealProps) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div
      aria-hidden={!show}
      className={`transition-all duration-[720ms] ease-[cubic-bezier(.22,1,.36,1)] transform ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } will-change-transform will-change-opacity`}
    >
      {children}
    </div>
  );
}

type TrainersSectionProps = {
  trainers?: Trainer[];
  sectionTitle?: string;
};

export default function TrainersSection({ trainers = trainersData, sectionTitle = "Meet our Trainers" }: TrainersSectionProps) {
  const [index, setIndex] = useState<number>(0);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Use mock pathname or real one
  const pathname = usePathname() || "";

  // Default paragraph (Updated for Digital Marketing context)
  const defaultIntro =
    "To ensure our students master the latest digital trends, we have instructors who have led campaigns for top global brands and startups.";

  const cityContent: Record<string, string> = {
    delhi: defaultIntro,
    mumbai: defaultIntro,
    bangalore: defaultIntro,
    // Add variations per city if needed
  };

  const [introText, setIntroText] = useState<string>(defaultIntro);

  useEffect(() => {
    // Matches URL ending like: /digital-marketing-course-in-<city>
    const cityMatch = pathname.match(/\/digital-marketing-course-in-([^\/]+)\/?$/i);

    if (cityMatch) {
      const citySlug = cityMatch[1].toLowerCase();
      if (cityContent[citySlug]) {
        setIntroText(cityContent[citySlug]);
        return;
      }
    }
    setIntroText(defaultIntro);
  }, [pathname]);

  if (!trainers || trainers.length === 0) return null;
  const current = trainers[index];

  const prev = () => setIndex((i) => (i - 1 + trainers.length) % trainers.length);
  const next = () => setIndex((i) => (i + 1) % trainers.length);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [trainers]);

  const renderDualTitle = (title: string) => {
    const t = (title || "").trim();
    if (!t) return null;
    const parts = t.split(/\s+/);
    if (parts.length === 1) return <span className="text-blue-700">{parts[0]}</span>;
    const last = parts.pop();
    const first = parts.join(" ");
    return (
      <>
        <span className="text-gray-900">{first}&nbsp;</span>
        <span className="text-blue-700">{last}</span>
      </>
    );
  };

  return (
    <section id="trainers" className="relative bg-white text-slate-900 py-16 md:py-20 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 md:mb-16 text-center">
          <h2 className="text-orange-600 font-bold tracking-widest text-sm uppercase mb-3">World-Class Faculty</h2>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{renderDualTitle(sectionTitle)}</h2>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto text-center text-lg leading-relaxed">{introText}</p>
        </div>

        {/* Main card */}
        <div className="bg-slate-50 border border-slate-200 rounded-[2.5rem] shadow-xl p-6 sm:p-10 md:p-12 flex flex-col lg:flex-row items-center gap-10 lg:gap-16 relative overflow-hidden">
          {/* Decorative background blob */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

          {/* Left: Avatar + name */}
          <div className="shrink-0 w-full lg:w-1/3 flex justify-center lg:justify-start relative z-10">
            <MountReveal>
              <div className="relative text-center lg:text-left group">
                <div
                  className="mx-auto lg:mx-0 w-[200px] h-[200px] sm:w-[240px] sm:h-[240px] md:w-[340px] md:h-[340px] rounded-full overflow-hidden border-[8px] border-white shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                  style={{
                    boxShadow: "0 22px 58px rgba(14,78,145,0.15), 0 8px 26px rgba(14,78,145,0.08)",
                  }}
                >
                  <img src={current.image} alt={current.name} className="object-cover w-full h-full" />
                </div>

                <div className="mt-6 text-center lg:text-left">
                  {current.linkedin ? (
                    <a
                      href={current.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${current.name} on LinkedIn`}
                      className="text-2xl sm:text-3xl font-bold hover:text-blue-700 transition-colors block text-gray-900 leading-tight"
                    >
                      {current.name}
                    </a>
                  ) : (
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{current.name}</h3>
                  )}

                  {current.role && <p className="text-base sm:text-lg text-blue-600 mt-2 font-medium">{current.role}</p>}
                </div>
              </div>
            </MountReveal>
          </div>

          {/* Middle: controls */}
          <div className="w-full lg:w-auto flex flex-col items-center gap-6 relative z-10">
            <MountReveal delay={80}>
              <div
                className="flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-white border border-slate-200 shadow-lg p-4"
                title={current.companyLogo ? `${current.name} — company` : "No company logo"}
              >
                {current.companyLogo ? (
                  <img src={current.companyLogo} alt={`${current.name} company logo`} className="object-contain w-full h-full" />
                ) : (
                  <div className="w-full h-full rounded-full bg-slate-100" />
                )}
              </div>
            </MountReveal>

            <MountReveal delay={140}>
              <div className="flex items-center gap-4">
                <button
                  onClick={prev}
                  aria-label="Previous trainer"
                  className="p-3 rounded-full bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-all shadow-sm"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                <button
                  onClick={next}
                  aria-label="Next trainer"
                  className="p-3 rounded-full bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-all shadow-sm"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </MountReveal>

            <MountReveal delay={220}>
              <div className="flex gap-2.5">
                {trainers.map((t, i) => (
                  <button
                    key={t.id}
                    onClick={() => setIndex(i)}
                    aria-label={`Show ${t.name}`}
                    className={`h-2.5 rounded-full transition-all duration-300 ${i === index ? "bg-blue-600 w-8" : "bg-slate-300 w-2.5 hover:bg-blue-300"}`}
                    title={t.name}
                  />
                ))}
              </div>
            </MountReveal>
          </div>

          {/* Right: details */}
          <div className="w-full lg:flex-1 relative z-10">
            <MountReveal delay={40}>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 relative">
                {/* Quote Icon Decoration */}
                <div className="absolute -top-4 -right-4 bg-orange-100 p-2 rounded-full hidden sm:block">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-orange-500 transform rotate-180">
                    <path
                      d="M10 11h-4a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1h3a1 1 0 0 1 1 1v6c0 2.667 -1.333 4.333 -4 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                    <path
                      d="M19 11h-4a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1h3a1 1 0 0 1 1 1v6c0 2.667 -1.333 4.333 -4 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                </div>

                <div className="flex items-start gap-5">
                  <div className="w-1.5 h-16 rounded-full bg-gradient-to-b from-blue-600 to-blue-300 shadow-sm flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Trainer Profile</p>

                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">
                      {current.name} <span className="font-normal text-slate-500 text-lg">| {current.role}</span>
                    </h3>

                    <ul className="space-y-4">
                      {current.highlights.map((h, idx) => (
                        <li key={idx} className="flex gap-4 items-start group">
                          <span className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M20 6L9 17l-5-5" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                          <p className="text-slate-700 text-base leading-relaxed">{h}</p>
                        </li>
                      ))}
                    </ul>

                    {current.companies && current.companies.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wide">Featured In / Worked With</p>
                        <div className="flex flex-wrap gap-4">
                          {current.companies.map((logo, i) => (
                            <div key={i} className="h-14 px-5 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
  <img
    src={logo}
    alt="Company Logo"
    className="h-8 w-auto object-contain transition-all"
  />
</div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-8">
                      <button
                        onClick={() => setActiveModal("DM")}
                        className="inline-flex items-center gap-2.5 px-6 py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5"
                      >
                        <Download className="w-5 h-5" />
                        Download Trainer Portfolio
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </MountReveal>
          </div>
        </div>
      </div>

      <MultiModalPopup activeModal={activeModal} setActiveModal={setActiveModal} />
    </section>
  );
}
