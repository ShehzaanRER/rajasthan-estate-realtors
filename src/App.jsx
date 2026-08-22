import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./layouts/Navbar";
import HeroSlider from "./components/home/HeroSlider";
import FloatingWhatsapp from "./components/FloatingWhatsapp";
import PropertySearch from "./components/home/PropertySearch";
import FeaturedProperties from "./components/home/FeaturedProperties";
import AboutSection from "./components/home/AboutTeaser";
import About from "./components/home/About";
import Properties from "./components/properties/Properties";
import Footer from "./layouts/Footer";
import PropertyDetails from "./components/properties/PropertyDetails";


function Home() {
  return (
    <>
      <HeroSlider />

      <FloatingWhatsapp />

      <PropertySearch />

      <FeaturedProperties />

      <AboutSection />


    </>
  );
}

function App() {
  return (
    <BrowserRouter>

      <Navbar />

      <Routes>

        {/* HOME */}
        <Route path="/" element={<Home />} />

        {/* ABOUT US */}
        <Route path="/about" element={<About />} />

        {/* PROPERTIES */}
        <Route path="/properties" element={<Properties />} />

        
        <Route
  path="/properties/:slug"
  element={<PropertyDetails />}
                           />

      </Routes>

      <Footer />

    </BrowserRouter>
  );
}

export default App;