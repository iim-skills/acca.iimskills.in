// components/ExampleVideoPlayer.tsx
"use client";

import React, { useEffect, useRef } from "react";

export default function ExampleVideoPlayer({
  src,
  globalIndex,
  resumeAt = 0,
  autoplay = false,
  reportProgress,
  onEndedCallback,
}: {
  src: string;
  globalIndex: number;
  resumeAt?: number;
  autoplay?: boolean;
  reportProgress: (globalIndex: number, positionSeconds: number, completed?: boolean) => void;
  onEndedCallback?: (globalIndex: number) => void;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const lastSavedRef = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // set resume and optionally autoplay
    el.currentTime = Math.max(0, resumeAt);
    if (autoplay) {
      // try to play; modern browsers sometimes block autoplay without user gesture
      el.play().catch((e) => {
        console.warn("[ExampleVideoPlayer] autoplay blocked:", e);
      });
    }
  }, [src, resumeAt, autoplay]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onTime = () => {
      const now = Math.floor(el.currentTime || 0);
      if (Math.abs(now - lastSavedRef.current) >= 5) {
        lastSavedRef.current = now;
        console.log("[ExampleVideoPlayer] reportProgress", { globalIndex, now });
        reportProgress(globalIndex, now, false);
      }
    };

    const onEnded = () => {
      const dur = Math.floor(el.duration || 0);
      console.log("[ExampleVideoPlayer] ended", { globalIndex, dur });
      reportProgress(globalIndex, dur, true);
      if (onEndedCallback) onEndedCallback(globalIndex);
    };

    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnded);
    };
  }, [reportProgress, globalIndex, onEndedCallback]);

  return (
    <div className="w-full">
      <video ref={ref} src={src} controls style={{ width: "100%", borderRadius: 8 }} />
    </div>
  );
}
