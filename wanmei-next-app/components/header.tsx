"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import navData from "@/data/nav.json";
import { cn } from "@/lib/utils";

export function Header() {
  const [open, setOpen] = useState(false);

  // Close drawer on resize past 768px so state doesn't persist into desktop
  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 768 && open) setOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 bg-black/85 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-[1200px] mx-auto px-3 md:px-6 h-14 md:h-20 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 shrink-0">
          {/* Phase 2 will populate /images/common/nav-logo.png after asset copy */}
          <img
            src="/images/common/nav-logo.png"
            alt="完美世界游戏"
            className="h-7 md:h-9 w-auto"
          />
        </a>

        {/* Desktop primary nav */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-3">
          {navData.primary.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="px-3 py-2 text-sm text-white/90 hover:text-white transition"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop helps + language */}
        <div className="hidden md:flex items-center gap-3 text-xs text-white/70">
          <div className="hidden lg:flex items-center gap-2">
            {navData.helps.map((h) => (
              <a key={h.href} href={h.href} target="_blank" rel="noreferrer" className="hover:text-white">
                {h.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {navData.languages.map((l, i) => (
              <span key={l.code} className="flex items-center gap-1">
                <a
                  href={l.href}
                  className={cn(
                    "hover:text-white",
                    l.active && "text-white font-semibold"
                  )}
                >
                  {l.label}
                </a>
                {i < navData.languages.length - 1 && <span className="text-white/30">/</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Mobile burger */}
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden inline-flex items-center justify-center w-10 h-10 -mr-2 text-white"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden absolute top-14 inset-x-0 bg-[#0f0f0f] border-t border-white/10 max-h-[calc(100dvh-3.5rem)] overflow-y-auto">
          <nav className="flex flex-col py-2">
            {navData.primary.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="px-4 py-3 text-base text-white border-b border-white/5"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="px-4 py-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-white/80 border-t border-white/5">
            <span className="text-white/50 mr-2">自助服务</span>
            {navData.helps.map((h) => (
              <a key={h.href} href={h.href} target="_blank" rel="noreferrer">
                {h.label}
              </a>
            ))}
          </div>
          <div className="px-4 py-3 flex items-center gap-2 text-sm text-white/80 border-t border-white/5">
            {navData.languages.map((l, i) => (
              <span key={l.code} className="flex items-center gap-2">
                <a
                  href={l.href}
                  className={cn(l.active && "text-white font-semibold")}
                >
                  {l.label}
                </a>
                {i < navData.languages.length - 1 && <span className="text-white/30">/</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
