"use client";

import React, { useState } from 'react';
import type { ReactNode } from 'react';
import Link from "next/link";
import {
  ChevronDown,
  FileSpreadsheet,
  Database,
  PieChart,
  Compass,
  Brain,
  BarChart3,
  Megaphone,
  Users,
  Settings,
  Table,
  Code,
  FileCode,
  Zap,
  Bot,
  Cloud,
  LineChart,
  Circle,
  Sigma,
  X,
  Terminal,
  FileText,
  CheckCircle2,
  Clock,
  Award,
  Globe,
  MonitorPlay,
  Download,
  ArrowRight
} from 'lucide-react';
import { BiDownload } from 'react-icons/bi';

/* ------------------------------ */
/* MOCK COMPONENTS */
/* ------------------------------ */
const Button = ({ children, onClick, className }: any) => (
  <button
    onClick={onClick}
    className={`bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all duration-200 ${className}`}
  >
    {children}
  </button>
);

const MultiModalPopup = ({ activeModal, setActiveModal, customTitle, customDescription }: any) => {
    if (!activeModal) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full relative animate-in zoom-in-95 duration-200 shadow-2xl">
                <button 
                  onClick={() => setActiveModal(null)} 
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={20}/>
                </button>
                <h3 className="text-xl font-bold mb-2 text-slate-900">{customTitle}</h3>
                <p className="text-slate-600 mb-6">{customDescription}</p>
                <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm text-center border border-blue-100">
                  Form Placeholder
                </div>
            </div>
        </div>
    )
};

/* ------------------------------ */
/* PHASE DATA */
/* ------------------------------ */
const phases = [
  {
    id: 1,
    icon: <Compass size={24} />,
    title: 'Module 1: Foundations of Excel',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    sections: [
      {
        title: 'Foundations of Excel for Analytics',
        description:
          'Establish a strong foundation in Excel navigation, formatting, and essential formulas for organizing analytical data.',
        platforms: ['Basic Navigation', 'Data Entry & Formatting', 'Essential Formulas'],
        skills: ['Basic Navigation', 'Data Entry', 'Essential Formulas (SUM, AVERAGE)', 'Workbook Organization'],
      },
    ],
  },

  {
    id: 2,
    icon: <FileSpreadsheet size={24} />,
    title: 'Module 2: Core Functions',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    sections: [
      {
        title: 'Core Functions for Real-World Analytics',
        description: 'Master intermediate Excel functions (LOOKUP, IF, etc.) for effective data manipulation and practical report generation.',
        platforms: ['Lookup Functions', 'Conditional Logic', 'Text & Date Functions', 'Array Formulas'],
        skills: ['VLOOKUP & XLOOKUP', 'Conditional Logic (IF, IFS)', 'Text Functions', 'Array Formulas'],
      },
    ],
  },

  {
    id: 3,
    icon: <Database size={24} />,
    title: 'Module 3: Data Cleaning',
    color: 'text-indigo-500',
    bg: 'bg-indigo-50',
    sections: [
      {
        title: 'Data Cleaning & Preparation',
        description: 'Learn techniques to cleanse, prepare, and standardize raw data for accurate and reliable analysis.',
        platforms: ['Removing Duplicates', 'Text to Columns', 'Data Validation', 'Handling Missing Data'],
        skills: ['Data Cleaning', 'Text to Columns', 'Data Validation', 'Data Normalization'],
      },
    ],
  },

  {
    id: 4,
    icon: <PieChart size={24} />,
    title: 'Module 4: Visualization',
    color: 'text-violet-500',
    bg: 'bg-violet-50',
    sections: [
      {
        title: 'Visualization & Pivoting',
        description:
          'Use Pivot Tables and dynamic charts to summarize large datasets and communicate key business insights clearly.',
        platforms: ['Pivot Tables', 'Conditional Formatting', 'Chart Types', 'Dashboard Creation'],
        skills: ['Pivot Tables', 'Chart Best Practices', 'Slicers & Timelines', 'Dashboard Creation'],
      },
    ],
  },

  {
    id: 5,
    icon: <Terminal size={24} />,
    title: 'Module 5: Advanced Concepts',
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    sections: [
      {
        title: 'Power Query & Macros',
        description:
          "Automate repetitive tasks using Macros (VBA) and Power Query for advanced data import and transformation.",
        platforms: ['Power Query (ETL)', 'Macros (VBA)', 'Data Model', 'Advanced Filtering'],
        skills: ['Power Query ETL', 'VBA Basics', 'Data Modeling', 'Advanced Filtering'],
      },
    ],
  },

  {
    id: 6,
    icon: <Brain size={24} />,
    title: 'Module 6: AI-Powered Analysis',
    color: 'text-rose-500',
    bg: 'bg-rose-50',
    sections: [
      {
        title: 'Excel + ChatGPT',
        description:
          'Integrate AI tools like ChatGPT to accelerate formula generation and enhance complex data interpretation.',
        platforms: ['AI Formula Generation', 'Text Summarization', 'Data Interpretation', 'Workflow Automation'] ,
        skills: ['AI Formula Gen', 'Summarization', 'Data Interpretation', 'Automation'],
      },
    ],
  },
];

