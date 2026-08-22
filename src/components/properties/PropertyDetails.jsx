import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Bath,
  Maximize,
  MapPin,
  Phone,
  MessageCircle,
} from "lucide-react";

import properties from "../../data/properties";

const property = properties[0];

function PropertyDetails() {
  return (
    <main className="bg-white">

      {/* =========================================================
          BREADCRUMB
      ========================================================= */}
      <section className="border-b border-slate-200 bg-[#F7F5F1]">

        <div className="mx-auto max-w-7xl px-6 py-5 sm:px-10 md:px-16 lg:px-8">

          <a
            href="/properties"
            className="group inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-[#B8862F]"
          >
            <ArrowLeft
              size={16}
              className="transition-transform group-hover:-translate-x-1"
            />

            Back to Properties
          </a>

        </div>

      </section>


      {/* =========================================================
          IMAGE GALLERY
      ========================================================= */}
      <section className="bg-white py-8 sm:py-10">

        <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">

          <div className="grid gap-3 lg:grid-cols-[1.7fr_1fr]">

            {/* Main image */}

            <div className="relative h-[420px] overflow-hidden sm:h-[520px] lg:h-[620px]">

              <img
                src={property.images[0]}
                alt={property.title}
                className="h-full w-full object-cover"
              />

              <div className="absolute left-5 top-5">

                <span className="bg-[#B8862F] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                  {property.status}
                </span>

              </div>

            </div>


            {/* Smaller gallery */}

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">

              {property.images.slice(1).map((image, index) => (

                <div
                  key={image}
                  className="relative h-[200px] overflow-hidden sm:h-[250px] lg:h-auto"
                >

                  <img
                    src={image}
                    alt={`${property.title} interior ${index + 2}`}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />

                </div>

              ))}

            </div>

          </div>

        </div>

      </section>


      {/* =========================================================
          PROPERTY HEADER
      ========================================================= */}
      <section className="bg-white pb-12 sm:pb-16">

        <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">

          <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:items-start">

            {/* Main information */}

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#B8862F]">
                {property.type}
              </p>

              <h1 className="mt-4 font-serif text-4xl font-medium leading-tight text-[#081221] sm:text-5xl md:text-6xl">
                {property.title}
              </h1>

              <div className="mt-5 flex items-center gap-2 text-base text-slate-500">

                <MapPin
                  size={18}
                  className="text-[#B8862F]"
                />

                {property.location}

              </div>


              {/* Key specifications */}

              <div className="mt-8 grid max-w-2xl grid-cols-2 border-y border-slate-200 sm:grid-cols-4">

                <div className="border-r border-slate-200 px-5 py-5 first:pl-0">

                  <Maximize
                    size={19}
                    className="text-[#B8862F]"
                  />

                  <p className="mt-3 text-[10px] uppercase tracking-[0.15em] text-slate-400">
                    Area
                  </p>

                  <p className="mt-1 text-sm font-medium text-[#081221]">
                    {property.area}
                  </p>

                </div>


                <div className="border-r border-slate-200 px-5 py-5">

                  <BedDouble
                    size={19}
                    className="text-[#B8862F]"
                  />

                  <p className="mt-3 text-[10px] uppercase tracking-[0.15em] text-slate-400">
                    Bedrooms
                  </p>

                  <p className="mt-1 text-sm font-medium text-[#081221]">
                    {property.bedrooms}
                  </p>

                </div>


                <div className="border-r border-slate-200 px-5 py-5">

                  <Bath
                    size={19}
                    className="text-[#B8862F]"
                  />

                  <p className="mt-3 text-[10px] uppercase tracking-[0.15em] text-slate-400">
                    Bathrooms
                  </p>

                  <p className="mt-1 text-sm font-medium text-[#081221]">
                    {property.bathrooms}
                  </p>

                </div>


                <div className="px-5 py-5 sm:pr-0">

                  <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400">
                    Status
                  </p>

                  <p className="mt-4 text-sm font-medium text-[#081221]">
                    {property.status}
                  </p>

                </div>

              </div>

            </div>


            {/* Price / enquiry card */}

            <aside className="border border-slate-200 bg-[#F7F5F1] p-7 lg:sticky lg:top-6">

              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                Asking Price
              </p>

              <p className="mt-2 font-serif text-4xl text-[#081221]">
                {property.price}
              </p>

              <div className="my-6 h-px bg-slate-200" />

              <p className="text-sm leading-6 text-slate-600">
                Interested in this property? Speak directly with our property
                experts for availability, additional information and a
                viewing.
              </p>


              <a
                href="tel:+919892371329"
                className="mt-6 flex items-center justify-center gap-3 rounded-lg bg-[#081221] px-6 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-white transition-all duration-300 hover:bg-[#14233A]"
              >
                <Phone size={17} />

                Speak With Us
              </a>


              <a
                href="https://wa.me/919892371329"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-6 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-[#081221] transition-all duration-300 hover:border-[#B8862F] hover:text-[#B8862F]"
              >
                <MessageCircle size={17} />

                WhatsApp Us
              </a>

            </aside>

          </div>

        </div>

      </section>


      {/* =========================================================
          DESCRIPTION + DETAILS
      ========================================================= */}
      <section className="bg-[#F7F5F1] py-16 sm:py-20">

        <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">

          <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">

            {/* Description */}

            <div>

              <div className="mb-6 flex items-center gap-4">

                <span className="h-px w-10 bg-[#B8862F]" />

                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#B8862F]">
                  Property Overview
                </p>

              </div>

              <h2 className="font-serif text-4xl font-light text-[#081221] sm:text-5xl">
                A closer look at
                <span className="block italic text-[#B8862F]">
                  this property.
                </span>
              </h2>

              <p className="mt-7 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                {property.description}
              </p>

              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                For complete property information, current availability and
                viewing arrangements, speak with our team directly.
              </p>

            </div>


            {/* Details */}

            <div>

              <h3 className="font-serif text-3xl text-[#081221]">
                Property Details
              </h3>

              <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">

                {property.details.map((detail) => (

                  <div
                    key={detail.label}
                    className="flex items-center justify-between gap-6 py-4"
                  >

                    <span className="text-sm text-slate-500">
                      {detail.label}
                    </span>

                    <span className="text-right text-sm font-medium text-[#081221]">
                      {detail.value}
                    </span>

                  </div>

                ))}

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =========================================================
          AMENITIES
      ========================================================= */}
      <section className="bg-white py-16 sm:py-20">

        <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">

          <div className="mb-10">

            <div className="mb-5 flex items-center gap-3">

              <span className="h-px w-10 bg-[#B8862F]" />

              <p className="text-xs font-medium uppercase tracking-[0.35em] text-[#B8862F]">
                Features
              </p>

            </div>

            <h2 className="font-serif text-4xl text-[#081221] sm:text-5xl">
              Property Amenities
            </h2>

          </div>


          <div className="grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">

            {property.amenities.map((amenity) => (

              <div
                key={amenity}
                className="bg-white px-6 py-6"
              >

                <div className="flex items-center gap-4">

                  <span className="h-2 w-2 rounded-full bg-[#B8862F]" />

                  <p className="text-sm font-medium text-[#081221]">
                    {amenity}
                  </p>

                </div>

              </div>

            ))}

          </div>

        </div>

      </section>


      {/* =========================================================
          LOCATION
      ========================================================= */}
      <section className="bg-[#081221] py-16 sm:py-20">

        <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">

          <div className="grid items-center gap-10 lg:grid-cols-2">

            <div>

              <div className="mb-5 flex items-center gap-3">

                <span className="h-px w-10 bg-[#B8862F]" />

                <p className="text-xs font-medium uppercase tracking-[0.35em] text-[#D4AF37]">
                  Location
                </p>

              </div>

              <h2 className="font-serif text-4xl font-light text-white sm:text-5xl">
                Located in
                <span className="block italic text-[#D4AF37]">
                  {property.location}.
                </span>
              </h2>

              <p className="mt-6 max-w-xl text-base leading-8 text-slate-300">
                Speak with our team to learn more about the neighbourhood,
                connectivity, nearby amenities and other factors that may be
                important to your property decision.
              </p>

              <a
                href="https://www.google.com/maps/search/?api=1&query=Lokhandwala+Andheri+West+Mumbai"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#D4AF37] transition-colors hover:text-white"
              >
                View Location

                <ArrowRight size={17} />

              </a>

            </div>


            <div className="flex min-h-[300px] items-center justify-center border border-white/10 bg-white/[0.04]">

              <div className="text-center">

                <MapPin
                  size={42}
                  strokeWidth={1.2}
                  className="mx-auto text-[#D4AF37]"
                />

                <p className="mt-5 font-serif text-2xl text-white">
                  {property.location}
                </p>

                <p className="mt-2 text-sm text-slate-400">
                  Mumbai, Maharashtra
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =========================================================
          FINAL CTA
      ========================================================= */}
      <section className="bg-[#F5F0E8] py-16 sm:py-20">

        <div className="mx-auto max-w-4xl px-6 text-center sm:px-10">

          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#B8862F]">
            Interested In This Property?
          </p>

          <h2 className="mt-4 font-serif text-4xl font-light leading-tight text-[#081221] sm:text-5xl">
            Let's discuss
            <span className="block italic text-[#B8862F]">
              your requirements.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Our team can provide further information and arrange a viewing
            based on your requirements.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">

            <a
              href="tel:+919892371329"
              className="inline-flex items-center justify-center gap-3 rounded-lg bg-[#081221] px-8 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-white transition-all duration-300 hover:bg-[#14233A]"
            >
              <Phone size={17} />

              Speak With Us
            </a>

            <a
              href="https://wa.me/919892371329"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 rounded-lg border border-[#081221]/25 px-8 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-[#081221] transition-colors hover:border-[#B8862F] hover:text-[#B8862F]"
            >
              <MessageCircle size={17} />

              WhatsApp Us
            </a>

          </div>

        </div>

      </section>

    </main>
  );
}

export default PropertyDetails;