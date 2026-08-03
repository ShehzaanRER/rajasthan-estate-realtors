const properties = [
  {
    id: 1,
    title: "3 BHK Apartment",
    location: "Lokhandwala, Andheri West",
    price: "₹3.25 Cr",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
    status: "For Sale",
  },
  {
    id: 2,
    title: "Luxury Villa",
    location: "Mira Road",
    price: "₹5.80 Cr",
    image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994",
    status: "Premium",
  },
  {
    id: 3,
    title: "2 BHK Flat",
    location: "Jogeshwari West",
    price: "₹1.65 Cr",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750",
    status: "New",
  },
];function FeaturedProperties() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">

        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold text-slate-900">
            Featured Properties
          </h2>

          <p className="mt-3 text-slate-600">
            Hand-picked properties from our latest listings.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">

          {properties.map((property) => (

            <div
              key={property.id}
              className="overflow-hidden rounded-2xl bg-white shadow-lg transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
            >

              <div className="relative">

                <img
                  src={property.image}
                  alt={property.title}
                  className="h-64 w-full object-cover"
                />

                <span className="absolute left-4 top-4 rounded-full bg-amber-500 px-4 py-1 text-sm font-semibold">
                  {property.status}
                </span>

              </div>

              <div className="p-6">

                <h3 className="text-2xl font-bold">
                  {property.title}
                </h3>

                <p className="mt-2 text-slate-500">
                  {property.location}
                </p>

                <div className="mt-5 flex items-center justify-between">

                  <span className="text-2xl font-bold text-amber-500">
                    {property.price}
                  </span>

                  <button className="rounded-lg border border-slate-900 px-4 py-2 transition hover:bg-slate-900 hover:text-white">
                    View Details
                  </button>

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>
    </section>
  );
}

export default FeaturedProperties;