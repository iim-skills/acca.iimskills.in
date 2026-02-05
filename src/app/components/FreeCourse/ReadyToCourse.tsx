"use client";

import React from "react";
import { 
  Quote, 
  Linkedin, 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  Award 
} from "lucide-react";

export default function FounderSection() {
  return (
    <section className="py-10 md:py-15 bg-slate-50 relative overflow-hidden font-sans">
      {/* Decorative Background Elements */}
       
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          
          {/* LEFT: Content (60% width) */}
          <div className="space-y-6 lg:col-span-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-4">
                <Users size={14} /> Founder's Message
              </div>
              <h2 className="text-2xl md:text-4xl font-bold text-slate-900 leading-tight mb-6">
                Empowering the Next Generation of {""}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Data Leaders
                </span>
              </h2>
              <div className="relative pl-6 border-l-4 border-blue-600">
                <Quote className="absolute -top-2 left-6 text-blue-200 fill-blue-100 -z-10 w-16 h-16" />
                <p className="text-lg text-slate-700 font-medium italic leading-relaxed relative z-10">
                  "Our mission is simple: to make high-quality data education accessible to everyone. We believe that skills, not just degrees, define the future of work. I invite you to join us and unlock your true potential."
                </p>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed">
              With over a decade of experience in the ed-tech and analytics industry, 
              Vaibhav has mentored thousands of students and professionals. His vision 
              for <strong>IIM SKILLS</strong> drives our commitment to practical, 
              job-oriented learning that bridges the gap between academia and industry demands.
            </p>

            {/* Stats / Highlights */}
            {/* <div className="grid grid-cols-2 gap-6">
               <div className="flex items-start gap-3">
                 <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                   <Award size={20} />
                 </div>
                 <div>
                   <h4 className="font-bold text-slate-900 text-lg">15+ Years</h4>
                   <p className="text-sm text-slate-500">Industry Experience</p>
                 </div>
               </div>
               <div className="flex items-start gap-3">
                 <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                   <Users size={20} />
                 </div>
                 <div>
                   <h4 className="font-bold text-slate-900 text-lg">35,000+</h4>
                   <p className="text-sm text-slate-500">Careers Transformed</p>
                 </div>
               </div>
            </div> */}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 pt-2">
              <a 
                href="https://www.linkedin.com/in/vaibhavkakkar/"  target="_blank"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all"
              >
                Connect on LinkedIn <Linkedin size={18} />
              </a>
              
            </div>
          </div>

          {/* RIGHT: Image / Profile Visual (40% width) */}
          <div className="relative w-full flex items-center justify-center lg:justify-end lg:col-span-4">
             {/* Background Blob */}
             <div className="absolute top-1/2 left-1/2 w-[120%] h-[80%] bg-gradient-to-tr from-blue-100 to-indigo-100 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 -z-10 opacity-60"></div>

             {/* Image Card */}
             <div className="relative w-full max-w-md bg-white p-3 rounded-[2rem] shadow-2xl border border-slate-100 rotate-2 hover:rotate-0 transition-transform duration-500 group">
                <div className="relative rounded-[1.5rem] overflow-hidden bg-slate-100 aspect-[4/5]">
                   {/* Placeholder Image - Replace with Founder Image */}
                   <img 
                     src="/Vaibhav-Kakkar.jpg" 
                     alt="Vaibhav Kakkar - Founder IIM SKILLS" 
                     className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                   />
                   
                   {/* Gradient Overlay at bottom */}
                   <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/60 to-transparent"></div>

                   {/* Name Overlay */}
                   <div className="absolute bottom-6 left-6 text-white">
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-200 mb-1">Founder & CEO</p>
                      <h3 className="text-2xl font-bold">Vaibhav Kakkar</h3>
                   </div>
                </div>

                {/* Floating Badge */}
                <div className="absolute -right-4 top-10 bg-white p-3 rounded-xl shadow-xl border border-slate-50 flex items-center gap-2 animate-bounce-slow">
                   <div className="bg-blue-600 text-white p-1 rounded-full">
                     <CheckCircle2 size={16} />
                   </div>
                   <div>
                     <p className="text-xs font-bold text-slate-400 uppercase">Profile</p>
                     <p className="text-sm font-bold text-slate-900">Verified</p>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
}