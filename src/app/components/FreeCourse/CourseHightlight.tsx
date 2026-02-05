"use client";

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

// Lucide Icons
import {
  Shield,
  Clock,
  FileBadge,
  PencilRuler,
  BanknoteArrowUp,
} from "lucide-react";

// Only DAFREE highlights
const daFreeHighlights = [
  { icon: Shield, title: "Pre-recorded", subtitle: "Training Session", color: "bg-blue-100 text-blue-600" },
  { icon: Clock, title: "Mastering Excel", subtitle: "Data Analytics Tool", color: "bg-red-100 text-red-600" },
  { icon: FileBadge, title: "1 Globally", subtitle: "Accredited Certificate", color: "bg-violet-100 text-violet-700" },
  { icon: PencilRuler, title: "Flexibility", subtitle: "Study Anytime, Anywhere", color: "bg-sky-100 text-sky-600" },
  { icon: BanknoteArrowUp, title: "Master Skills", subtitle: "Critical Thinking and Problem Solving", color: "bg-purple-100 text-purple-600" },
];

export default function CourseHighlights() {
  const highlights = daFreeHighlights;

  const breakpoints = {
    320: { slidesPerView: 1, spaceBetween: 12 },
    640: { slidesPerView: 2, spaceBetween: 16 },
    768: { slidesPerView: 3, spaceBetween: 20 },
    1024: { slidesPerView: 4, spaceBetween: 24 },
  };

  return (
    <section id="highlights" className="py-5 md:py-10 bg-white my-2 md:my-8">
      <div className="w-full xl:w-9/10 m-auto px-4 sm:px-6 lg:px-6 xl:px-4">

        {/* Title */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-medium text-gray-900 mb-4">
            What does IIM SKILLS{" "}
            <span className="text-blue-600">Free Data Analytics</span> course offer?
          </h2>
        </div>

        {/* Slider */}
        <div className="relative">
          <Swiper
            modules={[Autoplay]}
            autoplay={{ delay: 2500, disableOnInteraction: false, pauseOnMouseEnter: false }}
            loop={true}
            speed={800}
            breakpoints={breakpoints}
            className="py-2"
            onSwiper={(s) => s.autoplay?.start()}
          >
            {highlights.map((item, index) => {
              const Icon = item.icon; // dynamic icon component

              return (
                <SwiperSlide key={index}>
                  <div className="text-center md:shadow-[0_2px_4px_0_rgb(119,205,254,0.59)] p-3 md:rounded-lg border border-gray-100 border-b-2 hover:border-b-blue-600 transition-shadow mx-2 my-3 hover:shadow-[0_4px_8px_0_rgb(119,205,254,0.59)]">
                    <div className={`w-10 h-10 md:w-16 md:h-16 ${item.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <Icon className="w-6 h-6 md:w-8 md:h-8" />
                    </div>

                    <h3 className="text-gray-900 mb-2">{item.title}</h3>
                    <p className="font-light text-gray-600 text-sm">{item.subtitle}</p>
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
