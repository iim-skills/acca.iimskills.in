'use client';

import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaUserGraduate, FaChartPie } from 'react-icons/fa';
import MultiModalPopup from '../props/MultiModalPopup';
import {
  BookOpen,
  ShieldCheck,
  Briefcase,
  Clock,
  Award,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import Button from '../Button';

/* --------------------------
  ModalPortal helper
  - mounts children into document.body so modal overlays full screen
---------------------------*/
function ModalPortal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const elRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!elRef.current) elRef.current = document.createElement('div');
    const el = elRef.current!;
    document.body.appendChild(el);
    return () => {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    };
  }, []);

  if (!elRef.current) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-3xl mx-auto" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    elRef.current
  );
}

/* ------------------------------ */
/* ROADMAP DATA */
/* ------------------------------ */
type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement> & { className?: string }>;

const roadmapSteps: {
  id: number;
  title: string;
  description: string;
  icon: IconComponent;
  theme: string;
}[] = [
  {
    id: 1,
    title: "Eligibility",
    description: "Register in the ACCA Course after passing 12th or Graduation.",
    icon: FaUserGraduate,
    theme: "orange"
  },
  {
    id: 2,
    title: "Applied Knowledge",
    description: "Master the basics of BT, MA, and FA and clear the foundation qualification.",
    icon: BookOpen as unknown as IconComponent,
    theme: "blue"
  },
  {
    id: 3,
    title: "Applied Skills",
    description: "Obtain advanced, practical accounting skills & clear the 6 skill-based papers.",
    icon: FaChartPie,
    theme: "purple"
  },
  {
    id: 4,
    title: "Ethics Module",
    description: "Complete the Ethics and Professional Skills module (approx 20 hours).",
    icon: ShieldCheck as unknown as IconComponent,
    theme: "emerald"
  },
  {
    id: 5,
    title: "Strategic Professional",
    description: "Gain leadership skills & expertise. Clear 4 exams, including 2 essential & 2 options.",
    icon: Briefcase as unknown as IconComponent,
    theme: "indigo"
  },
  {
    id: 6,
    title: "Practical Experience",
    description: "After passing the exams, pursue a finance role & complete 3 years of relevant work experience.",
    icon: Clock as unknown as IconComponent,
    theme: "purple"
  },
  {
    id: 7,
    title: "ACCA Membership",
    description: "You are now a Chartered Certified Accountant. Ready for high-growth finance roles.",
    icon: Award as unknown as IconComponent,
    theme: "slate"
  }
];

