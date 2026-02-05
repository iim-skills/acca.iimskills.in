"use client";
import React from "react";
import { Users, Star, Quote } from "lucide-react";

// --- TYPES & DATA ---

type Theme = {
  headerColor: string;
  textColor: string;
  starColor: string;
};

type Testimonial = {
  id: number;
  name: string;
  role: string;
  // company: string;
  quote: string;
  /**
   * CompanyLogo can be either:
   *  - a React component (existing SVGs like GoogleLogo), or
   *  - a string path (e.g. "/logos/google.png") pointing to an image in /public
   */
  CompanyLogo: React.ElementType | string;
  theme: Theme;
  avatarImage: string;
  bgText: string;
};

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Onkar Yadav",
    role: "AVP",
    // company: "Barclays",
    quote:
      "I have been hiring from IIM SKILLS for a while and the process has been very smooth. The students bring in real skills and talent to our team.",
    CompanyLogo: "/Recruiters/barclays.png",
    theme: {
      headerColor: "bg-blue-600",
      textColor: "text-blue-900",
      starColor: "text-blue-500",
    },
    avatarImage: "/Recruiters/Onkar.jpg",
     bgText: "BARCLAYS",
  },
  {
    id: 2,
    name: "Mohit Budhiraja",
    role: "Assistant Manager",
    // company: "EY",
    quote:
      "IIM SKILLS is always my first choice for hiring finance professionals. I have personally interviewed their students and find them highly qualified for our roles.",
    CompanyLogo: "/HiringPartners/ey.png",
    theme: {
      headerColor: "bg-orange-500",
      textColor: "text-orange-900",
      starColor: "text-orange-500",
    },
    avatarImage: "/Recruiters/mohit.jpg",
     bgText: "Ernst & Young",
  },
  {
    id: 3,
    name: "Ishant Ghai",
    role: "Vice President",
    // company: "TAG",
    quote:
      "What makes analysts smart is their technical as well as soft skills. I get to see both of them when I hire from IIM SKILLS. They have been our preferred partner for all hiring needs.",
    CompanyLogo: "/trainer/tag.png",
    theme: {
      headerColor: "bg-sky-600",
      textColor: "text-sky-900",
      starColor: "text-sky-500",
    },
    avatarImage: "/Recruiters/ishant.jpg",
     bgText: "The Algebra Group",
  },
];

// --- COMPONENTS ---

const TestimonialCard: React.FC<{ testimonial: Testimonial }> = ({ testimonial }) => {
  const { name, role, quote, CompanyLogo, theme, avatarImage } = testimonial;

  // If CompanyLogo is a string, we render an <img>.
  // Otherwise assume it's a React component (SVG) and render it.
  const renderCompanyLogo = () => {
    if (typeof CompanyLogo === "string") {
      return (
        <img
          src={CompanyLogo}
          alt={`Company logo`}
          className="w-auto h-10 object-contain"
        />
      );
    } else {
      const LogoComp = CompanyLogo as React.ElementType;
      return <LogoComp className="w-6 h-6" />;
    }
  };

  return (
    <div className="flex-shrink-0 w-[350px] mx-6 relative  pt-12 group min-h-[450px]">
      <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 h-full flex flex-col">
        {/* 1. Header Section (Solid Color) */}
        <div className={`h-32 ${theme.headerColor} relative flex items-start justify-between p-6`}>
          <div className="flex items-center gap-2 text-white/90">
            {/* <-- replaced doodle usage with render helper that supports imgs */}
            {renderCompanyLogo()}
            {/* <span className="font-bold tracking-wide text-sm opacity-90">{company}</span> */}
          </div>
          {/* Decorative pattern/dots */}
          <div className=" text-white/50 font-black text-xl whitespace-nowrap tracking-tighter select-none pointer-events-none flex gap-1">
            {testimonial.bgText}
          </div>

          {/* Large Background Text
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/10 font-black text-4xl whitespace-nowrap tracking-tighter select-none pointer-events-none">
            
          </div> */}
        </div>

        {/* 2. Floating Avatar (Overlapping) */}
        <div className="relative -mt-12 flex justify-center">
          <div className="w-24 h-24 rounded-full bg-white p-1.5 shadow-lg">
            <div className={`w-full h-full rounded-full ${theme.headerColor} flex items-center justify-center text-white overflow-hidden`}>
              <img src={avatarImage} alt={`${name}'s avatar`} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* 3. Content Body */}
        <div className="px-8 pb-10 pt-4 text-center">
          {/* Name & Role */}
          <h3 className={`text-xl font-extrabold ${theme.textColor} mb-1`}>{name}</h3>
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4">{role}</p>

          {/* Stars */}
          <div className="flex justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star
  key={i}
  className={`w-4 h-4 ${theme.starColor}`}
  fill="currentColor"
/>

            ))}
          </div>

          {/* Quote Section */}
          <div className="relative">
            <Quote className="absolute -top-4 -left-2 w-8 h-8 text-gray-100 transform -scale-x-100" />
            <p className="text-gray-600 text-sm leading-relaxed relative z-10 italic">{`"${quote}"`}</p>
            <Quote className="absolute -bottom-4 -right-2 w-8 h-8 text-gray-100" />
          </div>
        </div>
      </div>
    </div>
  );
};

const RecruiterTestimonials: React.FC = () => {
  return (
    <section className="py-10 relative bg-slate-50 overflow-hidden font-sans">
      {/* Safely Injected CSS for Marquee Animation */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes scroll-right-to-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: scroll-right-to-left 80s linear infinite;
        }
      `,
        }}
      />

      <div className="max-w-7xl mx-auto px-4 relative z-10 mb-5">
        {/* Header Section */}
        <div className="text-center">
          <h2 className="text-orange-600 font-bold tracking-widest text-sm uppercase mb-3">Recruiter Feedback</h2>
          <div className="relative inline-block mb-6">
            <h2 className="w-62.5 md:w-2xl text-2xl md:text-4xl font-bold text-gray-900 relative z-10">
              Why Top Companies <span className="text-blue-700">Hire Through Us</span>
            </h2>
            {/* Clean Geometric Underline */}
            {/* <div className="absolute -bottom-2 left-0 w-full h-1.5 bg-yellow-400 rounded-full opacity-80"></div> */}
          </div>
          <p className="max-w-[60%] md:max-w-2xl mx-auto text-gray-600 text-[15px] md:text-lg leading-relaxed">
            Direct feedback from hiring managers who value the practical skills of our alumni.
          </p>
        </div>
      </div>

      {/* --- MARQUEE SECTION --- */}
      <div className="relative w-full overflow-hidden  pb-12">
        {/* Fade Gradients for Edges */}
        <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none"></div>

        {/* Marquee Track */}
        <div className="flex w-max animate-marquee">
          {/* Triple the list for smooth infinite scroll */}
          {[...testimonials, ...testimonials, ...testimonials].map((testimonial, idx) => (
            <TestimonialCard key={`${testimonial.id}-${idx}`} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecruiterTestimonials;
