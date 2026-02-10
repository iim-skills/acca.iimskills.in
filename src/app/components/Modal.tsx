// components/Modal.tsx
import React, { useEffect } from "react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
};

export default function Modal({ isOpen, onClose, children, ariaLabel = "Modal window" }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* modal box */}
      <div
        role="dialog"
        aria-label={ariaLabel}
        aria-modal="true"
        className="relative z-10 w-full max-w-xl overflow-hidden bg-white rounded-2xl shadow-2xl"
      >
        {/* close */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 text-xl font-bold text-slate-500 hover:text-black"
        >
          ✕
        </button>

        <div className="p-0 relative">{children}</div>
      </div>
    </div>
  );
}
