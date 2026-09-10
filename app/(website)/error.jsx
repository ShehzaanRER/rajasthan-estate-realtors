"use client";

export default function WebsiteError({ reset }) {
  return (
    <main className="flex min-h-[60vh] items-center bg-white">
      <div className="mx-auto max-w-2xl px-6 py-24 text-center sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#B8862F]">
          Something went wrong
        </p>

        <h1 className="mt-4 font-serif text-4xl font-light leading-tight text-[#081221] sm:text-5xl">
          We hit an
          <span className="block italic text-[#B8862F]">unexpected error.</span>
        </h1>

        <p className="mx-auto mt-5 max-w-md text-base leading-7 text-slate-600">
          Please try again, or reach out to us directly if the problem
          continues.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-3 rounded-lg bg-[#081221] px-8 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#14233A]"
          >
            Try Again
          </button>

          <a
            href="tel:+919892371329"
            className="inline-flex items-center justify-center rounded-lg border border-[#081221]/25 px-8 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-[#081221] transition-all duration-300 hover:border-[#B8862F] hover:text-[#B8862F]"
          >
            Call Us Instead
          </a>
        </div>
      </div>
    </main>
  );
}
