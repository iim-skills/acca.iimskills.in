// "use client";

// import React, { useState } from "react";
// import { Check, X, Shield, Star, Award, Clock, BookOpen, UserCheck, Briefcase, GraduationCap } from "lucide-react";

// /**
//  * UPDATED DATA: Based on provided images
//  */
// const programs = [
//   {
//     key: "weekday",
//     title: "Weekday Batch",
//     subtitle: "Live Online Interactive",
//     levels: [
//       { name: "Knowledge Level", price: "₹ 1,35,000" },
//       { name: "Skill Level", price: "₹ 1,65,000" },
//       { name: "Professional Level", price: "—" },
//     ],
//     features: [
//       { name: "Live Online Lectures", included: true },
//       { name: "Lecture Recordings", included: true },
//       { name: "LMS Access", included: true },
//       { name: "3x Unit & Mock Tests", included: true },
//       { name: "3x Test & Mock Feedback", included: true },
//       { name: "Placement Assistance", included: true },
//     ],
//     enrollUrl: "/enroll?course=acca&type=weekday",
//     note: "High-intensity training. Best for students dedicated to full-time study.",
//     theme: "blue"
//   },
//   {
//     key: "weekend",
//     title: "Weekend Batch",
//     subtitle: "Live Online Interactive",
//     isPopular: true,
//     levels: [
//       { name: "Knowledge Level", price: "₹ 95,000" },
//       { name: "Skill Level", price: "₹ 1,35,000" },
//       { name: "Professional Level", price: "₹ 1,35,000" },
//     ],
//     features: [
//       { name: "Live Online Lectures", included: true },
//       { name: "Lecture Recordings", included: true },
//       { name: "LMS Access", included: true },
//       { name: "2x Unit & Mock Tests", included: true },
//       { name: "2x Test & Mock Feedback", included: true },
//       { name: "Placement Assistance", included: true },
//     ],
//     enrollUrl: "/enroll?course=acca&type=weekend",
//     note: "Balanced pace. Ideal for working professionals and university students.",
//     theme: "purple"
//   },
//   {
//     key: "self-paced",
//     title: "Self-Paced",
//     subtitle: "Recorded Learning",
//     levels: [
//       { name: "Knowledge Level", price: "₹ 52,000" },
//       { name: "Skill Level", price: "₹ 67,500" },
//       { name: "Professional Level", price: "₹ 56,000" },
//     ],
//     features: [
//       { name: "Live Online Lectures", included: false },
//       { name: "Lecture Recordings", included: true },
//       { name: "LMS Access", included: true },
//       { name: "1x Unit & Mock Tests", included: true },
//       { name: "1x Test & Mock Feedback", included: true },
//       { name: "Placement Assistance", included: false },
//     ],
//     enrollUrl: "/enroll?course=acca&type=selfpaced",
//     note: "Learn at your own speed. 1-year access to all premium recordings.",
//     theme: "white"
//   },
// ];

// export default function App() {
//   const [activeKey, setActiveKey] = useState("weekend");

//   const handleEnroll = (url: string) => {
//     console.log(`Navigating to: ${url}`);
//     // Simulated navigation
//     window.parent.postMessage({ type: 'navigation', url }, '*');
//   };

//   return (
//     <div className="min-h-screen bg-[#F8FAFC] font-sans py-12 px-4 md:px-6">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="text-center mb-16">
//           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-widest mb-4">
//             <Award size={14} /> Global Accounting Standards
//           </div>
//           <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
//             ACCA Course <span className="text-blue-600">Fee Structure</span>
//           </h1>
//           <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed">
//             Choose your preferred learning mode and level. Transparent pricing for Knowledge, Skill, and Professional levels.
//           </p>
//         </div>

//         {/* Pricing Cards */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
//           {programs.map((program) => {
//             const isPopular = program.isPopular;
            