/* ------------------------------ */
/* ICON MAPPING */
/* ------------------------------ */
function getPlatformIcon(platform: string): ReactNode {
  const p = platform.toLowerCase();
  const iconClass = "text-slate-500";
  const size = 14;

  if (/excel/i.test(p)) return <FileSpreadsheet size={size} className={iconClass} />;
  if (/power query/i.test(p)) return <Settings size={size} className={iconClass} />;
  if (/power pivot/i.test(p)) return <Table size={size} className={iconClass} />;
  if (/vba/i.test(p)) return <Code size={size} className={iconClass} />;
  if (/office scripts/i.test(p)) return <FileCode size={size} className={iconClass} />;
  if (/power automate/i.test(p)) return <Zap size={size} className={iconClass} />;
  if (/copilot/i.test(p)) return <Bot size={size} className={iconClass} />;
  if (/analytics/i.test(p)) return <BarChart3 size={size} className={iconClass} />;
  if (/business/i.test(p)) return <Database size={size} className={iconClass} />;
  if (/marketing/i.test(p)) return <Megaphone size={size} className={iconClass} />;
  if (/analyst/i.test(p)) return <Users size={size} className={iconClass} />;
  if (/sql/i.test(p)) return <Database size={size} className={iconClass} />;
  if (/power bi/i.test(p)) return <PieChart size={size} className={iconClass} />;
  if (/tableau/i.test(p)) return <BarChart3 size={size} className={iconClass} />;
  if (/chart/i.test(p)) return <LineChart size={size} className={iconClass} />;
  if (/python/i.test(p)) return <Terminal size={size} className={iconClass} />;
  if (/ai/i.test(p)) return <Brain size={size} className={iconClass} />;
  if (/cloud/i.test(p)) return <Cloud size={size} className={iconClass} />;

  return <Circle size={8} className={iconClass} />;
}

/* ------------------------------ */
/* TAG COMPONENTS */
/* ------------------------------ */
function PlatformTag({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600 font-medium shadow-sm hover:border-blue-300 transition-colors cursor-default">
      <span className="mr-2 opacity-70 flex items-center">{getPlatformIcon(text)}</span>
      {text}
    </span>
  );
}

function SkillTag({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center text-xs px-2.5 py-1 gap-1.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200 font-medium hover:bg-white hover:shadow-sm transition-all cursor-default">
      <Sigma size={12} className="text-blue-600" />
      {text}
    </span>
  );
}

/* ------------------------------ */
/* SIDEBAR POINTS */
/* ------------------------------ */
const sidebarPoints = [
  { icon: <MonitorPlay size={18} />, text: "Pre-recorded Training Sessions" },
  { icon: <FileSpreadsheet size={18} />, text: "Master Excel for Data Analytics" },
  { icon: <Award size={18} />, text: "Globally Accredited Certificate" },
  { icon: <Globe size={18} />, text: "Flexible Anytime Learning" },
  { icon: <Brain size={18} />, text: "Master Critical Thinking Skills" },
];

