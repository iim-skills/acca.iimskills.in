"use client";

import React, { useState } from "react";
import MultiModalPopup, { ModalKey } from "@/components/props/MultiModalPopup";
import {
  CheckCircle2,
  XCircle,
  Briefcase,
  TrendingUp,
  Users,
  Globe,
  Star,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';

export default function ROITable(): React.ReactElement {
  const [activeModal, setActiveModalState] = useState<ModalKey | null>(null);
  const [customTitle, setCustomTitle] = useState<string | undefined>();
  const [customDescription, setCustomDescription] = useState<string | undefined>();

  // NOTE: kept the key "ACCA" to avoid changing ModalKey types in other parts of the app.
  // This object now contains ACCA-specific content only — no logic changes.
  const courseConfigs: Record<string, { imageUrl: string; productId: string; contactOwner: string; redirectUrl: string; courseKey?: string }> = {
    ACCA: {
      imageUrl: "/ACCA/acca-coaching-program.png",
      productId: "ACCA",
      contactOwner: "IIM SKILLS",
      redirectUrl: "/Thank-You/acca/",
      courseKey: "acca",
    },
  };
  const config = courseConfigs["ACCA"];

  const comparisonData = [
    {
      feature: "Training Delivery",
      us: "ACCA-focused live coaching with exam-style practice and real-time doubt resolution",
      others: "Generic recorded lessons or slide-led sessions without exam orientation",
      icon: <Zap className="w-5 h-5" />
    },
    {
      feature: "Syllabus Coverage",
      us: "Complete coverage across Applied Knowledge, Applied Skills & Strategic Professional with exam techniques",
      others: "Partial or outdated syllabus coverage causing gaps at higher levels",
      icon: <TrendingUp className="w-5 h-5" />
    },
    {
      feature: "Practical Application",
      us: "Case studies, exam-style questions and integrated skills (IFRS, Tax, Audit) — practice, not just theory",
      others: "Theory-first approach with few practice exams or real-world examples",
      icon: <Globe className="w-5 h-5" />
    },
    {
      feature: "Career & Internship",
      us: "Dedicated placement support, CV reviews and internship opportunities with finance teams",
      others: "Basic job listings or cookie-cutter placement sessions",
      icon: <Briefcase className="w-5 h-5" />
    },
    {
      feature: "Global Recognition",
      us: "Preparation for global ACCA roles with international accounting standards and interview readiness",
      others: "Locally-focused coaching with limited global context",
      icon: <Users className="w-5 h-5" />
    }
  ];

  return (
    <section id="comparison" className="min-h-screen bg-white font-sans text-slate-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold mb-6">
            <Star className="w-4 h-4 fill-blue-600" />
            THE A.C.C.A. LEARNING SYSTEM
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            Designed for <span className="text-blue-600 underline decoration-blue-200">Global Accounting Careers</span>
          </h2>
          <p className="text-slate-500 text-[15px] md:text-lg max-w-2xl mx-auto">
            Why our ACCA coaching program stands apart — exam-first training, practical application, and global placement support.
          </p>
        </div>

        {/* The A.C.C.A. Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-16">
          {[
            { l: 'A', t: 'Applied', d: 'Mock tests & exam tips' },
            { l: 'C', t: 'Comprehensive', d: 'An all-inclusive curriculum' },
            { l: 'C', t: 'Career', d: 'Interview preparation & resume building' },
            { l: 'A', t: 'Adaptive', d: 'Acquire industry-relevant knowledge & skills' },
            { l: 'G', t: 'Global', d: 'Global career opportunities' }
          ].map((item, i) => (
            <div key={i} className={`bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 text-center hover:shadow-md transition-shadow ${i === 4 ? 'col-span-2 md:col-span-1' : 'col-span-1'}`}>
              <div className="text-2xl md:text-3xl font-black text-blue-600 mb-1">{item.l}</div>
              <div className="font-bold text-slate-800 text-sm md:text-base mb-1 md:mb-2">{item.t}</div>
              <div className="text-[10px] md:text-xs text-slate-400 leading-tight uppercase tracking-wider">{item.d}</div>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-xl md:rounded-3xl shadow-xl overflow-hidden border border-slate-200">
          {/* Table Header */}
          <div className="grid grid-cols-12 bg-slate-900 text-white p-3 md:p-6 font-bold text-[10px] md:text-sm uppercase tracking-wider md:tracking-widest">
            <div className="col-span-3">Features</div>
            <div className="col-span-5 text-blue-400 pl-2 md:pl-4 border-l border-slate-700">Our ACCA Coaching</div>
            <div className="col-span-4 pl-2 md:pl-4 border-l border-slate-700 text-slate-400">Others</div>
          </div>

          {/* Rows */}
          {comparisonData.map((row, index) => (
            <div
              key={index}
              className={`grid grid-cols-12 px-2 py-4 md:p-6 border-b border-slate-100 items-center transition-colors hover:bg-slate-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
            >
              {/* Feature Column */}
              <div className="col-span-3">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-3">
                  {/* Icon hidden on mobile, shown on desktop */}
                  <div className="hidden md:block text-blue-600 bg-blue-50 p-2 rounded-lg">
                    {row.icon}
                  </div>
                  <span className="font-bold text-slate-700 text-[10px] md:text-base leading-tight">
                    {row.feature}
                  </span>
                </div>
              </div>

              {/* Advantage Column */}
              <div className="col-span-5 pl-2 md:pl-4 border-l border-slate-100">
                <div className="flex items-start gap-1.5 md:gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 md:w-5 md:h-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-[11px] md:text-base font-semibold text-slate-900 leading-snug md:leading-normal">
                    {row.us}
                  </span>
                </div>
              </div>

              {/* Others Column */}
              <div className="col-span-4 pl-2 md:pl-4 border-l border-slate-100">
                <div className="flex items-start gap-1.5 md:gap-2">
                  <XCircle className="w-3.5 h-3.5 md:w-5 md:h-5 text-red-400 shrink-0 mt-0.5" />
                  <span className="text-[11px] md:text-base text-slate-500 leading-snug md:leading-normal">
                    {row.others}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Footer CTA */}
          <div className="bg-blue-600 p-5 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
            <div className="flex items-center gap-3 md:gap-4">
              <ShieldCheck className="hidden md:block w-8 h-8 text-white/80" />
              <div className="text-center md:text-left">
                <p className="text-base md:text-xl font-bold leading-tight">Career Outcomes Guaranteed</p>
                <p className="text-blue-100 text-[11px] md:text-sm">Join 55,000+ alumni building global finance careers.</p>
              </div>
            </div>

            <button
              onClick={() => {
                // kept modal key as "ACCA" to preserve existing modal wiring in the app
                setActiveModalState("ACCA");
                setCustomTitle("Apply for ACCA Coaching Program");
                setCustomDescription("Start your ACCA journey with expert coaching and global placement support.");
              }}
              className="w-full md:w-auto bg-white text-blue-600 px-6 py-2.5 md:px-8 md:py-3 rounded-lg md:rounded-xl font-black text-sm md:text-base shadow-lg hover:bg-blue-50 transition-all uppercase tracking-wider flex items-center justify-center gap-2"
            >
              Apply Now
              <ArrowRight className="w-4 h-4" />
            </button>
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
  );
}