//             return (
//               <div
//                 key={program.key}
//                 onClick={() => setActiveKey(program.key)}
//                 className={`group relative rounded-[2.5rem] transition-all duration-500 cursor-pointer flex flex-col h-full
//                   ${isPopular 
//                     ? "bg-indigo-600 text-white shadow-2xl scale-100 lg:scale-105 z-10 ring-8 ring-indigo-50" 
//                     : " text-slate-900 border border-slate-200 shadow-xl hover:shadow-2xl z-0"
//                   }`}
//               >
//                 {/* Popular Badge */}
//                 {isPopular && (
//                   <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
//                     <span className="bg-orange-500 text-white px-6 py-2 rounded-full text-xs font-black shadow-lg flex items-center gap-2">
//                       <Star size={14} fill="white" /> MOST FLEXIBLE
//                     </span>
//                   </div>
//                 )}

//                 {/* Card Header */}
//                 <div className={`p-8 text-center border-b ${isPopular ? "border-white/10" : "border-slate-50"}`}>
//                   <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${isPopular ? "text-indigo-200" : "text-blue-500"}`}>
//                     {program.subtitle}
//                   </p>
//                   <h3 className="text-2xl font-black mb-6">{program.title}</h3>
                  
//                   {/* Tiered Pricing Table */}
//                   <div className={`space-y-3 rounded-2xl p-4 ${isPopular ? "bg-white/10" : "bg-slate-50"}`}>
//                     {program.levels.map((level, i) => (
//                       <div key={i} className="flex justify-between items-center text-sm">
//                         <span className={`font-semibold ${isPopular ? "text-indigo-100" : "text-slate-500"}`}>{level.name}</span>
//                         <span className="font-bold">{level.price}</span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 {/* Features Section */}
//                 <div className="p-8 flex-1">
//                   <div className="space-y-4">
//                     {program.features.map((feature, idx) => (
//                       <div key={idx} className="flex items-start gap-3">
//                         <div className={`mt-0.5 shrink-0 w-6 h-6 rounded-full flex items-center justify-center
//                           ${feature.included 
//                             ? (isPopular ? "bg-white" : "bg-green-500") 
//                             : (isPopular ? "bg-white/20" : "bg-slate-100")}`}>
//                           {feature.included ? (
//                             <Check size={14} strokeWidth={3} className={isPopular ? "text-indigo-600" : "text-white"} />
//                           ) : (
//                             <X size={14} strokeWidth={3} className={isPopular ? "text-white/50" : "text-slate-300"} />
//                           )}
//                         </div>
//                         <span className={`text-sm font-medium ${!feature.included && "opacity-50"} ${isPopular ? "text-indigo-50" : "text-slate-600"}`}>
//                           {feature.name}
//                         </span>
//                       </div>
//                     ))}
//                   </div>

//                   {/* Note */}
//                   <div className={`mt-8 p-4 rounded-2xl flex items-start gap-3 text-xs leading-relaxed
//                     ${isPopular 
//                       ? "bg-white/10 text-indigo-100" 
//                       : "bg-slate-50 text-slate-500 border border-slate-100"}`}>
//                     <Shield size={16} className="shrink-0" />
//                     <p>{program.note}</p>
//                   </div>
//                 </div>

//                 {/* Footer / CTA */}
//                 <div className="p-8 pt-0">
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       handleEnroll(program.enrollUrl);
//                     }}
//                     className={`w-full py-4 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-lg
//                       ${isPopular 
//                         ? "bg-white text-indigo-700 hover:bg-indigo-50" 
//                         : "bg-slate-900 text-white hover:bg-slate-800"
//                       }`}
//                   >
//                     Buy {program.title} Now
//                   </button>
//                 </div>
//               </div>
//             );
//           })}
//         </div>

//         {/* Quality Assurances */}
//         <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-center border-t border-slate-200 pt-12">
//           <div className="flex flex-col items-center gap-3">
//             <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
//               <GraduationCap size={24} />
//             </div>
//             <h4 className="font-bold text-slate-900">Expert Instruction</h4>
//             <p className="text-sm text-slate-500 leading-relaxed">Learn from qualified ACCA professionals with years of industry experience.</p>
//           </div>
//           <div className="flex flex-col items-center gap-3">
//             <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-inner">
//               <UserCheck size={24} />
//             </div>
//             <h4 className="font-bold text-slate-900">Career Readiness</h4>
//             <p className="text-sm text-slate-500 leading-relaxed">Integrated placement support including mock interviews and resume building.</p>
//           </div>
//           <div className="flex flex-col items-center gap-3">
//             <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-inner">
//               <Briefcase size={24} />
//             </div>
//             <h4 className="font-bold text-slate-900">Global Recognition</h4>
//             <p className="text-sm text-slate-500 leading-relaxed">Certified training materials from BPP & Kaplan to ensure global standards.</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import React, { useState } from "react";
import { Check, X, Shield, Star, Award, GraduationCap, UserCheck, Briefcase, Zap, Target, Rocket } from "lucide-react";

