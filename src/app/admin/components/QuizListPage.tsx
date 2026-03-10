"use client";

import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import QuizDrawer from "./QuizDrawer";

interface Quiz {
  id: string;
  title: string;
  total_questions: number;
  created_at: string;
}

export default function QuizListPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedQuizId, setSelectedQuizId] = useState<string | undefined>();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    const res = await fetch("/api/admin/quizzes");
    const data = await res.json();
    setQuizzes(data.quizzes || []);
  };

  const openCreate = () => {
    setMode("create");
    setSelectedQuizId(undefined);
    setDrawerOpen(true);
  };

  const openEdit = (id: string) => {
    setMode("edit");
    setSelectedQuizId(id);
    setDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this quiz?")) return;

    await fetch(`/api/admin/quizzes/${id}`, {
      method: "DELETE",
    });

    fetchQuizzes();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quiz Management</h1>

        <button
          onClick={openCreate}
          className="bg-black text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Plus size={16} /> Create Quiz
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-sm text-gray-600">
            <tr>
              <th className="p-4">Title</th>
              <th className="p-4">Questions</th>
              <th className="p-4">Created</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {quizzes.map((quiz) => (
              <tr key={quiz.id} className="border-t hover:bg-gray-50">
                <td className="p-4 font-medium">{quiz.title}</td>
                <td className="p-4">{quiz.total_questions}</td>
                <td className="p-4 text-sm text-gray-500">
                  {new Date(quiz.created_at).toLocaleDateString()}
                </td>

                <td className="p-4 flex justify-center gap-3">
                  <button
                    onClick={() => openEdit(quiz.id)}
                    className="text-blue-600"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    onClick={() => handleDelete(quiz.id)}
                    className="text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}

            {quizzes.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center p-6 text-gray-400">
                  No quizzes found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <QuizDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        mode={mode}
        quizId={selectedQuizId}
      />
    </div>
  );
}