const areas = [
  {
    name: "Jogeshwari West",
    description:
      "Our home market with residential apartments, societies and commercial spaces.",
  },
  {
    name: "Andheri West",
    description:
      "Luxury apartments, premium towers and excellent connectivity.",
  },
  {
    name: "Lokhandwala",
    description:
      "High-end residential projects and premium lifestyle properties.",
  },
  {
    name: "Goregaon",
    description:
      "Growing residential hub with modern developments and business parks.",
  },
  {
    name: "Mira Road",
    description:
      "Affordable and spacious homes for families and first-time buyers.",
  },
];

function Areas() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">

        <div className="text-center mb-14">

          <h2 className="text-4xl font-bold text-slate-900">
            Areas We Serve
          </h2>

          <p className="mt-4 text-slate-600">
            Trusted local experts across Mumbai's most sought-after locations.
          </p>

        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">

          {areas.map((area) => (

            <div
              key={area.name}
              className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-2 hover:border-amber-500 hover:shadow-xl"
            >
              <h3 className="text-2xl font-semibold text-slate-900">
                {area.name}
              </h3>

              <p className="mt-4 text-slate-600">
                {area.description}
              </p>

              <button className="mt-6 font-semibold text-amber-500 hover:text-amber-600">
                Explore →
              </button>

            </div>

          ))}

        </div>

      </div>
    </section>
  );
}

export default Areas;