/* ------------------------------ */
/* MAIN COMPONENT */
/* ------------------------------ */
export default function CourseCurriculum() {
  const [activePhase, setActivePhase] = useState<number>(1);
  const [activeModal, setActiveModal] = useState<'FreeDA' | null>(null);
  const [customTitle, setCustomTitle] = useState('Download Course Brochure');
  const [customDescription, setCustomDescription] = useState('Get complete details about the program.');

  const togglePhase = (id: number) => {
    setActivePhase((prev) => (prev === id ? 0 : id));
  };

  return (
    <section className="py-10 md:py-15 bg-gradient-to-b from-slate-50 to-white relative">
      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider rounded-full mb-3">
            Syllabus
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
            IIM SKILLS Free <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Data Analytics</span> Curriculum
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed">
            Our structured program offers flexibility and depth, designed to take you from basics to advanced analytics with practical application.
          </p>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-stretch">
          
          {/* Left Column - Curriculum Accordion */}
          <div className="lg:col-span-2 space-y-4">
            {phases.map((phase) => {
              const isOpen = activePhase === phase.id;

              return (
                <div
                  key={phase.id}
                  className={`
                    rounded-2xl border transition-all duration-300 ease-in-out
                    ${isOpen 
                      ? 'bg-white border-blue-200 shadow-xl shadow-blue-900/5' 
                      : 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100'
                    }
                  `}
                >
                  {/* Accordion Trigger */}
                  <button
                    onClick={() => togglePhase(phase.id)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between p-4 md:p-6 text-left focus:outline-none group"
                  >
                    <div className="flex items-center gap-5">
                      {/* Icon Container */}
                      <div className={`
                        w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300
                        ${isOpen ? `${phase.bg} ${phase.color}` : ` ${phase.bg} ${phase.color} group-hover:bg-slate-100 group-hover:text-slate-500`}
                      `}>
                        {phase.icon}
                      </div>
                      
                      {/* Title Text */}
                      <div>
                        <h3 className={`text-base md:text-lg font-bold transition-colors ${isOpen ? 'text-slate-900' : 'text-slate-700 group-hover:text-slate-900'}`}>
                          {phase.title}
                        </h3>
                        {!isOpen && (
                          <p className="text-xs md:text-sm text-slate-400 mt-1 hidden sm:block">
                            Click to view module details and skills
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300
                      ${isOpen 
                        ? 'bg-blue-600 border-blue-600 text-white rotate-180' 
                        : 'bg-white border-slate-200 text-slate-400 group-hover:border-blue-200 group-hover:text-blue-500'
                      }
                    `}>
                      <ChevronDown size={16} />
                    </div>
                  </button>

                  {/* Accordion Content */}
                  <div 
                    className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-4 md:px-6 pb-6 pt-0">
                        <div className="pt-6 border-t border-dashed border-slate-200">
                          {phase.sections.map((sec, sidx) => (
                            <div key={sidx} className="space-y-6">
                              
                              {/* Description */}
                              <div>
                                <h4 className="text-blue-900 font-semibold mb-2 text-lg">{sec.title}</h4>
                                <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                                  {sec.description}
                                </p>
                              </div>

                              {/* Highlights */}
                              <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                  <FileText size={14} /> What you will learn
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {sec.platforms.map((p, i) => (
                                    <PlatformTag key={i} text={p} />
                                  ))}
                                </div>
                              </div>

                              {/* Skills */}
                              <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                  <Zap size={14} /> Key Skills
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {sec.skills.map((sk, k) => (
                                    <SkillTag key={k} text={sk} />
                                  ))}
                                </div>
                              </div>

                              {/* Mobile CTA */}
                              <div className="md:hidden pt-4">
                                <Button
                                  onClick={() => {
                                    setActiveModal('FreeDA');
                                    setCustomTitle('Download Course Brochure');
                                    setCustomDescription('Get complete details about the program.');
                                  }}
                                  className="w-full text-sm py-3"
                                >
                                  Download Module Brochure
                                </Button>
                              </div>

                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Bottom CTA Area (Mobile/Tablet) */}
            {/* <div className="lg:hidden mt-8 text-center bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Want the full syllabus?</h3>
              <p className="text-slate-500 text-sm mb-4">Download the detailed brochure.</p>
              <Button
                onClick={() => {
                  setActiveModal('FreeDA');
                  setCustomTitle('Start Learning for Free');
                  setCustomDescription('Access beginner-friendly learning modules at no cost.');
                }}
                className="w-full"
              >
                Download Syllabus
              </Button>
            </div> */}
          </div>

          {/* Right Column - Sidebar */}
<div className="hidden lg:block lg:col-span-1 self-start sticky top-24">
  {/* The outer wrapper is the sticky element now */}
  <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 p-6 overflow-visible relative z-10">
  <div className="mb-6 relative z-10">
            <Link href="/free-courses/free-data-analytics-course/curriculum/" className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 ${className}">
                      Get Started Today   
                </Link>
     </div>
     {/* Decorative background blob */}
     <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
     
     <h3 className="text-xl font-bold text-slate-900 mb-6 relative z-10">Program Highlights</h3>

     <ul className="space-y-4 mb-8 relative z-10">
       {sidebarPoints.map((point, idx) => (
         <li key={idx} className="flex items-start gap-3 group">
           <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
             {point.icon}
           </div>
           <span className="text-slate-600 text-sm font-medium leading-relaxed group-hover:text-slate-800 transition-colors">
             {point.text}
           </span>
         </li>
       ))}
     </ul>
   <div className="pt-6 border-t border-slate-100 relative z-10">
       <p className="text-xs text-slate-400 mb-4 text-center">Ready to start your analytics journey?</p>
       </div>
     
  </div>
</div>



        </div>

      </div>

      {/* Modal Popup */}
      <MultiModalPopup
        activeModal={activeModal}
        setActiveModal={setActiveModal}
        customTitle={customTitle}
        customDescription={customDescription}
      />
    </section>
  );
}
