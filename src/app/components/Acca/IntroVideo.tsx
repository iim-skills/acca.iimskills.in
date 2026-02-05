"use client";
import React from 'react';

const ACCASection = () => {
  return (
    <div className=" bg-slate-50 py-12 px-4 md:px-8 lg:px-16 flex items-center justify-center relative overflow-hidden">
       <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
        
        {/* Left Column: Video/Image Frame */}
        <div className="relative w-full lg:col-span-5 group">
          
                <div className="relative aspect-video rounded-xl shadow-2xl overflow-hidden bg-slate-900 group cursor-pointer">
                {/* Simulated Video Thumbnail/Iframe */}
                <iframe 
                  width="100%" 
                  height="100%" 
                  src="https://www.youtube.com/embed/zNzRnlbAGJI?si=AnCNqcB2OBTG39EZ" 
                  title="All about ACCA Coaching" 
                  className="opacity-90 hover:opacity-100 transition-opacity"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                ></iframe>
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center"></div>
              </div>
            

          {/* Decorative element behind the frame */}
          <div className="absolute -z-10 -bottom-6 -left-6 w-32 h-32 bg-orange-200/50 rounded-full blur-3xl"></div>
        </div>

        {/* Right Column: Content */}
        <div className="space-y-6 w-full lg:col-span-7 lg:pl-6">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-6">
                        Why Choose the <span className="text-blue-700">ACCA Course for Your Career?</span>
                     </h2>
           
          
          <div className="space-y-5 text-[#4a5568] leading-relaxed">
            <p className="  text-slate-600 text-[15px] md:text-base">
             Wish to build a career that is not limited by borders? The ACCA course is the right option. It is a globally recognised qualification, accepted in 180 countries, having 2.5 Lacs members, 6+ lacs students, and 10,000+ employers - Big 4s. MNCs, Big 10 firms, etc.  
            </p>
            <p className=" text-slate-600 text-[15px] md:text-base">The ACCA coaching will provide you with benefits such as an international standard & updated knowledge, computer-based testing & high flexibility, a degree alongside ACCA, exemptions to fast-track qualification, career opportunities in India & 180 countries, practical learning, transition into a finance expert, and various job roles as per your specialization.</p>
            
             
          </div>  
        </div>
      </div>
    </div> 
  );
};

export default function App() {
  return (
    <div className="antialiased font-sans">
      <ACCASection />
    </div>
  );
}