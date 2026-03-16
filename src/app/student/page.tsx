"use client";

import { useEffect,useState } from "react";
import { useRouter } from "next/navigation";

type Course = {
  course_slug:string;
  course_title:string;
};

export default function StudentPage(){

  const router = useRouter();
  const [courses,setCourses] = useState<Course[]>([]);

  useEffect(()=>{

    const raw = localStorage.getItem("user");

    if(!raw){
      router.push("/student/login");
      return;
    }

    const user = JSON.parse(raw);

    fetch("/api/student/course",{
      headers:{
        "x-user-email":user.email
      }
    })
    .then(res=>res.json())
    .then(data=>{
      setCourses(data);
    });

  },[router]);

  return(

    <main className="max-w-6xl mx-auto p-6">

      <h1 className="text-2xl font-bold mb-6">
        My Courses
      </h1>

      <div className="grid md:grid-cols-3 gap-6">

        {courses.map(course=>(

          <div
            key={course.course_slug}
            className="border rounded-xl p-5 shadow"
          >

            <h3 className="font-semibold text-lg mb-2">
              {course.course_title}
            </h3>

            <button
              onClick={()=>router.push(`/student/course/${course.course_slug}`)}
              className="text-blue-600 text-sm font-semibold"
            >
              Continue Learning →
            </button>

          </div>

        ))}

      </div>

    </main>

  );

}