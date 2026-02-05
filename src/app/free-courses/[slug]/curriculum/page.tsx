// /app/free-courses/[slug]/curriculum/page.tsx
import fs from "fs";
import path from "path";
import CourseDetailsClient from "@/components/lms/CourseDetailsClient";
import React from "react";
import { Star, Users } from "lucide-react";

export default async function CourseDetailsPage({
  params,
}: {
  // params may be a Promise in the App Router (dev/streaming), so accept both shapes
  params: Promise<{ slug: string }> | { slug: string };
}) {
  // UNWRAP params
  const { slug } = await params;

  // read courses.json server-side
  const coursesPath = path.join(process.cwd(), "data", "courses.json");

  let courses: any[] = [];
  try {
    const raw = fs.readFileSync(coursesPath, "utf-8");
    courses = JSON.parse(raw);
  } catch (err) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold mb-2">Error loading courses</h1>
        <p className="text-sm text-gray-600">
          Could not read courses data. Check <code>data/courses.json</code>.
        </p>
      </div>
    );
  }

  const course = courses.find((c: any) => c.slug === slug || c.id === slug);

  if (!course) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Course not found</h1>
        <p className="text-sm text-gray-600">
          No course matching <code>{slug}</code>.
        </p>
      </div>
    );
  }

  // fallback for template if missing
  if (!course.template) {
    course.template = "/DemoImage/placeholder.png";
  }

  return (
    <div className="w-full mx-auto">
      <div className="relative w-full pt-20 pb-28 md:pt-32 md:pb-40 bg-slate-900 overflow-hidden font-sans">
        {/* Background Image with Gradient Mask */}
        <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900/80 to-slate-900 z-10"></div>
            <img 
                src="/LMS/Free-Courses-IIM-Skills.png" 
                alt="Background" 
                className="w-full h-full object-cover opacity-30 mix-blend-overlay"
            />
        </div>
        
        {/* Animated Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl z-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="relative z-20 max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-blue-300 text-xs font-bold uppercase tracking-wider mb-6 backdrop-blur-md shadow-lg">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            Free Certification Program
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.1] mb-8 drop-shadow-2xl">
            {course.title}
          </h1>
          
           

          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 text-slate-400 text-sm font-medium">
             <span className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                <Star size={14} className="text-yellow-400 fill-yellow-400" /> 4.9/5 Rating
             </span>
             <span className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                <Users size={14} className="text-blue-400" /> 15k+ Learners
             </span>
             {/* <span className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                <Calendar size={14} className="text-emerald-400" /> Updated Mar 2024
             </span> */}
          </div>
        </div>
      </div>

      <div className="w-full xl:w-9/10 px-8 -mt-20 py-10 m-auto">
        <CourseDetailsClient course={course} />
      </div>
    </div>
  );
}