/**
 * UPDATED DATA: Restructured by ACCA Levels (Knowledge, Skill, Professional)
 * Pricing extracted from user-provided images.
 */
const levelPrograms = [
  {
    key: "knowledge",
    title: "Knowledge Level",
    subtitle: "Fundamental Level (3 Papers)",
    icon: <Zap className="w-8 h-8" />,
    description: "Build a strong foundation in management and financial accounting with our entry-level papers.",
    modes: [
      // { name: "Weekday Batch (Live)", price: "₹ 1,35,000", metrics: "3x Tests" },
      { name: "Program Fee", price: "₹ 95,000", metrics: "2x Tests" },
      // { name: "Self-Paced (Recorded)", price: "₹ 52,000", metrics: "1x Tests" },
    ],
    features: [
      { name: "BPP/Kaplan Study Material", status: "check" },
      { name: "Doubt Clearing Sessions", status: "check" },
      { name: "Lecture Recordings", status: "check" },
      { name: "Exam Oriented Prep", status: "check" },
    ],
    isPopular: false,
    enrollUrl: "/enroll?level=knowledge",
  },
  {
    key: "skill",
    title: "Skill Level",
    subtitle: "Applied Skills Level (6 Papers)",
    icon: <Target className="w-8 h-8" />,
    description: "Deepen your technical expertise across taxation, auditing, and financial management.",
    isPopular: true,
    modes: [
      // { name: "Weekday Batch (Live)", price: "₹ 1,65,000", metrics: "3x Tests" },
      { name: "Program Fee", price: "₹ 1,35,000", metrics: "2x Tests" },
      // { name: "Self-Paced (Recorded)", price: "₹ 67,500", metrics: "1x Tests" },
    ],
    features: [
      { name: "Corporate Case Studies", status: "check" },
      { name: "Advanced Mock Feedback", status: "check" },
      { name: "Industry Expert Mentors", status: "check" },
      { name: "Placement Support", status: "check" },
    ],
    enrollUrl: "/enroll?level=skill",
  },
  {
    key: "professional",
    title: "Professional Level",
    subtitle: "Strategic Professional (4 Papers)",
    icon: <Rocket className="w-8 h-8" />,
    description: "Master strategic leadership and advanced technical skills to complete your ACCA journey.",
    modes: [
      // { name: "Weekday Batch (Live)", price: "—", metrics: "Coming Soon" },
      { name: "Program Fee", price: "₹ 1,35,000", metrics: "2x Tests" },
      // { name: "Self-Paced (Recorded)", price: "₹ 56,000", metrics: "1x Tests" },
    ],
    features: [
      { name: "Strategic Business Leader Prep", status: "check" },
      { name: "Global Networking", status: "check" },
      { name: "Mock Feedback (Professional)", status: "check" },
      { name: "Final Certification Prep", status: "check" },
    ],
    isPopular: false,
    enrollUrl: "/enroll?level=professional",
  },
];

