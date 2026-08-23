import HeroSlider from "../components/home/HeroSlider";
import FloatingWhatsapp from "../components/FloatingWhatsapp";
import PropertySearch from "../components/home/PropertySearch";
import FeaturedProperties from "../components/home/FeaturedProperties";
import AboutTeaser from "../components/home/AboutTeaser";

export default function HomePage() {
  return (
    <>
      <HeroSlider />
      <FloatingWhatsapp />
      <PropertySearch />
      <FeaturedProperties />
      <AboutTeaser />
    </>
  );
}
