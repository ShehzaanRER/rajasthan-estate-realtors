function Hero() {
  return (
    <section className="min-h-screen bg-white pt-52">
      <div className="mx-auto flex min-h-[80vh] max-w-7xl items-center justify-center px-6">

        <div className="text-center">

          <p className="text-sm font-medium uppercase tracking-[0.4em] text-amber-500">
            Since 1988
          </p>

          <h1 className="mt-6 text-7xl font-extrabold leading-tight text-slate-900">
            Rajasthan Estate Realtors
          </h1>

          <p className="mx-auto mt-8 max-w-4xl text-2xl leading-10 text-slate-600">
            Helping families buy, sell and rent premium properties across
            Jogeshwari, Andheri, Goregaon, Lokhandwala and Mira Road.
          </p>

          <div className="mt-12 flex justify-center gap-6">

            <button className="rounded-xl bg-amber-500 px-10 py-5 text-lg font-semibold text-slate-900 transition hover:bg-amber-400">
              Explore Properties
            </button>

            <button className="rounded-xl border border-slate-900 px-10 py-5 text-lg font-semibold text-slate-900 transition hover:bg-slate-900 hover:text-white">
              Contact Us
            </button>

          </div>

        </div>

      </div>
    </section>
  );
}

export default Hero;