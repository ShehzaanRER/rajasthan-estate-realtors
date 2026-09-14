import Hero from "../../components/home/Hero";
import Services from "../../components/home/Services";
import FloatingWhatsapp from "../../components/FloatingWhatsapp";
import FeaturedShowcase from "../../components/home/FeaturedShowcase";
import AboutTeaser from "../../components/home/AboutTeaser";
import OfficialChannelPartners from "../../components/home/OfficialChannelPartners";
import { getFeaturedProperties, getPropertyLocalities } from "../../lib/properties";
import { getProjects } from "../../lib/projects";
import { getChannelPartners } from "../../lib/channel-partners";

export default async function HomePage() {
  const [featured, localities, newProjects, channelPartners] = await Promise.all([
    getFeaturedProperties({ limit: 3 }),
    getPropertyLocalities(),
    // "New" is whatever the CMS says is a current launch — never a hardcoded list.
    getProjects({ isNew: true, limit: 3 }),
    getChannelPartners(),
  ]);

  return (
    <>
      <Hero localities={localities} />
      <FloatingWhatsapp />
      <Services />
      <FeaturedShowcase properties={featured} projects={newProjects} />
      <AboutTeaser />
      <OfficialChannelPartners partners={channelPartners} />
    </>
  );
}
