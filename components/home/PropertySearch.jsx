function PropertySearch() {
  return (
    <section className="bg-[#f7f5f1] py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">

        {/* =========================================================
            SECTION INTRO
        ========================================================= */}

        <div className="mb-10 text-center">

          <div className="mb-4 flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-[#B8862F]" />

            <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#B8862F]">
              Property Search
            </span>

            <span className="h-px w-10 bg-[#B8862F]" />
          </div>

          <h2 className="font-cormorant text-4xl font-semibold tracking-tight text-[#081221] sm:text-5xl">
            Find Your Next Property
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Tell us what you are looking for and explore property
            opportunities across Mumbai's Western Suburbs.
          </p>

        </div>


        {/* =========================================================
            SEARCH CARD
        ========================================================= */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(8,18,33,0.08)] sm:p-8">

          <div className="grid gap-5 lg:grid-cols-4">


            {/* =====================================================
                PURPOSE
            ===================================================== */}

            <div className="flex flex-col">

              <label
                htmlFor="property-search-purpose"
                className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
              >
                Looking For
              </label>

              <select
                id="property-search-purpose"
                className="h-14 rounded-lg border border-slate-300 bg-white px-4 text-base font-medium text-slate-800 outline-none transition focus:border-[#B8862F] focus:ring-1 focus:ring-[#B8862F] md:text-sm"
                defaultValue="Buy"
              >
                <option value="Buy">Buy</option>
                <option value="Rent">Rent</option>
                <option value="Sell">Sell</option>
              </select>

            </div>


            {/* =====================================================
                PROPERTY TYPE
            ===================================================== */}

            <div className="flex flex-col">

              <label
                htmlFor="property-search-type"
                className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
              >
                Property Type
              </label>

              <select
                id="property-search-type"
                className="h-14 rounded-lg border border-slate-300 bg-white px-4 text-base font-medium text-slate-800 outline-none transition focus:border-[#B8862F] focus:ring-1 focus:ring-[#B8862F] md:text-sm"
                defaultValue="Residential"
              >
                <option value="Residential">
                  Residential
                </option>

                <option value="Commercial">
                  Commercial
                </option>

              </select>

            </div>


            {/* =====================================================
                LOCATION
            ===================================================== */}

            <div className="flex flex-col">

              <label
                htmlFor="property-search-location"
                className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
              >
                Location
              </label>

              <select
                id="property-search-location"
                className="h-14 rounded-lg border border-slate-300 bg-white px-4 text-base font-medium text-slate-800 outline-none transition focus:border-[#B8862F] focus:ring-1 focus:ring-[#B8862F] md:text-sm"
                defaultValue=""
              >
                <option value="" disabled>
                  Select Location
                </option>

                <option value="Jogeshwari">
                  Jogeshwari
                </option>

                <option value="Andheri">
                  Andheri
                </option>

                <option value="Lokhandwala">
                  Lokhandwala
                </option>

                <option value="Goregaon">
                  Goregaon
                </option>

                <option value="Mira Road">
                  Mira Road
                </option>

                <option value="Other">
                  Other Mumbai Locations
                </option>

              </select>

            </div>


            {/* =====================================================
                BUDGET + BUTTON
            ===================================================== */}

            <div className="flex flex-col">

              <label
                htmlFor="property-search-budget"
                className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
              >
                Budget
              </label>

              <div className="flex h-14 gap-2">

                <select
                  id="property-search-budget"
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 text-base font-medium text-slate-800 outline-none transition focus:border-[#B8862F] focus:ring-1 focus:ring-[#B8862F] md:text-sm"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select Budget
                  </option>

                  <option value="Under 50L">
                    Under ₹50L
                  </option>

                  <option value="50L-1Cr">
                    ₹50L – ₹1Cr
                  </option>

                  <option value="1Cr-2Cr">
                    ₹1Cr – ₹2Cr
                  </option>

                  <option value="2Cr-5Cr">
                    ₹2Cr – ₹5Cr
                  </option>

                  <option value="5Cr+">
                    ₹5Cr+
                  </option>

                </select>

              </div>

            </div>

          </div>


          {/* =========================================================
              SEARCH ACTION
          ========================================================= */}

          <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 sm:flex-row">

            <p className="text-sm text-slate-500">
              Can't find what you're looking for?
              <span className="ml-1 font-medium text-[#081221]">
                Speak with our property experts.
              </span>
            </p>

            <button
              type="button"
              className="group inline-flex items-center justify-center gap-3 rounded-lg bg-[#B8862F] px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.12em] text-[#081221] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#CCA251] hover:shadow-[0_12px_30px_rgba(184,134,47,0.25)]"
            >
              Search Properties

              <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </button>

          </div>

        </div>

      </div>
    </section>
  );
}

export default PropertySearch;