export default function AccaRoadmap() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Modal state for "Download Curriculum"
  const [activeModal, setActiveModal] = useState<'ACCA' | null>(null);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customDescription, setCustomDescription] = useState<string>('');

  const toggleAccordion = (index: number) => {
    setOpenIndex(prev => (prev === index ? null : index));
  };

  // Helper to get color classes based on theme
  const getThemeStyles = (theme: string) => {
    const styles: Record<string, { border: string; number: string; bg: string; text: string; blob: string }> = {
      orange: {
        border: 'hover:border-orange-200',
        number: 'text-orange-200',
        bg: 'bg-orange-50',
        text: 'text-orange-600',
        blob: 'bg-orange-100 text-orange-600'
      },
      blue: {
        border: 'hover:border-blue-200',
        number: 'text-blue-200',
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        blob: 'bg-blue-100 text-blue-600'
      },
      purple: {
        border: 'hover:border-purple-200',
        number: 'text-purple-200',
        bg: 'bg-purple-50',
        text: 'text-purple-600',
        blob: 'bg-purple-100 text-purple-600'
      },
      emerald: {
        border: 'hover:border-emerald-200',
        number: 'text-emerald-200',
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
        blob: 'bg-emerald-100 text-emerald-600'
      },
      indigo: {
        border: 'hover:border-indigo-200',
        number: 'text-indigo-200',
        bg: 'bg-indigo-50',
        text: 'text-indigo-600',
        blob: 'bg-indigo-100 text-indigo-600'
      },
      pink: {
        border: 'hover:border-pink-200',
        number: 'text-pink-200',
        bg: 'bg-pink-50',
        text: 'text-pink-600',
        blob: 'bg-pink-100 text-pink-300'
      },
      slate: {
        border: 'hover:border-slate-300',
        number: 'text-slate-300',
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        blob: 'bg-slate-200 text-slate-700'
      }
    };
    return styles[theme] || styles.blue;
  };

  return (
    <section className="py-10 md:py-20 bg-white relative overflow-hidden" id="acca-roadmap">
      <div className="w-full max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm text-slate-500 text-xs font-bold uppercase tracking-wider mb-4">
            <ChevronRight className="w-3 h-3 text-blue-500" />
            Your Path to Success
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-slate-900 tracking-tight mb-6">
            Roadmap to <span className="text-blue-600">ACCA Membership</span>
          </h2>
          <p className="max-w-2xl mx-auto text-slate-500 text-lg leading-relaxed">
            From registration to becoming an ACCA member, get complete guidance with the ACCA Coaching offered at IIM SKILLS.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roadmapSteps.map((step, idx) => {
            const styles = getThemeStyles(step.theme);
            const stepNumber = (idx + 1).toString().padStart(2, '0');
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={`group relative overflow-hidden bg-white rounded-3xl p-8 border-2 border-gray-100 ${styles.border} shadow-sm hover:shadow-2xl transition-all duration-500 ease-out transform hover:-translate-y-2 flex flex-col gap-3 h-full`}
              >
                {/* Large Background Number */}
                <div className={`absolute top-0 md:-top-4 right-0 md:-right-4 text-8xl font-black ${styles.number} opacity-20 select-none transition-colors duration-300 group-hover:opacity-30`}>
                  {stepNumber}
                </div>

                {/* Step Badge (Small) */}
                <div className={`w-10 h-10 rounded-full ${styles.bg} ${styles.text} flex items-center justify-center font-bold text-sm mb-6 shadow-sm border border-white z-10`}>
                  {stepNumber}
                </div>

                {/* Content */}
                <div className="flex flex-row md:flex-col gap-2 items-center">
                  <div className="flex-grow relative z-10">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-800 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-0 md:mb-8">
                      {step.description}
                    </p>
                  </div>

                  {/* Icon Area with Doodle Animation on Hover */}
                  <div className="mt-auto pt-0 md:pt-4 flex justify-center">
                    <div className={`w-16 h-16 rounded-2xl ${styles.blob} flex items-center justify-center transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-2 shadow-inner`}>
                      <Icon className="w-12 h-12 stroke-2 group-hover:stroke-[2.5px] transition-all" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-[2rem] p-8 text-white flex flex-col justify-center items-center text-center shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className='flex flex-row '>
            <Award className="w-16 h-16 text-blue-200 mb-4" />
            <div className='flex flex-col justify-start text-left ml-4'> 
            <h3 className="text-xl md:text-2xl font-bold mb-2">Goal Achieved!</h3>
            <p className="text-blue-100 text-sm mb-6">Start your journey today and join the elite network of ACCA members.</p>
            </div>
            </div>
            <Button
              onClick={() => {
                setActiveModal('ACCA');
                setCustomTitle('Download Course Brochure');
                setCustomDescription('Get Complete Details about Course.');
              }}
              className="px-6 py-3 bg-white rounded-xl font-bold text-sm transition-colors shadow-lg flex items-center gap-2"
            >
              <span className="text-blue-700">Register Now</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* MultiModal rendered through a portal so it centers / overlays correctly */}
        <MultiModalPopup
          activeModal={activeModal}
          setActiveModal={(key) => {
            if (key === 'ACCA' || key === null) setActiveModal(key);
          }}
          customTitle={customTitle}
          customDescription={customDescription}
        />
      </div>
    </section>
  );
}
