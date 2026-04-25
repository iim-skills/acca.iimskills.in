"use client";

import React, { useEffect, useState } from "react";
import { Clock, BookOpen, BarChart3, HelpCircle, FileText } from "lucide-react";

// --- Types ---
type QuestionOption = { id: string; text: string };
type PassageSubQuestion = { id: string; text: string; options: QuestionOption[] };
type QuestionItem = {
  id: string;
  type: "MCQ" | "SHORT" | "LONG" | "PASSAGE";
  text: string;
  marks: number;
  options?: QuestionOption[];
  passage?: string;
  passageQuestions?: PassageSubQuestion[];
};

type QuizData = {
  id: number;
  name: string;
  questions: QuestionItem[];
  totalMarks: number;
  totalQuestions: number;
  time_minutes?: number;
  quizTime?: number;
};

export default function PreviewClient({ id }: { id?: string }) {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        if (!id) return;
        const res = await fetch(`/api/admin/quizzes?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          setQuiz(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id]);

  if (!id) return <StatusMessage color="text-red-500" message="❌ Missing Quiz ID" />;
  if (loading) return <StatusMessage color="text-indigo-600" message="Generating Preview..." isLoading />;
  if (!quiz) return <StatusMessage color="text-gray-500" message="No quiz data found" />;

  const quizTime = quiz.quizTime || quiz.time_minutes || 0;
  let globalIndex = 1;

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-20">
      {/* STICKY TOP BAR */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Quiz Preview</span>
            <h1 className="text-xl font-extrabold text-slate-900">{quiz.name}</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <Stat icon={<HelpCircle size={16} />} label={`${quiz.totalQuestions} Questions`} />
            <Stat icon={<BarChart3 size={16} />} label={`${quiz.totalMarks} Total Marks`} />
            <Stat 
              icon={<Clock size={16} />} 
              label={`${quizTime} Minutes`} 
              className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium"
            />
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto mt-8 px-6 space-y-8">
        {quiz.questions.map((q) => {
          if (q.type === "PASSAGE") {
            return (
              <section key={q.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Passage Header */}
                <div className="bg-slate-50 px-8 py-4 border-b flex items-center gap-2 text-slate-600">
                  <BookOpen size={18} />
                  <span className="font-semibold uppercase text-xs tracking-wider">Reading Comprehension</span>
                </div>
                
                <div className="p-8 space-y-6">
                  <h2 className="text-xl font-bold text-slate-800">{q.text}</h2>
                  <div className="bg-indigo-50/50 p-6 rounded-xl border border-indigo-100 text-slate-700 leading-relaxed italic">
                    {q.passage}
                  </div>

                  <div className="space-y-10 mt-8">
                    {q.passageQuestions?.map((sq) => (
                      <QuestionCard 
                        key={sq.id} 
                        number={globalIndex++} 
                        text={sq.text} 
                        options={sq.options} 
                        type="MCQ"
                      />
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          return (
            <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
               <QuestionCard 
                  number={globalIndex++} 
                  text={q.text} 
                  options={q.options} 
                  type={q.type}
                  marks={q.marks}
               />
            </div>
          );
        })}
      </main>
    </div>
  );
}

// --- Sub-Components for Cleanliness ---

function QuestionCard({ number, text, options, type, marks }: any) {
  return (
    <div className="space-y-5">
      <div className="flex justify-between items-start gap-4">
        <div className="flex gap-3">
          <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
            {number}
          </span>
          <p className="text-lg font-medium text-slate-800 pt-0.5">{text}</p>
        </div>
        {marks && (
          <span className="text-[11px] font-bold text-slate-400 border border-slate-200 px-2 py-1 rounded">
            {marks} PTS
          </span>
        )}
      </div>

      {type === "MCQ" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-11">
          {options?.map((opt: any, i: number) => (
            <div 
              key={opt.id} 
              className="group flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-default"
            >
              <span className="w-7 h-7 rounded-md bg-slate-100 group-hover:bg-indigo-100 text-slate-500 group-hover:text-indigo-600 flex items-center justify-center text-xs font-bold transition-colors">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-slate-700 font-medium">{opt.text}</span>
            </div>
          ))}
        </div>
      )}

      {(type === "SHORT" || type === "LONG") && (
        <div className="ml-11">
          <div className={`w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-sm ${type === 'LONG' ? 'h-32' : 'h-16'}`}>
            <div className="flex flex-col items-center gap-1">
               <FileText size={20} opacity={0.5} />
               <span>Student response area ({type.toLowerCase()} answer)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, className = "" }: { icon: React.ReactNode, label: string, className?: string }) {
  return (
    <div className={`flex items-center gap-2 text-sm text-slate-600 ${className}`}>
      <span className="text-slate-400">{icon}</span>
      {label}
    </div>
  );
}

function StatusMessage({ color, message, isLoading }: { color: string, message: string, isLoading?: boolean }) {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      {isLoading && <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />}
      <div className={`text-lg font-medium ${color}`}>{message}</div>
    </div>
  );
}