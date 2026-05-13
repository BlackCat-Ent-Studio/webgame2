import community from "@/data/community.json";

export function OfficialCommunity() {
  return (
    <section className="max-w-[1200px] mx-auto px-4 md:px-6 py-10 md:py-16">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
        官方社区
      </h2>
      <p className="text-sm tracking-[0.3em] text-white/40 mb-6 md:mb-10">
        OFFICIAL GROUPS
      </p>

      <ul className="flex flex-row items-start justify-center gap-8 md:gap-16 list-none p-0 m-0">
        {community.map((c) => (
          <li key={c.id} className="flex flex-col items-center gap-2 md:gap-3">
            <a
              href={c.link}
              target={c.link.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className="w-14 h-14 md:w-20 md:h-20 rounded-full overflow-hidden bg-[#39434d] flex items-center justify-center hover:opacity-90 transition"
            >
              <img
                src={c.icon}
                alt={c.label}
                className="w-7 h-7 md:w-10 md:h-10 object-contain"
              />
            </a>
            <span className="text-xs md:text-sm text-white/80">{c.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
