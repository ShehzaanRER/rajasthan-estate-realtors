import PropertyCard from "./PropertyCard";
import CardSlider from "../ui/CardSlider";

function SimilarProperties({ properties }) {
  if (!properties || properties.length === 0) {
    return null;
  }

  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">
        <h2 className="mb-8 font-serif text-3xl text-[#081221]">
          Similar properties
        </h2>

        {/* One card at a time on a phone, the same grid as before from md up. */}
        <CardSlider label="similar property">
          {properties.map((property) => (
            <PropertyCard key={property.slug} property={property} />
          ))}
        </CardSlider>
      </div>
    </section>
  );
}

export default SimilarProperties;
