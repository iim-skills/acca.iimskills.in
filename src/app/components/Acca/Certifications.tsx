"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Award, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles,
  FileCheck,
  ShieldAlert
} from 'lucide-react';

const benefits = [
  "Globally recognized by top MNCs & Government",
  "Verified credentials for high-growth roles",
  "Practicing rights in India & 180+ countries",
  "Covers GST, Taxation, & Compliance Analytics",
  "Portfolio of industry-standard certificates",
];

export default function App() {
  const [imageError, setImageError] = useState(false);

  return (
    <section className="relative py-16 lg:py-24 bg-[#f8fafc] overflow-hidden font-sans">
      {/* Enhanced Dynamic Background */}
 

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* LEFT CONTENT: Information */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />
                <span className="inline-block px-4 py-1.5 text-xs font-bold tracking-widest text-blue-600 uppercase bg-blue-100/50 backdrop-blur-sm rounded-full">
                  Industry Recognized
                </span>
              </div>
              <h2 className="text-4xl md:text-4xl font-bold text-slate-900 leading-tight">
                IIM SKILLS  {""}
                <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  ACCA Certification
                </span>
              </h2>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                Earn a credential that speaks volumes. Our comprehensive ACCA program validates your expertise from foundational knowledge to professional mastery.
              </p>
            </div>

            <div>
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-3 group"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-slate-600 font-medium group-hover:text-slate-900 transition-colors">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-200 hover:shadow-blue-400 hover:-translate-y-1 transition-all duration-300 active:scale-95">
                Request Program Details
              </button>
              <button className="px-8 py-4 bg-white/80 backdrop-blur-md text-slate-700 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95">
                Download Brochure
              </button>
            </div>
          </div>

          {/* RIGHT CONTENT: Single Attractive Certificate Showcase */}
          <div className="lg:col-span-5 relative">
            <div className='w-full bg-white rounded-[3rem] p-8 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden'>
            {/* <motion.div
              initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
              whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative aspect-[4/3] md:aspect-auto w-full bg-white rounded-[3rem] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden"
            > */}
              {/* Background Accents */}
               
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-100/30 rounded-full blur-3xl" />

              {/* Certificate Card Header */}
              <div className="relative flex justify-between items-start mb-10">
                
                <motion.div 
                  whileHover={{ rotate: 15, scale: 1.1 }}
                  className=" absolute right-2 -top-5 p-4 bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg rounded-2xl text-white"
                >
                  <Award className="w-8 h-8" />
                </motion.div>
              </div>
              <div>
                 <img
  src="/ACCA/iim-skills-acca.png"
  alt="ACCA Professional Certificate"
  onError={(e) => {
    console.error('Certificate image failed to load', e); // shows event in console
    setImageError(true);
  }}
  className="w-auto h-[400px] mx-auto  "
/>
              </div>
              {/* </motion.div> */}
          

            {/* Decorative Floating Elements around the certificate */}
            <motion.div 
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-6 -left-6 p-4 bg-white shadow-xl rounded-2xl border border-slate-100 hidden md:block"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</div>
                  <div className="text-sm font-bold text-slate-900">Highly Rated</div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-6 -right-6 p-4 bg-white shadow-xl rounded-2xl border border-slate-100 hidden md:block"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Security</div>
                  <div className="text-sm font-bold text-slate-900">QR Verified</div>
                </div>
              </div>
            </motion.div>
          </div>

        </div>

     </div>
      </div>
    </section>
  );
}