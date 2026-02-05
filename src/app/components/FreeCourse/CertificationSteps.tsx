"use client";
import React from "react";

// --- CUSTOM DOODLE COMPONENTS (UPDATED TO MATCH TITLES) ---

// 1. Enroll for Free -> Registration Form / Pen
const EnrollDoodle = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Clipboard/Paper */}
    <path d="M30 20 h40 v60 h-40 z" />
    <path d="M40 15 h20 v10 h-20 z" />
    {/* Text Lines */}
    <path d="M38 35 h24" opacity="0.5" />
    <path d="M38 45 h24" opacity="0.5" />
    <path d="M38 55 h15" opacity="0.5" />
    {/* Pen */}
    <path d="M60 75 l15 -15 l4 4 l-15 15 z" />
    <path d="M60 75 l-3 3 l4 1" />
    {/* Checkmark/Button */}
    <rect x="35" y="65" width="15" height="6" rx="2" fill="currentColor" fillOpacity="0.1" />
  </svg>
);

// 2. Learn at Your Pace -> Video Player + Clock
const LearnDoodle = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Video Player Window */}
    <rect x="15" y="25" width="70" height="45" rx="3" />
    <path d="M15 60 h70" />
    {/* Play Button */}
    <polygon points="45,40 58,47 45,54" fill="currentColor" fillOpacity="0.2" />
    {/* Progress Bar */}
    <line x1="25" y1="65" x2="60" y2="65" strokeWidth="2" opacity="0.5"/>
    <circle cx="60" cy="65" r="2" fill="currentColor" />
    {/* Clock (Pace) floating */}
    <circle cx="80" cy="20" r="12" />
    <path d="M80 20 v-5" />
    <path d="M80 20 l4 4" />
  </svg>
);

// 3. Get Certified -> Certificate with Seal
const CertificateDoodle = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Certificate Border */}
    <rect x="20" y="15" width="60" height="70" rx="2" />
    <rect x="25" y="20" width="50" height="60" rx="1" strokeDasharray="3 3" opacity="0.5" />
    {/* Header Line */}
    <path d="M35 30 h30" strokeWidth="2" />
    {/* Body Lines */}
    <path d="M30 40 h40" opacity="0.5" />
    <path d="M30 48 h40" opacity="0.5" />
    {/* Seal */}
    <circle cx="65" cy="70" r="8" fill="currentColor" fillOpacity="0.1" />
    {/* Ribbons */}
    <path d="M65 78 l-5 10 l5 -3 l5 3 l-5 -10" />
  </svg>
);

// 4. Share on LinkedIn -> Profile/Network
const ShareDoodle = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Profile Card / Certificate */}
    <rect x="25" y="35" width="50" height="40" rx="2" />
    <path d="M35 50 h30" opacity="0.5" />
    <path d="M35 60 h20" opacity="0.5" />
    {/* Profile Circle */}
    <circle cx="35" cy="25" r="8" fill="currentColor" fillOpacity="0.1" />
    {/* Connection Nodes (Network) */}
    <circle cx="85" cy="25" r="5" />
    <circle cx="85" cy="75" r="5" />
    {/* Connecting Lines */}
    <path d="M75 45 q10 -10 10 -15" strokeDasharray="3 3" />
    <path d="M75 65 q10 5 10 5" strokeDasharray="3 3" />
    {/* Megaphone/Broadcast lines */}
    <path d="M15 35 q-5 -5 -5 -10" opacity="0.3"/>
    <path d="M10 55 h-5" opacity="0.3"/>
  </svg>
);

// --- TYPES ---
type Step = {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  theme: "blue" | "orange" | "teal" | "amber"; 
};

