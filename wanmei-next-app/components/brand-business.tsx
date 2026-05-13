import brands from "@/data/brands.json";

export function BrandBusiness() {
  return (
    <section className="max-w-[1200px] mx-auto px-4 md:px-6 py-10 md:py-16">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
        品牌业务
      </h2>
      <p className="text-sm tracking-[0.3em] text-white/40 mb-6 md:mb-10">
        BUSINESS
      </p>

      <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 list-none p-0 m-0">
        {brands.map((b) => (
          <li key={b.id}>
            <a
              href={b.link}
              className="relative block aspect-[328/350] md:aspect-[240/374] rounded-lg overflow-hidden group"
            >
              <picture>
                <source media="(max-width: 767px)" srcSet={b.imageMobile} />
                <img
                  src={b.image}
                  alt={b.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </picture>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
