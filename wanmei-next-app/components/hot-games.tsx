import games from "@/data/games.json";

export function HotGames() {
  const list = games.hotGame.mobile;

  return (
    <section
      id="hot-games"
      className="max-w-[1200px] mx-auto px-4 md:px-6 py-10 md:py-16"
    >
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
        热门游戏
      </h2>
      <p className="text-sm tracking-[0.3em] text-white/40 mb-6 md:mb-10">
        TRENDING GAMES
      </p>

      {/* 2-column grid all breakpoints — matches upstream /m/ .hotgame-box li */}
      <ul className="grid grid-cols-2 gap-3 md:gap-4 list-none p-0 m-0">
        {list.map((g) => (
          <li key={g.id} className="bg-[var(--color-bg-elevated)] rounded-lg overflow-hidden">
            <a
              href={g.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              {/* Banner — aspect locked to upstream 300:220 (73.333%).
                  faceCropBottomPct scales image up from top to hide baked-in footer bars (e.g. 异环 NTE band) */}
              <div
                className="relative w-full overflow-hidden"
                style={{ paddingTop: "73.333%" }}
              >
                <img
                  src={g.faceUrl}
                  alt={g.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
                  style={
                    g.faceCropBottomPct
                      ? {
                          transformOrigin: "top center",
                          transform: `scale(${1 + g.faceCropBottomPct / (100 - g.faceCropBottomPct)})`,
                        }
                      : undefined
                  }
                />
              </div>
              {/* Caption row — attached directly under banner (upstream pattern) */}
              <div className="flex items-center gap-3 px-3 py-3 md:px-4 md:py-4">
                <img
                  src={g.icon}
                  alt=""
                  className="w-10 h-10 md:w-[52px] md:h-[52px] rounded-md shrink-0 object-cover"
                />
                <h3 className="text-white font-medium text-sm md:text-base leading-tight truncate">
                  {g.name}
                </h3>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
