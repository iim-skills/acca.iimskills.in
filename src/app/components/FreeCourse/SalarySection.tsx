"use client";

import React, { useState } from "react";
import { 
  MapPin, 
  Building2, 
  Briefcase, 
  Download, 
  TrendingUp, 
  X,
  BarChart3
} from "lucide-react";
import Link from "next/link";

/* ------------------------------ */
/* MOCK COMPONENTS (Inlined)      */
/* ------------------------------ */
const Button = ({ children, onClick, className }: any) => (
  <button
    onClick={onClick}
    className={`bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 ${className}`}
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
/* TYPES                          */
/* ------------------------------ */
type CourseConfigType = {
  imageUrl: string;
  productId: string;
  contactOwner: string;
  redirectUrl: string;
};

const courseConfigs: Record<string, CourseConfigType> = {
  FreeDA: {
    imageUrl: "/DemoImage/DA.png",
    productId: "FDAMC",
    contactOwner: "IIM SKILLS",
    redirectUrl: "/free-courses/free-data-analytics-course",
  },
};

/* ------------------------------ */
/* MAIN COMPONENT                 */
/* ------------------------------ */
export default function SalarySection() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState<string | undefined>();
  const [customDescription, setCustomDescription] = useState<string | undefined>();

  const config = courseConfigs["FreeDA"];

  return (
    <section id="salary" className="py-10 md:py-15  relative overflow-hidden font-sans">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-100/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* LEFT SECTION: Content & Factors (Takes up ~60% space - 7/12 cols) */}
          <div className="space-y-8 lg:col-span-7">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-4">
                <TrendingUp size={14} /> Career Growth
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-6">
                What is The Average Salary <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                After a Data Analytics Course?
                </span>
              </h2>
              
              <p className="text-lg text-slate-600 leading-relaxed">
                The earnings of a data analyst range significantly depending on location,
                experience, and skills. A skilled analyst can expect a salary between
                <span className="font-semibold text-slate-900"> 3–7 LPA</span> for beginners, 
                <span className="font-semibold text-slate-900"> 12 LPA</span> for intermediate
                roles, and up to <span className="font-semibold text-slate-900">18 LPA+</span> for 
                senior professionals with advanced technical and leadership skills.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                Key Factors Influencing Salary:
              </h3>

              <ul className="space-y-6">
                {/* Factor 1 */}
                <li className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <MapPin size={22} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">Location</h4>
                    <p className="text-sm text-slate-500 mt-1">
                      Higher expectations in metro cities like Mumbai, Delhi & Bangalore.
                    </p>
                  </div>
                </li>

                {/* Factor 2 */}
                <li className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Building2 size={22} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">Company Size</h4>
                    <p className="text-sm text-slate-500 mt-1">
                      Large companies offer higher compensation compared to small firms.
                    </p>
                  </div>
                </li>

                {/* Factor 3 */}
                <li className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Briefcase size={22} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">Project / Portfolio</h4>
                    <p className="text-sm text-slate-500 mt-1">
                      A strong portfolio allows you to command higher pay even with less experience.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* RIGHT SECTION: Salary Dashboard Card (Takes up ~40% space - 5/12 cols) */}
          <div className="relative lg:col-span-5">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[2.5rem] blur-xl opacity-20 transform translate-y-4 scale-95"></div>
            
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-[0_20px_50px_rgba(8,_112,_184,_0.1)] relative overflow-hidden">
               {/* Decorative header bg */}
               <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-50/50 to-transparent"></div>

               <div className="relative z-10 flex items-start justify-between mb-8">
                 <div>
                    <h3 className="text-xl font-bold text-slate-800">Salary Progression</h3>
                    <p className="text-slate-500 text-sm mt-1">Estimated annual growth (INR)</p>
                 </div>
                 <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <BarChart3 size={20} />
                 </div>
               </div>

               {/* Modern Vertical Chart Area */}
               <div className="relative h-64 mt-4 mb-8 z-10 w-full">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between text-xs text-slate-300 pointer-events-none z-0">
                    <div className="border-b border-dashed border-slate-200 h-0 w-full"></div>
                    <div className="border-b border-dashed border-slate-200 h-0 w-full"></div>
                    <div className="border-b border-dashed border-slate-200 h-0 w-full"></div>
                    <div className="border-b border-dashed border-slate-200 h-0 w-full"></div>
                    <div className="border-b border-dashed border-slate-100 h-0 w-full"></div>
                  </div>

                  {/* Bars Container */}
                  <div className="absolute inset-0 flex items-end justify-around px-2 z-10">
                    
                    {/* Bar 1: Beginner */}
                    <div className="flex flex-col items-center group w-1/4">
                       <div className="text-sm font-bold text-slate-700 mb-2 group-hover:-translate-y-1 transition-transform duration-300">3-7 LPA</div>
                       <div className="w-full bg-gradient-to-t from-blue-300 to-blue-500 rounded-t-xl shadow-lg shadow-blue-200 group-hover:shadow-blue-300/60 transition-all duration-300 group-hover:-translate-y-1 h-24 relative overflow-hidden cursor-default">
                          <div className="absolute inset-0 bg-white/20 skew-y-12"></div>
                          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/10 to-transparent opacity-50"></div>
                       </div>
                       <div className="mt-3 text-xs font-semibold text-slate-500 text-center uppercase tracking-wide">Beginner</div>
                    </div>

                    {/* Bar 2: Intermediate */}
                    <div className="flex flex-col items-center group w-1/4">
                       <div className="text-sm font-bold text-slate-700 mb-2 group-hover:-translate-y-1 transition-transform duration-300">~12 LPA</div>
                       <div className="w-full bg-gradient-to-t from-blue-500 to-indigo-500 rounded-t-xl shadow-lg shadow-indigo-200 group-hover:shadow-indigo-300/60 transition-all duration-300 group-hover:-translate-y-1 h-40 relative overflow-hidden cursor-default">
                           <div className="absolute inset-0 bg-white/20 skew-y-12"></div>
                           <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/10 to-transparent opacity-50"></div>
                       </div>
                       <div className="mt-3 text-xs font-semibold text-slate-500 text-center uppercase tracking-wide">Mid-Level</div>
                    </div>

                    {/* Bar 3: Senior */}
                    <div className="flex flex-col items-center group w-1/4">
                       <div className="text-sm font-bold text-slate-700 mb-2 group-hover:-translate-y-1 transition-transform duration-300">18+ LPA</div>
                       <div className="w-full bg-gradient-to-t from-indigo-500 to-purple-600 rounded-t-xl shadow-lg shadow-purple-200 group-hover:shadow-purple-300/60 transition-all duration-300 group-hover:-translate-y-1 h-56 relative overflow-hidden cursor-default">
                           <div className="absolute inset-0 bg-white/20 skew-y-12"></div>
                           <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/10 to-transparent opacity-50"></div>
                       </div>
                       <div className="mt-3 text-xs font-semibold text-slate-500 text-center uppercase tracking-wide">Senior</div>
                    </div>
                  </div>
               </div>
               
               <p className="text-xs text-slate-400 text-right flex justify-end items-center gap-1 italic mb-6">
                  *Salary varies based on skills & location
               </p>

               {/* CTA Area */}
               <div className="pt-6 border-t border-slate-100 relative z-10">
                <Link href="/free-courses/free-data-analytics-course/curriculum/" className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 ${className}">
                      Unlock Your Career Growth   
                </Link>
                
                  
               </div>
            </div>
          </div>

        </div>
      </div>

      <MultiModalPopup
        activeModal={activeModal}
        setActiveModal={setActiveModal}
        customTitle={customTitle}
        customDescription={customDescription}
        productId={config.productId}
      />
    </section>
  );
}