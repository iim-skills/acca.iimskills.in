"use client";

import React, { useState } from "react";
import BatchDate from "@/components/NewBatchDatedesign";
import {
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
  CreditCard,
  Award,
  ShieldCheck,
  Briefcase,
  Users,
  Monitor,
} from "lucide-react";

const colorStyles = {
  orange: {
    bg50: "bg-orange-50",
    border200: "border-orange-200",
    text600: "text-orange-600",
    bg600: "bg-orange-600",
  },
  blue: {
    bg50: "bg-blue-50",
    border200: "border-blue-200",
    text600: "text-blue-600",
    bg600: "bg-blue-600",
  },
  green: {
    bg50: "bg-green-50",
    border200: "border-green-200",
    text600: "text-green-600",
    bg600: "bg-green-600",
  },
  purple: {
    bg50: "bg-purple-50",
    border200: "border-purple-200",
    text600: "text-purple-600",
    bg600: "bg-purple-600",
  },
  indigo: {
    bg50: "bg-indigo-50",
    border200: "border-indigo-200",
    text600: "text-indigo-600",
    bg600: "bg-indigo-600",
  },
  teal: {
    bg50: "bg-teal-50",
    border200: "border-teal-200",
    text600: "text-teal-600",
    bg600: "bg-teal-600",
  },
} as const;

type Batch = {
  id: number;
  type: string;
  date: string;
  days: string;
  time: string;
  status?: string;
  color: keyof typeof colorStyles;
};

type Advantage = {
  title: string;
  desc: string;
  icon: React.ComponentType<any>;
  color: keyof typeof colorStyles;
};

const batches: Batch[] = [
  {
    id: 1,
    type: "Tuesday Batch",
    date: "Dec 16, 2025",
    days: "Tue & Thu",
    time: "08:00 PM - 09:30 PM",
    status: "Filling Fast",
    color: "orange",
  },
];

const advantages: Advantage[] = [
  { title: "Easy EMI Options", desc: "Pay in 12 Interest-Free EMIs.", icon: CreditCard, color: "blue" },
      { title: "100% Money-Back*", desc: "Claim refund after 1st session.", icon: ShieldCheck, color: "green" },
      { title: "Certification Fees", desc: "Includes IIM SKILLS Certification Fees.", icon: Award, color: "orange" },
      { title: "Group Discount", desc: "Flat 10% off for 3+ registrations.", icon: Users, color: "indigo" },
      // { title: "Virtual Internship", desc: "Virtual internships are part of IIM SKILLS in-house, non-paid internship programs. Paid internships are offered through partner firms, subject to interview clearance. The stipend may vary depending on the company.", icon: Briefcase, color: "purple" },
];

const CombinedCourseInfo: React.FC = () => {
  const [activeBatch, setActiveBatch] = useState<number | null>(null);

  return (
     <section
      id="batch-details"
      className="py-10 md:py-15 bg-white font-sans relative"
    > 

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h4 className="text-orange-600 font-bold tracking-widest text-sm uppercase mb-3 inline-block px-3 py-1 rounded-full bg-orange-50 border border-orange-100">
            Enrollment Details
          </h4>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            ACCA Upcoming  <span className="text-blue-700">Batches & Benefits</span>
          </h2>
          <p className="max-w-2xl mx-auto text-gray-500 text-[15px] md:text-lg">
            Choose our upcoming batch and enjoy comprehensive benefits
            designed for your professional success.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 items-start relative">
          
          {/* LEFT: STICKY COLUMN */}
          <div className="lg:col-span-5 lg:sticky lg:top-10 lg:self-start flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 to-red-500" />
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-orange-500" /> Upcoming Batch
              </h3>

              <div className="space-y-4">
                {batches.map((batch) => {
                  const styles = colorStyles[batch.color] || colorStyles.orange;
                  const isActive = activeBatch === batch.id;
                  const outerClass = isActive
                    ? `${styles.bg50} ${styles.border200} shadow-md transform -translate-y-1`
                    : "bg-gray-50 border-gray-100 hover:border-gray-300";

                  return (
                    <div
                      key={batch.id}
                      onMouseEnter={() => setActiveBatch(batch.id)}
                      onMouseLeave={() => setActiveBatch(null)}
                      className={`group relative rounded-2xl p-5 border transition-all duration-300 cursor-pointer ${outerClass}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider transition-colors ${
                            isActive
                              ? `bg-white ${styles.text600}`
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {batch.type}
                        </span>
                        {batch.status === "Filling Fast" && (
                          <span className="text-[10px] font-bold text-red-500 animate-pulse">
                            Filling Fast 🔥
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mb-4">
                        <div className="text-center pr-4 border-r border-gray-200">
                          <span className="block text-2xl font-black text-gray-900 leading-none">
                            <BatchDate courseKey="acca" />
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                            <Clock className="w-4 h-4 text-blue-500" />
                            {batch.time}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {batch.days}
                          </div>
                        </div>
                      </div>

                      <button
                        className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                          isActive
                            ? `${styles.bg600} text-white shadow-lg`
                            : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        Secure Seat
                      </button>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-center text-gray-400 mt-6 italic">
                * Flexible rescheduling available for working professionals.
              </p>
            </div>
          </div>

          {/* RIGHT: CONTENT COLUMN (SCROLLS) */}
          <div className="lg:col-span-7">
            <div className="grid sm:grid-cols-2 gap-5">
              {advantages.map((adv, idx) => {
                const styles = colorStyles[adv.color] || colorStyles.blue;
                const Icon = adv.icon;

                const isInternship = adv.title === "Virtual Internship";
                return (
                  <div
                    key={idx} 
          className={`group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 
            ${isInternship ? "sm:col-span-2 p-8" : "p-6"} 
          `}>
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300 ${styles.bg50} ${styles.text600} group-hover:${styles.bg600} group-hover:text-white`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
                        {adv.title}
                      </h4>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        {adv.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Money Back Banner */}
            <div className="mt-8 bg-blue-900 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
              <div
                className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"
                aria-hidden
              />
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">100% Money-Back Guarantee</h4>
                  <p className="text-blue-200 text-sm">
                    Not satisfied after the 1st session? Full refund, no questions asked.
                  </p>
                </div>
              </div>
              <a href="#program-fee" className="relative z-10 px-6 py-3 bg-white text-blue-900 font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-lg whitespace-nowrap"> 
               
                Register Now
              
              </a>
            </div>
            
            {/* <div className="h-24"></div> */}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CombinedCourseInfo;
