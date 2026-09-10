import HeroSlider from "../../components/home/HeroSlider";
import FloatingWhatsapp from "../../components/FloatingWhatsapp";
import PropertySearch from "../../components/home/PropertySearch";
import FeaturedProperties from "../../components/home/FeaturedProperties";
import AboutTeaser from "../../components/home/AboutTeaser";
import { getFeaturedProperties } from "../../lib/properties";

export default async function HomePage() {
  const featured = await getFeaturedProperties({ limit: 3 });

  return (
    <>
      <HeroSlider />
      <FloatingWhatsapp />
      <PropertySearch />
      <FeaturedProperties properties={featured} />
      <AboutTeaser />
    </>
  );
}
