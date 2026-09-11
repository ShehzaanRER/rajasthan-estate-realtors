import Hero from "../../components/home/Hero";
import Services from "../../components/home/Services";
import FloatingWhatsapp from "../../components/FloatingWhatsapp";
import PropertySearch from "../../components/home/PropertySearch";
import FeaturedShowcase from "../../components/home/FeaturedShowcase";
import AboutTeaser from "../../components/home/AboutTeaser";
import { getFeaturedProperties, getPropertyLocalities } from "../../lib/properties";
import { getProjects } from "../../lib/projects";

export default async function HomePage() {
  const [featured, localities, newProjects] = await Promise.all([
    getFeaturedProperties({ limit: 3 }),
    getPropertyLocalities(),
    // "New" is whatever the CMS says is a current launch — never a hardcoded list.
    getProjects({ isNew: true, limit: 3 }),
  ]);

  return (
    <>
      <Hero />
      <FloatingWhatsapp />
      <Services />
      <PropertySearch localities={localities} />
      <FeaturedShowcase properties={featured} projects={newProjects} />
      <AboutTeaser />
    </>
  );
}