export default function App() {
  const handleEnroll = (url: string) => {
    console.log(`Enrolling for: ${url}`);
    window.parent.postMessage({ type: 'navigation', url }, '*');
  };

  return (
    <div id="program-fees" className="min-h-screen bg-slate-50 font-sans py-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest mb-6 shadow-sm">
            <Award size={14} /> Career Path Optimized
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 mb-6 tracking-tight">
            IIM SKILLS ACCA  <span className="text-blue-600 underline decoration-blue-200 underline-offset-8">Program Fees</span>
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed">
            Pricing structured by your current progress. Choose your level and select the learning mode that fits your schedule.
          </p>
        </div>

        {/* Level Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-stretch">
          {levelPrograms.map((level) => {
            const isPopular = level.isPopular;
            
            return (
              <div
                key={level.key}
                className={`group relative rounded-2xl transition-all duration-500 flex flex-col bg-white text-slate-900 border border-slate-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-2xl z-0
                  ${isPopular 
                    ? "bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white shadow-[0_30px_60px_-15px_rgba(59,130,246,0.3)] scale-100 lg:scale-105 z-10" 
                    : "bg-white text-slate-900 border border-slate-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-2xl z-0"
                  }`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 w-full flex justify-center">
                    <span className="bg-orange-500 text-white px-8 py-2.5 rounded-full text-[10px] font-black shadow-xl flex items-center gap-2 tracking-widest whitespace-nowrap">
                      <Star size={14} fill="white" /> MOST ENROLLED LEVEL
                    </span>
                  </div>
                )}

                {/* Level Header */}
                <div className={`p-10 text-center rounded-t-[3rem] ${isPopular ? "bg-white/5" : "bg-slate-50/50"}`}>
                  <div className={`mx-auto w-16 h-16 mb-6 rounded-2xl flex items-center justify-center shadow-lg
                    ${isPopular ? "bg-white text-blue-700" : "bg-blue-600 text-white"}`}>
                    {level.icon}
                  </div>
                  <h3 className="text-2xl font-black mb-1">{level.title}</h3>
                  <p className={`text-xs font-bold uppercase tracking-widest opacity-70 mb-4`}>{level.subtitle}</p>
                  <p className={`text-sm leading-relaxed ${isPopular ? "text-blue-100" : "text-slate-500"}`}>
                    {level.description}
                  </p>
                </div>

                {/* Batch Pricing Breakdown */}
                <div className="p-8 pt-2 space-y-3">
                  {/* <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-60 text-center`}>
                    Batch Options & Pricing
                  </h4> */}
                  {level.modes.map((mode, i) => (
                    <div key={i} className={`flex justify-between items-center px-4 py-3 rounded-2xl transition-all border
                      ${isPopular 
                        ? "bg-white/10 border-white/10 hover:bg-white/20" 
                        : "bg-white border-slate-100 shadow-sm hover:border-blue-200 hover:bg-blue-50/20"}`}>
                      <div className="flex flex-col">
                        {/* <span className="text-[14px] font-bold uppercase tracking-tight">{mode.name}</span> */}
                        {/* <span className={`text-[9px] font-black uppercase opacity-60 ${isPopular ? "text-indigo-200" : "text-blue-500"}`}>
                          {mode.metrics}
                        </span> */}
                      </div>
                      <span className="w-full text-center text-lg font-black tracking-tight">{mode.price} + 18% GST</span>
                    </div>
                  ))}
                </div>

                {/* Level Specifics */}
                <div className="p-10 pt-4 flex-1">
                  <div className="space-y-4">
                    {level.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-5 h-5 rounded-full shrink-0
                          ${isPopular ? "bg-white" : "bg-blue-600"}`}>
                          <Check size={12} strokeWidth={4} className={isPopular ? "text-blue-700" : "text-white"} />
                        </div>
                        <span className={`text-xs font-bold ${isPopular ? "text-indigo-50" : "text-slate-700"}`}>
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer / CTA */}
                <div className="p-10 pt-0">
                  <button
                    onClick={() => handleEnroll(level.enrollUrl)}
                    className={`group w-full py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl
                      ${isPopular 
                        ? "bg-white text-blue-800 hover:bg-blue-50" 
                        : "bg-slate-900 text-white hover:bg-slate-800"
                      }`}
                  >
                    Enroll Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Global ACCA Benefits */}
        {/* <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-slate-100 pt-16">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
              <GraduationCap size={28} />
            </div>
            <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">Expert Faculty</h4>
            <p className="text-xs text-slate-500 max-w-[240px] leading-relaxed">Qualified ACCA professionals mentoring you throughout the journey.</p>
          </div>
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
              <UserCheck size={28} />
            </div>
            <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">LMS & Recordings</h4>
            <p className="text-xs text-slate-500 max-w-[240px] leading-relaxed">24/7 access to student portal with lecture backups and mock tests.</p>
          </div>
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
              <Briefcase size={28} />
            </div>
            <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">Placement Support</h4>
            <p className="text-xs text-slate-500 max-w-[240px] leading-relaxed">Integrated career guidance including resume prep and interviews.</p>
          </div>
        </div> */}
      </div>
    </div>
  );
}