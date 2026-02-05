"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Star, 
  ArrowRight,
  User,
  X,
  Puzzle,
  TrendingUp,
  Globe2,
  Hourglass,
  Users,
  CheckCircle2
} from "lucide-react";

/* ------------------------------ */
/* CUSTOM CSS FOR INFINITE SCROLL */
/* ------------------------------ */
const styles = `
  @keyframes scroll-up {
    0% { transform: translateY(0); }
    100% { transform: translateY(-50%); }
  }
  .animate-scroll-up {
    animation: scroll-up 40s linear infinite;
  }
  .animate-scroll-up:hover {
    animation-play-state: paused;
  }
  .mask-gradient-vertical {
    mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
    -webkit-mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
  }
`;

 
const benefits = [
  {
    title: "Problem Solving Skills",
    text: "Enhance critical thinking to solve complex problems by drawing meaningful conclusions from raw data for better decisions.",
    icon: Puzzle,
    bg: "bg-blue-100",
    iconColor: "text-blue-600"
  },
  {
    title: "High-demand Career",
    text: "Exploding demand across industries offers high earning potential and massive job security for skilled analysts.",
    icon: TrendingUp,
    bg: "bg-teal-100",
    iconColor: "text-teal-600"
  },
  {
    title: "Global Opportunities",
    text: "Big Data's boom creates widespread career opportunities worldwide, irrespective of industry boundaries or location.",
    icon: Globe2,
    bg: "bg-purple-100",
    iconColor: "text-purple-600"
  },
  {
    title: "Long Term Career",
    text: "A future-proof career choice offering sustained growth as data becomes essential in the modern digital era.",
    icon: Hourglass,
    bg: "bg-indigo-100",
    iconColor: "text-indigo-600"
  },
  {
    title: "Enhances Related Skills",
    text: "Sharpen communication and leadership skills by learning to present complex insights clearly to key decision-makers.",
    icon: Users,
    bg: "bg-orange-100",
    iconColor: "text-orange-600"
  },
];

/* ------------------------------ */
/* MAIN COMPONENT                 */
/* ------------------------------ */
export default function WhyLearnSection() {
  const [activeModal, setActiveModal] = useState(null);
  
  // Duplicate list for seamless infinite scroll
  const scrollBenefits = [...benefits, ...benefits];

  return (
    <section className="py-10 md:py-15 bg-slate-50 relative overflow-hidden font-sans">
      <style>{styles}</style>
      
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-50/50 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* LEFT SIDE: Content */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-100 text-xs font-bold uppercase tracking-wider">
              <Star size={14} className="fill-yellow-500 text-yellow-500" /> 
              4.9/5 Average Rating
            </div>

            <h2 className="text-2xl md:text-4xl font-bold text-slate-900 leading-tight">
              Why Learn <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Data Analytics?</span>
            </h2>
            
            <p className="text-lg text-slate-600 leading-relaxed">
              Our Free Data Analytics course helps you build strong problem-solving skills, understand real business data, and start your analytics journey without cost or prior experience.
            </p>

            <div className="grid grid-cols-2 gap-6 pt-0">
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-3xl font-bold text-slate-900 mb-1">92%</div>
                  <div className="text-sm text-slate-500 font-medium">Placement Success</div>
               </div>
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-3xl font-bold text-slate-900 mb-1">50%</div>
                  <div className="text-sm text-slate-500 font-medium">Avg. Salary Hike</div>
               </div>
            </div>

            <div className="pt-0">
              <Link href="/free-courses/free-data-analytics-course/curriculum/" className="w-max bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 ${className}">
                      Begin Learning Now   
              </Link>
              {/* <Button 
                
              >
                Start Your Success Story <ArrowRight size={18} />
              </Button> */}
            </div>
            
            {/* <div className="flex items-center gap-4 text-sm text-slate-400">
               <div className="flex -space-x-3">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center overflow-hidden">
                     <User size={16} className="text-slate-400" />
                   </div>
                 ))}
               </div>
               <p>Join our growing community</p>
            </div> */}
          </div>

          {/* RIGHT SIDE: Infinite Scroll Vertical */}
          <div className="relative h-[400px] w-full overflow-hidden mask-gradient-vertical">
             {/* Gradient Masks for smooth fade in/out */}
             {/* <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none"></div>
             <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none"></div> */}

             {/* Scrolling Container */}
             <div className="animate-scroll-up w-full">
                <div className="space-y-6 pb-6">
                  {scrollBenefits.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgba(59,130,246,0.1)] hover:border-blue-100 transition-all duration-300 flex items-start gap-5"
                    >
                        {/* Icon Box */}
                        <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center ${item.bg} ${item.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                            <item.icon size={28} strokeWidth={1.5} />
                        </div>

                        {/* Text Content */}
                        <div>
                            <h4 className="font-bold text-slate-900 text-lg mb-2 group-hover:text-blue-700 transition-colors">
                                {item.title}
                            </h4>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                {item.text}
                            </p>
                        </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>

        </div>
      </div>

       
    </section>
  );
}