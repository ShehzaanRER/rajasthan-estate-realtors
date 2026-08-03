import GoogleReviews from "./components/GoogleReviews";
import Navbar from "./layouts/Navbar";
import Hero from "./components/home/Hero";
import FloatingWhatsapp from "./components/FloatingWhatsapp";
import PropertySearch from "./components/home/PropertySearch";
import FeaturedProperties from "./components/home/FeaturedProperties";
import WhyChoose from "./components/home/WhyChoose";
import Areas from "./components/home/Areas";

function App() {
  return (
    <>
      <GoogleReviews />
      <Navbar />
      <Hero />
       <FloatingWhatsapp />
       <PropertySearch />
      <FeaturedProperties />
      <WhyChoose />
      <Areas />
  
    </>
  );
}

export default App;