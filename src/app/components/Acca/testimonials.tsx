"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  PlayCircle,
  Youtube,
  Linkedin,
  ArrowRight,
  Quote,
} from "lucide-react";
import Link from "next/link";
import MultiModalPopup from "@/components/props/MultiModalPopup";

// --- CUSTOM ANIMATIONS ---
const customStyles = `
  @keyframes scroll-vertical { 
    0% { transform: translateY(0); } 
    100% { transform: translateY(-50%); } 
  }
  .animate-scroll-vertical { 
    animation: scroll-vertical 60s linear infinite; 
  }
  .pause-on-hover:hover .animate-scroll-vertical { 
    animation-play-state: paused; 
  }
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

/* --------------------------
  ModalPortal helper
  - Appends a fixed full-screen container to document.body
  - Renders children centered with a backdrop
  - Clicking backdrop will call onClose
---------------------------*/
function ModalPortal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const elRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // create container once
    if (!elRef.current) {
      elRef.current = document.createElement("div");
    }
    const el = elRef.current!;
    document.body.appendChild(el);
    return () => {
      // cleanup
      if (el && el.parentNode) el.parentNode.removeChild(el);
    };
  }, []);

  if (!elRef.current) return null;

  // Portal markup: full-screen overlay + centered content container
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* content holder - prevent backdrop clicks from closing when clicking modal content */}
      <div
        className="relative z-10 w-full max-w-3xl mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    elRef.current
  );
}

// --- DATA & TYPES ---
interface Testimonial {
  id: number;
  name: string;
  role: string;
  tag: string;
  quote: string;
  fullStory: string;
  videoThumbnailColor: string;
  youtubeUrl?: string;
  thumbnailUrl?: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Akshita",
    role: "Credit Analyst",
    tag: "Data Analytics",
    quote: "I got to develop great insights and was able to learn about the real world of finance.",
    fullStory:
      "I took a financial modeling workshop by Varun Sir. It was a 4-day workshop & I got to develop great insights into the technicals of financial modeling. His way of teaching & interacting with students has helped me in building great interest into this concept.  All in all this workshop has really helped me learn about the real world of finance, and I would highly recommend this course to everyone.",
    videoThumbnailColor: "bg-blue-100",
    youtubeUrl: "/FMMC/videos/akshita.mp4",
    thumbnailUrl: "/FMMC/videos/akshita-thumbnail.png",
  },
  {
    id: 2,
    name: "Amisha",
    role: "Financial Analyst",
    tag: "Business Intelligence",
    quote: "The internship program and course structure are highly impressive.",
    fullStory:
      "I recently joined IIM SKILLS to learn financial modeling. I must say the course is very well planned. My mentor Varun is very supportive, and we are getting good internship support. I strongly recommend IIM SKILLS.",
    videoThumbnailColor: "bg-orange-100",
    youtubeUrl: "/FMMC/videos/amisha.mp4",
    thumbnailUrl: "/FMMC/videos/amisha-thumbnail.png",
  },
  {
    id: 3,
    name: "Mannat",
    role: "Finance Consolidation",
    tag: "Data Science",
    quote: "The course is well-planned with good placement support.",
    fullStory:
      "I must say the course is very well planned. My faculty, Varun, is extremely supportive, and we are getting good placement support, so I would strongly recommend IIM SKILLS to everybody so they can learn financial modeling course.",
    videoThumbnailColor: "bg-green-100",
    youtubeUrl: "/FMMC/videos/mannat.mp4",
    thumbnailUrl: "/FMMC/videos/mannat-thumbnail.png",
  },
  {
    id: 4,
    name: "Manish Karn",
    role: "Financial Analyst",
    tag: "Data Analytics",
    quote: "Pursuing this course was the best decision for my career growth",
    fullStory:
      "After so much research, I decided to join IIM SKILLS. I was really nervous, but after joining the course, I realized this is the best decision I have taken in my career. I really like the structure of the course - very easy to learn and grasp. Last but not least, our Varun sir, who will help you learn everything in a very sorted manner. So I am feeling kind of blessed and very hopeful to apply these learnings in the real world.",
    videoThumbnailColor: "bg-purple-100",
    youtubeUrl: "/FMMC/videos/manish.mp4",
    thumbnailUrl: "/FMMC/videos/manish-thumbnail.png",
  },
];

// --- CLASSNAME SHORTHANDS ---
const cardBase =
  "w-full bg-white rounded-xl shadow-sm p-4 border-2 cursor-pointer transition-all duration-300 flex flex-col justify-between mb-4 hover:shadow-md";
const cardActive = "border-orange-400 ring-1 ring-orange-100 bg-orange-50/10";
const cardIdle = "border-gray-100 hover:border-blue-200";

// --- Helpers ---
const isYouTubeUrl = (url?: string) => {
  if (!url) return false;
  return /youtube\.com\/watch|youtu\.be\//.test(url);
};
const isLocalFile = (url?: string) => {
  if (!url) return false;
  return url.startsWith("/");
};
const extractYouTubeId = (url: string) => {
  try {
    if (url.includes("watch?v=")) return url.split("watch?v=")[1].split("&")[0];
    if (url.includes("youtu.be/")) return url.split("youtu.be/")[1].split("?")[0];
    return url;
  } catch {
    return url;
  }
};
const getThumbnailUrl = (url?: string) => {
  if (!url) return null;
  if (isYouTubeUrl(url)) {
    const id = extractYouTubeId(url);
    return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  }
  if (isLocalFile(url)) {
    // try replacing extension with .jpg (fallback). Make sure server has the image.
    return url.replace(/\.(mp4|webm|mov)(\?.*)?$/i, ".jpg");
  }
  return null;
};

// --- MAIN COMPONENT ---
export default function TestimonialSection() {
  const [activeTestimonial, setActiveTestimonial] = useState<Testimonial>(testimonials[0]);
  const [isPaused, setIsPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // YouTube player reference (YT.Player)
  const playerRef = useRef<any>(null);
  // optional container ref
  const ytContainerRef = useRef<HTMLDivElement | null>(null);

  const [activeModal, setActiveModal] = useState<"ACCA" | null>(null);
  const [customTitle, setCustomTitle] = useState("Download Course Brochure");
  const [customDescription, setCustomDescription] = useState(
    "Get complete details about the program."
  );

  const currentIsLocal = isLocalFile(activeTestimonial.youtubeUrl);
  const currentIsYouTube = isYouTubeUrl(activeTestimonial.youtubeUrl);

  const activeIndex = testimonials.findIndex((t) => t.id === activeTestimonial.id);
  const showVideo = isLocalFile(activeTestimonial.youtubeUrl) || currentIsYouTube; // first three tabs show video

  // Stop / reset when testimonial changes
  useEffect(() => {
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      } catch {}
    }
    if (playerRef.current && typeof playerRef.current.pauseVideo === "function") {
      try {
        playerRef.current.pauseVideo();
      } catch {}
    }
    setIsPlaying(false);
  }, [activeTestimonial]);

  // Auto-rotation logic (7 seconds) - stops while playing
  useEffect(() => {
    if (isPlaying) return;
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => {
        const currentIndex = testimonials.findIndex((t) => t.id === prev.id);
        const nextIndex = (currentIndex + 1) % testimonials.length;
        return testimonials[nextIndex];
      });
    }, 7000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // YouTube API loader + player creation (only when needed)
  useEffect(() => {
    if (!showVideo || !currentIsYouTube) return;

    const videoId = extractYouTubeId(activeTestimonial.youtubeUrl || "");

    const mountPlayer = () => {
      // skip if same video
      try {
        if (
          playerRef.current &&
          playerRef.current.getVideoData &&
          playerRef.current.getVideoData().video_id === videoId
        ) {
          return;
        }
      } catch {}

      try {
        if (playerRef.current && typeof playerRef.current.destroy === "function") {
          playerRef.current.destroy();
          playerRef.current = null;
        }
      } catch {}

      const YT = (window as any).YT;
      if (!YT || !YT.Player) return;

      playerRef.current = new YT.Player(`yt-player-${activeTestimonial.id}`, {
        height: "100%",
        width: "100%",
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onStateChange: (e: any) => {
            if (e.data === 1) setIsPlaying(true);
            if (e.data === 2 || e.data === 0) setIsPlaying(false);
          },
        },
      });
    };

    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

      (window as any).onYouTubeIframeAPIReady = () => {
        mountPlayer();
      };
    } else {
      mountPlayer();
    }

    return () => {
      try {
        if (playerRef.current && typeof playerRef.current.destroy === "function") {
          playerRef.current.destroy();
          playerRef.current = null;
        }
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTestimonial.id, activeTestimonial.youtubeUrl, showVideo, currentIsYouTube]);

  // Toggle play (handles both local video and youtube player)
  const togglePlay = async () => {
    if (showVideo && currentIsLocal) {
      const v = videoRef.current;
      if (!v) return;
      try {
        if (v.paused) {
          await v.play();
          setIsPlaying(true);
        } else {
          v.pause();
          setIsPlaying(false);
        }
      } catch {
        setIsPlaying(!v?.paused);
      }
      return;
    }

    if (showVideo && currentIsYouTube) {
      const p = playerRef.current;
      if (!p) {
        const url = activeTestimonial.youtubeUrl;
        if (url) window.open(url, "_blank", "noopener");
        return;
      }
      const state = p.getPlayerState?.();
      if (state !== 1) {
        p.playVideo?.();
        setIsPlaying(true);
      } else {
        p.pauseVideo?.();
        setIsPlaying(false);
      }
      return;
    }

    // fallback for thumbnail clicks
    if (activeTestimonial.youtubeUrl) {
      window.open(activeTestimonial.youtubeUrl, "_blank", "noopener");
    }
  };

  return (
    <section id="alumni-stats" className="font-sans text-gray-800 bg-slate-50 py-10 relative overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-orange-600 font-bold tracking-widest text-sm uppercase mb-3">
            Student Success Stories
          </h2>
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-6 relative z-10">
            Hear from Our{" "}
            <span className="text-blue-700 relative inline-block">
              Alumni
              <svg
                className="absolute w-full h-3 -bottom-1 left-0 text-yellow-400 opacity-60"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
              >
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none" />
              </svg>
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[100%] md:h-[600px]">
          <div
            className="lg:col-span-4 relative h-full bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden shadow-inner group"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-gray-50 to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-gray-50 to-transparent z-10 pointer-events-none" />

            <div className="h-[300px] md:h-full overflow-hidden pause-on-hover px-4 py-4">
              <div className="animate-scroll-vertical">
                {[...testimonials, ...testimonials, ...testimonials].map((t, idx) => {
                  const isActive = t.id === activeTestimonial.id;
                  return (
                    <div
                      key={`list-${t.id}-${idx}`}
                      onClick={() => {
                        setActiveTestimonial(t);
                        setIsPlaying(false);
                      }}
                      className={`${cardBase} ${isActive ? cardActive : cardIdle}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative w-12 h-12 flex-shrink-0">
                          <div className="w-full h-full rounded-full bg-gray-100 overflow-hidden border border-gray-200 relative">
                            <div className={`w-full h-full ${t.videoThumbnailColor} opacity-50`} />
                            {t.thumbnailUrl ? (
                              // if an explicit image URL exists show the image (cover)
                              <img
                                src={t.thumbnailUrl}
                                alt={t.name}
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                            ) : (
                              // fallback: first initial
                              <span className="absolute inset-0 flex items-center justify-center text-gray-600 font-bold text-sm">
                                {t.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          {isActive && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full transition-all duration-300 animate-pulse" />
                          )}
                        </div>

                        <div className="flex-grow min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="text-sm font-bold text-gray-900 truncate">{t.name}</h4>
                          </div>
                          <p className="text-xs text-gray-600 italic line-clamp-2 leading-snug opacity-80">"{t.quote}"</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 flex flex-col md:flex-row gap-8 items-start h-full">
            <div className="relative flex-shrink-0 w-full h-[250px] md:w-[320px] md:h-[550px] bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border-4 border-white self-center transition-all duration-500">
              <div className={`absolute inset-0 ${activeTestimonial.videoThumbnailColor} opacity-20`} />

              {/* --- Local video (mp4) --- */}
              {showVideo && currentIsLocal && (
                <div className="relative w-full h-full group/video">
                  <video
                    ref={videoRef}
                    src={activeTestimonial.youtubeUrl}
                    controls={false}
                    playsInline
                    controlsList="nodownload noremoteplayback"
                    className="w-full h-full object-contain sm:object-cover bg-black"
                    onClick={togglePlay}
                    onEnded={() => {
                      setIsPlaying(false);
                    }}
                  />

                  {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity duration-300">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlay();
                        }}
                        className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform duration-200"
                      >
                        <PlayCircle className="w-8 h-8 text-white ml-1" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* --- YouTube embedded (controlled via API) --- */}
              {showVideo && currentIsYouTube && (
                <div
                  ref={ytContainerRef}
                  className="relative w-full h-full group/video"
                  style={{ minHeight: 0 }}
                  onClick={(e) => {
                    e.preventDefault();
                    togglePlay();
                  }}
                >
                  {/* Player mount point */}
                  <div id={`yt-player-${activeTestimonial.id}`} className="w-full h-full" />

                  {/* Play overlay */}
                  {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity duration-300 pointer-events-none">
                      <div className="pointer-events-auto">
                        <button
                          onClick={(ev) => {
                            ev.stopPropagation();
                            togglePlay();
                          }}
                          className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform duration-200"
                        >
                          <PlayCircle className="w-8 h-8 text-white ml-0.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* --- IMAGE / THUMBNAIL VIEW for indices >= 3 --- */}
              {!showVideo && (
                <div
                  className="w-full h-full relative flex items-center justify-center bg-gray-800 cursor-pointer"
                  onClick={() => {
                    if (activeTestimonial.youtubeUrl) window.open(activeTestimonial.youtubeUrl, "_blank", "noopener");
                  }}
                >
                  {(() => {
                    const thumb = getThumbnailUrl(activeTestimonial.youtubeUrl);
                    if (thumb) {
                      return (
                        <img
                          src={thumb}
                          alt={`${activeTestimonial.name} thumbnail`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      );
                    }
                    // fallback placeholder (initial in colored box)
                    return (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className={`w-48 h-48 rounded-lg flex items-center justify-center ${activeTestimonial.videoThumbnailColor}`}>
                          <span className="text-4xl font-bold text-white">{activeTestimonial.name.charAt(0)}</span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 to-transparent p-6 pt-20 text-white">
                    <h3 className="text-2xl font-bold">{activeTestimonial.name}</h3>
                    <p className="text-sm font-medium opacity-90">{activeTestimonial.role}</p>
                  </div>
                </div>
              )}

              {/* bottom meta for video */}
              {showVideo && (
                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 to-transparent p-6 pt-20 text-white pointer-events-none">
                  <h3 className="text-2xl font-bold transition-all duration-300">{activeTestimonial.name}</h3>
                  <p className="text-sm font-medium opacity-90">{activeTestimonial.role}</p>
                </div>
              )}

              {/* Timer Bar Indicator - Independent of Hover */}
              {!isPlaying && (
                <div
                  className="absolute top-0 left-0 h-1 bg-orange-500 w-full"
                  style={{ width: "0%", animation: "progress 7s linear infinite" }}
                />
              )}
              <style>{`
                @keyframes progress {
                  from { width: 0%; }
                  to { width: 100%; }
                }
              `}</style>
            </div>

            <div className="flex-grow flex flex-col justify-center h-full py-4 animate-fade-in">
              <div className="mb-6 text-center md:text-left">
                <span className="inline-flex items-center justify-center md:justify-start gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
                  <Linkedin className="w-3 h-3" /> Verified Alumni
                </span>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 transition-all text-center md:text-left duration-300">{activeTestimonial.name}</h3>
                <div className="flex justify-center md:justify-start gap-2 text-gray-500 font-medium">
                </div>
              </div>

              <div className="relative mb-8 pl-6 border-l-4 border-orange-200">
                <Quote className="absolute -top-3 -left-2 w-6 h-6 text-orange-200 bg-white" />
                <p className="text-[16px] md:text-xl text-gray-800 font-medium italic leading-relaxed transition-opacity duration-300">
                  "{activeTestimonial.quote}"
                </p>
              </div>

              <p className="text-gray-600 leading-relaxed mb-8 text-[14px] md:text-base transition-opacity duration-300">
                {activeTestimonial.fullStory}
              </p>

              <div className="mt-auto flex justify-center">
                <button
                  onClick={() => {
                    setActiveModal("ACCA");
                    setCustomTitle("Download Course Brochure");
                    setCustomDescription("Get Complete Details about the Program.");
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all transform hover:-translate-y-1 flex items-center gap-2 w-fit"
                >
                  Start Your Journey <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Previously you rendered MultiModalPopup inline — now we render it in a portal so it centers on the page */}
              {activeModal && (
                <ModalPortal onClose={() => setActiveModal(null)}>
                  <MultiModalPopup
                    activeModal={activeModal}
                    setActiveModal={(key) => {
                      if (key === "ACCA" || key === null) setActiveModal(key);
                    }}
                    customTitle={customTitle}
                    customDescription={customDescription}
                  />
                </ModalPortal>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
