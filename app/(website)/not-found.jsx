import Link from "next/link";

export const metadata = {
  title: "Page Not Found | Rajasthan Estate Realtors",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] items-center bg-white">
      <div className="mx-auto max-w-2xl px-6 py-24 text-center sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#B8862F]">
          404
        </p>

        <h1 className="mt-4 font-serif text-4xl font-light leading-tight text-[#081221] sm:text-5xl">
          We couldn&apos;t find
          <span className="block italic text-[#B8862F]">that page.</span>
        </h1>

        <p className="mx-auto mt-5 max-w-md text-base leading-7 text-slate-600">
          The page you&apos;re looking for may have moved or no longer
          exists. It's possible the listing you were viewing is no longer
          available.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/properties"
            className="inline-flex items-center justify-center gap-3 rounded-lg bg-[#081221] px-8 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#14233A]"
          >
            Browse Properties
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-[#081221]/25 px-8 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-[#081221] transition-all duration-300 hover:border-[#B8862F] hover:text-[#B8862F]"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
