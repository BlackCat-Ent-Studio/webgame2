import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HeroCarousel } from "@/components/hero-carousel";
import { NewsSection } from "@/components/news-section";
import { BrandBusiness } from "@/components/brand-business";
import { HotGames } from "@/components/hot-games";
import { OfficialCommunity } from "@/components/official-community";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <HeroCarousel />
        <NewsSection />
        <BrandBusiness />
        <HotGames />
        <OfficialCommunity />
      </main>
      <Footer />
    </>
  );
}
