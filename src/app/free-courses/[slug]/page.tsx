import fs from "fs";
import path from "path";
import CourseLMSClient from "@/components/lms/CourseLMSClient";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { ensureUserAndCourse } from "../../../lib/enrol";
import { Layout } from "lucide-react";

export default async function CoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [k: string]: string | undefined }>;
}) {
  // Await params & searchParams per Next.js requirements
  const { slug } = await params;
  const sp = await searchParams;

  const coursesPath = path.join(process.cwd(), "data", "courses.json");
  const raw = await fs.promises.readFile(coursesPath, "utf-8");
  const courses = JSON.parse(raw);
  const course = courses.find((c: any) => c.slug === slug);

  if (!course) return <div className="p-6">Course not found</div>;

  const session = await getServerSession(authOptions);

  if (sp.autoEnrol === "1" && session?.user?.email) {
    await ensureUserAndCourse({
      email: session.user.email,
      courseSlug: slug,
      sendWelcome: true,
    });
  }

  const prefill = { email: session?.user?.email || "", pw: "" };

  return (
    <div className="w-full mx-auto">
      <div className="relative w-full pt-15 pb-22 md:pt-25 md:pb-40 bg-slate-900 overflow-hidden">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
           <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/95 to-indigo-950/90 z-10"></div>
           <img 
             src="/LMS/Free-Courses-IIM-Skills.png" 
             alt="Background" 
             className="w-full h-full object-cover opacity-40 mix-blend-overlay"
           />
        </div>

        {/* Decorative Glows */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

        {/* Content */}
        <div className="relative z-20 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-blue-200 text-xs font-bold uppercase tracking-wider mb-6 backdrop-blur-md shadow-lg">
            <Layout size={12} /> Learning Management System
          </div>

          <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-6 drop-shadow-2xl">
            {course.title}
          </h1>
          
          <p className="text-slate-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed font-light">
            {course.shortDescription}
          </p>
        </div>
      </div>
      

      <div className="w-full xl:w-9/10 px-8 py-10 md:-mt-35 m-auto">
        <CourseLMSClient course={course} prefill={prefill} />
      </div>
    </div>
  );
}
