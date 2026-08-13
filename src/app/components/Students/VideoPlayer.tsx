// components/Students/VideoPlayer.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";

type VideoPlayerProps = {
  userKey: string;
  courseId: string;
  videoId: string | number;
  src: string;
  resumeAt?: number;
  autoplay?: boolean;
  onProgress?: (positionSeconds: number, completed?: boolean) => void;
  className?: string;
};

export default function VideoPlayer({
  userKey,
  courseId,
  videoId,
  src,
  resumeAt = 0,
  autoplay = false,
  onProgress,
  className,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [maxWatchedTime, setMaxWatchedTime] = useState<number>(resumeAt);
  const [lastSavedTime, setLastSavedTime] = useState<number>(resumeAt);

  const SAVE_INTERVAL = 8; // seconds
  const MIN_VALID_TIME = 2; // do not save <= 1s

  /* ================= Resume / loadedmetadata ================= */
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const onLoaded = () => {
      try {
        if (resumeAt > MIN_VALID_TIME) {
          el.currentTime = Math.min(resumeAt, Math.floor(el.duration || resumeAt));
          setMaxWatchedTime(Math.floor(resumeAt));
          setLastSavedTime(Math.floor(resumeAt));
        }
        if (autoplay) {
          el.play().catch(() => {});
        }
      } catch {
        // ignore
      }
    };

    el.addEventListener("loadedmetadata", onLoaded, { once: true });
    return () => el.removeEventListener("loadedmetadata", onLoaded);
  }, [resumeAt, autoplay]);

  /* ================= Save progress to API + callback ================= */
  const saveProgress = async (time: number, completed = false) => {
    if (time <= MIN_VALID_TIME) return;

    try {
      // POST to your existing backend
      await fetch("/api/courseApi/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userKey,
          courseId,
          videoId,
          positionSeconds: Math.floor(time),
          completed,
        }),
      });
      setLastSavedTime(Math.floor(time));
      onProgress?.(Math.floor(time), completed);
    } catch (err) {
      // best-effort; do not crash player for network errors
      console.warn("[VideoPlayer] failed to save progress", err);
    }
  };

  /* ================= Track watching and periodic saves ================= */
  const handleTimeUpdate = () => {
    const el = videoRef.current;
    if (!el) return;
    const current = Math.floor(el.currentTime || 0);

    if (current > maxWatchedTime) {
      setMaxWatchedTime(current);
    }

    if (current - lastSavedTime >= SAVE_INTERVAL) {
      saveProgress(current, false);
    }
  };

  /* ================= Block forward seeking beyond watched ================= */
  const handleSeeking = () => {
    const el = videoRef.current;
    if (!el) return;

    // if user attempts to seek beyond maxWatchedTime (plus tiny slack), revert
    if (el.currentTime > maxWatchedTime + 1) {
      // jump back to max watched time
      el.currentTime = maxWatchedTime;
    }
  };

  /* ================= On ended ================= */
  const handleEnded = () => {
    const el = videoRef.current;
    if (!el) return;
    const dur = Math.floor(el.duration || 0);
    saveProgress(dur, true);
  };

  /* ================= Save on page close using sendBeacon ================= */
  useEffect(() => {
    const handleBeforeUnload = () => {
      const el = videoRef.current;
      if (!el) return;
      const current = Math.floor(el.currentTime || 0);
      if (current > MIN_VALID_TIME) {
        try {
          const url = "/api/courseApi/progress";
          const payload = {
            userKey,
            courseId,
            videoId,
            positionSeconds: current,
            completed: false,
          };
          const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
          if (navigator.sendBeacon) {
            navigator.sendBeacon(url, blob);
          } else {
            // fallback: small synchronous XHR (rare)
            const xhr = new XMLHttpRequest();
            xhr.open("POST", url, false);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(JSON.stringify(payload));
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") handleBeforeUnload();
    });

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [userKey, courseId, videoId]);

  return (
    <video
      ref={videoRef}
      src={src}
      controls
      controlsList="nodownload noplaybackrate"
      disablePictureInPicture
      onContextMenu={(e) => e.preventDefault()}
      className={className}
      onTimeUpdate={handleTimeUpdate}
      onSeeking={handleSeeking}
      onEnded={handleEnded}
    />
  );
}