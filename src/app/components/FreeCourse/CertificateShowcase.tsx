"use client";

import React from "react";
import { Award, CheckCircle2, ShieldCheck, Star, Linkedin, Download } from "lucide-react";

export default function CertificateSection() {
  return (
    <section className="py-10 md:py-15 bg-white relative overflow-hidden font-sans">
      {/* Background Decorative Glows */}
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:lg:grid-cols-12 gap-16 lg:gap-24 items-center">
          
          {/* LEFT: Certificate Visual (3D Tilt Effect) */}
          <div className="relative md:col-span-5 group perspective-1000 order-2 lg:order-1 flex justify-center">
             {/* Background Blob behind image */}
              
             <div className="relative w-full max-w-lg transform transition-transform duration-700 group-hover:rotate-y-6 group-hover:rotate-x-6 preserve-3d">
                {/* Main Frame */}
                <div className="bg-white p-3 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 relative">
                    {/* Inner Border */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden relative aspect-[1.4/1] bg-slate-50">
                        <img 
                            src="/freeCourseCertificate/dacb.png" 
                            alt="IIM Skills Data Analytics Certificate" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement?.classList.add('flex', 'flex-col', 'items-center', 'justify-center', 'text-slate-400');
                                const icon = document.createElement('div');
                                icon.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="mb-2 opacity-50"><circle cx="12" cy="8" r="7"/><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"/></svg>';
                                const text = document.createElement('span');
                                text.innerText = 'Certificate Preview';
                                e.currentTarget.parentElement?.appendChild(icon);
                                e.currentTarget.parentElement?.appendChild(text);
                            }}
                        />
                        
                        {/* Shimmer Effect overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none"></div>
                    </div>

                    {/* Blue Badge */}
                    <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 animate-pulse-slow">
                        <Award className="text-white w-10 h-10" strokeWidth={1.5} />
                    </div>
                </div>

                {/* Reflection/Shadow underneath */}
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-[90%] h-4 bg-blue-900/10 blur-xl rounded-[100%]"></div>
             </div>
          </div>

          {/* RIGHT: Content */}
          <div className="md:col-span-7 space-y-8 order-1 lg:order-2">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider mb-6">
                <ShieldCheck size={14} className="fill-blue-100" /> Govt. Recognized
              </div>
              
              <h2 className="text-2xl md:text-4xl font-bold text-slate-900 leading-tight mb-3">
                Get  {""}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Certified
                </span>
              </h2>

              <p className="text-slate-600 text-lg leading-relaxed mb-4">
                The free data analytics course builds strong Excel-based practical skills, sharpens analytical thinking, and introduces industry-relevant concepts to help beginners confidently start their data analytics career.
              </p>
              
               
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                    { title: "LinkedIn Shareable", icon: <Linkedin size={18} />, color: "text-blue-600", bg: "bg-blue-50" },
                    { title: "Lifetime Validity", icon: <CheckCircle2 size={18} />, color: "text-green-600", bg: "bg-green-50" },
                    { title: "Downloadable PDF", icon: <Download size={18} />, color: "text-indigo-600", bg: "bg-indigo-50" },
                    { title: "Industry Verified", icon: <ShieldCheck size={18} />, color: "text-purple-600", bg: "bg-purple-50" },
                ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all cursor-default">
                        <div className={`p-2 rounded-full ${item.bg} ${item.color}`}>
                            {item.icon}
                        </div>
                        <span className="text-slate-700 font-medium text-sm">{item.title}</span>
                    </div>
                ))}
            </div>

            {/* CTA */}
            {/* <div className="pt-2">
                <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors group">
                    View Sample Certificate 
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
            </div> */}
          </div>

        </div>
      </div>
    </section>
  );
}