// --- DATA (Updated Icons) ---
const steps: Step[] = [
  {
    id: "01",
    title: "Enroll for Free",
    description: "Register in seconds with your name, email, and phone to start learning right away.",
    icon: EnrollDoodle,
    theme: "amber",
  },
  {
    id: "02",
    title: "Learn at Your Pace",
    description: "Watch Pre-recorded Training Sessions anytime, any where and complete practical projects.",
    icon: LearnDoodle,
    theme: "blue",
  },
  {
    id: "03",
    title: "Get Certified",
    description: "Finish the course successfully and receive your globally accredited certificate.",
    icon: CertificateDoodle,
    theme: "teal",
  },
  {
    id: "04",
    title: "Share Your Certificate on LinkedIn",
    description: "Share your certificate on LinkedIn and get free resume analysis and placement guidance.",
    icon: ShareDoodle,
    theme: "orange",
  },
];

// Helper to get color classes based on theme
const getThemeClasses = (theme: Step["theme"]) => {
  switch (theme) {
    case "blue":
      return {
        text: "text-blue-600",
        bg: "bg-blue-50",
        border: "group-hover:border-blue-400",
        blob: "bg-blue-100 text-blue-600",
        number: "text-blue-100",
      };
    case "orange":
      return {
        text: "text-orange-600",
        bg: "bg-orange-50",
        border: "group-hover:border-orange-400",
        blob: "bg-orange-100 text-orange-600",
        number: "text-orange-100",
      };
    case "teal":
      return {
        text: "text-teal-600",
        bg: "bg-teal-50",
        border: "group-hover:border-teal-400",
        blob: "bg-teal-100 text-teal-600",
        number: "text-teal-100",
      };
    case "amber":
      return {
        text: "text-amber-600",
        bg: "bg-amber-50",
        border: "group-hover:border-amber-400",
        blob: "bg-amber-100 text-amber-600",
        number: "text-amber-100",
      };
  }
};

const AdmissionProcess = () => {
  return (
    <section className="py-10 md:py-15 bg-gradient-to-b bg-gray-50 relative overflow-hidden font-sans">
      
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-orange-50 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 opacity-60"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-50 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 opacity-60"></div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-15">
          <h2 className="text-orange-600 font-bold tracking-widest text-sm uppercase mb-3">
            Your Path to Success
          </h2>
          <div className="relative inline-block mb-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 relative z-10">
              Admission <span className="text-blue-700">Process</span>
            </h2>
            {/* Styled Underline */}
            {/* <div className="absolute -bottom-2 left-0 w-full h-3 bg-orange-200 -skew-x-12 opacity-60"></div> */}
          </div>
          
          <p className="max-w-2xl mx-auto text-gray-600 text-lg leading-relaxed">
            The motive of our thorough training is to make you industry-ready, not just teaching. Therefore, we aim to enroll only dedicated learners.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-10 transform -translate-y-1/2 rounded-full">
             <div className="w-full h-full border-t-2 border-dashed border-gray-300 relative top-[1px]"></div>
          </div>

          {steps.map((step) => {
            const Icon = step.icon;
            const styles = getThemeClasses(step.theme);
            
            return (
              <div
                key={step.id}
                className={`group relative bg-white rounded-3xl p-8 border-2 border-gray-100 ${styles?.border} shadow-sm hover:shadow-2xl transition-all duration-500 ease-out transform hover:-translate-y-2 flex flex-col h-full`}
              >
                {/* Large Background Number */}
                <div className={`absolute -top-4 -right-4 text-8xl font-black ${styles?.number} opacity-20 select-none transition-colors duration-300 group-hover:opacity-40`}>
                  {step.id}
                </div>
                
                {/* Step Badge (Small) */}
                <div className={`w-10 h-10 rounded-full ${styles?.bg} ${styles?.text} flex items-center justify-center font-bold text-sm mb-6 shadow-sm border border-white z-10`}>
                    {step.id}
                </div>

                {/* Content */}
                <div className="flex-grow relative z-10">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-800 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-8">
                    {step.description}
                  </p>
                </div>

                {/* Icon Area with Doodle Animation on Hover */}
                <div className="mt-auto pt-4 flex justify-center">
                    <div className={`w-24 h-24 rounded-2xl ${styles?.blob} flex items-center justify-center transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-2 shadow-inner`}>
                      <Icon className="w-20 h-20 stroke-2 group-hover:stroke-[2.5px] transition-all" />
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AdmissionProcess;