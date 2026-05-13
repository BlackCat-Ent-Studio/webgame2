"use client";

import { useEffect, useRef, useState } from "react";
import type { Swiper as SwiperClass } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Controller } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import news from "@/data/news.json";

export function NewsSection() {
  const ticker = news.desktopTicker;
  const mobileFeatured = news.mobileFeatured;
  const mobileCards = news.mobileCards;
  const [bannerSwiper, setBannerSwiper] = useState<SwiperClass | null>(null);
  const [cardsSwiper, setCardsSwiper] = useState<SwiperClass | null>(null);

  // Auto-rotate mobile featured banner — banner drives the linked cards swiper
  // via Swiper Controller, so both move together
  useEffect(() => {
    const id = setInterval(() => bannerSwiper?.slideNext(), 4000);
    return () => clearInterval(id);
  }, [bannerSwiper]);

  // Swiper 11 requires slides.length > slidesPerView for loop to engage.
  // Upstream's Swiper 4 was happy with 4==4; v11 isn't, so we render the
  // ticker twice (8 entries) and map realIndex back to 0..3 for the cv_tab.
  const tickerLooped = [...ticker, ...ticker];

  const [activeIdx, setActiveIdx] = useState(0);
  const swiperRef = useRef<SwiperClass | null>(null);

  // Drive rotation manually instead of Swiper's Autoplay module — the
  // module is unreliable across Swiper 11 + React strict-mode double-mount.
  // slideNext() respects loop, so it wraps cleanly from slide 7 → 0.
  useEffect(() => {
    const id = setInterval(() => {
      swiperRef.current?.slideNext();
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="news" className="max-w-[1200px] mx-auto px-4 md:px-6 py-10 md:py-16">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
        新闻动态
      </h2>
      <p className="text-sm tracking-[0.3em] text-white/40 mb-6 md:mb-10">
        NEWS AND TRENDS
      </p>

      {/* Desktop: vendored upstream layout — cv_swiper (left) + cv_tab (right) */}
      <div className="hidden md:block news_box">
        <div className="container">
          <Swiper
            className="cv_swiper"
            direction="vertical"
            loop={true}
            slidesPerView={4}
            spaceBetween={9}
            slideToClickedSlide
            onSwiper={(s) => { swiperRef.current = s; }}
            onSlideChangeTransitionStart={(s) => setActiveIdx(s.realIndex % ticker.length)}
          >
            {tickerLooped.map((item, i) => (
              <SwiperSlide key={i}>
                <a href="#" onClick={(e) => e.preventDefault()}>
                  <img src={item.viewpic} className="games_icon" alt="" />
                  <div className="des_box">
                    <p className="tit">{item.title}</p>
                    <p className="des">{item.viceTitle}</p>
                  </div>
                </a>
              </SwiperSlide>
            ))}
          </Swiper>

          <ul className="cv_tab">
            {ticker.map((item, i) => (
              <li key={i} className={`cv_tab1 ${i === activeIdx ? "on" : ""}`}>
                <a href="#" onClick={(e) => e.preventDefault()}>
                  <img src={item.bigpic} alt={item.title} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Mobile: featured banner Swiper carousel + card list — 1:1 upstream /m/ AD2 */}
      <div className="md:hidden space-y-4">
        <Swiper
          modules={[Pagination, Controller]}
          loop={mobileFeatured.length > 1}
          pagination={{ clickable: true }}
          slidesPerView={1}
          onSwiper={setBannerSwiper}
          controller={{ control: cardsSwiper }}
          className="rounded-lg overflow-hidden ring-1 ring-white/5 aspect-[640/390] mobile-news-swiper"
        >
          {mobileFeatured.map((slide, i) => (
            <SwiperSlide key={i}>
              <a
                href={slide.link}
                target="_blank"
                rel="noreferrer"
                className="block w-full h-full"
              >
                <img
                  src={slide.bigpic}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </a>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Mobile news cards — one card at a time, linked to the banner swiper above */}
        <Swiper
          modules={[Controller]}
          loop={mobileCards.length > 1}
          slidesPerView={1}
          spaceBetween={12}
          onSwiper={setCardsSwiper}
          controller={{ control: bannerSwiper }}
          className="mobile-news-cards-swiper"
        >
          {mobileCards.map((card, i) => (
            <SwiperSlide key={i}>
              <a
                href={card.link}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg bg-[#11141a] ring-1 ring-white/5 hover:bg-white/5"
              >
                <img
                  src={card.icon}
                  alt=""
                  className="w-12 h-12 rounded object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold leading-tight truncate">
                    {card.title}
                  </p>
                  <p className="text-white/50 text-xs mt-0.5 truncate">
                    {card.viceTitle}
                  </p>
                </div>
              </a>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
