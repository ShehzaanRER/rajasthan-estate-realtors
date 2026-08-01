function Hero() {
  return (
    <section className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-center px-6">
        <p className="text-amber-400 uppercase tracking-[0.3em] text-sm">
          Since 1988
        </p>

        <h1 className="mt-6 text-6xl font-bold">
          Rajasthan Estate Realtors
        </h1>

        <p className="mt-6 max-w-2xl mx-auto text-xl text-slate-300">
          Helping families buy, sell and rent premium properties across
          Jogeshwari, Andheri and Goregaon.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <button className="rounded-xl bg-amber-500 px-8 py-4 font-semibold text-slate-950 transition hover:bg-amber-400">
            Explore Properties
          </button>

          <button className="rounded-xl border border-white px-8 py-4 hover:bg-white hover:text-slate-950 transition">
            Contact Us
          </button>
        </div>
      </div>
    </section>
  );
}

export default Hero;