"use client"

import React, { useState, useEffect } from "react";
import MultiModalPopup, { ModalKey } from "@/components/props/MultiModalPopup";
import {
   Award,
   Briefcase,
   TrendingUp,
   Users,
   CheckCircle2,
   BarChart3,
   FileText,
   GraduationCap,
   ArrowRight,
   Layers,
   Calculator,
   Cpu,
   ChevronDown,
   ChevronUp,
   Gem,
   Building2,
   X,
   Globe,
   BookOpen,
   Target,
   PieChart,
   ShieldCheck,
   Scale
} from "lucide-react";
 

// --- Data & Config ---

const audienceHighlights = [
   {
      icon: <GraduationCap className="w-6 h-6 text-blue-600" />,
      title: "Students & Grads",
      description: "Class 12th passouts and commerce graduates or postgraduates."
   },
   {
      icon: <Target className="w-6 h-6 text-emerald-600" />,
      title: "CA/CMA Aspirants",
      description: "Pursuing CA, CS, CMA, etc, plus wanting a global accounting career. "
   },
   {
      icon: <Briefcase className="w-6 h-6 text-purple-600" />,
      title: "Professionals",
      description: "Finance or accounting professionals currently working & wanting to upskill."
   },
   {
      icon: <Globe className="w-6 h-6 text-amber-600" />,
      title: "Global Aspirants",
      description: "Students seeking global finance or accounting careers."
   }
];

/* Course config for ACCA */
const courseConfigs = {
   ACCA: {
      imageUrl: "/ACCA/acca-coaching-program.png",
      productId: "ACCA_MASTERY",
      contactOwner: "IIM SKILLS",
      redirectUrl: "/Thank-You/Acca/",
      courseKey: "acca",
   },
};

