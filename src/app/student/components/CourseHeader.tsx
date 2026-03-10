// src/components/CourseHeader.tsx
"use client";

import React from "react";
import { BookOpen, Video } from "lucide-react";
import BookingApp from "@/components/MentorsMeetForm";
import Modal from "@/components/Modal";

type Props = {
  courseName?: string;
  courseDescription?: string;
  modulesCount?: number;
  allowedModules?: string[];
  isFreeLoggedIn?: boolean;
  onBookMeet?: () => void;
  onUpgrade?: () => void;
  meetModalOpen?: boolean;
  setMeetModalOpen?: (v: boolean) => void;
};

export default function CourseHeader({
  courseName,
  courseDescription,
  modulesCount = 0,
  allowedModules = [],
  isFreeLoggedIn = false,
  onBookMeet,
  onUpgrade,
  meetModalOpen,
  setMeetModalOpen,
}: Props) {
  return (
    <div className="p-4 border-b border-gray-100 bg-white border-indigo-100 shadow-md ring-1 ring-indigo-50">
      <h2 className="text-2xl font-black text-slate-900 leading-tight mb-2">{courseName}</h2>
      <p className="text-xs text-gray-500 mt-1">{courseDescription}</p>

      <div className="flex flex-col justify-start gap-4 mt-3">
        <div className="flex flex-row gap-4 items-center">
          <span className="text-[14px] font-medium text-gray-500 flex items-center gap-1">
            <BookOpen size={14} className="text-blue-400" /> {modulesCount} Modules
          </span>
          <span className="text-[14px] font-medium text-gray-500 flex items-center gap-1">
            <Video size={14} className="text-blue-400" /> Video Lessons
          </span>
        </div>

        {Boolean(allowedModules && allowedModules.length > 0) && (
          <div className="">
            <button
              onClick={onBookMeet}
              type="button"
              className="w-full mt-6 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 group"
            >
              Book A meet with mentors
            </button>
          </div>
        )}

        {isFreeLoggedIn && (!allowedModules || allowedModules.length === 0) && (
          <div className="ml-auto">
            <button
              onClick={onUpgrade}
              type="button"
              className="px-3 py-2 bg-amber-500 text-white text-sm font-semibold rounded-md hover:bg-amber-600 focus:outline-none"
            >
              Upgrade your Access
            </button>
          </div>
        )}
      </div>

      <Modal isOpen={meetModalOpen ?? false} onClose={() => setMeetModalOpen && setMeetModalOpen(false)}>
        <BookingApp onSuccess={() => setMeetModalOpen && setMeetModalOpen(false)} />
      </Modal>
    </div>
  );
}