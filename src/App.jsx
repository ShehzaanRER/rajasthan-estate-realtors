import Navbar from "./layouts/Navbar";
import HeroSlider from "./components/home/HeroSlider";
import FloatingWhatsapp from "./components/FloatingWhatsapp";
import PropertySearch from "./components/home/PropertySearch";
import FeaturedProperties from "./components/home/FeaturedProperties";
import AboutSection from "./components/home/AboutTeaser"
import Footer from "./layouts/Footer";

function App() {
  return (
    <>
      <Navbar />
      <HeroSlider />
       <FloatingWhatsapp />
       <PropertySearch />
      <FeaturedProperties />
      <AboutSection />
      <Footer />
  
    </>
  );
}

export default App;