const App = () => {
   const [activeModal, setActiveModalState] = useState<ModalKey | null>(null);
      const [customTitle, setCustomTitle] = useState<string | undefined>();
      const [customDescription, setCustomDescription] = useState<string | undefined>();
      const [isReadMore, setIsReadMore] = useState(false);

   const config = courseConfigs["ACCA"];
   
   // Mock data for trainers
   const trainers = [
      { name: "Amit", initials: "AK" },
      { name: "Priya", initials: "PS" },
      { name: "Rahul", initials: "RJ" },
   ];

   return (
      <div className="min-h-screen bg-white font-sans text-slate-800 selection:bg-blue-100 selection:text-blue-900">
         <section id="overview" className="relative overflow-hidden">
            <div className="min-h-screen py-16 px-4">
               <div className="max-w-7xl mx-auto">

                  {/* Header Section */}
                  <div className="text-center mb-16">
                     <span className="inline-block px-4 py-1.5 mb-4 text-xs font-bold tracking-widest uppercase bg-amber-100 text-amber-700 rounded-full border border-amber-200">
                        Global Accounting Qualification
                     </span>
                     <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-6">
                        ACCA Coaching Program Overview at <span className="text-blue-700">IIM SKILLS</span>
                     </h2>
                     <p className="max-w-2xl mx-auto text-slate-600 text-[15px] md:text-lg">
                        Interested in building growth-focused, high-paying international accounting careers? Then, pursue the globally recognized ACCA Course.
                     </p>
                  </div>

                  {/* Bento Grid Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                     {/* Main Hero Card - About Section with Read More */}
                     <div className="md:col-span-8 bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-20 -mt-20 blur-3xl opacity-50"></div>

                        <div className="relative z-10 h-full flex flex-col">
                           <div className="flex items-center gap-3 mb-6">
                              <div className="p-3 bg-blue-700 rounded-2xl">
                                 <BookOpen className="w-6 h-6 text-white" />
                              </div>
                              <h2 className="text-xl md:text-2xl font-bold">About ACCA Coaching By IIM SKILLS</h2>
                           </div>

                           <div className="text-slate-600 leading-relaxed text-base mb-6">
                              <p className="mb-4">
                                 The Association of Chartered Certified Accountants (ACCA) is a globally recognized body offering the Chartered Certified Accountant qualification. Often referred to as the 'Global CA', it prepares you for a successful career in finance, accounting, and management across 180+ countries.
                              </p>

                              {isReadMore && (
                                 <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                                    <p>
                                       The ACCA course offers structured training in advanced concepts such as financial accounting, management accounting, business law, taxation, etc. Divided into three parts - Knowledge level, Skill Level, and Professional Level - the ACCA Course syllabus provides industry-relevant knowledge.
                                    </p>
                                    <p>
                                        The course starts with expert-led sessions providing training in every aspect of ACCA, followed by practice sessions for better understanding. Alongside live classes, the ACCA coaching also includes doubt-solving sessions and mock tests to ensure students have a clear understanding and are well-prepared for the exam. Learners also get lifetime LMS access for continued learning and easy revision. 
                                    </p>
                                    <p>To ensure our students get the best global career opportunities, we provide 100% placement assistance, including guidance for resume building and interview preparation. Learners also benefit from the free industry-recognized certifications offered with the ACCA course for enhanced career prospects.</p>
                                    <p>Thus, IIM SKILLS offers the best ACCA Course in India, packed with all the essential features that train learners in how to deal with real industry challenges and build a successful finance and accounting career.</p>
                                    
                                    <p className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-800 text-sm font-medium">
                                       <strong>Global Mobility:</strong> ACCA is recognized by key regulatory bodies and employers worldwide, making it the perfect qualification for international career mobility in the UK, Canada, UAE, and beyond.
                                    </p>
                                 </div>
                              )}
                           </div>

                           <button
                              onClick={() => setIsReadMore(!isReadMore)}
                              className="flex items-center gap-2 text-blue-700 font-bold hover:text-blue-800 transition-colors mb-8 focus:outline-none"
                           >
                              {isReadMore ? 'Show Less' : 'Read More About the Course'}
                              {isReadMore ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                           </button>

                           <div className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                 <Globe className="w-5 h-5 text-emerald-500 mt-1" />
                                 <span className="text-sm font-medium text-slate-700">Recognized in 180+ Countries</span>
                              </div>
                              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                 <Layers className="w-5 h-5 text-emerald-500 mt-1" />
                                 <span className="text-sm font-medium text-slate-700">3 Levels, 13 Exams</span>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Quick Specs Sidebar */}
                     <div className="md:col-span-4 bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col justify-between border border-slate-800 shadow-xl">
                        <div className="space-y-8">
                           <div className="flex items-center justify-between">
                              <h3 className="text-xl font-bold">Program Specs</h3>
                              <Gem className="w-6 h-6 text-amber-400" />
                           </div>

                           <div className="space-y-6">
                              <div>
                                 <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Levels</p>
                                 <p className="font-semibold text-sm">Applied Knowledge, Applied Skills, Strategic Professional</p>
                              </div>
                              <div>
                                 <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Recognition</p>
                                 <p className="font-semibold">Global (180+ Countries)</p>
                              </div>
                              <div>
                                 <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Methodology</p>
                                 <p className="font-semibold text-sm">Exam-oriented, Mock Tests, Doubt Clearing</p>
                              </div>
                              <div>
                                 <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Career Support</p>
                                 <p className="font-semibold text-sm">Placement Assistance for Big 4 & MNCs</p>
                              </div>
                           </div>
                        </div>

                         <button onClick={() => {
                                                setActiveModalState("ACCA");
                                                setCustomTitle("Download ACCA Syllabus");
                                                setCustomDescription("Get detailed module breakdown and certification roadmap");
                                             }} className="mt-8 w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 group">
                                                Download Brochure
                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                             </button>
                     </div>

                     {/* Faculty Card */}
                     <div className="md:col-span-4 bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
                        <div className="flex flex-col h-full">
                           <Building2 className="w-8 h-8 text-blue-700 mb-6" />
                           <h3 className="text-xl font-bold mb-4">Faculty Excellence</h3>
                           <p className="text-slate-600 mb-6 leading-relaxed">
                              Learn from mentors with real-world experience in <span className="font-bold text-slate-900">Big-4 firms</span> and global accounting.
                           </p>

                           <div className="mt-auto pt-6 border-t border-slate-100 flex items-center gap-4">
                              <div className="flex -space-x-3">
                                 {trainers.map((trainer, i) => (
                                    <div
                                       key={i}
                                       className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-slate-100 shadow-sm flex items-center justify-center"
                                    >
                                       <span className="text-xs font-bold text-slate-500">{trainer.initials}</span>
                                    </div>
                                 ))}
                              </div>
                              <span className="text-xs font-semibold text-slate-500 italic">CA & ACCA Members</span>
                           </div>
                        </div>
                     </div>

                     {/* Career Opportunities Grid (Replaced Tools Grid) */}
                     <div className="md:col-span-8 bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="relative z-10">
                           <h3 className="text-xl font-bold mb-6">Career Opportunities After ACCA</h3>
                           <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              {[
                                 { name: "Financial Accountant", icon: <Calculator className="w-8 h-8 text-emerald-600" /> },
                                 { name: "Audit Associate", icon: <FileText className="w-8 h-8 text-amber-600" /> },
                                 { name: "Tax Consultant", icon: <Briefcase className="w-8 h-8 text-blue-600" /> },
                                 { name: "Risk Analyst", icon: <BarChart3 className="w-8 h-8 text-purple-600" /> },
                                 { name: "Management Accountant", icon: <PieChart className="w-8 h-8 text-indigo-600" /> },
                                 { name: "Financial Analyst", icon: <TrendingUp className="w-8 h-8 text-green-600" /> },
                                 { name: "Internal Auditor", icon: <ShieldCheck className="w-8 h-8 text-red-600" /> },
                                 { name: "Compliance Officer", icon: <Scale className="w-8 h-8 text-teal-600" /> }

                              ].map((role, idx) => (
                                 <div key={idx} className="bg-slate-50 p-4 rounded-3xl border border-slate-100 text-center hover:bg-white hover:shadow-md transition-all cursor-default group">
                                    <div className="mb-4 group-hover:scale-110 transition-transform duration-300 flex justify-center">
                                       {role.icon}
                                    </div>
                                    <p className="font-bold text-slate-900 text-xs mt-2">{role.name}</p>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>

                     {/* Audience Highlights Bento Tiles */}
                     <div className="md:col-span-12">
                        <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-6 px-2">Who Should Enrol in ACCA Coaching?</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {audienceHighlights.map((item, index) => (
                            <div key={index} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:translate-y-[-4px] transition-transform duration-300">
                                <div className="mb-6 w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                                    {item.icon}
                                </div>
                                <h4 className="font-bold text-slate-900 mb-3">{item.title}</h4>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    {item.description}
                                </p>
                            </div>
                            ))}
                        </div>
                     </div>

                  </div>
               </div>
            </div>

            <MultiModalPopup
                        activeModal={activeModal}
                        setActiveModal={(k) => setActiveModalState(k)}
                        customTitle={customTitle}
                        customImage={config.imageUrl}
                        customDescription={customDescription}
                        productId={config.productId}
                         
                     />
         </section>
      </div>
   );
};

export default App;