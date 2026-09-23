/**
 * The skeleton has to be the same shape as what replaces it, or it is not a
 * placeholder — it is a layout shift with an animation on it.
 *
 * This previously rendered one column of 300px-tall cards while the real
 * listing renders two columns of 3:2 cards on mobile, so the swap moved every
 * card on the page. Grid, container padding, image ratio and body padding all
 * mirror PropertiesListing + PropertyCard; keep them in step.
 */
function CardSkeleton() {
  return (
    <div className="@container animate-pulse border border-slate-200 bg-white">
      <div className="aspect-[3/2] w-full bg-slate-100" />
      <div className="space-y-3 p-3.5 @2xs:space-y-4 @2xs:p-6">
        <div className="h-5 w-1/2 bg-slate-100 @2xs:h-7" />
        <div className="h-3 w-3/4 bg-slate-100" />
        <div className="h-3 w-2/3 bg-slate-100" />
        <div className="h-11 bg-slate-100" />
      </div>
    </div>
  );
}

export default function PropertiesLoading() {
  return (
    <main className="bg-white">
      <section className="bg-[#081221]">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:px-10 md:px-16 lg:px-8">
          <div className="h-12 w-2/3 animate-pulse bg-white/10" />
          <div className="mt-6 h-4 w-40 animate-pulse bg-white/10" />
        </div>
      </section>

      <section className="bg-white py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-10 md:px-16 lg:px-8">
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
