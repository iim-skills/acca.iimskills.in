// hooks/useImageResize.ts
"use client";

import { useEffect, useRef, useState } from "react";

type ResizeState = {
  startX: number;
  startY: number;
  startW: number;
  startH: number;
  startContainerWidth?: number;
  pointerId?: number;
};

/**
 * useImageResize
 * Keeps all pointer / resize logic in one reusable hook.
 * - previewRef: container element that holds the preview HTML
 * - getSelectedImage: a function that must return the currently selected <img> element (or null)
 * - updateHandlePosition: callback to reposition handle/delete UI
 * - setForm: setter to update post content (so resized width persists)
 */
export function useImageResize(
  previewRef: React.RefObject<HTMLElement | null>,
  getSelectedImage: () => HTMLImageElement | null,
  updateHandlePosition: () => void,
  setForm: React.Dispatch<React.SetStateAction<any>>
) {
  const [isResizing, setIsResizing] = useState(false);
  const resizingState = useRef<ResizeState | null>(null);

  const startResize = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const selectedImage = getSelectedImage();
    if (!selectedImage || !previewRef.current) return;

    // actual rendered pixel width of image and container width
    const imgRect = selectedImage.getBoundingClientRect();
    const containerW = previewRef.current.getBoundingClientRect().width || previewRef.current.clientWidth || imgRect.width;

    resizingState.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: Math.round(imgRect.width),
      startH: Math.round(imgRect.height),
      startContainerWidth: Math.round(containerW),
      pointerId: e.pointerId,
    };

    try {
      if (e.currentTarget && typeof (e.currentTarget as Element).setPointerCapture === "function") {
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
      }
    } catch {}

    setIsResizing(true);
  };

  useEffect(() => {
    const onPointerMove = (ev: PointerEvent) => {
      if (!isResizing || !previewRef.current || !resizingState.current) return;
      ev.preventDefault();

      const selectedImage = getSelectedImage();
      if (!selectedImage) return;

      const state = resizingState.current as ResizeState;
      const deltaX = ev.clientX - state.startX;

      // compute new width in px and then convert to percent of container
      const containerW = previewRef.current.getBoundingClientRect().width || state.startContainerWidth || state.startW;
      const newWPx = Math.max(8, Math.round(state.startW + deltaX)); // px

      let newWPercent = Math.round((newWPx / Math.max(1, containerW)) * 100);
      newWPercent = Math.max(1, Math.min(100, newWPercent));

      // apply percent width & keep aspect ratio
      selectedImage.style.maxWidth = "100%";
      selectedImage.style.width = `${newWPercent}%`;
      selectedImage.style.height = "auto";

      // sync DOM -> state so saves capture the percent width
      if (previewRef.current) {
        setForm((p: any) => ({ ...p, content: previewRef.current!.innerHTML }));
      }

      // reposition handle/delete while dragging
      updateHandlePosition();
    };

    const onPointerUp = () => {
      if (!isResizing) return;
      setIsResizing(false);
      try {
        const pid = resizingState.current?.pointerId;
        // nothing to release here — if capture was set, releasing is optional
      } catch {}
      resizingState.current = null;
    };

    if (isResizing) {
      document.addEventListener("pointermove", onPointerMove, { passive: false });
      document.addEventListener("pointerup", onPointerUp);
    }
    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
    };
  }, [isResizing, previewRef, getSelectedImage, updateHandlePosition, setForm]);

  return { startResize, isResizing } as const;
}
 