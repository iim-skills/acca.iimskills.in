"use client";
import React, { useState } from "react";
import { Quote, ArrowRight, Linkedin, ChevronRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import MultiModalPopup, { ModalKey } from "@/components/props/MultiModalPopup";

// --- TYPES & DATA ---
type Mentor = {
  id: string;
  name: string;
  role: string;
  company: string;
  CompanyLogoPath: string;
  imagePath: string;
  sessionTopic: string;
  quote: string;
  imageColor: string;
  linkedinUrl?: string;
  sessionUrl?: string;
};

const mentors: Mentor[] = [
  {
    id: "m1",
    name: "Varun",
    role: "CEO & Founder | Helping CFOs, CPAs & Investment Firms Scale with Offshore Financial Expertise",
    company: "CEO & Founder",
    CompanyLogoPath: "/trainer/tag.png",
    imagePath: "/trainer/varun.jpeg",
    sessionTopic: "Industry insights on business and technology",
    quote: "Having worked with top companies and trained thousands of students, my sessions are packed with industry insights and knowledge on topics such as stakeholder management, governance, and IFRS basics, delivered in easily digestible form to strengthen learners' ACCA preparation.",
    imageColor: "bg-blue-100",
    linkedinUrl: "https://www.linkedin.com/in/varun-7/",
    sessionUrl: "https://www.youtube.com/watch?v=vikramsession",
  },
  {
    id: "m2",
    name: "Shubham",
    role: "ACCA Member",
    company: "Infrastructure Investments Professional",
    CompanyLogoPath: "/ACCA/acca-logo.png",
    imagePath: "/trainer/subham.jpeg",
    sessionTopic: "Build expert-level knowledge of audit and taxation",
    quote: "Having years of experience as an ACCA faculty, I provide learners with rich industry knowledge of audit planning, internal control, and tax computations. Alongside training, learners will benefit from the complete exam guidance and detailed feedback provided during the sessions.",
    imageColor: "bg-green-100",
    linkedinUrl: "https://www.linkedin.com/in/tushar-b-a9108114/",
    sessionUrl: "https://www.youtube.com/watch?v=rohansession",
  },
  {
    id: "m3",
    name: "Tushar B.",
    role: "Infrastructure Investments Professional | M&A",
    company: "Infrastructure Investments Professional",
    CompanyLogoPath: "/trainer/Cube-Highways.webp",
    imagePath: "/trainer/tusar.jpeg",
    sessionTopic: "Understand the corporate and business law",
    quote: "My sessions are focused on providing industry-specific knowledge of business law, legal systems, and professional law in a simple and easy-to-follow manner.",
    imageColor: "bg-green-100",
    linkedinUrl: "https://www.linkedin.com/in/tushar-b-a9108114/",
    sessionUrl: "https://www.youtube.com/watch?v=rohansession",
  },
  {
    id: "m4",
    name: "Vikas K.",
    role: "Senior Manager - Lead Advisory - Grant Thornton | Ex - Manager - RocSearch",
    company: "Senior Manager",
    CompanyLogoPath: "/trainer/Grant_Thornton_logo.png",
    imagePath: "/trainer/vikas.png",
    sessionTopic: "Master financial and management accounting",
    quote: "I deliver informative training sessions that are focused on helping learners prepare better for knowledge-level subjects. The goal is to teach in a simple and easy-to-understand manner, so learners can easily grasp the concepts and clear the exams.",
    imageColor: "bg-cyan-100",
    linkedinUrl: "https://www.linkedin.com/in/vikas-k-59522241/",
    sessionUrl: "https://www.youtube.com/watch?v=anitasession",
  },
  {
    id: "m5",
    name: "Raj A.",
    role: "M&A | Investment Banking | Ex-Shaper - Global Shapers Community",
    company: "Investment Banker",
    CompanyLogoPath: "/trainer/wodehouse.png",
    imagePath: "/trainer/raj-arora.jpeg",
    sessionTopic: "Develop a strong knowledge of strategic business leadership and reporting",
    quote: "Having trained hundreds of students for ACCA, my sessions help learners build a better understanding of leadership management, corporate reporting, strategy, and risk measurement. My experience working for top firms has helped elevate the ACCA training sessions with real industry insights.",
    imageColor: "bg-indigo-100",
    linkedinUrl: "http://linkedin.com/in/rajkumararora-cfa/",
    sessionUrl: "https://www.youtube.com/watch?v=davidsession",
  },
  {
    id: "m6",
    name: "Vanthana B.",
    role: "Vice President, IIM SKILLS",
    company: "Vice President",
    CompanyLogoPath: "/Logo_IIMSKILLS.webp",
    imagePath: "/trainer/vanthana.png",
    sessionTopic: "Understand the latest technologies and data analytics",
    quote: "With extensive experience in data analytics leadership, I train learners in ACCA subjects such as management accounting, helping learners understand how to summarise and analyse data, variance analysis, and time series analysis.",
    imageColor: "bg-indigo-100",
    linkedinUrl: "https://www.linkedin.com/in/vanthana-baburao-254a0494/",
    sessionUrl: "https://www.youtube.com/watch?v=davidsession",
  },
  {
    id: "m7",
    name: "Dr. Swati",
    role: "Educationist, Researcher, Financial Trainer, Assistant Professor at VIPS",
    company: "Assistant Professor",
    CompanyLogoPath: "/trainer/vips.jpg",
    imagePath: "/trainer/swati.jpeg",
    sessionTopic: "Gain expertise in knowledge-level subjects of ACCA",
    quote: "Committed to student success, my sessions are focused on providing structured ACCA training for clearing the basics of financial accounting, management accounting, and financial statements.",
    imageColor: "bg-yellow-100",
    linkedinUrl: "https://www.linkedin.com/in/dr-swati-narula-aa034717/",
    sessionUrl: "https://www.youtube.com/watch?v=sarahsession",
  },
    {
    id: "m8",
    name: "Vijayalakshmi M.",
    role: "Establish strong command in advanced finance tools",
    company: "Senior Data Analyst",
    CompanyLogoPath: "/trainer/Vodafone.png",
    imagePath: "/trainer/Vijayalakshmi.jpg",
    sessionTopic: "Master analytical techniques and performance management",
    quote: "My sessions provide learners with advanced knowledge of analytical techniques, performance management, and analysis, preparing them for the industry challenges and applied skill level.",
    imageColor: "bg-indigo-100",
    linkedinUrl: "https://www.linkedin.com/in/vijayalakshmi-m-576586192/",
    sessionUrl: "https://www.youtube.com/watch?v=davidsession",
  },
  {
    id: "m9",
    name: "Shubham S.",
    role: "Financial Modeling Expert",
    company: "RMA Technical Sales",
    CompanyLogoPath: "/trainer/Rishihood.png",
    imagePath: "/trainer/shubham.jpg",
    sessionTopic: "Learn advanced IFRS and financial management",
    quote: "The goal of my sessions is to help learners clear the ACCA with expert-level instruction on advanced topics such as IFRS accounting standards, investment appraisal, business valuation, and risk management.",
    imageColor: "bg-indigo-100",
    linkedinUrl: "http://linkedin.com/in/shubham-sharma-101948189/",
    sessionUrl: "https://www.youtube.com/watch?v=davidsession",
  },
];

const SuperMentors: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeMentor = mentors[activeIndex];

  // --- MODAL STATE ---
  const [activeModal, setActiveModalState] = useState<ModalKey | null>(null);
  const [customTitle, setCustomTitle] = useState<string | undefined>();
  const [customDescription, setCustomDescription] = useState<string | undefined>();

  const visibleCards = 5.2;

  const handleNext = () => {
    setActiveIndex((prev) => Math.min(prev + 1, mentors.length - 1));
  };

  const handlePrev = () => {
    setActiveIndex((prev) => Math.max(prev - 1, 0));
  };

  const getClampedTranslateX = () => {
    const maxScrollIndex = Math.max(0, mentors.length - visibleCards);
    const scrollToIndex = Math.min(activeIndex, maxScrollIndex);
    return -(scrollToIndex * (100 / visibleCards));
  };

  return (
    <section id="trainers" className="py-16 bg-white relative font-sans overflow-hidden">
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-orange-600 font-bold tracking-widest text-sm uppercase mb-3">Industry Guidance</h2>
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
            Session of <span className="text-blue-700">Super Mentors</span>
          </h2>
          <p className="max-w-3xl mx-auto text-gray-600 text-[15px] md:text-lg leading-relaxed">
            Attend sessions of experienced professionals who are leaders at top global brands and learn to deal with industry challenges.
          </p>
        </div>

        {/* --- TOP: MENTOR SELECTOR SLIDER --- */}
        <div className="relative mb-10">
          <div className="flex justify-between items-center mb-2 px-2">
            <h3 className="text-xl font-bold text-gray-800">Meet our mentors</h3>
            <div className="flex gap-2">
              <button
                onClick={handlePrev}
                disabled={activeIndex === 0}
                className={`p-2 rounded-full border border-gray-200 transition-colors ${activeIndex === 0 ? "text-gray-300 border-gray-100 cursor-not-allowed" : "text-gray-500 hover:text-blue-600 hover:border-blue-600"
                  }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                disabled={activeIndex === mentors.length - 1}
                className={`p-2 rounded-full border border-gray-200 transition-colors ${activeIndex === mentors.length - 1 ? "text-gray-300 border-gray-100 cursor-not-allowed" : "text-gray-500 hover:text-blue-600 hover:border-blue-600"
                  }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="hidden md:block overflow-hidden px-10 py-10 -mx-10">
            <div
              className="flex gap-4 transition-transform duration-500 ease-out"
              style={{ transform: `translateX(${getClampedTranslateX()}%)` }}
            >
              {mentors.map((mentor, index) => {
                const isActive = index === activeIndex;
                return (
                  <div
                    key={mentor.id}
                    onClick={() => setActiveIndex(index)}
                    className={`cursor-pointer rounded-xl p-4 border transition-all duration-300 flex flex-col items-center text-center shrink-0 ${isActive
                        ? "bg-blue-50 border-blue-400 shadow-xl scale-110 z-30 relative"
                        : "bg-white border-gray-100 hover:border-blue-200 hover:shadow-sm z-10"
                      }`}
                    style={{ width: `calc((100% - ${(visibleCards - 1) * 16}px) / ${visibleCards})` }}
                  >
                    <div className={`w-12 h-12 rounded-full ${mentor.imageColor} flex items-center justify-center mb-2 overflow-hidden shadow-sm`}>
                      <img src={mentor.imagePath} alt={mentor.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="h-6 mb-2 flex items-center justify-center w-full">
                      <img src={mentor.CompanyLogoPath} alt="logo" className="h-4 object-contain max-w-[90%] opacity-80" />
                    </div>
                    <h5 className={`text-sm font-bold truncate w-full ${isActive ? "text-blue-800" : "text-gray-700"}`}>
                      {mentor.name}
                    </h5>
                    <p className="text-[10px] text-gray-500 truncate w-full">{mentor.company}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="md:hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 bg-white rounded-xl p-3 shadow-sm flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full ${activeMentor.imageColor} flex items-center justify-center overflow-hidden`}>
                  <img src={activeMentor.imagePath} alt={activeMentor.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-bold text-gray-900 truncate">{activeMentor.name}</h5>
                  <p className="text-[11px] text-gray-500 truncate">{activeMentor.company}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- MAIN SPOTLIGHT AREA --- */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-orange-500 to-blue-600"></div>
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-4 relative bg-gray-50 p-8 flex flex-col items-center justify-center border-r border-gray-100">
              <div className={`relative w-48 h-48 md:w-56 md:h-56 rounded-full ${activeMentor.imageColor} border-4 border-white shadow-xl flex items-center justify-center mb-6 overflow-hidden`}>
                <img src={activeMentor.imagePath} alt={activeMentor.name} className="object-cover w-full h-full" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{activeMentor.name}</h3>
                <p className="text-gray-500 font-medium text-sm">{activeMentor.role}</p>
                <img src={activeMentor.CompanyLogoPath} alt="logo" className="h-8 object-contain mt-4 mx-auto" />
              </div>
            </div>

            <div className="lg:col-span-8 p-8 md:p-12 flex flex-col justify-center relative">
              <Quote className="absolute top-6 left-6 w-12 h-12 text-blue-100 -z-10 transform -scale-x-100" />
              <div className="mb-6">
                <span className="inline-block py-1 px-3 rounded-full bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wider mb-3">Masterclass Highlight</span>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{activeMentor.sessionTopic}</h2>
                <div className="w-20 h-1.5 bg-blue-600 rounded-full"></div>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed italic mb-8">&quot;{activeMentor.quote}&quot;</p>

              <div className="flex items-center gap-4">
                {/* --- UPDATED BUTTON --- */}
                <button
                  onClick={() => {
                    setActiveModalState("ACCA");
                    setCustomTitle('Download Brochure');
                    setCustomDescription('ACCA Course Brochure - Get course brochure and syllabus');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all flex items-center gap-2"
                >
                  Watch Session Preview <ArrowRight className="w-4 h-4" />
                </button>

                <Link href={activeMentor.linkedinUrl || "#"} target="_blank" className="p-3 rounded-full border border-gray-200 text-blue-600 hover:bg-blue-50 transition-colors">
                  <Linkedin className="w-6 h-6" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL COMPONENT --- */}
      <MultiModalPopup
        activeModal={activeModal}
        setActiveModal={(k) => setActiveModalState(k)}
        customTitle={customTitle}
        customImage={'/DemoImage/ACCA.png'}
        customDescription={customDescription}
        productId="ACCA"
         
      />
    </section>
  );
};

export default SuperMentors;