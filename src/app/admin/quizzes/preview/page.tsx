// app/admin/quizzes/preview/page.tsx
import { Suspense } from "react";
import PreviewClient from "./PreviewClient";

export const metadata = {
  title: "Quiz Preview",
};

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading preview...</div>}>
      <PreviewClient />
    </Suspense>
  );
}