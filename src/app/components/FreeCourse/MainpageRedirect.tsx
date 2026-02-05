"use client";

import React from "react";
import { ArrowRight, Zap, CheckCircle2, TrendingUp, Code2, Database, BarChart4 } from "lucide-react";

export default function NextStepCTA() {
  const features = [
    { name: "Advanced Excel", icon: <BarChart4 size={18} />, color: "text-green-400", bg: "bg-green-400/10" },
    { name: "Python Programming", icon: <Code2 size={18} />, color: "text-yellow-400", bg: "bg-yellow-400/10" },
    { name: "SQL Databases", icon: <Database size={18} />, color: "text-blue-400", bg: "bg-blue-400/10" },
    { name: "Power BI & Tableau", icon: <TrendingUp size={18} />, color: "text-orange-400", bg: "bg-orange-400/10" },
  ];

  return (
    <section className="py-20 px-4 md:px-8 bg-white relative font-sans overflow-hidden">
        {/* Background Decorative Blob */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-[500px] bg-blue-50/50 rounded-full blur-3xl -z-10"></div>

        <div className="max-w-7xl mx-auto">
            <div className="relative rounded-[2.5rem] overflow-hidden bg-slate-900 shadow-2xl shadow-blue-900/20">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#60a5fa 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
                
                {/* Glow Effects */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 p-8 md:p-16 items-center">
                    
                    {/* LEFT CONTENT */}
                    <div className="space-y-8 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-widest">
                            <Zap size={14} className="fill-blue-300" /> Career Acceleration
                        </div>

                        <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                            Unlock the Full <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                                Data Analytics Toolkit
                            </span>
                        </h2>

                        <p className="text-slate-400 text-lg leading-relaxed max-w-lg mx-auto lg:mx-0">
                            Ready to go beyond the basics? Our Master Program covers everything from Python automation to advanced visualization, making you 100% job-ready.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                            <a 
                                href="/data-analytics-course"
                                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg shadow-blue-900/50 hover:shadow-blue-600/40 hover:-translate-y-1 group"
                            >
                                View Master Program
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </a>
                        </div>
                        
                        {/* <p className="text-sm text-slate-500 font-medium">
                            <span className="text-green-400">●</span> Next batch starts soon
                        </p> */}
                    </div>

                    {/* RIGHT VISUAL - Feature Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
                        {features.map((feature, idx) => (
                            <div 
                                key={idx} 
                                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:bg-slate-800 transition-colors duration-300 flex flex-col gap-4 group"
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${feature.bg} ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                                    {feature.icon}
                                </div>
                                <div>
                                    <h4 className="text-slate-200 font-bold text-lg mb-1">{feature.name}</h4>
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <CheckCircle2 size={12} className="text-blue-500" /> 
                                        Industry Standard
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Decor floating badge */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-slate-900 px-6 py-3 rounded-full shadow-2xl font-bold text-sm hidden md:flex items-center gap-2 border-4 border-slate-900 z-10 whitespace-nowrap">
                            <span className="flex h-3 w-3 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                            </span>
                            500+ Hiring Partners
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </section>
  );
}