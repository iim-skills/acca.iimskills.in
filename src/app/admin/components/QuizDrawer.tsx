"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import QuizCreator from "../quizzes/create/page";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  quizId?: string;
}

export default function QuizDrawer({
  isOpen,
  onClose,
  mode,
  quizId,
}: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            className="fixed left-0 top-0 h-full w-[700px] bg-white z-50 shadow-xl overflow-y-auto"
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">
                {mode === "create" ? "Create Quiz" : "Edit Quiz"}
              </h2>

              <button onClick={onClose}>
                <X />
              </button>
            </div>

            <div className="p-4">
              <QuizCreator />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}