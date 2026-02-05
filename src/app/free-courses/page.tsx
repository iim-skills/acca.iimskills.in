// app/free-courses/[slug]/curriculum/page.tsx
import fs from "fs";
import path from "path";
import React from "react";

type Params = { slug: string };

// Server Component — note the `async` and `await params`
export default async function CurriculumPage({
  params,
}: {
  params: Promise<Params> | Params;
}) {
  // UNWRAP params (they are a Promise in dev/streaming)
  const { slug } = await params;

  const coursesPath = path.join(process.cwd(), "data", "courses.json");
  const raw = fs.readFileSync(coursesPath, "utf-8");
  const courses = JSON.parse(raw) as Array<any>;

  // adjust this to match how you store slug (e.g. course.slug)
  const course = courses.find((c) => c.slug === slug || c.id === slug);

  if (!course) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Course not found</h1>
        <p className="mt-2">No course matches the slug: <code>{slug}</code></p>
      </div>
    );
  }

  // Render curriculum — adapt to your actual course data shape
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
      <p className="text-sm text-gray-600 mb-6">{course.description}</p>

      {Array.isArray(course.curriculum) && course.curriculum.length > 0 ? (
        <div className="space-y-6">
          {course.curriculum.map((section: any, idx: number) => (
            <section key={idx} className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-medium mb-2">{section.title}</h2>
              {Array.isArray(section.items) ? (
                <ul className="list-disc pl-5 space-y-1">
                  {section.items.map((it: string, i: number) => (
                    <li key={i}>{it}</li>
                  ))}
                </ul>
              ) : (
                <p>{section.content ?? null}</p>
              )}
            </section>
          ))}
        </div>
      ) : (
        <p>No curriculum available for this course.</p>
      )}
    </div>
  );
}
