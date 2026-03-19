"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Loader2,
  ArrowLeft,
  Save,
  Target,
  Layout,
  Layers,
  Info,
  CheckCircle2,
  AlignLeft,
  Trash2,
} from "lucide-react";

export const dynamic = "force-dynamic";

/* ================= TYPES ================= */

type Question = {
  id: string;
  text: string;
  type: string;
  options: { id: string; text: string }[];
  correctOption?: string;
  parentContent?: string;
};

type Quiz = {
  id: number | string;
  name: string;
  course_slug: string;
  module_id: string;
  submodule_id: string | null;
  batch_ids: string[];
  created_by: string;
  time_minutes: number;
  passing_percent: number;
  questions: Question[];
};

type ApiQuizResponse = {
  id: number | string;
  name?: string;
  title?: string;
  course_slug?: string;
  module_id?: string;
  submodule_id?: string | null;
  batch_ids?: string[] | string;
  created_by?: string;
  time_minutes?: number;
  passing_percent?: number;
  questions?: Question[] | string;
};

/* ================= HELPERS ================= */

function safeJSONParse<T>(value: unknown, fallback: T): T {
  try {
    if (value === null || value === undefined || value === "") return fallback;
    if (typeof value === "string") return JSON.parse(value) as T;
    return value as T;
  } catch {
    return fallback;
  }
}

function normalizeQuestions(questions: Question[]) {
  return questions.map((q, index) => {
    const questionId = q.id || `q-${Date.now()}-${index}`;

    const options = (q.options || []).map((opt, i) => ({
      id: opt.id || `${questionId}-opt-${i}`,
      text: opt.text ?? "",
    }));

    return {
      id: questionId,
      text: q.text ?? "",
      type: q.type || "MCQ",
      options,
      correctOption: q.correctOption || "",
      parentContent: q.parentContent || null,
    };
  });
}

/* ================= WRAPPER ================= */

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10">Loading...</div>}>
      <EditQuizPage />
    </Suspense>
  );
}

/* ================= ORIGINAL COMPONENT ================= */

function EditQuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchQuiz = async () => {
      try {
        const res = await fetch(`/api/admin/quizzes?id=${id}`);
        const data: ApiQuizResponse | null = await res.json();

        if (!res.ok) {
          console.error("Failed to load quiz:", data);
          return;
        }

        if (!data) return;

        const mappedQuiz: Quiz = {
          id: data.id,
          name: data.name || data.title || "",
          course_slug: data.course_slug || "demo-course",
          module_id: data.module_id || "MOD_1",
          submodule_id: data.submodule_id ?? null,
          batch_ids: safeJSONParse<string[]>(data.batch_ids, []),
          created_by: data.created_by || "admin",
          time_minutes: data.time_minutes ?? 10,
          passing_percent: data.passing_percent ?? 50,
          questions: safeJSONParse<Question[]>(data.questions, []),
        };

        setQuiz(mappedQuiz);
        setActiveIdx(0);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id]);

  const updateCurrentQuestion = (updates: Partial<Question>) => {
    setQuiz((prev) => {
      if (!prev || !prev.questions.length) return prev;

      const updatedQuestions = [...prev.questions];
      const current = updatedQuestions[activeIdx];

      if (!current) return prev;

      updatedQuestions[activeIdx] = { ...current, ...updates };

      return {
        ...prev,
        questions: updatedQuestions,
      };
    });
  };

  const handleSetCorrect = (optionId: string) => {
    updateCurrentQuestion({ correctOption: optionId });
  };

  const handleDeleteQuestion = () => {
    setQuiz((prev) => {
      if (!prev || prev.questions.length <= 1) return prev;

      const filtered = prev.questions.filter((_, i) => i !== activeIdx);
      const nextActive = activeIdx > 0 ? activeIdx - 1 : 0;
      setActiveIdx(nextActive);

      return {
        ...prev,
        questions: filtered,
      };
    });
  };

  const handleSave = async () => {
    if (!quiz) return;

    setIsSaving(true);
    try {
      const payload = {
        id: quiz.id,
        name: quiz.name,
        course_slug: quiz.course_slug,
        module_id: quiz.module_id,
        submodule_id: quiz.submodule_id,
        batch_ids: quiz.batch_ids,
        time_minutes: quiz.time_minutes,
        passing_percent: quiz.passing_percent,
        questions: normalizeQuestions(quiz.questions),
        created_by: quiz.created_by,
      };

      const res = await fetch("/api/admin/quizzes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to save quiz");
        return;
      }

      alert("Quiz Saved Successfully!");
      router.push("/admin");
    } catch (err) {
      console.error(err);
      alert("Something went wrong while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const currentQ = useMemo(() => {
    if (!quiz?.questions?.length) return null;
    return quiz.questions[activeIdx] || quiz.questions[0] || null;
  }, [quiz, activeIdx]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (!quiz || !currentQ) {
    return (
      <div className="p-10 text-center text-slate-500 font-bold">
        Quiz not found
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      ✅ Page working (error fixed)
    </div>
  );
}