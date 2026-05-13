"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Thumbs } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { useState } from "react";
import slides from "@/data/heroSlides.json";

import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/thumbs";

export function HeroCarousel() {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);

  return (
    <section className="relative w-full bg-black">
      <Swiper
        modules={[Autoplay, EffectFade, Thumbs]}
        slidesPerView={1}
        loop
        effect="fade"
        autoplay={{ delay: 4500, disableOnInteraction: false }}
        thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
        className="w-full"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div className="relative w-full">
              <picture>
                <source media="(max-width: 767px)" srcSet={slide.imageMobile} />
                <img
                  src={slide.imageDesktop}
                  alt={slide.title}
                  className="w-full h-auto block object-cover"
                />
              </picture>

              {/* Desktop overlay — 1:1 upstream AD3 .product_info1.product_info2
                  Upstream sizes (1920 design): icon 102, title 48, viceTitle 42, mlink 16, CTA 145x45 */}
              <div className="hidden md:flex absolute right-[6vw] top-1/2 -translate-y-1/2 flex-col items-start gap-4 max-w-[480px] lg:max-w-[506px] z-10">
                <img
                  src={slide.thumb}
                  alt=""
                  className="w-24 md:w-20 lg:w-[102px] xl:w-[110px] aspect-square rounded-md"
                />
                <div>
                  <p className="text-4xl md:text-4xl lg:text-5xl xl:text-[48px] font-bold text-white leading-tight">
                    {slide.title}
                  </p>
                  <span className="block text-2xl md:text-2xl lg:text-4xl xl:text-[42px] text-white mt-2 leading-tight">
                    {slide.viceTitle}
                  </span>
                </div>
                <div className="h-px w-[200px] lg:w-[343px] bg-[var(--color-accent-gold)]/60" />
                {slide.mlink && (
                  <p className="text-base lg:text-base text-white/90">{slide.mlink}</p>
                )}
                <a
                  href={slide.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block px-7 py-2.5 lg:px-8 lg:py-3 rounded-full bg-[var(--color-accent-red)] hover:bg-[var(--color-accent-red-bright)] text-white text-base lg:text-lg font-medium transition"
                >
                  查看详情 »
                </a>
              </div>

              {/* Mobile overlay — 1:1 upstream AD4 .product_info1.product_info8
                  Upstream sizes (750 design @ viewport scale 0.5): title 48 (~24 effective), viceTitle 42 (~21 effective) */}
              <div className="flex md:hidden absolute right-[7%] bottom-[20%] flex-col items-end gap-2 max-w-[70%] z-10 text-right">
                <p className="text-3xl font-bold text-white drop-shadow-md leading-tight">
                  {slide.title}
                </p>
                <span className="text-xl text-white drop-shadow-md leading-tight">
                  {slide.viceTitle}
                </span>
                <a
                  href={slide.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block px-5 py-2 rounded-full bg-[var(--color-accent-red)] text-white text-sm font-medium mt-2"
                >
                  查看详情 »
                </a>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Thumbnail strip */}
      <div className="absolute bottom-3 md:bottom-6 left-0 right-0 z-10 pointer-events-none">
        <div className="max-w-[720px] mx-auto px-4">
          <Swiper
            modules={[Thumbs]}
            onSwiper={setThumbsSwiper}
            slidesPerView={5}
            spaceBetween={12}
            watchSlidesProgress
            className="pointer-events-auto"
          >
            {slides.map((slide) => (
              <SwiperSlide
                key={slide.id}
                className="!w-14 md:!w-24 cursor-pointer"
              >
                <div className="aspect-square overflow-hidden rounded-xl ring-2 ring-white/30 hover:ring-white/60 transition">
                  <img
                    src={slide.thumb || slide.imageMobile}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
