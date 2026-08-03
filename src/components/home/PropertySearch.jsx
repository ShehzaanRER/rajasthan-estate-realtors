function PropertySearch() {
  return (
    <section className="bg-slate-100 py-14">
      <div className="mx-auto max-w-7xl px-6">

        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-slate-900">
            Find Your Dream Property
          </h2>

          <p className="mt-3 text-slate-600">
            Search residential and commercial properties across Mumbai.
          </p>
        </div>

        <div className="rounded-2xl bg-white shadow-xl p-6">

          <div className="grid gap-4 md:grid-cols-4">

            <select className="rounded-lg border p-4">
              <option>Buy</option>
              <option>Rent</option>
              <option>Commercial</option>
            </select>

            <select className="rounded-lg border p-4">
              <option>Location</option>
              <option>Jogeshwari</option>
              <option>Andheri</option>
              <option>Lokhandwala</option>
              <option>Goregaon</option>
              <option>Mira Road</option>
            </select>

            <select className="rounded-lg border p-4">
              <option>Budget</option>
              <option>₹50L - ₹1Cr</option>
              <option>₹1Cr - ₹2Cr</option>
              <option>₹2Cr - ₹5Cr</option>
              <option>₹5Cr+</option>
            </select>

            <button className="rounded-lg bg-amber-500 font-semibold hover:bg-amber-400 transition">
              Search Properties
            </button>

          </div>

        </div>

      </div>
    </section>
  );
}

export default PropertySearch;